import type { AppConfig } from "~types/config"

export interface AIAnalysisResult {
  summary: string
  tags: string[]
}

export const AIService = {
  /**
   * 测试 API 连接
   */
  async testConnection(config: AppConfig): Promise<boolean> {
    const { apiKey, baseUrl, model } = config
    const cleanBaseUrl = baseUrl.replace(/\/+$/, "")
    const endpoint = `${cleanBaseUrl}/chat/completions`

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: "Say Hi" }],
          max_tokens: 5
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `HTTP Error: ${response.status}`)
      }

      return true
    } catch (error) {
      console.error("Connection Test Failed:", error)
      throw error
    }
  },

  /**
   * 调用 AI 生成摘要和标签
   */
  async generateSummaryAndTags(content: string, config: AppConfig): Promise<AIAnalysisResult> {
    const { apiKey, baseUrl, model } = config

    const truncatedContent = content.slice(0, 15000)

    // 使用 promptSettings（优先）或 customPrompt（向后兼容）
    const promptSettings = config.promptSettings
    const summaryMaxLength = promptSettings?.summaryMaxLength || 100
    const tagCount = promptSettings?.tagCount || 8
    const userInstruction = promptSettings?.systemPrompt?.trim()
      || config.customPrompt?.trim()
      || `请根据用户提供的网页文本内容，生成一份简短的中文摘要（${summaryMaxLength}字以内），并提取${tagCount}个关键标签。`

    const systemPrompt = `你是一个专业的网页内容整理助手。
${userInstruction}
请严格按照以下 JSON 格式返回结果，不要包含 markdown 标记或其他多余内容：
{
  "summary": "摘要内容...",
  "tags": ["标签1", "标签2", ...]
}`

    const cleanBaseUrl = baseUrl.replace(/\/+$/, "")
    const endpoint = `${cleanBaseUrl}/chat/completions`

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: truncatedContent }
          ],
          temperature: 0.3
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `HTTP Error: ${response.status}`)
      }

      const data = await response.json()
      const rawContent = data.choices?.[0]?.message?.content

      if (!rawContent) {
        throw new Error("AI returned empty content")
      }

      // 解析 JSON
      const cleanedJson = this.cleanJsonString(rawContent)
      const result = JSON.parse(cleanedJson) as AIAnalysisResult

      // 简单验证结构
      if (!result.summary || !Array.isArray(result.tags)) {
        throw new Error("Invalid JSON structure from AI")
      }

      return result

    } catch (error) {
      console.error("AI Generation Failed:", error)
      throw error
    }
  },

  /**
   * 清洗可能包含 markdown 标记的 JSON 字符串
   */
  cleanJsonString(str: string): string {
    let cleaned = str.replace(/```json/g, "").replace(/```/g, "")
    const firstBrace = cleaned.indexOf("{")
    const lastBrace = cleaned.lastIndexOf("}")

    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1)
    }

    return cleaned.trim()
  }
}
