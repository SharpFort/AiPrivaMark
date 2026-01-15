import { StorageService } from "~services/storage"
import { AIService } from "~services/ai"
import { MESSAGES, type ExtractContentResponse } from "~types/messages"
import type { AppConfig } from "~types/config"

export interface QueueStatus {
  total: number
  processed: number
  success: number
  failed: number
  isProcessing: boolean
}

type ProgressCallback = (status: QueueStatus) => void

export class ProcessingQueue {
  private queue: string[] = []
  private status: QueueStatus = { total: 0, processed: 0, success: 0, failed: 0, isProcessing: false }
  private config: AppConfig
  private onProgress: ProgressCallback | null = null
  private shouldStop = false

  constructor(config: AppConfig, onProgress?: ProgressCallback) {
    this.config = config
    this.onProgress = onProgress
  }

  // 新增：获取当前状态
  getStatus() {
    return { ...this.status }
  }

  addItems(ids: string[]) {
    // 简单的去重，防止重复添加
    const newIds = ids.filter(id => !this.queue.includes(id))
    this.queue.push(...newIds)
    this.status.total += newIds.length
    this.notify()
  }

  stop() {
    this.shouldStop = true
    this.status.isProcessing = false
    this.notify()
  }

  async start(concurrency = 1) {
    if (this.status.isProcessing) return
    this.status.isProcessing = true
    this.shouldStop = false
    this.notify()

    while (this.queue.length > 0 && !this.shouldStop) {
      const batchIds = this.queue.splice(0, concurrency)

      const promises = batchIds.map(id => this.processItem(id))
      await Promise.all(promises)

      // 添加随机延迟 (5-10s) 避免 429
      if (this.queue.length > 0 && !this.shouldStop) {
        const delay = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000
        await new Promise(r => setTimeout(r, delay))
      }
    }

    this.status.isProcessing = false
    this.notify()
  }

  private notify() {
    if (this.onProgress) {
      this.onProgress({ ...this.status })
    }
  }

  private async processItem(id: string) {
    try {
      // 1. 获取书签数据
      const bookmark = await StorageService.getBookmarkById(id)
      if (!bookmark) throw new Error("Bookmark not found")

      // 更新状态为 processing
      await StorageService.updateBookmark(id, { status: "processing" })

      // 2. 创建后台 Tab 并提取内容
      const content = await this.extractContentInBg(bookmark.url)

      // 3. AI 分析
      const aiResult = await AIService.generateSummaryAndTags(content.content, this.config)

      // 4. 保存结果
      await StorageService.updateBookmark(id, {
        content_summary: aiResult.summary,
        tags: aiResult.tags,
        description: content.excerpt || bookmark.description,
        status: "done"
      })

      this.status.success++
    } catch (error: any) {
      console.error(`Failed to process ${id}:`, error)
      await StorageService.updateBookmark(id, {
        status: "error",
        errorMessage: error.message
      })
      this.status.failed++
    } finally {
      this.status.processed++
      this.notify()
    }
  }

  private async extractContentInBg(url: string): Promise<ExtractContentResponse> {
    // 创建不激活的标签页
    const tab = await chrome.tabs.create({ url, active: false })

    // 超时 Promise
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout waiting for tab load")), 30000)
    )

    // 内容获取 Promise
    const extractPromise = async (): Promise<ExtractContentResponse> => {
      // 等待加载完成
      await new Promise<void>((resolve) => {
        const listener = (tid: number, changeInfo: chrome.tabs.TabChangeInfo) => {
          if (tid === tab.id && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener)
            setTimeout(resolve, 1500)
          }
        }
        chrome.tabs.onUpdated.addListener(listener)
      })

      // 发送消息
      try {
        // @ts-ignore
        const response = await chrome.tabs.sendMessage(tab.id!, { type: MESSAGES.EXTRACT_CONTENT })
        return response
      } catch (e) {
        await new Promise(r => setTimeout(r, 1000))
        // @ts-ignore
        return await chrome.tabs.sendMessage(tab.id!, { type: MESSAGES.EXTRACT_CONTENT })
      }
    }

    try {
      const result = await Promise.race([extractPromise(), timeoutPromise])
      return result
    } finally {
      if (tab.id) await chrome.tabs.remove(tab.id)
    }
  }
}
