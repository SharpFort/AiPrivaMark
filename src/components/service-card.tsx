import { useI18n } from "../i18n/hook"

interface ServiceCardProps {
    id: string
    icon: React.ReactNode
    nameKey: string
    descKey: string
    status: "configured" | "not_configured"
    isTag?: string
    onClick: () => void
}

export const ServiceCard = ({ id, icon, nameKey, descKey, status, isTag, onClick }: ServiceCardProps) => {
    const { t } = useI18n()

    return (
        <div
            onClick={onClick}
            className="group relative bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex flex-col h-full"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-50 border border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                    {icon}
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${status === "configured"
                        ? "bg-green-50 text-green-600 border border-green-100"
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                    }`}>
                    {status === "configured" ? "● " + t("configured") : "● " + t("notConfigured")}
                </div>
            </div>

            <h3 className="font-bold text-gray-900 mb-1">{t(nameKey as any)}</h3>
            <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-grow">{t(descKey as any)}</p>

            {isTag && (
                <div className="mt-auto pt-3 border-t border-gray-50">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
                        {isTag}
                    </span>
                </div>
            )}
        </div>
    )
}
