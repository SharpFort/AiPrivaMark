import { en, type Translations } from "./locales/en"
import { zh } from "./locales/zh"

export type Locale = "en" | "zh"

const locales: Record<Locale, Translations> = {
    en,
    zh
}

// 获取浏览器语言
function getBrowserLocale(): Locale {
    const browserLang = navigator.language.toLowerCase()
    if (browserLang.startsWith("zh")) {
        return "zh"
    }
    return "en"
}

// 全局状态
let currentLocale: Locale = getBrowserLocale()

// 获取当前语言
export function getLocale(): Locale {
    return currentLocale
}

// 设置当前语言
export function setLocale(locale: Locale): void {
    currentLocale = locale
    // 触发存储更新以便持久化
    if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.set({ locale })
    }
}

// 仅更新内存状态（用于从存储同步）
export function syncLocale(locale: Locale): void {
    currentLocale = locale
}

// 初始化语言（从存储加载）
export async function initLocale(): Promise<Locale> {
    if (typeof chrome !== "undefined" && chrome.storage) {
        return new Promise((resolve) => {
            chrome.storage.local.get(["locale"], (result) => {
                if (result.locale && (result.locale === "en" || result.locale === "zh")) {
                    currentLocale = result.locale
                }
                resolve(currentLocale)
            })
        })
    }
    return currentLocale
}

// 获取翻译文本
export function t(key: keyof Translations): string {
    return locales[currentLocale][key] || locales.en[key] || key
}

// 导出类型和语言包
export { en, zh, type Translations }
