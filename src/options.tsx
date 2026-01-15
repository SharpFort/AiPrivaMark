
import { useEffect, useMemo, useState } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import { AIService } from "~services/ai"
import { BookmarkImportService } from "~services/bookmark-import"
import { SearchService } from "~services/search"
import { StorageService } from "~services/storage"
import { useTaskProcessor, type TaskExecutor, type TaskItem } from "~hooks/use-task-processor"
import { TaskProcessModal } from "~components/task-process-modal"
import { TaskProcessMini } from "~components/task-process-mini"
import { DEFAULT_CONFIG, DEEPSEEK_CONFIG, type AppConfig } from "~types/config"
import type { BookmarkItem } from "~types/bookmark"
import { isFullBackup, type FullBackup } from "~types/backup"
import { BookmarkCard } from "~components/bookmark-card"
import { useI18n } from "~i18n/hook"

import "./style.css"

import { ServiceCard } from "./components/service-card"
import { ServiceConfigModal } from "./components/service-config-modal"
import { buildAIConfig } from "~utils/config-utils"

type TabType = "dashboard" | "basicSettings" | "importExport" | "api" | "data" | "about"

function Options() {
    const { t, isReady, locale, setLocale } = useI18n()
    const [activeTab, setActiveTab] = useState<TabType>("dashboard")

    // === 全局数据状态 ===
    const [config, setConfig] = useStorage<AppConfig>("app-config", DEFAULT_CONFIG)
    const [activeService, setActiveService] = useState<string | null>(null)
    const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])

    // Task Processor
    const processor = useTaskProcessor()
    const [processPhase, setProcessPhase] = useState<"import" | "analysis">("import")

    // === Dashboard 状态 ===
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedTag, setSelectedTag] = useState<string | null>(null)

    // === 设置页状态 ===
    const [status, setStatus] = useState<{ type: "success" | "error" | "loading" | null, msg: string }>({ type: null, msg: "" })
    // === Import State ===
    const [importStatus, setImportStatus] = useState<string>("")
    const [scanResult, setScanResult] = useState<chrome.bookmarks.BookmarkTreeNode[] | null>(null)
    const [scanStats, setScanStats] = useState<{ total: number, new: number, duplicates: number } | null>(null)

    // Conflict Resolution State
    const [showConflictModal, setShowConflictModal] = useState(false)
    const [conflicts, setConflicts] = useState<{ imported: BookmarkItem, existing: BookmarkItem }[]>([])
    const [currentConflictIndex, setCurrentConflictIndex] = useState(0)
    const [mergedItems, setMergedItems] = useState<BookmarkItem[]>([])
    const [showImportModal, setShowImportModal] = useState(false)

    // 初始化加载数据
    useEffect(() => {
        loadBookmarks()
    }, [])

    // Auto-trigger analysis after import phase completes
    useEffect(() => {
        if (processPhase === "import" && processor.isFinished && processor.stats.success > 0) {
            // Import finished, start analysis on newly imported bookmarks
            const triggerAnalysis = async () => {
                await loadBookmarks()
                const allBookmarks = await StorageService.getBookmarks()
                // Filter to only analyze those without summary
                const toAnalyze = allBookmarks.filter(b => !b.content_summary || b.content_summary.length === 0)
                if (toAnalyze.length > 0) {
                    startAnalysis(toAnalyze)
                }
            }
            triggerAnalysis()
        }
    }, [processor.isFinished, processPhase])

    const loadBookmarks = async () => {
        const data = await StorageService.getBookmarks()
        setBookmarks(data)
    }

    // === 计算属性 ===
    const tagCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        bookmarks.forEach(b => {
            b.tags.forEach(t => {
                counts[t] = (counts[t] || 0) + 1
            })
        })
        return Object.entries(counts).sort((a, b) => b[1] - a[1])
    }, [bookmarks])

    const filteredBookmarks = useMemo(() => {
        let result = bookmarks
        if (selectedTag) {
            result = result.filter(b => b.tags.includes(selectedTag))
        }
        if (searchQuery) {
            result = SearchService.search(result, searchQuery)
        }
        return result
    }, [bookmarks, searchQuery, selectedTag])


    // === 事件处理 ===

    const handleDelete = async (id: string) => {
        if (confirm(t("deleteConfirm"))) {
            await StorageService.removeBookmark(id)
            await loadBookmarks()
        }
    }

    const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const provider = e.target.value as AppConfig["provider"]
        let newConfig: Partial<AppConfig> = { provider }

        // Try to get settings from stored providerSettings, fallback to defaults
        const settings = config.providerSettings?.[provider] || DEFAULT_CONFIG.providerSettings?.[provider]

        if (settings) {
            newConfig = {
                ...newConfig,
                apiKey: settings.apiKey,
                baseUrl: settings.baseUrl,
                model: settings.model
            }
        } else {
            // Fallback hardcoded defaults if something goes wrong with DEFAULT_CONFIG
            switch (provider) {
                case "openai":
                    newConfig = { ...newConfig, baseUrl: "https://api.openai.com/v1", model: "gpt-3.5-turbo" }
                    break
                case "zhipu":
                    newConfig = { ...newConfig, baseUrl: "https://open.bigmodel.cn/api/paas/v4", model: "glm-4" }
                    break
                case "aliyun":
                    newConfig = { ...newConfig, baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen-plus" }
                    break
                case "siliconflow":
                    newConfig = { ...newConfig, baseUrl: "https://api.siliconflow.cn/v1", model: "deepseek-ai/DeepSeek-V3" }
                    break
                case "deepseek":
                    newConfig = { ...newConfig, ...DEEPSEEK_CONFIG }
                    break
            }
        }

        setConfig({ ...config, ...newConfig })
    }

    const handleCardClick = (serviceId: string) => {
        setActiveService(serviceId)
    }

    const handleConfigSave = (apiKey: string, model: string) => {
        if (!activeService) return

        // Initialize providerSettings if undefined
        const currentSettings = config.providerSettings || {}

        // Get existing or default specific settings
        const existingSpecificSettings = currentSettings[activeService] || DEFAULT_CONFIG.providerSettings?.[activeService] || { baseUrl: "", apiKey: "", model: "" }

        // Check if model should be added to availableModels
        let availableModels = existingSpecificSettings.availableModels || []
        if (model && !availableModels.includes(model)) {
            availableModels = [...availableModels, model]
        }

        const updatedSpecificSettings = {
            ...existingSpecificSettings,
            apiKey,
            model,
            availableModels
        }

        const updatedProviderSettings = {
            ...currentSettings,
            [activeService]: updatedSpecificSettings
        }

        let newConfig: Partial<AppConfig> = {
            providerSettings: updatedProviderSettings
        }

        // If we are modifying the currently active provider, invoke a switch to sync top-level
        if (activeService === config.provider) {
            newConfig = {
                ...newConfig,
                apiKey,
                model,
                baseUrl: updatedSpecificSettings.baseUrl // Ensure baseUrl is kept/synced
            }
        }

        // If the provider wasn't active, we just save the settings. 
        // User might want to switch to it manually or we could ask. For now just save.

        setConfig({ ...config, ...newConfig })
        // 不自动关闭弹窗，让用户手动关闭
        setStatus({ type: "success", msg: t("settingsSaved") })
        setTimeout(() => setStatus({ type: null, msg: "" }), 2000)
    }

    const handleTestConnection = async (apiKey?: string) => {
        setStatus({ type: "loading", msg: "Testing connection..." })
        try {
            // 如果从 modal 传入了 apiKey，使用 activeService 的配置
            let testConfig = config
            if (apiKey && activeService) {
                const providerConfig = config.providerSettings?.[activeService]
                testConfig = {
                    ...config,
                    apiKey,
                    baseUrl: providerConfig?.baseUrl || config.baseUrl,
                    model: providerConfig?.model || config.model
                }
            }
            await AIService.testConnection(testConfig)
            setStatus({ type: "success", msg: t("connectionSuccessful") })
        } catch (error: any) {
            setStatus({ type: "error", msg: `${t("connectionFailed")} ${error.message} ` })
        }
    }

    const startAnalysis = async (itemsToAnalyze: BookmarkItem[]) => {
        if (!config || !itemsToAnalyze.length) return

        // Build AI config using helper (auto-detects configured provider)
        const aiConfig = buildAIConfig(config)
        if (!aiConfig) {
            setStatus({ type: "error", msg: t("pleaseSetApiKey") })
            return
        }

        // 切换到分析阶段
        setProcessPhase("analysis")
        processor.clearTasks()

        const tasks: TaskItem[] = itemsToAnalyze.map(b => ({
            id: b.id,
            title: b.title,
            data: b,
            status: "waiting"
        }))

        processor.addTasks(tasks)

        const analysisExecutor: TaskExecutor = async (task, onProgress) => {
            const bookmark = task.data as BookmarkItem
            // 如果已有总结，跳过
            if (bookmark.content_summary) {
                return { success: true, skipped: true, msg: t("duplicateSkipped") }
            }

            try {
                // Step 1: Accessing link
                onProgress(t("stepAccessing") || "Accessing link...")

                // 使用 Background Tab打开并提取内容 (避免 CORS/403)
                // 这需要 background.ts 或 content.ts 配合。
                // 现有的 queue.ts 逻辑是在 background 跑的。
                // 这里我们发送消息给 background 让它帮忙提取，或者直接模拟 behavior。
                // 为了复用，我们这里直接创建一个 tab 并等待。
                // 但 Options 页面无法接收 content script 消息 (除非是 runtime 消息)。
                // 简单点：创建 tab -> 等待加载 -> 发送消息 -> 关闭 tab。

                const tab = await chrome.tabs.create({ url: bookmark.url, active: false })

                // 等待页面加载
                await new Promise<void>((resolve, reject) => {
                    // 30s 超时
                    const timeout = setTimeout(() => reject(new Error("Tab load timeout")), 30000)

                    const listener = (tid: number, changeInfo: chrome.tabs.TabChangeInfo) => {
                        if (tid === tab.id && changeInfo.status === 'complete') {
                            chrome.tabs.onUpdated.removeListener(listener)
                            clearTimeout(timeout)
                            setTimeout(resolve, 2000) // 额外等待 JS 执行
                        }
                    }
                    chrome.tabs.onUpdated.addListener(listener)
                })

                // Step 2: Extracting content
                onProgress(t("stepExtracting") || "Extracting content...")

                let contentData: any = null
                try {
                    // 发送消息给 tab 内容脚本
                    // 注意：需要确保 content script 已注入。
                    contentData = await chrome.tabs.sendMessage(tab.id!, { type: "EXTRACT_CONTENT" })
                } catch (e) {
                    console.warn("Direct extraction failed, trying update/inject?", e)
                    // 如果页面刚加载 content script 可能没好，重试一次
                    await new Promise(r => setTimeout(r, 1000))
                    contentData = await chrome.tabs.sendMessage(tab.id!, { type: "EXTRACT_CONTENT" })
                } finally {
                    // 关闭 tab
                    if (tab.id) await chrome.tabs.remove(tab.id)
                }

                if (!contentData || (!contentData.content && !contentData.metadata)) {
                    throw new Error(t("cannotReadPage") || "Cannot read page content")
                }

                // Step 3: Submitting to AI
                onProgress(t("stepSubmittingAI") || "Submitting to AI...")

                // 构造富文本上下文
                const richContent = `Title: ${contentData.title}\nURL: ${contentData.url}\nDescription: ${contentData.metadata?.description || ""}\nKeywords: ${contentData.metadata?.keywords || ""}\nContent:\n${contentData.content}`

                // Step 4: Analyzying
                onProgress(t("stepAnalyzing") || "Analyzing...")
                const result = await AIService.generateSummaryAndTags(richContent, aiConfig)

                // Step 5: Saving
                onProgress(t("stepSaving") || "Saving result...")

                const updated = {
                    ...bookmark,
                    content_summary: result.summary,
                    tags: result.tags,
                    status: "done" as const
                }

                await StorageService.updateBookmark(updated.id, updated)

                // Step 6: Success
                onProgress(t("stepSuccess") || "Success")

                return { success: true }
            } catch (e: any) {
                return { success: false, msg: e.message }
            }
        }

        // 启动任务处理：并发 1，延迟 5-10秒
        processor.start(analysisExecutor, 1, 5000, 10000)
    }


    const handleImportHtml = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setProcessPhase("import")
        processor.clearTasks()

        try {
            const text = await file.text()
            const items = await BookmarkImportService.parseHtmlBookmarks(text)

            if (items.length === 0) {
                setStatus({ type: "error", msg: t("noBookmarksFound") })
                return
            }

            // 创建任务
            const tasks: TaskItem[] = items.map((item, index) => ({
                id: `html - ${index} `,
                title: item.title,
                data: item,
                status: "waiting"
            }))

            processor.addTasks(tasks)

            const importExecutor: TaskExecutor = async (task) => {
                const item = task.data
                // 1. Check Accessibility
                const isAlive = await BookmarkImportService.checkUrlAccessibility(item.url)

                if (isAlive) {
                    const newItem = {
                        ...item,
                        id: crypto.randomUUID(),
                        timestamp: Date.now()
                    }
                    try {
                        await StorageService.addBookmark(newItem)
                        return { success: true }
                    } catch (e) {
                        // Duplicate usually
                        return { success: true, skipped: true, msg: t("duplicateSkipped") }
                    }
                } else {
                    return { success: false, msg: t("networkError") }
                }
            }

            processor.start(importExecutor, 5)

        } catch (error: any) {
            setStatus({ type: "error", msg: `${t("importFailed")}: ${error.message} ` })
        }

        // Reset file input
        e.target.value = ""
    }

    const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setImportStatus(t("loadingConfiguration"))
        try {
            const text = await file.text()
            const parsed = JSON.parse(text)

            // 检测是否为新版完整备份格式
            let items: BookmarkItem[]
            let importedConfig: AppConfig | null = null

            if (isFullBackup(parsed)) {
                // 新版完整备份
                items = parsed.bookmarks
                importedConfig = parsed.config

                // 检查是否需要恢复配置
                if (importedConfig && confirm(t("restoreConfigConfirm") || "是否同时恢复配置信息（含API设置、基本设置、提示词）？")) {
                    // 保留当前 API Key，仅恢复其他设置
                    const hasExistingApiKey = config.apiKey && config.apiKey.length > 0
                    const hasImportedApiKey = importedConfig.apiKey && importedConfig.apiKey.length > 0

                    if (hasExistingApiKey && hasImportedApiKey && config.apiKey !== importedConfig.apiKey) {
                        // API Key 冲突
                        const useImported = confirm(t("apiKeyConflict") || "检测到API密钥冲突，是否使用导入的API密钥？\n确定=使用导入的，取消=保留当前的")
                        if (!useImported) {
                            importedConfig = { ...importedConfig, apiKey: config.apiKey }
                        }
                    }
                    setConfig(importedConfig)
                }
            } else if (Array.isArray(parsed)) {
                // 旧版纯书签数组
                items = parsed as BookmarkItem[]
            } else {
                throw new Error("Invalid JSON format")
            }

            const currentBookmarks = await StorageService.getBookmarks()

            const tasks: TaskItem[] = items.map((item, index) => ({
                id: `json-\${index}`,
                title: item.title,
                data: item,
                status: "waiting"
            }))

            processor.addTasks(tasks)

            const importExecutor: TaskExecutor = async (task) => {
                const item = task.data
                if (!item.url) return { success: false, msg: "No URL" }

                const isAlive = await BookmarkImportService.checkUrlAccessibility(item.url)

                if (isAlive) {
                    const newItem: BookmarkItem = {
                        url: item.url,
                        title: item.title,
                        description: "",
                        content_summary: "",
                        tags: [],
                        status: "pending",
                        id: crypto.randomUUID(),
                        timestamp: Date.now()
                    }
                    try {
                        await StorageService.addBookmark(newItem)
                        return { success: true }
                    } catch (e) {
                        return { success: true, skipped: true, msg: t("duplicateSkipped") }
                    }
                } else {
                    return { success: false, msg: t("networkError") }
                }
            }

            processor.start(importExecutor, 5)

        } catch (error: any) {
            setImportStatus("") // Clear on error
            setStatus({ type: "error", msg: `${t("importFailed")}: ${error.message}` })
        }

        e.target.value = ""
        if (!showConflictModal) setTimeout(() => setImportStatus(""), 3000)
    }

    const handleScanBookmarks = async () => {
        setProcessPhase("import")
        processor.clearTasks()
        setImportStatus(t("processing") || "Scanning...")

        try {
            console.log("Scan started")
            const items = await BookmarkImportService.getBrowserBookmarks()
            setImportStatus("") // Clear on success
            console.log("Scan items:", items.length)

            if (items.length === 0) {
                setStatus({ type: "error", msg: t("noBookmarksFound") })
                return
            }

            const tasks: TaskItem[] = items.map((item) => ({
                id: item.id,
                title: item.title,
                data: item,
                status: "waiting"
            }))

            processor.addTasks(tasks)

            const importExecutor: TaskExecutor = async (task) => {
                const item = task.data
                if (!item.url) return { success: false, msg: "No URL" }

                const isAlive = await BookmarkImportService.checkUrlAccessibility(item.url)

                if (isAlive) {
                    const newItem: BookmarkItem = {
                        url: item.url,
                        title: item.title,
                        description: "",
                        content_summary: "",
                        tags: item.tags || [], // Use passed tags
                        status: "pending",
                        id: crypto.randomUUID(),
                        timestamp: Date.now()
                    }
                    try {
                        await StorageService.addBookmark(newItem)
                        return { success: true }
                    } catch (e) {
                        // Check if we need to update tags if dup
                        return { success: true, skipped: true, msg: t("duplicateSkipped") }
                    }
                } else {
                    return { success: false, msg: t("networkError") }
                }
            }

            processor.start(importExecutor, 5)

        } catch (error: any) {
            setStatus({ type: "error", msg: `${t("importFailed")}: ${error.message} ` })
        }
    }

    const resolveConflict = (useImported: boolean) => {
        const conflict = conflicts[currentConflictIndex]
        const resolvedItem = useImported ? conflict.imported : conflict.existing

        // Merge tags regardless of summary choice
        const mergedTags = Array.from(new Set([...conflict.existing.tags, ...conflict.imported.tags]))
        const finalItem = { ...resolvedItem, tags: mergedTags, id: conflict.existing.id } // Keep existing ID

        const newMerged = [...mergedItems, finalItem]
        setMergedItems(newMerged)

        if (currentConflictIndex < conflicts.length - 1) {
            setCurrentConflictIndex(currentConflictIndex + 1)
        } else {
            // All resolved
            finishConflictResolution(newMerged)
        }
    }

    const finishConflictResolution = async (finalMergedItems: BookmarkItem[]) => {
        const currentBookmarks = await StorageService.getBookmarks()
        const finalMap = new Map(currentBookmarks.map(b => [b.url, b]))

        finalMergedItems.forEach(item => finalMap.set(item.url, item))
        const finalList = Array.from(finalMap.values())

        // Assuming `StorageService.overrideAllBookmarks` exists and replaces all bookmarks.
        await StorageService.overrideAllBookmarks(finalList)
        setImportStatus(t("importSuccess"))
        setShowConflictModal(false)
        setConflicts([])
        loadBookmarks()
        setTimeout(() => setImportStatus(""), 3000)
    }

    const handleSaveSettings = () => {
        setStatus({ type: "success", msg: t("settingsSaved") })
        setTimeout(() => setStatus({ type: null, msg: "" }), 2000)
    }

    const handleKeyBind = () => {
        alert(t("keyBindHelp"))
    }



    const handleExport = async () => {
        if (bookmarks.length === 0 && !config) return

        // 创建完整备份
        const fullBackup: FullBackup = {
            version: "1.0",
            exportedAt: new Date().toISOString(),
            config: config,
            bookmarks: bookmarks
        }

        const dataStr = JSON.stringify(fullBackup, null, 2)
        const blob = new Blob([dataStr], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `ai - priva - mark - full - backup - ${new Date().toISOString().slice(0, 10)}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const handleAnalyzeLibrary = async () => {
        const all = await StorageService.getBookmarks()
        const todo = all.filter(b => !b.content_summary || b.content_summary.length === 0)

        if (todo.length === 0) {
            setStatus({ type: "success", msg: t("allAnalyzed") })
            return
        }

        startAnalysis(todo)
    }

    const handleClearData = async () => {
        if (confirm(t("clearDataConfirm"))) {
            await StorageService.clearAll()
            loadBookmarks()
            setImportStatus(t("allDataCleared"))
        }
    }

    if (!config) return <div className="p-10 text-center text-gray-500">{t("loadingConfiguration")}</div>

    if (!isReady) return <div className="p-10 text-center text-gray-500">{t("loadingConfiguration")}</div>

    return (
        <div className="flex h-screen w-full bg-gray-50 font-sans text-slate-800 overflow-hidden">

            {/* --- Sidebar --- */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
                        <span>🔖</span> {t("appName")}
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">{t("appSlogan")}</p>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <SidebarItem
                        active={activeTab === "dashboard"}
                        onClick={() => setActiveTab("dashboard")}
                        icon="📊" label={t("dashboard")}
                    />
                    <div className="pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider pl-3">{t("settingsSection")}</div>
                    <SidebarItem
                        active={activeTab === "basicSettings"}
                        onClick={() => setActiveTab("basicSettings")}
                        icon="⚙️" label={t("basicSettings")}
                    />
                    <SidebarItem
                        active={activeTab === "importExport"}
                        onClick={() => setActiveTab("importExport")}
                        icon="📦" label={t("importExport")}
                    />
                    <SidebarItem
                        active={activeTab === "api"}
                        onClick={() => setActiveTab("api")}
                        icon="🔑" label={t("apiService")}
                    />
                    <SidebarItem
                        active={activeTab === "data"}
                        onClick={() => setActiveTab("data")}
                        icon="💾" label={t("dataPrivacy")}
                    />
                    <SidebarItem
                        active={activeTab === "about"}
                        onClick={() => setActiveTab("about")}
                        icon="ℹ️" label={t("about")}
                    />
                </nav>

                <div className="p-4 border-t border-gray-100 text-xs text-center text-gray-400">
                    {t("versionFooter")}
                </div>
            </aside>


            {/* --- Main Content Area --- */}
            <main className="flex-1 overflow-y-auto bg-gray-50">
                <div className="max-w-6xl mx-auto p-8">

                    {/* === View: Dashboard === */}
                    {activeTab === "dashboard" && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-gray-800">{t("myKnowledgeBase")}</h2>
                                <div className="text-sm text-gray-500">
                                    {filteredBookmarks.length} {t("items")}
                                </div>
                            </div>

                            {/* Search & Stats */}
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full pl-12 pr-4 py-4 rounded-xl border-none shadow-sm text-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                    placeholder={t("searchPlaceholder")}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <div className="absolute left-4 top-4 text-2xl opacity-30">🔍</div>
                            </div>

                            {/* Tag Cloud (Capsules) */}
                            {tagCounts.length > 0 && (
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t("smartTags")}</div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setSelectedTag(null)}
                                            className={`px - 3 py - 1 rounded - full text - sm font - medium transition - colors border ${selectedTag === null
                                                ? "bg-gray-800 text-white border-gray-800"
                                                : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                                                } `}
                                        >
                                            {t("all")}
                                        </button>
                                        {tagCounts.map(([tag, count]) => (
                                            <button
                                                key={tag}
                                                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                                                className={`px - 3 py - 1 rounded - full text - sm font - medium transition - colors border flex items - center gap - 2 ${selectedTag === tag
                                                    ? "bg-blue-100 text-blue-700 border-blue-200"
                                                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                                                    } `}
                                            >
                                                <span>#{tag}</span>
                                                <span className="opacity-50 text-xs bg-black/5 px-1.5 rounded-full">{count}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Bookmarks Grid */}
                            {filteredBookmarks.length === 0 ? (
                                <div className="text-center py-20 opacity-50">
                                    <div className="text-6xl mb-4">📭</div>
                                    <p className="text-xl">{t("noBookmarksFound")}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredBookmarks.map(b => (
                                        <BookmarkCard
                                            key={b.id}
                                            bookmark={b}
                                            onDelete={handleDelete}
                                            onTagClick={(tag) => {
                                                setSelectedTag(tag)
                                                setSearchQuery("") // Clear search when clicking tag
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* === View: Basic Settings === */}
                    {activeTab === "basicSettings" && (
                        <div className="space-y-8 max-w-2xl mx-auto">

                            {/* Keyboard Shortcuts */}
                            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold">{t("keyboardShortcuts")}</h2>
                                    <button className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50">
                                        {t("setShortcutKey")}
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Quick Save */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                            </svg>
                                            <span className="font-medium text-sm">{t("quickSaveBookmark")}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-3">{t("quickSaveDesc")}</p>
                                        <div className="bg-white border border-gray-200 rounded px-3 py-2 text-center text-sm font-mono">
                                            Ctrl+B
                                        </div>
                                    </div>

                                    {/* Quick Search */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            <span className="font-medium text-sm">{t("quickSearchBookmark")}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-3">{t("quickSearchDesc")}</p>
                                        <div className="bg-white border border-gray-200 rounded px-3 py-2 text-center text-sm text-gray-400">
                                            {t("notSet")}
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* Language Settings */}
                            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                                <h2 className="text-xl font-bold mb-6">{t("language")}</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setLocale("en")}
                                        className={`flex items - center gap - 3 p - 4 rounded - lg border - 2 transition - colors ${locale === "en" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"} `}
                                    >
                                        <div className="text-2xl">🇺🇸</div>
                                        <div className="font-medium">{t("english")}</div>
                                    </button>
                                    <button
                                        onClick={() => setLocale("zh")}
                                        className={`flex items - center gap - 3 p - 4 rounded - lg border - 2 transition - colors ${locale === "zh" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"} `}
                                    >
                                        <div className="text-2xl">🇨🇳</div>
                                        <div className="font-medium">{t("chinese")}</div>
                                    </button>
                                </div>
                            </div>

                            {/* Appearance */}
                            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                                <h2 className="text-xl font-bold mb-6">{t("appearance")}</h2>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">{t("theme")}</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {/* Light Theme */}
                                        <button className="flex flex-col items-center gap-3 p-4 rounded-lg border-2 border-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors">
                                            <div className="w-full aspect-video bg-white rounded border border-gray-200 flex items-center justify-center">
                                                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium">{t("lightTheme")}</span>
                                        </button>

                                        {/* Dark Theme */}
                                        <button className="flex flex-col items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                                            <div className="w-full aspect-video bg-gray-800 rounded border border-gray-700 flex items-center justify-center">
                                                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 118.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium">{t("darkTheme")}</span>
                                        </button>

                                        {/* Device Theme */}
                                        <button className="flex flex-col items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                                            <div className="w-full aspect-video bg-gradient-to-r from-white to-gray-800 rounded border border-gray-300 flex items-center justify-center">
                                                <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium">{t("deviceTheme")}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Search Settings */}
                            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                                <h2 className="text-xl font-bold mb-6">{t("searchSettings")}</h2>

                                <div className="space-y-6">
                                    {/* Search Result Count */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                {t("searchResultCount")}
                                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </label>
                                            <input
                                                type="number"
                                                defaultValue="50"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                {t("addressBarResultCount")}
                                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </label>
                                            <input
                                                type="number"
                                                defaultValue="9"
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2"
                                            />
                                        </div>
                                    </div>

                                    {/* Search History & Quick Access */}
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Search History */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                {t("searchHistory")}
                                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </label>
                                            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                                <span className="text-sm text-gray-700">启用</span>
                                                <input type="checkbox" defaultChecked className="toggle-switch" />
                                            </label>
                                            <button className="mt-2 w-full text-sm text-gray-600 hover:text-gray-800 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                                                {t("clearSearchHistory")}
                                            </button>
                                        </div>

                                        {/* Quick Access Website */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                {t("quickAccessWebsite")}
                                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </label>
                                            <div className="space-y-2">
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">{t("sortBy")}</label>
                                                    <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                                                        <option>{t("recentVisit")}</option>
                                                        <option>{t("hideOption")}</option>
                                                        <option>{t("pinnedSites")}</option>
                                                        <option>{t("visitFrequency")}</option>
                                                        <option>{t("recentlyStored")}</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-500 mb-1">{t("displayCount")}</label>
                                                    <input
                                                        type="number"
                                                        defaultValue="8"
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                    }

                    {/* === View: Import / Export === */}
                    {
                        activeTab === "importExport" && (
                            <div className="space-y-6 max-w-4xl mx-auto">

                                {/* Import Section */}
                                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                                    <h2 className="text-xl font-bold mb-6">{t("importExportData")}</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* 1. Browser Bookmarks */}
                                        <div className="border border-gray-200 rounded-xl p-6 bg-gray-50 flex flex-col items-center text-center">
                                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <h3 className="font-bold mb-2">{t("importBrowserBookmarks")}</h3>

                                            {importStatus ? (
                                                <p className="text-xs text-blue-600 mb-4 flex-grow font-medium flex items-center justify-center gap-2">
                                                    <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    {importStatus}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-gray-500 mb-4 flex-grow">{t("scanDesc")}</p>
                                            )}

                                            <button
                                                onClick={handleScanBookmarks}
                                                disabled={!!importStatus}
                                                className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-wait"
                                            >
                                                {t("scan")}
                                            </button>
                                        </div>

                                        {/* 2. HTML File */}
                                        <div className="border border-gray-200 rounded-xl p-6 bg-gray-50 flex flex-col items-center text-center">
                                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <h3 className="font-bold mb-2">{t("importLocalHtml")}</h3>
                                            <p className="text-xs text-gray-500 mb-4 flex-grow">{t("htmlFileDesc")}</p>
                                            <input
                                                type="file"
                                                accept=".html"
                                                id="html-upload"
                                                className="hidden"
                                                onChange={handleImportHtml}
                                            />
                                            <label
                                                htmlFor="html-upload"
                                                className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium cursor-pointer"
                                            >
                                                {t("fileSelect")}
                                            </label>
                                        </div>

                                        {/* 3. JSON Backup */}
                                        <div className="border border-gray-200 rounded-xl p-6 bg-gray-50 flex flex-col items-center text-center">
                                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                </svg>
                                            </div>
                                            <h3 className="font-bold mb-2">{t("importJsonBackup")}</h3>
                                            <p className="text-xs text-gray-500 mb-4 flex-grow">{t("jsonFileDesc")}</p>
                                            <input
                                                type="file"
                                                accept=".json"
                                                id="json-upload"
                                                className="hidden"
                                                onChange={handleImportJson}
                                            />
                                            <label
                                                htmlFor="json-upload"
                                                className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium cursor-pointer"
                                            >
                                                {t("fileSelect")}
                                            </label>
                                        </div>
                                    </div>
                                </div>


                                {/* Analysis Section */}
                                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
                                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        ✨ {t("analyzeLibrary")}
                                    </h2>
                                    <div className="flex justify-between items-center">
                                        <p className="text-gray-500 text-sm">{t("analyzeDesc")}</p>
                                        <button
                                            onClick={handleAnalyzeLibrary}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={processor.isProcessing}
                                        >
                                            {processor.isProcessing ? t("processing") : t("startAnalysis")}
                                        </button>
                                    </div>
                                </div>

                                {/* Data Freedom Section */}
                                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                                    <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                                        {t("dataFreedom")}
                                    </h2>
                                    <p className="text-gray-500 mb-6 text-sm">
                                        {t("dataFreedomDesc")}
                                    </p>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={handleExport}
                                            className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            {t("exportJson")}
                                        </button>
                                        <button
                                            onClick={handleClearData}
                                            className="flex items-center gap-2 px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-medium border border-red-100"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            {t("clearAllData")}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* === View: API Service === */}
                    {
                        activeTab === "api" && (
                            <div className="space-y-6 max-w-4xl mx-auto">

                                {/* Security Notice */}
                                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-blue-800">{t("apiKeySecurityTitle")}</h3>
                                            <div className="mt-2 text-sm text-blue-700 space-y-1">
                                                <p>• {t("apiKeySecurityDesc1")}</p>
                                                <p>• {t("apiKeySecurityDesc2")}</p>
                                                <p>• {t("apiKeySecurityDesc3")}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Model Tabs */}
                                <div className="border-b border-gray-200">
                                    <nav className="-mb-px flex gap-8">
                                        <button className="border-blue-500 text-blue-600 border-b-2 py-4 px-1 font-medium text-sm">
                                            {t("textModel")}
                                        </button>
                                        <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 py-4 px-1 font-medium text-sm">
                                            {t("embeddingModel")}
                                        </button>
                                    </nav>
                                </div>

                                {/* Current Service Selector */}
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-500">{t("currentTextModelService")}</span>
                                        {config.providerSettings?.[config.provider]?.apiKey && (
                                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                    </div>
                                    <select
                                        className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[200px]"
                                        value={config.provider}
                                        onChange={handleProviderChange}
                                    >
                                        <option value="siliconflow">{t("providerSiliconFlow")}</option>
                                        <option value="openai">{t("providerOpenAI")}</option>
                                        <option value="zhipu">{t("providerZhipu")}</option>
                                        <option value="aliyun">{t("providerAliyun")}</option>
                                    </select>
                                </div>

                                {/* Service Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <ServiceCard
                                        id="openai"
                                        icon={<span className="text-xl">🤖</span>} // Replace with specific icon if available
                                        nameKey="providerOpenAI"
                                        descKey="providerOpenAIDesc"
                                        status={config.providerSettings?.openai?.apiKey ? 'configured' : 'not_configured'}
                                        onClick={() => handleCardClick('openai')}
                                    />
                                    <ServiceCard
                                        id="zhipu"
                                        icon={<span className="text-xl">🌟</span>}
                                        nameKey="providerZhipu"
                                        descKey="providerZhipuDesc"
                                        status={config.providerSettings?.zhipu?.apiKey ? 'configured' : 'not_configured'}
                                        isTag={t("freeModel") as string}
                                        onClick={() => handleCardClick('zhipu')}
                                    />
                                    <ServiceCard
                                        id="aliyun"
                                        icon={<span className="text-xl">🌪️</span>}
                                        nameKey="providerAliyun"
                                        descKey="providerAliyunDesc"
                                        status={config.providerSettings?.aliyun?.apiKey ? 'configured' : 'not_configured'}
                                        isTag={t("richModels") as string}
                                        onClick={() => handleCardClick('aliyun')}
                                    />
                                    <ServiceCard
                                        id="siliconflow"
                                        icon={<span className="text-xl">⚡</span>}
                                        nameKey="providerSiliconFlow"
                                        descKey="providerSiliconFlowDesc"
                                        status={config.providerSettings?.siliconflow?.apiKey ? 'configured' : 'not_configured'}
                                        isTag={t("freeModel") as string}
                                        onClick={() => handleCardClick('siliconflow')}
                                    />
                                    <ServiceCard
                                        id="tencent"
                                        icon={<span className="text-xl">🐧</span>}
                                        nameKey="providerTencent"
                                        descKey="providerTencentDesc"
                                        status="not_configured"
                                        onClick={() => { }}
                                    />

                                    {/* Add Custom Button */}
                                    <button className="border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all h-full min-h-[160px]">
                                        <span className="text-2xl mb-2">+</span>
                                        <span className="text-sm font-medium">{t("addOpenAICompatible")}</span>
                                    </button>
                                </div>

                                {/* Usage Stats Mockup */}
                                <div>
                                    <div className="flex justify-between items-center mb-4 mt-8">
                                        <h3 className="font-bold text-gray-900">{t("apiUsageStats")}</h3>
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">{t("currentMonth")}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <div className="text-sm font-medium text-gray-500 mb-2">{t("textModelUsage")}</div>
                                            <div className="text-3xl font-bold text-blue-600 mb-4">13</div>
                                            <div className="space-y-1 text-xs text-gray-500">
                                                <div className="flex justify-between">
                                                    <span>{t("inputTokens")}</span>
                                                    <span className="font-mono">3,964</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>{t("outputTokens")}</span>
                                                    <span className="font-mono">38,483</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <div className="text-sm font-medium text-gray-500 mb-2">{t("embeddingModelUsage")}</div>
                                            <div className="text-3xl font-bold text-blue-600 mb-4">13</div>
                                            <div className="space-y-1 text-xs text-gray-500">
                                                <div className="flex justify-between">
                                                    <span>{t("tokenCount")}</span>
                                                    <span className="font-mono">695</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* Config Modal */}
                    <ServiceConfigModal
                        isOpen={!!activeService}
                        serviceId={activeService || ""}
                        serviceNameKey={
                            activeService === 'openai' ? 'providerOpenAI' :
                                activeService === 'deepseek' ? 'providerDeepSeek' :
                                    activeService === 'zhipu' ? 'providerZhipu' :
                                        activeService === 'aliyun' ? 'providerAliyun' :
                                            activeService === 'siliconflow' ? 'providerSiliconFlow' : 'providerOpenAI'
                        }
                        initialApiKey={activeService && config.providerSettings?.[activeService]?.apiKey || ""}
                        initialModel={activeService && config.providerSettings?.[activeService]?.model || ""}
                        availableModels={activeService && config.providerSettings?.[activeService]?.availableModels || []}
                        getApiKeyUrl={activeService && config.providerSettings?.[activeService]?.getApiKeyUrl}
                        pricingUrl={activeService && config.providerSettings?.[activeService]?.pricingUrl}
                        onClose={() => setActiveService(null)}
                        onSave={handleConfigSave}
                        onVerify={handleTestConnection}
                        status={status}
                    />


                    {/* === View: Data & Privacy === */}
                    {
                        activeTab === "data" && (
                            <div className="space-y-8 max-w-2xl mx-auto">

                                {/* Prompt Tuning */}
                                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                                    <h2 className="text-xl font-bold mb-4">{t("smartTagsPrompt")}</h2>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">{t("customSystemPrompt")}</label>
                                    <textarea
                                        value={config.customPrompt || ""}
                                        onChange={(e) => setConfig({ ...config, customPrompt: e.target.value })}
                                        rows={3}
                                        placeholder={t("customPromptPlaceholder")}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm"
                                    />
                                    <div className="mt-4 text-right">
                                        <button onClick={handleSaveSettings} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">{t("savePrompt")}</button>
                                    </div>
                                </div>

                            </div>
                        )
                    }

                    {/* === View: About === */}
                    {
                        activeTab === "about" && (
                            <div className="max-w-2xl mx-auto bg-white p-10 rounded-xl shadow-sm border border-gray-100 text-center">
                                <div className="text-6xl mb-4">🛡️</div>
                                <h2 className="text-2xl font-bold mb-2">{t("aboutTitle")}</h2>
                                <p className="text-gray-500 mb-8">{t("aboutSlogan")}</p>

                                <div className="text-left space-y-4 bg-gray-50 p-6 rounded-lg text-sm text-gray-600">
                                    <p><strong>Local-First:</strong> {t("localFirstDesc")}</p>
                                    <p><strong>Open Source:</strong> {t("openSourceDesc")}</p>
                                    <p><strong>{t("versionLabel")}</strong> {t("versionValue")}</p>
                                </div>
                            </div>
                        )
                    }

                </div >
            </main >

            {/* Processor Modal */}
            {processor.tasks.length > 0 && !processor.minimized && (
                <TaskProcessModal
                    title={processPhase === "import" ? t("importData") : t("startAIAnalysis")}
                    tasks={processor.tasks}
                    stats={processor.stats}
                    isProcessing={processor.isProcessing}
                    isFinished={processor.isFinished}
                    onClose={processor.clearTasks}
                    onMinimize={() => processor.setMinimize(true)}
                />
            )}

            {/* Processor Mini Popup */}
            {processor.tasks.length > 0 && processor.minimized && (
                <TaskProcessMini
                    stats={processor.stats}
                    isProcessing={processor.isProcessing}
                    isFinished={processor.isFinished}
                    onMaximize={() => processor.setMinimize(false)}
                />
            )}
        </div >
    )
}

function SidebarItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active
                ? "bg-blue-50 text-blue-700 shadow-sm"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
        >
            <span className="text-lg">{icon}</span>
            {label}
        </button>
    )
}

export default Options

