import { Storage } from "@plasmohq/storage"
import type { BookmarkItem } from "~types/bookmark"

// 使用 @plasmohq/storage 封装存储服务
const storage = new Storage({
  area: "local"
})

const BOOKMARKS_KEY = "bookmarks-v1"

export const StorageService = {
  /**
   * 获取所有书签
   */
  async getBookmarks(): Promise<BookmarkItem[]> {
    const bookmarks = await storage.get<BookmarkItem[]>(BOOKMARKS_KEY)
    return bookmarks || []
  },

  /**
   * 根据 ID 获取单个书签
   */
  async getBookmarkById(id: string): Promise<BookmarkItem | undefined> {
    const bookmarks = await this.getBookmarks()
    return bookmarks.find(b => b.id === id)
  },

  /**
   * 添加新书签
   * @throws Error if bookmark with same URL exists
   */
  async addBookmark(item: Omit<BookmarkItem, "id" | "timestamp">): Promise<BookmarkItem> {
    const bookmarks = await this.getBookmarks()

    // 去重检查
    const existing = bookmarks.find(b => b.url === item.url)
    if (existing) {
      // 也可以选择更新现有书签，这里为了简单直接抛出
      throw new Error("Bookmark already exists!")
    }

    // 生成 ID
    const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()

    const newBookmark: BookmarkItem = {
      ...item,
      id,
      timestamp: Date.now(),
      tags: item.tags || [],
      content_summary: item.content_summary || "",
      status: item.status || "pending"
    }

    const updatedBookmarks = [newBookmark, ...bookmarks]
    await storage.set(BOOKMARKS_KEY, updatedBookmarks)

    return newBookmark
  },

  /**
   * 批量添加书签 (优化性能 + 去重)
   */
  async addBookmarksBatch(items: Omit<BookmarkItem, "id" | "timestamp">[]): Promise<number> {
    const currentBookmarks = await this.getBookmarks()
    const newBookmarks: BookmarkItem[] = []

    // 简单的去重检查 Set (基于 URL)
    const existingUrls = new Set(currentBookmarks.map(b => b.url))
    let addedCount = 0

    for (const item of items) {
      if (!existingUrls.has(item.url)) {
        newBookmarks.push({
          ...item,
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          tags: item.tags || [],
          content_summary: item.content_summary || "",
          status: item.status || "pending"
        })
        addedCount++
        // 更新 Set 防止 batch 内部重复
        existingUrls.add(item.url)
      }
    }

    if (addedCount > 0) {
      const updatedBookmarks = [...newBookmarks, ...currentBookmarks]
      await storage.set(BOOKMARKS_KEY, updatedBookmarks)
    }

    return addedCount
  },

  /**
   * 更新书签信息
   */
  async updateBookmark(id: string, updates: Partial<BookmarkItem>): Promise<void> {
    const bookmarks = await this.getBookmarks()
    const index = bookmarks.findIndex((b) => b.id === id)

    if (index !== -1) {
      bookmarks[index] = { ...bookmarks[index], ...updates }
      await storage.set(BOOKMARKS_KEY, bookmarks)
    }
  },

  /**
   * 删除书签
   */
  async removeBookmark(id: string): Promise<void> {
    const bookmarks = await this.getBookmarks()
    const updatedBookmarks = bookmarks.filter((b) => b.id !== id)
    await storage.set(BOOKMARKS_KEY, updatedBookmarks)
  },

  /**
   * 清空所有书签
   */
  async clearAll(): Promise<void> {
    await storage.remove(BOOKMARKS_KEY)
  },

  /**
   * 覆盖所有书签 (用于全量导入)
   */
  async overrideAllBookmarks(bookmarks: BookmarkItem[]): Promise<void> {
    await storage.set(BOOKMARKS_KEY, bookmarks)
  }
}
