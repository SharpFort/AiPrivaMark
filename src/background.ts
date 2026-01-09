import { Storage } from "@plasmohq/storage"
import { ProcessingQueue } from "~services/queue"
import { StorageService } from "~services/storage"
import { DEFAULT_CONFIG, type AppConfig } from "~types/config"

export {} // 确保是模块

let queue: ProcessingQueue | null = null
const storage = new Storage({ area: "local" })

// 安装时创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "save-to-priva-mark",
        title: "Save to AI Priva Mark",
        contexts: ["page", "selection"]
    })
})

// 监听右键点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "save-to-priva-mark") {
        const url = info.pageUrl
        const title = tab?.title || "Unknown Page"
        
        // 1. 初始化 Queue (如果需要)
        const config = await storage.get<AppConfig>("app-config") || DEFAULT_CONFIG
        if (!queue) {
             queue = new ProcessingQueue(config, (status) => {
                chrome.runtime.sendMessage({ type: "QUEUE_PROGRESS", status }).catch(() => {})
            })
        }
        
        try {
            // 2. 添加到 Storage (Pending)
            // addBookmark 内部有去重逻辑
            const newBookmark = await StorageService.addBookmark({
                url,
                title,
                description: "Added via Context Menu",
                content_summary: "",
                tags: [],
                status: "pending"
            })
            
            // 3. 加入队列
            queue.addItems([newBookmark.id])
            queue.start(2)
            
            // 保活
            chrome.alarms.create("keep-alive", { periodInMinutes: 0.5 })
            
            // 4. 通知用户
            chrome.notifications.create({
                type: "basic",
                iconUrl: chrome.runtime.getURL("assets/icon.png"),
                title: "AI Priva Mark",
                message: "Page saved! Analyzing in background..."
            })
            
        } catch (e: any) {
            console.warn("Save failed:", e)
            chrome.notifications.create({
                type: "basic",
                iconUrl: chrome.runtime.getURL("assets/icon.png"),
                title: "AI Priva Mark",
                message: `Failed: ${e.message}`
            })
        }
    }
})


// 监听 SidePanel 消息
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    // 异步处理函数需要返回 true
    handleMessage(msg, sendResponse)
    return true 
})

async function handleMessage(msg: any, sendResponse: (response?: any) => void) {
    if (msg.type === "START_BATCH") {
        const config = await storage.get<AppConfig>("app-config") || DEFAULT_CONFIG
        
        if (!queue) {
            queue = new ProcessingQueue(config, (status) => {
                chrome.runtime.sendMessage({
                    type: "QUEUE_PROGRESS",
                    status
                }).catch(() => {})
            })
        }
        
        queue.addItems(msg.ids)
        queue.start(2)
        
        chrome.alarms.create("keep-alive", { periodInMinutes: 0.5 }) 
        sendResponse({ success: true })
    }

    if (msg.type === "STOP_BATCH") {
        queue?.stop()
        chrome.alarms.clear("keep-alive")
        sendResponse({ success: true })
    }

    if (msg.type === "GET_QUEUE_STATUS") {
        const status = queue ? queue.getStatus() : { isProcessing: false, total: 0, processed: 0, success: 0, failed: 0 }
        sendResponse(status)
    }
}

// 保活 Alarm
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "keep-alive") {
        if (queue && !queue.getStatus().isProcessing) {
            chrome.alarms.clear("keep-alive")
        }
    }
})
