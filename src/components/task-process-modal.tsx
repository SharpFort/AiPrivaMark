import { useI18n } from "~i18n/hook"
import type { TaskItem } from "../hooks/use-task-processor"

interface TaskProcessModalProps {
    title: string
    tasks: TaskItem[]
    stats: {
        total: number
        processed: number
        success: number
        failed: number
        skipped: number
        startTime: number
        endTime: number
    }
    isProcessing: boolean
    isFinished: boolean
    onClose: () => void
    onMinimize: () => void
}

export function TaskProcessModal({
    title,
    tasks,
    stats,
    isProcessing,
    isFinished,
    onClose,
    onMinimize
}: TaskProcessModalProps) {
    const { t } = useI18n()

    // 计算时间
    const now = stats.endTime || Date.now()
    const elapsedTime = Math.floor((now - stats.startTime) / 1000)

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}m ${s}s`
    }

    // 估算剩余时间
    const itemsPerSec = stats.processed / (elapsedTime || 1)
    const remainingItems = stats.total - stats.processed
    const remainingTime = itemsPerSec > 0 ? Math.floor(remainingItems / itemsPerSec) : 0

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-[800px] h-[600px] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <div className="flex items-center gap-2">
                        {isProcessing && (
                            <button
                                onClick={onMinimize}
                                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                            >
                                {t("runInBackground") || "后台运行"}
                            </button>
                        )}
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="p-6 grid grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                        <div className="text-xs text-green-800 uppercase tracking-wider">{t("success")}</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">{formatTime(elapsedTime)}</div>
                        <div className="text-xs text-blue-800 uppercase tracking-wider">{t("timeElapsed")}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-gray-600">
                            {isFinished ? t("finished") : `~ ${formatTime(remainingTime)}`}
                        </div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">{t("estRemaining") || "预计剩余"}</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="px-6 mb-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{t("progress")}: {stats.processed} / {stats.total}</span>
                        <span>{Math.round((stats.processed / (stats.total || 1)) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300 relative"
                            style={{ width: `${(stats.processed / (stats.total || 1)) * 100}%` }}
                        >
                            {/* Animated sheen effect */}
                            {isProcessing && (
                                <div className="absolute top-0 left-0 bottom-0 right-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite] -translate-x-full" />
                            )}
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto px-6 py-2 bg-gray-50/50">
                    <div className="space-y-2">
                        {tasks.map((item) => (
                            <div key={item.id} className="bg-white p-3 rounded border border-gray-100 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex-1 min-w-0 pr-4">
                                    <div className="font-medium text-sm text-gray-800 truncate" title={item.title}>
                                        {item.title}
                                    </div>
                                    <div className="text-xs text-gray-400 truncate" title={item.data.url}>
                                        {item.data.url}
                                    </div>
                                </div>
                                <div className="flex-shrink-0 w-32 text-right">
                                    {item.status === "waiting" && <span className="text-xs text-gray-400">{t("waiting")}</span>}
                                    {item.status === "processing" && (
                                        <div className="flex items-center justify-end gap-1 text-blue-500">
                                            <span className="animate-spin text-xs">⟳</span>
                                            <span className="text-xs font-medium">{t("processing") || "处理中"}</span>
                                        </div>
                                    )}
                                    {item.status === "success" && (
                                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 font-medium">
                                            {item.msg || t("success")}
                                        </span>
                                    )}
                                    {item.status === "skipped" && (
                                        <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded border border-yellow-100 font-medium">
                                            {item.msg || t("duplicateSkipped")}
                                        </span>
                                    )}
                                    {item.status === "failed" && (
                                        <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100 font-medium">
                                            {item.msg || t("failed")}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
