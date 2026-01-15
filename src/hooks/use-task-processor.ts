import { useState, useRef, useCallback, useEffect } from "react"


export interface TaskItem {
    id: string
    title: string
    data: any // 原始数据
    status: "waiting" | "processing" | "success" | "failed" | "skipped"
    msg?: string
}

export type TaskExecutor = (
    item: TaskItem,
    onProgress: (msg: string) => void
) => Promise<{ success: boolean; msg?: string; skipped?: boolean }>

export function useTaskProcessor() {
    const [tasks, setTasks] = useState<TaskItem[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [isFinished, setIsFinished] = useState(false)
    const [minimized, setMinimized] = useState(false)

    // 统计
    const [stats, setStats] = useState({
        total: 0,
        processed: 0,
        success: 0,
        failed: 0,
        skipped: 0,
        startTime: 0,
        endTime: 0
    })

    const queueRef = useRef<TaskItem[]>([])
    const processingRef = useRef(false)
    const executorRef = useRef<TaskExecutor | null>(null)
    const activeTasksRef = useRef(0)

    // 配置 Ref
    const configRef = useRef({ concurrency: 1, minDelay: 1000, maxDelay: 1000 })

    // 添加任务
    const addTasks = useCallback((newTasks: TaskItem[]) => {
        setTasks(prev => [...prev, ...newTasks])
        queueRef.current = [...queueRef.current, ...newTasks]
        setStats(prev => ({ ...prev, total: prev.total + newTasks.length }))
        setIsFinished(false)
    }, [])

    // 清空任务
    const clearTasks = useCallback(() => {
        setTasks([])
        queueRef.current = []
        setStats({
            total: 0,
            processed: 0,
            success: 0,
            failed: 0,
            skipped: 0,
            startTime: 0,
            endTime: 0
        })
        setIsFinished(false)
        setIsProcessing(false)
        setMinimized(false)
        activeTasksRef.current = 0
    }, [])

    // 更新单个任务状态
    const updateTaskStatus = (id: string, status: TaskItem["status"], msg?: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status, msg } : t))
    }

    // 开始处理
    const start = useCallback(async (
        executor: TaskExecutor,
        concurrency = 1,
        minDelay = 1000,
        maxDelay = 1000
    ) => {
        if (processingRef.current) return

        executorRef.current = executor
        configRef.current = { concurrency, minDelay, maxDelay }

        processingRef.current = true
        setIsProcessing(true)
        setIsFinished(false)

        if (stats.startTime === 0) {
            setStats(prev => ({ ...prev, startTime: Date.now() }))
        }

        const processNext = async () => {
            if (!processingRef.current) return

            // 检查是否还有任务
            if (queueRef.current.length === 0) {
                if (activeTasksRef.current === 0) {
                    processingRef.current = false
                    setIsProcessing(false)
                    setIsFinished(true)
                    setStats(prev => ({ ...prev, endTime: Date.now() }))
                }
                return
            }

            const item = queueRef.current.shift()
            if (!item) return

            activeTasksRef.current++
            updateTaskStatus(item.id, "processing", "Start processing...")

            try {
                // 定义进度回调
                const onProgress = (msg: string) => {
                    updateTaskStatus(item.id, "processing", msg)
                }

                const result = await executor(item, onProgress)
                const status = result.skipped ? "skipped" : result.success ? "success" : "failed"

                updateTaskStatus(item.id, status, result.msg)

                setStats(prev => ({
                    ...prev,
                    processed: prev.processed + 1,
                    success: result.success && !result.skipped ? prev.success + 1 : prev.success,
                    failed: !result.success ? prev.failed + 1 : prev.failed,
                    skipped: result.skipped ? prev.skipped + 1 : prev.skipped
                }))
            } catch (e: any) {
                updateTaskStatus(item.id, "failed", e.message)
                setStats(prev => ({ ...prev, processed: prev.processed + 1, failed: prev.failed + 1 }))
            } finally {
                activeTasksRef.current--

                // 添加随机延迟，避免 429
                if (queueRef.current.length > 0 && processingRef.current) {
                    const { minDelay, maxDelay } = configRef.current
                    const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay
                    await new Promise(r => setTimeout(r, delay))
                }

                processNext() // 递归处理下一个
            }
        }

        // 启动并发
        for (let i = 0; i < concurrency; i++) {
            processNext()
        }

    }, [stats.startTime])

    // 暂停/停止
    const stop = useCallback(() => {
        processingRef.current = false
        setIsProcessing(false)
    }, [])

    return {
        tasks,
        isProcessing,
        isFinished,
        minimized,
        stats,
        addTasks,
        clearTasks,
        start,
        stop,
        setMinimize: setMinimized
    }
}
