export interface ProviderConfig {
  apiKey: string
  baseUrl: string
  model: string
  // 新增字段
  getApiKeyUrl?: string      // 获取 API Key 的网页地址
  pricingUrl?: string        // 查看模型及定价的网页地址
  availableModels?: string[] // 可用模型列表
}

// 基本设置
export interface GeneralSettings {
  language: 'en' | 'zh'
  theme: 'light' | 'dark' | 'system'
  searchResultCount: number
  addressBarResultCount: number
  searchHistoryEnabled: boolean
  quickAccessSortBy: 'recent' | 'frequency' | 'stored' | 'pinned'
  quickAccessCount: number
}

// 提示词设置
export interface PromptSettings {
  systemPrompt: string        // 系统提示词
  summaryMaxLength?: number   // 摘要最大长度
  tagCount?: number           // 生成标签数量
  outputLanguage?: 'auto' | 'zh' | 'en'  // 输出语言
}

export interface AppConfig {
  provider: "openai" | "deepseek" | "custom" | "siliconflow" | "zhipu" | "aliyun"
  apiKey: string
  baseUrl: string
  model: string
  customPrompt?: string  // 保留向后兼容
  providerSettings: Record<string, ProviderConfig>
  // 新增配置
  generalSettings?: GeneralSettings
  promptSettings?: PromptSettings
}

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  language: 'zh',
  theme: 'system',
  searchResultCount: 50,
  addressBarResultCount: 9,
  searchHistoryEnabled: true,
  quickAccessSortBy: 'recent',
  quickAccessCount: 8
}

export const DEFAULT_PROMPT_SETTINGS: PromptSettings = {
  systemPrompt: '请根据用户提供的网页文本内容，生成一份简短的中文摘要（100字以内），并提取5-8个关键标签。',
  summaryMaxLength: 100,
  tagCount: 8,
  outputLanguage: 'auto'
}

export const DEFAULT_CONFIG: AppConfig = {
  provider: "openai",
  apiKey: "",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-3.5-turbo",
  customPrompt: "",
  generalSettings: DEFAULT_GENERAL_SETTINGS,
  promptSettings: DEFAULT_PROMPT_SETTINGS,
  providerSettings: {
    openai: {
      apiKey: "",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-3.5-turbo",
      getApiKeyUrl: "https://platform.openai.com/api-keys",
      pricingUrl: "https://openai.com/pricing",
      availableModels: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "gpt-4o", "gpt-4o-mini"]
    },
    deepseek: {
      apiKey: "",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-chat",
      getApiKeyUrl: "https://platform.deepseek.com/api_keys",
      pricingUrl: "https://platform.deepseek.com/api-docs/zh-cn/pricing",
      availableModels: ["deepseek-chat", "deepseek-reasoner"]
    },
    zhipu: {
      apiKey: "",
      baseUrl: "https://open.bigmodel.cn/api/paas/v4",
      model: "glm-4",
      getApiKeyUrl: "https://open.bigmodel.cn/usercenter/apikeys",
      pricingUrl: "https://open.bigmodel.cn/pricing",
      availableModels: ["glm-4", "glm-4-plus", "glm-4-flash"]
    },
    aliyun: {
      apiKey: "",
      baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      model: "qwen-plus",
      getApiKeyUrl: "https://bailian.console.aliyun.com/?apiKey=1",
      pricingUrl: "https://help.aliyun.com/zh/model-studio/getting-started/models",
      availableModels: ["qwen-turbo", "qwen-plus", "qwen-max"]
    },
    siliconflow: {
      apiKey: "",
      baseUrl: "https://api.siliconflow.cn/v1",
      model: "deepseek-ai/DeepSeek-V3",
      getApiKeyUrl: "https://cloud.siliconflow.cn/account/ak",
      pricingUrl: "https://siliconflow.cn/pricing",
      availableModels: ["deepseek-ai/DeepSeek-V3", "Qwen/Qwen2.5-72B-Instruct"]
    },
    custom: {
      apiKey: "",
      baseUrl: "",
      model: ""
    }
  }
}

export const DEEPSEEK_CONFIG: Partial<AppConfig> = {
  provider: "deepseek",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-chat"
}

