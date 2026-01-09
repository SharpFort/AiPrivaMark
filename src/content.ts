import { Readability } from "@mozilla/readability"
import type { PlasmoCSConfig } from "plasmo"

import { MESSAGES, type ExtractContentResponse } from "~types/messages"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false
}

/**
 * 提取页面内容
 */
const extractContent = (): ExtractContentResponse | null => {
  try {
    // 克隆 document 以避免 Readability 修改原始页面 DOM
    const documentClone = document.cloneNode(true) as Document
    const reader = new Readability(documentClone)
    const article = reader.parse()

    if (!article) {
      // 如果 Readability 失败，回退到简单的 body text
      return {
        title: document.title,
        content: document.body.innerText || "",
        excerpt: "",
        url: window.location.href
      }
    }

    return {
      title: article.title || document.title,
      // textContent 是纯文本，content 是带 HTML 的。
      // 为了给 AI 总结，我们主要需要纯文本，但保留一定的 HTML 结构可能有助于识别标题层级。
      // 考虑到 Token 限制和简单性，textContent 通常足够。
      content: article.textContent, 
      excerpt: article.excerpt,
      url: window.location.href
    }
  } catch (error) {
    console.error("Failed to parse page content:", error)
    return null
  }
}

// 监听来自 SidePanel/Background 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === MESSAGES.EXTRACT_CONTENT) {
    const data = extractContent()
    sendResponse(data)
  }
  // 必须返回 true 以支持异步 sendResponse (虽然这里是同步的，但保持习惯)
  return true 
})
