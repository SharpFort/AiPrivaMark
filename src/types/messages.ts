export const MESSAGES = {
  EXTRACT_CONTENT: "EXTRACT_CONTENT"
}

export interface ExtractContentResponse {
  title: string
  content: string // 纯文本内容，用于 AI 分析
  excerpt: string // 简介
  url: string
  metadata?: Record<string, any>
}
