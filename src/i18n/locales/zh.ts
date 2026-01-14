import type { Translations } from "./en"

export const zh: Translations = {
    // Common
    appName: "AI 智能书签",
    appSlogan: "本地优先的知识库",
    version: "v0.0.1",
    versionFooter: "v0.0.1 • 仅本地存储",

    // Actions
    save: "保存",
    cancel: "取消",
    delete: "删除",
    close: "关闭",
    done: "完成",
    scan: "扫描",
    all: "全部",

    // Header
    saveCurrentPage: "保存当前页面",
    settings: "设置",

    // Search
    searchBookmarks: "搜索书签...",
    searchPlaceholder: "按标题、摘要或标签搜索...",
    noResultsFor: "未找到相关结果",

    // Bookmarks
    noBookmarksYet: "暂无书签",
    importHint: "从设置导入或手动添加",
    noBookmarksFound: "未找到书签",
    items: "项",
    noSummaryAvailable: "暂无摘要",
    more: "更多",

    // Tags
    smartTags: "智能标签",

    // Batch Process
    bookmarksNeedAnalysis: "个书签需要分析",
    startAIAnalysis: "开始 AI 分析",
    analyzing: "正在分析...",
    stop: "停止",
    success: "成功",
    failed: "失败",

    // Status
    pending: "待处理",
    done_status: "已完成",

    // Sidebar Navigation
    dashboard: "仪表盘",
    settingsSection: "设置",
    basicSettings: "基本设置",
    importExport: "导入/导出",
    apiService: "API 服务",
    dataPrivacy: "数据与隐私",
    about: "关于",

    // Dashboard
    myKnowledgeBase: "我的知识库",

    // API Configuration
    apiConfiguration: "API 配置",
    provider: "服务商",
    apiKey: "API 密钥",
    baseUrl: "接口地址",
    model: "模型",
    testConnection: "测试连接",
    testingConnection: "正在测试连接...",
    connectionSuccessful: "连接成功！🎉",
    connectionFailed: "失败：",
    settingsSaved: "设置已自动保存",
    testing: "测试中...",

    // Data & Privacy
    smartTagsPrompt: "智能标签与提示词",
    customSystemPrompt: "自定义系统提示词",
    customPromptPlaceholder: "例如：用中文总结。专注于代码细节。",
    savePrompt: "保存提示词",

    // Import
    importData: "导入数据",
    browserBookmarks: "浏览器书签",
    scanFromChrome: "扫描并导入 Chrome 书签",
    scanningBookmarks: "正在扫描浏览器书签...",
    found: "找到",
    total: "总计",
    new: "新增",
    duplicates: "重复",
    startImport: "开始导入",

    // Export
    dataFreedom: "数据自由",
    exportJsonBackup: "📤 导出 JSON 备份",
    clearAllData: "🗑️ 清除所有数据",
    clearDataConfirm: "危险：这将删除所有数据。确认吗？",
    allDataCleared: "所有数据已清除",

    // About
    aboutTitle: "AI 智能书签",
    aboutSlogan: "隐私优先的 AI 知识库",
    localFirstDesc: "您的数据永远不会离开您的设备，除非与您配置的 AI 服务商通信。",
    openSourceDesc: "使用 Plasmo、React 和 Tailwind CSS 构建。",
    versionLabel: "版本：",
    versionValue: "0.0.1 (Alpha)",

    // Import Modal
    importingBrowserBookmarks: "正在导入浏览器书签",
    imported: "已导入",
    timeElapsed: "已用时间",
    estRemaining: "预计剩余",
    finished: "已完成",
    progress: "进度",
    waiting: "等待中...",
    checking: "检测中...",
    duplicateSkipped: "重复（已跳过）",
    networkError: "网络错误 / 超时",
    unknownError: "未知错误",

    // Errors
    noActiveTab: "未找到活动标签页",
    cannotSaveSystemPages: "无法保存浏览器系统页面",
    cannotReadPage: "无法读取页面内容，请刷新页面后重试。",
    failedToExtract: "提取内容失败",
    apiKeyNotFound: "未找到 API 密钥，请在设置中配置。",
    pleaseSetApiKey: "请先设置 API 密钥",
    unknownErrorOccurred: "发生未知错误",

    // Confirmations
    deleteConfirm: "确定要删除这个书签吗？",

    // API Service Page
    apiServiceTitle: "API 服务",
    apiServiceDesc: "配置 AI 服务所需的 API 密钥以启用智能书签功能",
    apiKeySecurityTitle: "API 密钥安全说明",
    apiKeySecurityDesc1: "您的 API 密钥将使用浏览器的安全存储机制进行本地存储",
    apiKeySecurityDesc2: "密钥仅用于与相应 AI 服务进行直接通信",
    apiKeySecurityDesc3: "我们不会将您的 API 密钥上传到服务器或分享给第三方",
    textModel: "文本模型",
    embeddingModel: "向量模型",
    currentTextModelService: "当前使用的文本模型服务",
    notConfigured: "未配置",
    configured: "已配置",
    addOpenAICompatible: "添加 OpenAI 兼容服务",

    // Service Providers
    providerOpenAI: "OpenAI",
    providerOpenAIDesc: "OpenAI大模型，由OpenAI提供",
    providerDeepSeek: "DeepSeek",
    providerDeepSeekDesc: "DeepSeek深度求索大模型",
    providerZhipu: "智谱AI",
    providerZhipuDesc: "智谱GLM大模型，由智谱AI提供",
    providerAliyun: "阿里云百炼",
    providerAliyunDesc: "阿里云百炼大模型平台，它集成了通义系列大模型和第三方大模型",
    providerSiliconFlow: "硅基流动",
    providerSiliconFlowDesc: "SiliconCloud 硅基流动云服务，高效、模型丰富、性价比高的大模型服务平台",
    providerTencent: "腾讯混元",
    providerTencentDesc: "腾讯混元大模型，由腾讯云提供",

    // Config Modal
    configTitle: "配置",
    getKey: "获取 API Key",
    enterApiKey: "输入 API Key",
    verify: "验证",
    modelInfo: "模型信息",
    viewPricing: "查看模型及定价",

    // Usage Stats
    apiUsageStats: "API 使用统计",
    textModelUsage: "文本模型调用",
    embeddingModelUsage: "向量模型调用",
    inputTokens: "输入 Token:",
    outputTokens: "输出 Token:",
    tokenCount: "Token 数:",
    currentMonth: "本月用量",

    // Tags
    freeModel: "免费模型",
    richModels: "模型丰富",

    // Import/Export
    importExportData: "数据导入/导出",
    importBrowserBookmarks: "导入浏览器书签",
    importLocalHtml: "导入本地 HTML 书签",
    importJsonBackup: "恢复 JSON 备份",
    exportData: "导出数据",
    exportJson: "导出 JSON 备份",
    // clearAllData duplicated
    import: "导入",
    export: "导出",
    fileSelect: "选择文件",
    htmlFileDesc: "导入标准 HTML 书签文件（例如来自 Chrome/Edge/Firefox 导出）",
    jsonFileDesc: "从 AiPrivaMark 备份文件恢复（自动合并标签，冲突需手动解决）",
    conflictResolution: "导入冲突解决",
    conflictCount: "个冲突项待解决",
    resolveConflicts: "解决冲突",
    keepExisting: "保留现有总结",
    useImported: "使用导入总结",
    mergeTagsInfo: "标签将被自动合并。",
    importSuccess: "导入成功",
    importedCount: "项已导入",
    mergedCount: "项已合并",

    // Loading
    loadingConfiguration: "正在加载配置...",

    // Basic Settings
    keyboardShortcuts: "快捷键设置",
    setShortcutKey: "设置快捷键",
    quickSaveBookmark: "快速保存书签",
    quickSaveDesc: "快速保存当前页面为书签",
    quickSearchBookmark: "快速搜索书签",
    quickSearchDesc: "打开快速搜索面板",
    notSet: "未设置",

    // Appearance
    appearance: "外观设置",
    theme: "主题",
    lightTheme: "浅色",
    darkTheme: "深色",
    deviceTheme: "设备",

    // Language
    language: "语言设置",
    english: "English",
    chinese: "简体中文",

    // Search Settings
    searchSettings: "搜索设置",
    searchResultCount: "搜索结果数量",
    addressBarResultCount: "地址栏搜索结果数量",
    searchHistory: "搜索历史",
    clearSearchHistory: "清除搜索历史",
    quickAccessWebsite: "快捷访问网站",
    sortBy: "显示类型：",
    displayCount: "显示数量：",
    recentVisit: "最近访问",
    hideOption: "隐藏",
    pinnedSites: "固定网站",
    visitFrequency: "访问最多",
    recentlyStored: "最近保存",

    // Missing Keys
    scanDesc: "扫描并导入 Chrome 书签",
    dataFreedomDesc: "您完全拥有您的数据。您可以导出备份，或清空数据以重新开始。",
    importFailed: "导入失败",
    keyBindHelp: "快捷键暂不支持自定义。欢迎提交 Pull Request！",

    // Backup Restore
    restoreConfigConfirm: "是否同时恢复配置信息（含API设置、基本设置、提示词）？",
    apiKeyConflict: "检测到API密钥冲突，是否使用导入的API密钥？\n确定=使用导入的，取消=保留当前的",
    configRestored: "配置已恢复",

    // Task Processing
    runInBackground: "后台运行",
    processing: "处理中...",
    taskFinished: "任务完成",
    processingInBackground: "后台处理中...",
    clickToRestore: "点击还原详情",

    analyzeLibrary: "智能分析",
    analyzeDesc: "使用 AI 自动为书签生成标签和摘要。",
    startAnalysis: "开始分析",
    allAnalyzed: "所有书签已完成分析。",

    // AI Prompts
    process_prompt_system: "你是一个专业的网页内容整理助手。",
    process_prompt_user_intro: "请根据用户提供的网页文本内容，完成以下两个任务，并仅以 JSON 格式返回结果：",
    process_prompt_task_summary: "1. **生成摘要**：\n   - 提取客观、简洁的要点。\n   - 不得出现\"我\"、\"我们\"等主观评价词，只陈述页面的核心信息。\n   - 精确控制在{{maxLength}}字以内。",
    process_prompt_task_tags: "2. **提取标签**：\n   - 提取 {{count}} 个关键标签。\n   - 标签应简洁、准确（2-20个字符）。",
    process_prompt_output_format: "请严格按照以下 JSON 格式返回结果，不要包含 markdown 标记或其他多余内容：\n{\n  \"summary\": \"摘要内容...\",\n  \"tags\": [\"标签1\", \"标签2\", ...]\n}"
}
