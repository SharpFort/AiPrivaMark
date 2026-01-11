import type { BookmarkItem } from "~types/bookmark"

export const BookmarkImportService = {
  /**
   * 获取所有原生浏览器书签并扁平化
   */
  async getBrowserBookmarks(): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    return new Promise((resolve, reject) => {
      // Timeout safety (5s)
      const timeoutId = setTimeout(() => {
        reject(new Error("Timeout: Failed to load bookmarks. Please try again."))
      }, 5000)

      try {
        if (typeof chrome === "undefined" || !chrome.bookmarks) {
          clearTimeout(timeoutId)
          reject(new Error("Bookmarks API unavailable"))
          return
        }

        chrome.bookmarks.getTree((tree) => {
          clearTimeout(timeoutId)

          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
            return
          }

          if (!tree || !Array.isArray(tree)) {
            resolve([])
            return
          }

          const flatBookmarks: chrome.bookmarks.BookmarkTreeNode[] = []

          // 递归遍历函数
          const traverse = (nodes: chrome.bookmarks.BookmarkTreeNode[]) => {
            if (!nodes) return
            for (const node of nodes) {
              if (node.url) {
                flatBookmarks.push(node)
              } else if (node.children) {
                traverse(node.children)
              }
            }
          }

          traverse(tree)
          resolve(flatBookmarks)
        })
      } catch (e: any) {
        clearTimeout(timeoutId)
        reject(e)
      }
    })
  },

  /**
   * 解析 HTML 书签文件内容
   * 支持 Netscape Bookmark File Format (Chrome, Edge, Firefox 导出格式)
   */
  async parseHtmlBookmarks(htmlContent: string): Promise<Omit<BookmarkItem, "id" | "timestamp">[]> {
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, "text/html")
    const links = doc.getElementsByTagName("a")
    const bookmarks: Omit<BookmarkItem, "id" | "timestamp">[] = []

    for (let i = 0; i < links.length; i++) {
      const link = links[i]
      const url = link.getAttribute("href")
      const title = link.textContent || "Untitled"

      // 获取添加时间 (可选)
      // const addDate = link.getAttribute("add_date")

      // 尝试从文件夹结构获取标签 (尚未实现完全递归，暂取父级文本)
      // 实际书签文件中，标签通常由文件夹层级决定
      // 这里简化处理，后续可以优化

      if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
        bookmarks.push({
          url: url,
          title: title,
          description: "",
          content_summary: "",
          tags: [],
          status: "pending"
        })
      }
    }
    return bookmarks
  },

  /**
   * 将原生书签转换为 App 的数据结构
   */
  convertBrowserBookmark(node: chrome.bookmarks.BookmarkTreeNode): Omit<BookmarkItem, "id" | "timestamp"> {
    return {
      url: node.url || "",
      title: node.title || "Untitled",
      description: "",
      content_summary: "",
      tags: [], // 初始无标签
      status: "pending" // 标记为待处理
    }
  },

  /**
   * 检查 URL 是否可访问 (Ping)
   */
  async checkUrlAccessibility(url: string): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8秒超时

      await fetch(url, {
        method: "HEAD",
        mode: "no-cors",
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      return true
    } catch (error) {
      return false
    }
  }
}
