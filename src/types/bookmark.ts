export interface BookmarkItem {
  id: string
  url: string
  title: string
  // 原始页面描述或截取的开头内容
  description?: string
  // AI 生成的总结
  content_summary?: string
  // AI 生成的标签
  tags: string[]
  // 创建时间戳
  timestamp: number
  // 处理状态：pending (等待AI处理), processing (处理中), done (完成), error (失败)
  status: "pending" | "processing" | "done" | "error"
  // 预留给错误信息
  errorMessage?: string
}

export interface SearchQuery {
  query: string
  tags?: string[]
}
