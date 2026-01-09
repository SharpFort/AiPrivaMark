import { useEffect, useState, useRef } from "react"
import { BookmarkImportService } from "~services/bookmark-import"
import { StorageService } from "~services/storage"

interface ImportModalProps {
  items: chrome.bookmarks.BookmarkTreeNode[]
  onClose: () => void
  onFinish: () => void
}

type ImportStatus = "waiting" | "checking" | "success" | "failed"

interface ImportItemState {
  id: string
  title: string
  url: string
  status: ImportStatus
  msg?: string
}

export function ImportModal({ items, onClose, onFinish }: ImportModalProps) {
  // 状态管理
  const [list, setList] = useState<ImportItemState[]>([])
  const [processedCount, setProcessedCount] = useState(0)
  const [successCount, setSuccessCount] = useState(0)
  const [startTime] = useState(Date.now())
  const [isFinished, setIsFinished] = useState(false)
  
  // 用于并发控制
  const queueRef = useRef<ImportItemState[]>([])
  const processingRef = useRef(false)
  const mountedRef = useRef(false)

  // 初始化列表
  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    const initialState = items.map(item => ({
      id: item.id, // bookmark node id
      title: item.title,
      url: item.url || "",
      status: "waiting" as ImportStatus
    }))
    
    setList(initialState)
    queueRef.current = [...initialState]
    startProcessing()
  }, [])

  const startProcessing = async () => {
    if (processingRef.current) return
    processingRef.current = true

    const CONCURRENCY = 5 // 并发 5 个请求

    while (queueRef.current.length > 0) {
      const batch = queueRef.current.splice(0, CONCURRENCY)
      
      // 更新这一批的状态为 checking
      setList(prev => prev.map(item => 
        batch.find(b => b.id === item.id) ? { ...item, status: "checking" } : item
      ))

      await Promise.all(batch.map(async (item) => {
        try {
          // 1. 检查连通性
          const isAlive = await BookmarkImportService.checkUrlAccessibility(item.url)
          
          if (isAlive) {
            // 2. 存入 Storage
            const newItem = BookmarkImportService.convertBrowserBookmark({
                id: item.id,
                title: item.title,
                url: item.url,
                // @ts-ignore
                parentId: "", index: 0, dateAdded: 0
            })
            // addBookmark 内部会去重，如果重复会抛错，我们在 try catch 里捕获
            try {
                await StorageService.addBookmark(newItem)
                updateItemStatus(item.id, "success")
                setSuccessCount(prev => prev + 1)
            } catch (e: any) {
                // 如果是重复，视为成功（或跳过），这里标记为 success 但 msg 说明是 duplicate
                 updateItemStatus(item.id, "success", "Duplicate (Skipped)")
                 // 不增加 successCount 或者视作 success? 视作 success 吧
                 setSuccessCount(prev => prev + 1)
            }
          } else {
            updateItemStatus(item.id, "failed", "Network Error / Timeout")
          }
        } catch (e) {
            updateItemStatus(item.id, "failed", "Unknown Error")
        } finally {
            setProcessedCount(prev => prev + 1)
        }
      }))
    }

    setIsFinished(true)
    processingRef.current = false
  }

  const updateItemStatus = (id: string, status: ImportStatus, msg?: string) => {
    setList(prev => prev.map(item => item.id === id ? { ...item, status, msg } : item))
  }

  // 计算时间
  const elapsedTime = Math.floor((Date.now() - startTime) / 1000)
  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60)
      const s = seconds % 60
      return `${m}m ${s}s`
  }

  // 估算剩余时间
  const itemsPerSec = processedCount / (elapsedTime || 1)
  const remainingItems = list.length - processedCount
  const remainingTime = itemsPerSec > 0 ? Math.floor(remainingItems / itemsPerSec) : 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[800px] h-[600px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800">Importing Browser Bookmarks</h2>
            {!isFinished ? (
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
            ) : (
                <button onClick={onFinish} className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700">Done</button>
            )}
        </div>

        {/* Stats */}
        <div className="p-6 grid grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{successCount}</div>
                <div className="text-xs text-green-800 uppercase tracking-wider">Imported</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{formatTime(elapsedTime)}</div>
                <div className="text-xs text-blue-800 uppercase tracking-wider">Time Elapsed</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-600">
                    {isFinished ? "Finished" : `~ ${formatTime(remainingTime)}`}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Est. Remaining</div>
            </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 mb-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress: {processedCount} / {list.length}</span>
                <span>{Math.round((processedCount / list.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(processedCount / list.length) * 100}%` }}
                ></div>
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-2 bg-gray-50/50">
            <div className="space-y-2">
                {list.map((item) => (
                    <div key={item.id} className="bg-white p-3 rounded border border-gray-100 flex items-center justify-between shadow-sm">
                        <div className="flex-1 min-w-0 pr-4">
                            <div className="font-medium text-sm text-gray-800 truncate" title={item.title}>
                                {item.title}
                            </div>
                            <div className="text-xs text-gray-400 truncate" title={item.url}>
                                {item.url}
                            </div>
                        </div>
                        <div className="flex-shrink-0 w-32 text-right">
                            {item.status === "waiting" && <span className="text-xs text-gray-400">Waiting...</span>}
                            {item.status === "checking" && <span className="text-xs text-blue-500 font-medium">Checking...</span>}
                            {item.status === "success" && (
                                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 font-medium">
                                    {item.msg || "Success"}
                                </span>
                            )}
                            {item.status === "failed" && (
                                <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100 font-medium">
                                    {item.msg || "Failed"}
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
