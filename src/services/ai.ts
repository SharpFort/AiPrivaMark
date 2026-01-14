import { t } from "~i18n"
import type { AppConfig } from "~types/config"
import { smartTruncate } from "~utils/text"

export interface AIAnalysisResult {
  summary: string
  tags: string[]
}


// 辅助函数：计算字符串视觉长度
function getStringVisualLength(str: string): number {
  let length = 0
  for (let i = 0; i < str.length; i++) {
    // 中日韩文字计为2个单位长度
    if (/[\u4e00-\u9fa5\u3040-\u30ff\u3400-\u4dbf]/.test(str[i])) {
      length += 2
    } else {
      length += 1
    }
  }
  return length
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
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: "Say Hi" }],
          max_tokens: 5
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}) as any)
        throw new Error(
          errorData.error?.message || `HTTP Error: ${response.status}`
        )
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
  async generateSummaryAndTags(
    content: string,
    config: AppConfig,
    signal?: AbortSignal
  ): Promise<AIAnalysisResult> {
    const { apiKey, baseUrl, model } = config

    // 使用智能截断，限制 10000 字符
    const truncatedContent = smartTruncate(content, 10000)

    const promptSettings = config.promptSettings
    const summaryMaxLength = promptSettings?.summaryMaxLength || 100
    const tagCount = promptSettings?.tagCount || 8

    // 构造工程化的 System Prompt (使用 i18n)
    const systemPromptTemplate = `{{system}}
{{user_intro}}

{{task_summary}}

{{task_tags}}

{{output_format}}`

    const systemPrompt = systemPromptTemplate
      .replace("{{system}}", t("process_prompt_system"))
      .replace("{{user_intro}}", t("process_prompt_user_intro"))
      .replace("{{task_summary}}", t("process_prompt_task_summary").replace("{{maxLength}}", String(summaryMaxLength)))
      .replace("{{task_tags}}", t("process_prompt_task_tags").replace("{{count}}", String(tagCount)))
      .replace("{{output_format}}", t("process_prompt_output_format"))

    const cleanBaseUrl = baseUrl.replace(/\/+$/, "")
    const endpoint = `${cleanBaseUrl}/chat/completions`

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: truncatedContent }
          ],
          temperature: 0.3
        }),
        signal // 支持请求取消
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}) as any)
        throw new Error(
          errorData.error?.message || `HTTP Error: ${response.status}`
        )
      }

      const data = await response.json()
      const rawContent = data.choices?.[0]?.message?.content

      if (!rawContent) {
        throw new Error("AI returned empty content")
      }

      // 解析 JSON
      const cleanedJson = this.cleanJsonString(rawContent)
      let result = JSON.parse(cleanedJson) as AIAnalysisResult

      // 简单验证结构
      if (!result.summary || !Array.isArray(result.tags)) {
        throw new Error("Invalid JSON structure from AI")
      }

      // 后处理：清洗标签
      result.tags = this.cleanTags(result.tags)

      return result
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('AI Request Cancelled')
        throw error
      }
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
  },

  /**
   * 清洗标签：长度过滤、正则过滤、去重
   */
  cleanTags(tags: string[]): string[] {
    return tags
      .map((tag) => tag.trim())
      .filter((tag) => {
        if (!tag) return false
        const tagLength = getStringVisualLength(tag)
        // 长度限制 2-20
        if (tagLength < 2 || tagLength > 20) {
          return false
        }
        // 不能包含特殊字符
        return /^[^\.,\/#!$%\^&\*;:{}=\-_`~()]+$/.test(tag)
      })
      // 去重
      .filter((tag, index, self) => self.indexOf(tag) === index)
  },

  /**
   * 生成用于 Embedding 的文本 (组合 Title + Tags + Excerpt)
   */
  makeEmbeddingText(title: string, tags: string[], excerpt: string): string {
    const parts = []
    if (title) parts.push(`title: ${title}`)
    if (tags.length > 0) parts.push(`tags: ${tags.join(",")}`)
    if (excerpt) parts.push(`excerpt: ${excerpt}`)

    // 简单的清理和组合
    return parts.join("; ").replace(/\s+/g, " ").trim()
  }
}
