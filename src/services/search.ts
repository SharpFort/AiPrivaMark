import Fuse from "fuse.js"
import type { BookmarkItem } from "~types/bookmark"

// Fuse.js 搜索配置
const fuseOptions: Fuse.IFuseOptions<BookmarkItem> = {
  includeScore: true,
  threshold: 0.4, // 0.0 是完全匹配，1.0 是匹配所有。0.4 是一个比较均衡的模糊度
  keys: [
    { name: "title", weight: 0.4 },           // 标题权重最高
    { name: "tags", weight: 0.3 },            // 标签次之
    { name: "content_summary", weight: 0.2 }, // AI 总结
    { name: "description", weight: 0.1 }      // 原始描述
  ]
}

export const SearchService = {
  /**
   * 执行搜索
   * @param bookmarks 所有的书签列表
   * @param query 搜索关键词
   * @returns 过滤后的书签列表
   */
  search(bookmarks: BookmarkItem[], query: string): BookmarkItem[] {
    if (!query || query.trim() === "") {
      return bookmarks
    }

    const fuse = new Fuse(bookmarks, fuseOptions)
    const results = fuse.search(query)
    
    // Fuse 返回的是 { item, score } 结构，我们需要还原回 BookmarkItem 数组
    return results.map((result) => result.item)
  }
}
