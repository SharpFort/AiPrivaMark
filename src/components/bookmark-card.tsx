import { useState } from "react"
import type { BookmarkItem } from "~types/bookmark"
import { useI18n } from "~i18n/hook"

interface BookmarkCardProps {
  bookmark: BookmarkItem
  onDelete: (id: string) => void
  onTagClick: (tag: string) => void
}

export function BookmarkCard({ bookmark, onDelete, onTagClick }: BookmarkCardProps) {
  const { t } = useI18n()
  const [isExpanded, setIsExpanded] = useState(false)

  // 获取 Favicon 的简单方式
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    } catch {
      return ""
    }
  }

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group">
      {/* Header: Logo + Title + Delete */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-start gap-3 flex-1 overflow-hidden">
          {/* Logo - Clickable to open */}
          <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 mt-0.5 opacity-80 hover:opacity-100 transition-opacity">
            <img
              src={getFaviconUrl(bookmark.url)}
              alt="icon"
              className="w-5 h-5"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </a>

          {/* Title */}
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gray-800 hover:text-blue-600 leading-snug truncate block flex-1 group/link"
            title={bookmark.title}
          >
            <span className="flex items-center gap-1">
              <span className="truncate">{bookmark.title}</span>
              <svg className="w-3 h-3 text-gray-300 opacity-0 group-hover/link:opacity-100 transition-opacity flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </span>
          </a>
        </div>

        {/* Actions */}
        <button
          onClick={(e) => {
            e.preventDefault()
            onDelete(bookmark.id)
          }}
          className="text-gray-300 hover:text-red-500 p-1 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
          title={t("delete")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Summary Area - Expandable */}
      <div
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {bookmark.content_summary ? (
          <div className={`text-sm text-gray-600 mb-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100 transition-all ${isExpanded ? "" : "line-clamp-2"}`}>
            {bookmark.content_summary}
            {!isExpanded && (
              <span className="text-blue-500 text-xs ml-1 font-medium hover:underline">{t("more")}</span>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic mb-3">{t("noSummaryAvailable")}</p>
        )}
      </div>

      {/* Tags Area */}
      <div className="flex flex-wrap gap-2 items-center">
        {bookmark.tags && bookmark.tags.length > 0 && bookmark.tags.map((tag, idx) => (
          <span
            key={idx}
            className="cursor-pointer bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 text-xs px-2.5 py-1 rounded-full border border-blue-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation() // 防止触发展开
              onTagClick(tag)
            }}
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-2 border-t border-gray-50 text-[10px] text-gray-400 flex justify-between items-center">
        <span>{new Date(bookmark.timestamp).toLocaleDateString()}</span>
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider ${bookmark.status === 'done' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
          }`}>
          {bookmark.status === 'done' ? t("done_status") : t("pending")}
        </span>
      </div>
    </div>
  )
}
