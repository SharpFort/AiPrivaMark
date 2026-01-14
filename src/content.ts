import { Readability, isProbablyReaderable } from "@mozilla/readability"
import type { PlasmoCSConfig } from "plasmo"

import { MESSAGES, type ExtractContentResponse } from "~types/messages"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false
}

/**
 * 清理内容，移除多余的空白字符
 */
function cleanContent(content: string): string {
  if (!content) return ""
  return content
    .replace(/\s+/g, " ") // 将多个空白字符替换为单个空格
    .replace(/[\r\n]+/g, " ") // 将换行符替换为空格
    .replace(/\t+/g, " ") // 将制表符替换为空格
    .trim() // 去除首尾空白
}

/**
 * 提取页面元数据
 */
function extractMetadata(doc: Document): Record<string, any> {
  const metadata: Record<string, any> = {}

  // 提取 meta 标签信息
  const metaTags = {
    description: doc
      .querySelector('meta[name="description"]')
      ?.getAttribute("content"),
    keywords: doc
      .querySelector('meta[name="keywords"]')
      ?.getAttribute("content"),
    author: doc.querySelector('meta[name="author"]')?.getAttribute("content"),
    "publish-date": doc
      .querySelector('meta[property="article:published_time"]')
      ?.getAttribute("content")
  }

  // 只添加存在的元数据
  Object.entries(metaTags).forEach(([key, value]) => {
    if (value) {
      metadata[key] = value
    }
  })

  // 提取 Schema.org 结构化数据
  const schemaScripts = doc.querySelectorAll(
    'script[type="application/ld+json"]'
  )
  if (schemaScripts.length > 0) {
    try {
      metadata.schema = Array.from(schemaScripts)
        .map((script) => JSON.parse(script.textContent || "{}"))
        .filter(Boolean)
    } catch (e) {
      console.error("Failed to parse Schema.org data:", e)
    }
  }

  return metadata
}

/**
 * 备用提取方案
 * 当 Readability 失败时，使用暴力剥离 DOM 的方式
 */
function fallbackExtraction(doc: Document): ExtractContentResponse {
  console.info("Using fallback extraction")
  // 创建一个新的容器来存放内容
  const tempContainer = doc.createElement("div")

  // 获取主要内容区域（不修改原内容）
  const mainContent =
    doc.querySelector("main") ||
    doc.querySelector("article") ||
    doc.querySelector(".content")

  if (mainContent) {
    tempContainer.innerHTML = mainContent.innerHTML
  } else {
    tempContainer.innerHTML = doc.body.innerHTML
  }

  // 在临时容器中移除不需要的元素
  const selectorsToRemove = [
    "script",
    "style",
    "iframe",
    "nav",
    "header",
    "footer",
    ".ads",
    ".advertisement",
    ".social-share",
    ".comments",
    '[role="complementary"]'
  ]

  selectorsToRemove.forEach((selector) => {
    tempContainer.querySelectorAll(selector).forEach((el) => el.remove())
  })

  // 获取清理后的文本
  const rawText = tempContainer.textContent || ""
  const cleanText = rawText
    .replace(/[\r\n]+/g, "\n")
    .replace(/\s+/g, " ")
    .trim()

  return {
    title: doc.title,
    content: cleanText,
    excerpt: cleanText.slice(0, 200) + "...",
    url: window.location.href,
    metadata: extractMetadata(doc)
  }
}

/**
 * 带超时的 Promise 包装器
 */
function withTimeout<T>(promise: Promise<T>, ms: number, fallbackValue?: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve, reject) => {
      setTimeout(() => {
        if (fallbackValue !== undefined) {
          console.warn(`Operation timed out after ${ms}ms, using fallback`)
          resolve(fallbackValue)
        } else {
          reject(new Error(`Operation timed out after ${ms}ms`))
        }
      }, ms)
    })
  ])
}

/**
 * 提取页面内容（主入口）
 */
const extractContent = async (): Promise<ExtractContentResponse | null> => {
  try {
    console.info("Starting content extraction...")
    const documentClone = document.cloneNode(true) as Document

    // 基础备用数据（如果 Readability 超时或失败）
    const fallbackData = fallbackExtraction(document)

    // 包装 Readability 解析过程，增加超时限制 (5000ms)
    // 注意：Readability 本身是同步的，所以我们通过 Promise 包装使其看似异步
    // 但实际上单线程 JS 无法真正通过 Promise 中断同步计算。
    // 如果 Readability 进入死循环，setTimeout 也不会触发。
    // 不过，大多数"慢"的情况是 DOM 操作繁重，偶尔可以给主线程喘息机会，
    // 或者我们假设 Readability 不虽然是同步的但不会完全卡死。
    // *修正*：为了不阻塞主线程，理想情况应该用 Web/Background Worker，但这比较复杂。
    // 作为一个简单的超时机制，我们可以尝试将其放在 Promise.resolve().then 中

    const extractionPromise = new Promise<ExtractContentResponse>((resolve, reject) => {
      try {
        const isReaderable = isProbablyReaderable(documentClone)
        console.log("isReaderable:", isReaderable)

        const reader = new Readability(documentClone)
        const article = reader.parse()
        const metadata = extractMetadata(document)

        if (!article) {
          resolve(fallbackData)
          return
        }

        resolve({
          title: article.title || document.title,
          content: cleanContent(article.textContent),
          excerpt: cleanContent(article.excerpt),
          url: window.location.href,
          metadata: metadata
        })
      } catch (e) {
        reject(e)
      }
    })

    // 由于 Readability 是同步的，这里的 timeout 更多是防止 extractMetadata 或其他后续操作卡住，
    // 或者为未来迁移到 Worker 做准备。
    // 如果 Readability 非常慢，它会阻塞 Event Loop，setTimeout 回调也没法执行。
    // 真正的超时需要 Worker。但对于 Content Script，我们先实现逻辑结构。
    const result = await withTimeout(extractionPromise, 5000, fallbackData)

    console.info("Content extraction complete")
    return result

  } catch (error) {
    console.error("Failed to parse page content:", error)
    return fallbackExtraction(document)
  }
}

// 监听来自 SidePanel/Background 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === MESSAGES.EXTRACT_CONTENT) {
    // 必须返回 true 以支持异步 sendResponse
    extractContent().then(sendResponse)
    return true
  }
  return true
})
