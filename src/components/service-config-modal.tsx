import { useState, useEffect } from "react"
import { useI18n } from "../i18n/hook"

interface ServiceConfigModalProps {
    isOpen: boolean
    serviceId: string
    serviceNameKey: string
    initialApiKey?: string
    initialModel?: string
    availableModels?: string[]
    getApiKeyUrl?: string
    pricingUrl?: string
    onClose: () => void
    onSave: (apiKey: string, model: string) => void
    onVerify: (apiKey: string) => void
    status?: { type: "idle" | "loading" | "success" | "error", msg?: string }
}

export const ServiceConfigModal = ({
    isOpen,
    serviceId,
    serviceNameKey,
    initialApiKey = "",
    initialModel = "",
    availableModels = [],
    getApiKeyUrl,
    pricingUrl,
    onClose,
    onSave,
    onVerify,
    status
}: ServiceConfigModalProps) => {
    const { t } = useI18n()
    const [apiKey, setApiKey] = useState(initialApiKey)
    const [model, setModel] = useState(initialModel)
    const [showKey, setShowKey] = useState(false)
    const [isEditingModel, setIsEditingModel] = useState(false)

    useEffect(() => {
        setApiKey(initialApiKey)
        setModel(initialModel)
    }, [initialApiKey, initialModel, isOpen])

    if (!isOpen) return null

    const handleVerify = () => {
        onVerify(apiKey.trim())
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">
                        {t(serviceNameKey as any)} {t("configTitle")}
                    </h2>
                    <div className="flex items-center gap-2">
                        {/* Reverting to original header icons if they existed, or just the close button as per screenshot */}
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* API Key Input */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-semibold text-gray-700">{t("apiKey")}</label>
                            {getApiKeyUrl && (
                                <a
                                    href={getApiKeyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors hover:underline"
                                >
                                    {t("getKey")}
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            )}
                        </div>
                        <div className="relative">
                            <input
                                type={showKey ? "text" : "password"}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder={t("enterApiKey")}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all font-mono"
                            />
                            <button
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showKey ? (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => onSave(apiKey.trim(), model)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            {t("save")}
                        </button>
                        <button
                            onClick={handleVerify}
                            disabled={status?.type === "loading"}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {status?.type === "loading" ? "..." : t("verify")}
                        </button>
                    </div>

                    {/* Status Message */}
                    {status && status.type !== "idle" && (
                        <div className={`text-sm ${status.type === "error" ? "text-red-600" : "text-green-600"}`}>
                            {status.type === "success" && "✅ "}
                            {status.type === "error" && "❌ "}
                            {status.msg}
                        </div>
                    )}

                    {/* Divider */}
                    <div className="border-t border-gray-100"></div>

                    {/* Model Info - Original Style */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-1">
                                <span className="text-sm font-semibold text-gray-700">{t("modelInfo")}</span>
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            {pricingUrl && (
                                <a
                                    href={pricingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors hover:underline"
                                >
                                    {t("viewPricing")}
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            )}
                        </div>

                        <div className="space-y-3">
                            {/* Text Model Row */}
                            <div className="flex bg-gray-50 rounded-lg p-3 items-center justify-between">
                                <span className="text-sm font-semibold text-gray-600 w-24">{t("textModel")}</span>
                                <div className="flex-grow flex items-center">
                                    {isEditingModel ? (
                                        <input
                                            type="text"
                                            value={model}
                                            onChange={(e) => setModel(e.target.value)}
                                            onBlur={() => setIsEditingModel(false)}
                                            onKeyDown={(e) => e.key === 'Enter' && setIsEditingModel(false)}
                                            autoFocus
                                            className="w-full text-sm text-gray-800 font-mono bg-white px-2 py-1 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                            list="available-models"  // Using datalist for suggestions while keeping input/edit style
                                        />
                                    ) : (
                                        <span
                                            className="text-sm text-gray-800 font-mono bg-white px-2 py-1 rounded border border-gray-100 cursor-text w-full"
                                            onClick={() => setIsEditingModel(true)} // Allow clicking text to edit
                                        >
                                            {model}
                                        </span>
                                    )}
                                    {/* Datalist for suggestions if available */}
                                    {availableModels && availableModels.length > 0 && (
                                        <datalist id="available-models">
                                            {availableModels.map(m => (
                                                <option key={m} value={m} />
                                            ))}
                                        </datalist>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsEditingModel(!isEditingModel)}
                                    className="ml-2 text-gray-400 hover:text-blue-600 p-1"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            </div>

                            {/* Embedding Model Row - Keeping it as read-only/placeholder as per original style */}
                            <div className="flex bg-gray-50 rounded-lg p-3 items-center justify-between">
                                <span className="text-sm font-semibold text-gray-600 w-24">{t("embeddingModel")}</span>
                                <span className="text-sm text-gray-800 flex-grow font-mono bg-white px-2 py-1 rounded border border-gray-100">embedding-2</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
