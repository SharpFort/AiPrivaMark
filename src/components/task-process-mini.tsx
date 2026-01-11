import { useI18n } from "~i18n/hook"

interface TaskProcessMiniProps {
    stats: {
        total: number
        processed: number
    }
    isProcessing: boolean
    isFinished: boolean
    onMaximize: () => void
}

export function TaskProcessMini({
    stats,
    isProcessing,
    isFinished,
    onMaximize
}: TaskProcessMiniProps) {
    const { t } = useI18n()

    const percent = Math.round((stats.processed / (stats.total || 1)) * 100)

    return (
        <div
            onClick={onMaximize}
            className="fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl border border-gray-200 w-80 p-4 cursor-pointer hover:-translate-y-1 transition-transform duration-200 z-50 animate-in slide-in-from-bottom-10 fade-in"
        >
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800 text-sm">
                    {isFinished ? (t("taskFinished") || "任务完成") : (t("processingInBackground") || "后台处理中...")}
                </h3>
                <span className="text-xs text-blue-500 font-medium">{percent}%</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${isFinished ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${percent}%` }}
                >
                    {isProcessing && (
                        <div className="absolute top-0 left-0 bottom-0 right-0 bg-white/20 animate-[shimmer_1s_infinite]" />
                    )}
                </div>
            </div>

            <div className="flex justify-between text-xs text-gray-400">
                <span>{stats.processed} / {stats.total}</span>
                <span className="text-blue-500 hover:underline">{t("clickToRestore") || "点击还原"}</span>
            </div>
        </div>
    )
}
