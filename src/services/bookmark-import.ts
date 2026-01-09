import type { BookmarkItem } from "~types/bookmark"

export const BookmarkImportService = {
  /**
   * 获取所有原生浏览器书签并扁平化
   */
  async getBrowserBookmarks(): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    return new Promise((resolve) => {
      chrome.bookmarks.getTree((tree) => {
        const flatBookmarks: chrome.bookmarks.BookmarkTreeNode[] = []
        
        // 递归遍历函数
        const traverse = (nodes: chrome.bookmarks.BookmarkTreeNode[]) => {
          for (const node of nodes) {
            if (node.url) {
              // 如果有 URL，说明是书签
              flatBookmarks.push(node)
            } else if (node.children) {
              // 如果没有 URL 且有 children，说明是文件夹，继续遍历
              traverse(node.children)
            }
          }
        }

        traverse(tree)
        resolve(flatBookmarks)
      })
    })
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
   * 只要服务器有响应（包括 403, 401, 500），都视为"链接存在"
   * 只有网络错误（DNS, Timeout, Connection Refused）视为"死链"
   */
  async checkUrlAccessibility(url: string): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8秒超时

      // mode: 'no-cors' 允许我们要么得到 opaque response (成功/4xx/5xx)，要么抛出网络错误
      await fetch(url, { 
          method: "HEAD", 
          mode: "no-cors", 
          signal: controller.signal 
      })
      
      clearTimeout(timeoutId)
      return true
    } catch (error) {
      // 网络不通
      return false
    }
  }
}
