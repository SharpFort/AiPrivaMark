import { useEffect, useRef, useState } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import { AIService } from "~services/ai"
import type { QueueStatus } from "~services/queue"
import { SearchService } from "~services/search"
import { StorageService } from "~services/storage"
import { MESSAGES, type ExtractContentResponse } from "~types/messages"
import { DEFAULT_CONFIG, type AppConfig } from "~types/config"
import type { BookmarkItem } from "~types/bookmark"
import { BookmarkCard } from "~components/bookmark-card"
import { useI18n } from "~i18n/hook"
import { buildAIConfig } from "~utils/config-utils"

import "./style.css"

function SidePanel() {
  const { t, isReady } = useI18n()
  const [config] = useStorage<AppConfig>("app-config", DEFAULT_CONFIG)
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // 队列相关状态
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null)

  // 加载书签列表
  const loadBookmarks = async () => {
    const data = await StorageService.getBookmarks()
    setBookmarks(data)
  }

  useEffect(() => {
    loadBookmarks()
  }, [])

  // 监听后台队列进度
  useEffect(() => {
    // 1. 初始化时查询状态
    chrome.runtime.sendMessage({ type: "GET_QUEUE_STATUS" }, (status) => {
      if (chrome.runtime.lastError) {
        // 忽略错误
        return
      }
      if (status) {
        setQueueStatus(status)
      }
    })

    // 2. 监听进度广播
    const messageListener = (msg: any) => {
      if (msg.type === "QUEUE_PROGRESS") {
        setQueueStatus(msg.status)
        // 如果刚完成一个任务或者整个队列完成，刷新列表
        // 为了避免过于频繁刷新，可以简单判断 processed 变化
        if (msg.status.processed > 0 || !msg.status.isProcessing) {
          loadBookmarks()
        }
      }
    }
    chrome.runtime.onMessage.addListener(messageListener)
    return () => chrome.runtime.onMessage.removeListener(messageListener)
  }, [])


  // 计算过滤后的书签
  const filteredBookmarks = searchQuery
    ? SearchService.search(bookmarks, searchQuery)
    : bookmarks

  // 统计待处理任务
  const pendingCount = bookmarks.filter(b => b.status === "pending").length

  // 批量处理逻辑 (发送给 Background)
  const handleBatchProcess = () => {
    if (pendingCount === 0) return

    // Use helper to get effective AI config (auto-detects configured provider)
    const aiConfig = buildAIConfig(config)
    if (!aiConfig) {
      setErrorMsg(t("pleaseSetApiKey"))
      return
    }

    const pendingIds = bookmarks.filter(b => b.status === "pending").map(b => b.id)

    // 发送指令给 Background
    chrome.runtime.sendMessage({ type: "START_BATCH", ids: pendingIds })

    // 乐观更新 UI
    setQueueStatus({
      isProcessing: true,
      total: pendingIds.length,
      processed: 0,
      success: 0,
      failed: 0
    })
  }

  const handleStopQueue = () => {
    chrome.runtime.sendMessage({ type: "STOP_BATCH" })
  }

  // 用于取消请求
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      // 组件卸载时取消正在进行的请求
      abortControllerRef.current?.abort()
    }
  }, [])

  // 核心保存逻辑 (单页 - 仍然在 SidePanel 直接处理，也可以迁移但保持现状更灵活)
  const handleSaveCurrentPage = async () => {
    if (isLoading) return
    setIsLoading(true)
    setErrorMsg(null)

    // 取消之前的请求（如果有）
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) throw new Error(t("noActiveTab"))

      if (tab.url?.startsWith("chrome://") || tab.url?.startsWith("edge://")) {
        throw new Error(t("cannotSaveSystemPages"))
      }

      let contentData: ExtractContentResponse
      try {
        contentData = await chrome.tabs.sendMessage(tab.id, { type: MESSAGES.EXTRACT_CONTENT })
      } catch (e) {
        console.warn("Content script not ready, trying to inject...", e)
        throw new Error(t("cannotReadPage"))
      }

      // Build AI config using helper (auto-detects configured provider)
      const aiConfig = buildAIConfig(config)
      if (!aiConfig) {
        throw new Error(t("apiKeyNotFound"))
      }

      // 构造包含元数据的丰富内容上下文
      const richContent = `Title: ${contentData.title || ''}
URL: ${contentData.url || ''}
Description: ${contentData.metadata?.description || ''}
Keywords: ${contentData.metadata?.keywords || ''}
Author: ${contentData.metadata?.author || ''}

Content:
${contentData.content || ''}`

      const aiResult = await AIService.generateSummaryAndTags(
        richContent,
        aiConfig,
        controller.signal
      )

      await StorageService.addBookmark({
        url: contentData.url,
        title: contentData.title,
        description: contentData.excerpt,
        content_summary: aiResult.summary,
        tags: aiResult.tags,
        status: "done"
      })

      await loadBookmarks()
      setSearchQuery("")

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Save cancelled')
        return
      }
      console.error("Save failed:", err)
      setErrorMsg(err.message || t("unknownErrorOccurred"))
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm(t("deleteConfirm"))) {
      await StorageService.removeBookmark(id)
      await loadBookmarks()
    }
  }

  const openSettings = () => {
    chrome.runtime.openOptionsPage()
  }

  if (!isReady) return <div className="w-full h-screen bg-gray-50 flex items-center justify-center text-gray-500">{t("loadingConfiguration")}</div>

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <h1 className="font-bold text-lg tracking-tight text-blue-600">{t("appName")}</h1>

        <div className="flex items-center gap-1">
          <button
            onClick={handleSaveCurrentPage}
            disabled={isLoading || (queueStatus?.isProcessing ?? false)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={t("saveCurrentPage")}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>

          <button
            onClick={openSettings}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title={t("settings")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Action Area */}
      <div className="p-4 bg-white border-b shadow-sm space-y-4">
        {/* Batch Process Notification */}
        {pendingCount > 0 && !(queueStatus?.isProcessing) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex justify-between items-center">
            <div className="text-sm text-blue-800">
              <strong>{pendingCount}</strong> {t("bookmarksNeedAnalysis")}
            </div>
            <button
              onClick={handleBatchProcess}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded transition-colors"
            >
              {t("startAIAnalysis")}
            </button>
          </div>
        )}

        {/* Queue Progress */}
        {queueStatus?.isProcessing && (
          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-gray-700">{t("analyzing")} {queueStatus.processed}/{queueStatus.total}</span>
              <button
                onClick={handleStopQueue}
                className="text-red-500 hover:text-red-700 text-xs font-bold"
              >
                {t("stop")}
              </button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(queueStatus.processed / queueStatus.total) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>{t("success")}: {queueStatus.success}</span>
              <span>{t("failed")}: {queueStatus.failed}</span>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
            placeholder={t("searchBookmarks")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 flex items-start">
            <svg className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errorMsg}
          </div>
        )}
      </div>

      {/* Bookmarks List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {filteredBookmarks.length === 0 ? (
          <div className="text-center mt-10 text-gray-400">
            {searchQuery ? (
              <>
                <div className="mb-2 text-4xl">🔍</div>
                <p>{t("noResultsFor")} "{searchQuery}"</p>
              </>
            ) : (
              <>
                <div className="mb-2 text-4xl">📭</div>
                <p>{t("noBookmarksYet")}</p>
                <p className="text-sm">{t("importHint")}</p>
              </>
            )}
          </div>
        ) : (
          filteredBookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onDelete={handleDelete}
              onTagClick={(tag) => setSearchQuery(tag)}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default SidePanel
