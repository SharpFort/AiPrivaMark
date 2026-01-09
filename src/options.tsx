import { useEffect, useMemo, useState } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import { AIService } from "~services/ai"
import { BookmarkImportService } from "~services/bookmark-import"
import { SearchService } from "~services/search"
import { StorageService } from "~services/storage"
import { DEFAULT_CONFIG, DEEPSEEK_CONFIG, type AppConfig } from "~types/config"
import type { BookmarkItem } from "~types/bookmark"
import { BookmarkCard } from "~components/bookmark-card"
import { ImportModal } from "~components/import-modal"

import "./style.css"

type TabType = "dashboard" | "api" | "data" | "about"

function Options() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard")
  
  // === 全局数据状态 ===
  const [config, setConfig] = useStorage<AppConfig>("app-config", DEFAULT_CONFIG)
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  
  // === Dashboard 状态 ===
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // === 设置页状态 ===
  const [status, setStatus] = useState<{ type: "success" | "error" | "loading" | null, msg: string }>({ type: null, msg: "" })
  const [scanResult, setScanResult] = useState<chrome.bookmarks.BookmarkTreeNode[] | null>(null)
  const [scanStats, setScanStats] = useState<{ total: number, new: number, duplicates: number } | null>(null)
  const [importStatus, setImportStatus] = useState<string>("")
  const [showImportModal, setShowImportModal] = useState(false)

  // 初始化加载数据
  useEffect(() => {
    loadBookmarks()
  }, [])

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
    if (confirm("Are you sure you want to delete this bookmark?")) {
      await StorageService.removeBookmark(id)
      await loadBookmarks()
    }
  }

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provider = e.target.value as AppConfig["provider"]
    if (provider === "deepseek") {
      setConfig({ ...config, ...DEEPSEEK_CONFIG, apiKey: config.apiKey }) 
    } else if (provider === "openai") {
       setConfig({ ...config, provider: "openai", baseUrl: "https://api.openai.com/v1", model: "gpt-3.5-turbo", apiKey: config.apiKey })
    } else {
       setConfig({ ...config, provider: "custom" })
    }
  }

  const handleTestConnection = async () => {
    setStatus({ type: "loading", msg: "Testing connection..." })
    try {
      await AIService.testConnection(config)
      setStatus({ type: "success", msg: "Connection successful! 🎉" })
    } catch (error: any) {
      setStatus({ type: "error", msg: `Failed: ${error.message}` })
    }
  }

  const handleSaveSettings = () => {
      setStatus({type: "success", msg: "Settings saved automatically."})
      setTimeout(() => setStatus({type: null, msg: ""}), 2000)
  }

  const handleScanBookmarks = async () => {
      setImportStatus("Scanning browser bookmarks...")
      const browserBookmarks = await BookmarkImportService.getBrowserBookmarks()
      const currentAppBookmarks = await StorageService.getBookmarks()
      const existingUrls = new Set(currentAppBookmarks.map(b => b.url))
      const newItems = browserBookmarks.filter(b => b.url && !existingUrls.has(b.url))
      const duplicatesCount = browserBookmarks.length - newItems.length

      setScanResult(browserBookmarks)
      setScanStats({ total: browserBookmarks.length, new: newItems.length, duplicates: duplicatesCount })
      setImportStatus("")
  }

  // 这里的 Import 逻辑已经转移到 Modal，这里只是触发 Modal
  // 但为了安全，只传递 scanResult 中新的 items (或全部传进去让 Modal 再检测一次也行，推荐全部传进去检测死链)
  const handleOpenImportModal = () => {
      setShowImportModal(true)
  }

  const handleExport = async () => {
      if (bookmarks.length === 0) return
      const dataStr = JSON.stringify(bookmarks, null, 2)
      const blob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `ai-priva-mark-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
  }

  const handleClearData = async () => {
      if (confirm("DANGER: This will delete ALL data. Confirm?")) {
          await StorageService.clearAll()
          loadBookmarks()
          setImportStatus("All data cleared.")
      }
  }

  if (!config) return <div className="p-10 text-center text-gray-500">Loading Configuration...</div>

  return (
    <div className="flex h-screen w-full bg-gray-50 font-sans text-slate-800 overflow-hidden">
      
      {/* --- Sidebar --- */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-gray-100">
            <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
                <span>🔖</span> Ai Priva Mark
            </h1>
            <p className="text-xs text-gray-400 mt-1">Local-First Knowledge Base</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <SidebarItem 
                active={activeTab === "dashboard"} 
                onClick={() => setActiveTab("dashboard")} 
                icon="📊" label="Dashboard" 
            />
            <div className="pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider pl-3">Settings</div>
            <SidebarItem 
                active={activeTab === "api"} 
                onClick={() => setActiveTab("api")} 
                icon="🔑" label="API Service" 
            />
            <SidebarItem 
                active={activeTab === "data"} 
                onClick={() => setActiveTab("data")} 
                icon="💾" label="Data & Privacy" 
            />
            <SidebarItem 
                active={activeTab === "about"} 
                onClick={() => setActiveTab("about")} 
                icon="ℹ️" label="About" 
            />
        </nav>

        <div className="p-4 border-t border-gray-100 text-xs text-center text-gray-400">
            v0.0.1 • Local Storage Only
        </div>
      </aside>


      {/* --- Main Content Area --- */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-6xl mx-auto p-8">
            
            {/* === View: Dashboard === */}
            {activeTab === "dashboard" && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-800">My Knowledge Base</h2>
                        <div className="text-sm text-gray-500">
                            {filteredBookmarks.length} items
                        </div>
                    </div>

                    {/* Search & Stats */}
                    <div className="relative">
                        <input
                            type="text"
                            className="w-full pl-12 pr-4 py-4 rounded-xl border-none shadow-sm text-lg focus:ring-2 focus:ring-blue-500 bg-white"
                            placeholder="Search by title, summary, or tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute left-4 top-4 text-2xl opacity-30">🔍</div>
                    </div>

                    {/* Tag Cloud (Capsules) */}
                    {tagCounts.length > 0 && (
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Smart Tags</div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedTag(null)}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
                                        selectedTag === null 
                                        ? "bg-gray-800 text-white border-gray-800" 
                                        : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                                    }`}
                                >
                                    All
                                </button>
                                {tagCounts.map(([tag, count]) => (
                                    <button
                                        key={tag}
                                        onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border flex items-center gap-2 ${
                                            selectedTag === tag 
                                            ? "bg-blue-100 text-blue-700 border-blue-200" 
                                            : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                                        }`}
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
                            <p className="text-xl">No bookmarks found.</p>
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


            {/* === View: API Service === */}
            {activeTab === "api" && (
                <div className="max-w-2xl bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-6">API Configuration</h2>
                    {/* ... API form fields ... */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Provider</label>
                            <select
                                value={config.provider}
                                onChange={handleProviderChange}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2"
                            >
                                <option value="openai">OpenAI</option>
                                <option value="deepseek">DeepSeek</option>
                                <option value="custom">Custom (Compatible)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">API Key</label>
                            <input
                                type="password"
                                value={config.apiKey}
                                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2"
                                placeholder="sk-..."
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Base URL</label>
                            <input
                                type="text"
                                value={config.baseUrl}
                                onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Model</label>
                            <input
                                type="text"
                                value={config.model}
                                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2"
                            />
                        </div>
                        <div className="flex items-center justify-between pt-4">
                            <div className="text-sm">
                                {status.type === "success" && <span className="text-green-600">✅ {status.msg}</span>}
                                {status.type === "error" && <span className="text-red-600">❌ {status.msg}</span>}
                                {status.type === "loading" && <span className="text-blue-600">⏳ Testing...</span>}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={handleTestConnection} className="px-4 py-2 bg-gray-100 rounded-lg font-medium hover:bg-gray-200">Test Connection</button>
                                <button onClick={handleSaveSettings} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* === View: Data & Privacy === */}
            {activeTab === "data" && (
                <div className="space-y-8 max-w-2xl">
                    
                    {/* Prompt Tuning */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold mb-4">Smart Tags & Prompt</h2>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Custom System Prompt</label>
                        <textarea
                            value={config.customPrompt || ""}
                            onChange={(e) => setConfig({ ...config, customPrompt: e.target.value })}
                            rows={3}
                            placeholder="e.g. Summarize in Chinese. Focus on coding details."
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm"
                        />
                         <div className="mt-4 text-right">
                             <button onClick={handleSaveSettings} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save Prompt</button>
                         </div>
                    </div>

                    {/* Import */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold mb-4">Import Data</h2>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                                <div>
                                    <p className="font-semibold text-blue-900">Browser Bookmarks</p>
                                    <p className="text-sm text-blue-700">Scan and import from Chrome</p>
                                </div>
                                <button onClick={handleScanBookmarks} className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-100">Scan</button>
                            </div>

                            {scanResult && (
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="text-sm mb-3">
                                        Found <strong>{scanStats?.total}</strong> total. 
                                        <span className="text-green-600 font-bold ml-2">{scanStats?.new} New</span>, 
                                        <span className="text-gray-400 ml-2">{scanStats?.duplicates} Duplicates</span>.
                                    </p>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={handleOpenImportModal}
                                            disabled={!scanStats?.new}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            Start Import
                                        </button>
                                        <button onClick={() => {setScanResult(null); setScanStats(null)}} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
                                    </div>
                                </div>
                            )}
                            {importStatus && <p className="text-sm text-gray-500">{importStatus}</p>}
                        </div>
                    </div>

                    {/* Export / Danger */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold mb-4">Data Freedom</h2>
                        <div className="flex gap-4">
                            <button onClick={handleExport} className="flex-1 py-3 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 text-gray-700">
                                📤 Export JSON Backup
                            </button>
                            <button onClick={handleClearData} className="flex-1 py-3 border border-red-100 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100">
                                🗑️ Clear All Data
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* === View: About === */}
            {activeTab === "about" && (
                <div className="max-w-2xl bg-white p-10 rounded-xl shadow-sm border border-gray-100 text-center">
                    <div className="text-6xl mb-4">🛡️</div>
                    <h2 className="text-2xl font-bold mb-2">AI Priva Mark</h2>
                    <p className="text-gray-500 mb-8">Privacy-First AI Knowledge Base</p>
                    
                    <div className="text-left space-y-4 bg-gray-50 p-6 rounded-lg text-sm text-gray-600">
                        <p><strong>Local-First:</strong> Your data never leaves your device, except when communicating with the AI provider you configured.</p>
                        <p><strong>Open Source:</strong> Built with Plasmo, React, and Tailwind CSS.</p>
                        <p><strong>Version:</strong> 0.0.1 (Alpha)</p>
                    </div>
                </div>
            )}

        </div>
      </main>

      {/* === Modal === */}
      {showImportModal && scanResult && (
          <ImportModal 
            items={scanResult}
            onClose={() => setShowImportModal(false)}
            onFinish={() => {
                setShowImportModal(false)
                setScanResult(null)
                setScanStats(null)
                loadBookmarks()
            }}
          />
      )}
    </div>
  )
}

function SidebarItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active 
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
