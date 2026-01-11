import type { AppConfig } from "./config"
import type { BookmarkItem } from "./bookmark"

/**
 * 完整备份数据结构
 * 用于导出/导入时同时包含配置和书签
 */
export interface FullBackup {
    /** 备份格式版本号 */
    version: "1.0"
    /** 导出时间 (ISO 8601) */
    exportedAt: string
    /** 完整配置（含API设置、基本设置、提示词） */
    config: AppConfig
    /** 书签列表（含AI摘要和标签） */
    bookmarks: BookmarkItem[]
}

/**
 * 检测导入数据是否为完整备份格式
 */
export function isFullBackup(data: unknown): data is FullBackup {
    return (
        typeof data === "object" &&
        data !== null &&
        "version" in data &&
        "config" in data &&
        "bookmarks" in data
    )
}
