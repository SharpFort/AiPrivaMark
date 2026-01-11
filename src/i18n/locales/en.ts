export const en = {
    // Common
    appName: "AI Priva Mark",
    appSlogan: "Local-First Knowledge Base",
    version: "v0.0.1",
    versionFooter: "v0.0.1 • Local Storage Only",

    // Actions
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    close: "Close",
    done: "Done",
    scan: "Scan",
    all: "All",

    // Header
    saveCurrentPage: "Save Current Page",
    settings: "Settings",

    // Search
    searchBookmarks: "Search bookmarks...",
    searchPlaceholder: "Search by title, summary, or tags...",
    noResultsFor: "No results found for",

    // Bookmarks
    noBookmarksYet: "No bookmarks yet.",
    importHint: "Import from settings or add manually.",
    noBookmarksFound: "No bookmarks found.",
    items: "items",
    noSummaryAvailable: "No summary available",
    more: "more",

    // Tags
    smartTags: "Smart Tags",

    // Batch Process
    bookmarksNeedAnalysis: "bookmarks need analysis.",
    startAIAnalysis: "Start AI Analysis",
    analyzing: "Analyzing...",
    stop: "STOP",
    success: "Success",
    failed: "Failed",

    // Status
    pending: "pending",
    done_status: "done",

    // Sidebar Navigation
    dashboard: "Dashboard",
    settingsSection: "Settings",
    basicSettings: "Basic Settings",
    importExport: "Import/Export",
    apiService: "API Service",
    dataPrivacy: "Data & Privacy",
    about: "About",

    // Dashboard
    myKnowledgeBase: "My Knowledge Base",

    // API Configuration
    apiConfiguration: "API Configuration",
    provider: "Provider",
    apiKey: "API Key",
    baseUrl: "Base URL",
    model: "Model",
    testConnection: "Test Connection",
    testingConnection: "Testing connection...",
    connectionSuccessful: "Connection successful! 🎉",
    connectionFailed: "Failed:",
    settingsSaved: "Settings saved automatically.",
    testing: "Testing...",

    // Data & Privacy
    smartTagsPrompt: "Smart Tags & Prompt",
    customSystemPrompt: "Custom System Prompt",
    customPromptPlaceholder: "e.g. Summarize in Chinese. Focus on coding details.",
    savePrompt: "Save Prompt",

    // Import
    importData: "Import Data",
    browserBookmarks: "Browser Bookmarks",
    scanFromChrome: "Scan and import from Chrome",
    scanningBookmarks: "Scanning browser bookmarks...",
    found: "Found",
    total: "total",
    new: "New",
    duplicates: "Duplicates",
    startImport: "Start Import",

    // Export
    dataFreedom: "Data Freedom",
    exportJsonBackup: "📤 Export JSON Backup",
    clearAllData: "🗑️ Clear All Data",
    clearDataConfirm: "DANGER: This will delete ALL data. Confirm?",
    allDataCleared: "All data cleared.",

    // About
    aboutTitle: "AI Priva Mark",
    aboutSlogan: "Privacy-First AI Knowledge Base",
    localFirstDesc: "Your data never leaves your device, except when communicating with the AI provider you configured.",
    openSourceDesc: "Built with Plasmo, React, and Tailwind CSS.",
    versionLabel: "Version:",
    versionValue: "0.0.1 (Alpha)",

    // Import Modal
    importingBrowserBookmarks: "Importing Browser Bookmarks",
    imported: "Imported",
    timeElapsed: "Time Elapsed",
    estRemaining: "Est. Remaining",
    finished: "Finished",
    progress: "Progress",
    waiting: "Waiting...",
    checking: "Checking...",
    duplicateSkipped: "Duplicate (Skipped)",
    networkError: "Network Error / Timeout",
    unknownError: "Unknown Error",

    // Errors
    noActiveTab: "No active tab found",
    cannotSaveSystemPages: "Cannot save browser system pages.",
    cannotReadPage: "Cannot read page content. Please refresh the page and try again.",
    failedToExtract: "Failed to extract content",
    apiKeyNotFound: "API Key not found. Please set it in Settings.",
    pleaseSetApiKey: "Please set API Key first.",
    unknownErrorOccurred: "Unknown error occurred",

    // Confirmations
    deleteConfirm: "Are you sure you want to delete this bookmark?",

    // API Service Page
    apiServiceTitle: "API Service",
    apiServiceDesc: "Configure API keys to enable AI capabilities",
    apiKeySecurityTitle: "API Key Security",
    apiKeySecurityDesc1: "Your API Key is stored locally using the browser's secure storage mechanism",
    apiKeySecurityDesc2: "The key is only used for direct communication with the corresponding AI service",
    apiKeySecurityDesc3: "We will never upload your API Key to our servers or share it with third parties",
    textModel: "Text Model",
    embeddingModel: "Embedding Model",
    currentTextModelService: "Current Text Model Service",
    notConfigured: "Not Configured",
    configured: "Configured",
    addOpenAICompatible: "Add OpenAI Compatible Service",

    // Service Providers
    providerOpenAI: "OpenAI",
    providerOpenAIDesc: "Official OpenAI Large Models",
    providerDeepSeek: "DeepSeek",
    providerDeepSeekDesc: "DeepSeek AI Models",
    providerZhipu: "Zhipu AI",
    providerZhipuDesc: "GLM Models by Zhipu AI",
    providerAliyun: "Aliyun Bailian",
    providerAliyunDesc: "Tongyi Qwen Series Models",
    providerSiliconFlow: "SiliconFlow",
    providerSiliconFlowDesc: "High performance model service platform",
    providerTencent: "Tencent Hunyuan",
    providerTencentDesc: "Hunyuan Large Models by Tencent",

    // Config Modal
    configTitle: "Configuration",
    getKey: "Get API Key",
    enterApiKey: "Enter API Key",
    verify: "Verify",
    modelInfo: "Model Information",
    viewPricing: "View Models & Pricing",

    // Usage Stats
    apiUsageStats: "API Usage Statistics",
    textModelUsage: "Text Model Usage",
    embeddingModelUsage: "Embedding Model Usage",
    inputTokens: "Input Tokens:",
    outputTokens: "Output Tokens:",
    tokenCount: "Token Count:",
    currentMonth: "Current Month",

    // Tags
    // Import/Export

    importLocalHtml: "Import Local HTML File",
    importJsonBackup: "Restore JSON Backup",
    exportData: "Export Data",
    exportJson: "Export JSON Backup",
    // clearAllData duplicated
    import: "Import",
    export: "Export",
    fileSelect: "Select File",
    htmlFileDesc: "Import standardized HTML bookmark file (e.g. from Chrome/Edge/Firefox)",
    jsonFileDesc: "Restore from AiPrivaMark backup file (Merge tags, prompt for conflicts)",
    conflictResolution: "Import Conflict Resolution",
    conflictCount: "conflicts found",
    resolveConflicts: "Resolve Conflicts",
    keepExisting: "Keep Existing Summary",
    useImported: "Use Imported Summary",
    mergeTagsInfo: "Tags will be automatically merged.",
    importSuccess: "Import Successful",
    importedCount: "items imported",
    mergedCount: "items merged",

    // Loading
    loadingConfiguration: "Loading Configuration...",

    // Basic Settings
    keyboardShortcuts: "Keyboard Shortcuts",
    setShortcutKey: "Set Shortcut Key",
    quickSaveBookmark: "Quick Save Bookmark",
    quickSaveDesc: "Save current page as bookmark",
    quickSearchBookmark: "Quick Search Bookmark",
    quickSearchDesc: "Open quick search panel",
    notSet: "Not Set",

    // Appearance
    appearance: "Appearance",
    theme: "Theme",
    lightTheme: "Light",
    darkTheme: "Dark",
    deviceTheme: "Device",

    // Language
    language: "Language",
    english: "English",
    chinese: "Chinese (Simplified)",

    // Search Settings
    searchSettings: "Search Settings",
    searchResultCount: "Search Result Count",
    addressBarResultCount: "Address Bar Search Result Count",
    searchHistory: "Search History",
    clearSearchHistory: "Clear Search History",
    quickAccessWebsite: "Quick Access Website",
    sortBy: "Sort By:",
    displayCount: "Display Count:",
    recentVisit: "Recent Visit",
    hideOption: "Hide",
    pinnedSites: "Pinned Sites",
    visitFrequency: "Visit Frequency",
    recentlyStored: "Recently Stored",
    // Missing Keys from options.tsx usage
    scanDesc: "Scan and import from Chrome",
    dataFreedomDesc: "You fully own your data. Export it for backup or clear it to start fresh.",
    freeModel: "Free Model",
    richModels: "Rich Models",

    // Additional Missing
    importExportData: "Import/Export Data",
    importBrowserBookmarks: "Import Browser Bookmarks",
    importFailed: "Import Failed",
    keyBindHelp: "Shortcuts are not customizable yet. Pull requests welcome!",

    // Backup Restore
    restoreConfigConfirm: "Also restore configuration (API settings, general settings, prompts)?",
    apiKeyConflict: "API key conflict detected. Use imported API key?\nOK = Use imported, Cancel = Keep current",
    configRestored: "Configuration restored.",

    // Task Processing
    runInBackground: "Run in Background",
    processing: "Processing...",
    taskFinished: "Task Finished",
    processingInBackground: "Processing in background...",
    clickToRestore: "Click to restore details",
    estRemaining: "Est. Remaining",

    // Analysis
    analyzeLibrary: "Smart Analysis",
    analyzeDesc: "Use AI to auto-tag and summarize your bookmarks.",
    startAnalysis: "Start Analysis",
    allAnalyzed: "All bookmarks have been analyzed."
}

export type Translations = typeof en
