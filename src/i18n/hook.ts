import { useEffect, useState } from "react"
import { getLocale, setLocale, initLocale, t, type Locale, type Translations } from "./index"

export function useI18n() {
    const [locale, setLocaleState] = useState<Locale>(getLocale())
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        initLocale().then((initialLocale) => {
            setLocaleState(initialLocale)
            setIsReady(true)
        })

        // 监听存储变化，实现跨页面状态同步 (e.g. Options -> SidePanel)
        const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
            if (changes.locale) {
                const newLocale = changes.locale.newValue as Locale
                // 同步内部状态但不写入存储 (避免循环)
                import("./index").then(({ syncLocale }) => {
                    syncLocale(newLocale)
                    setLocaleState(newLocale)
                })
            }
        }

        if (typeof chrome !== "undefined" && chrome.storage) {
            chrome.storage.onChanged.addListener(handleStorageChange)
        }

        return () => {
            if (typeof chrome !== "undefined" && chrome.storage) {
                chrome.storage.onChanged.removeListener(handleStorageChange)
            }
        }
    }, [])

    const changeLocale = (newLocale: Locale) => {
        setLocale(newLocale)
        setLocaleState(newLocale)
    }

    // 翻译函数，包装 t 函数以便在 locale 变化时触发重渲染
    const translate = (key: keyof Translations): string => {
        return t(key)
    }

    return {
        locale,
        setLocale: changeLocale,
        t: translate,
        isReady
    }
}
