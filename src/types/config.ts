export interface AppConfig {
  provider: "openai" | "deepseek" | "custom"
  apiKey: string
  baseUrl: string
  model: string
  customPrompt?: string
}

export const DEFAULT_CONFIG: AppConfig = {
  provider: "openai",
  apiKey: "",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-3.5-turbo",
  customPrompt: ""
}

export const DEEPSEEK_CONFIG: Partial<AppConfig> = {
  provider: "deepseek",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-chat"
}
