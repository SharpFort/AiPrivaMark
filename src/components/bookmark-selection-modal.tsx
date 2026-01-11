import { useEffect, useState, useMemo } from "react"
import { useI18n } from "~i18n/hook"

export interface ImportOptions {
    addFolderTags: boolean
    skipExisting: boolean
}

interface BookmarkSelectionModalProps {
    onClose: () => void
    onConfirm: (selectedIds: string[], options: ImportOptions) => void
    nodes: chrome.bookmarks.BookmarkTreeNode[]
}

export function BookmarkSelectionModal({ onClose, onConfirm, nodes }: BookmarkSelectionModalProps) {
    const { t } = useI18n()
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
    const [options, setOptions] = useState<ImportOptions>({
        addFolderTags: true,
        skipExisting: true
    })

    // Flatten logic helper to get all IDs including children
    const getAllIds = (nodes: chrome.bookmarks.BookmarkTreeNode[]): string[] => {
        let ids: string[] = []
        nodes.forEach(node => {
            ids.push(node.id)
            if (node.children) {
                ids = [...ids, ...getAllIds(node.children)]
            }
        })
        return ids
    }

    // Helper to get only leaf IDs (actual bookmarks)
    const getLeafIds = (nodes: chrome.bookmarks.BookmarkTreeNode[]): string[] => {
        let ids: string[] = []
        nodes.forEach(node => {
            if (node.url) {
                ids.push(node.id)
            }
            if (node.children) {
                ids = [...ids, ...getLeafIds(node.children)]
            }
        })
        return ids
    }

    const allLeafIds = useMemo(() => getLeafIds(nodes), [nodes])

    // Toggle expanded state
    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedIds)
        if (newExpanded.has(id)) {
            newExpanded.delete(id)
        } else {
            newExpanded.add(id)
        }
        setExpandedIds(newExpanded)
    }

    // Toggle selection
    const toggleSelection = (node: chrome.bookmarks.BookmarkTreeNode, isSelected: boolean) => {
        const newSelected = new Set(selectedIds)
        const targetIds = node.children ? getAllIds([node]) : [node.id]

        targetIds.forEach(id => {
            if (isSelected) {
                newSelected.add(id)
            } else {
                newSelected.delete(id)
            }
        })
        setSelectedIds(newSelected)
    }

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(getAllIds(nodes)))
        } else {
            setSelectedIds(new Set())
        }
    }

    // Count selected actual bookmarks (leaves)
    const selectedLeafCount = useMemo(() => {
        let count = 0
        selectedIds.forEach(id => {
            if (allLeafIds.includes(id)) count++
        })
        return count
    }, [selectedIds, allLeafIds])

    // Calculate folder counts recursively
    const getFolderCount = (node: chrome.bookmarks.BookmarkTreeNode): number => {
        if (node.children) {
            return node.children.reduce((acc, child) => {
                // Counts logic: count all descendants that are bookmarks (url is set)
                if (child.url) return acc + 1
                return acc + getFolderCount(child)
            }, 0)
        }
        return 0
    }

    const renderTree = (nodes: chrome.bookmarks.BookmarkTreeNode[], level = 0) => {
        return nodes.map(node => {
            const isFolder = !node.url
            const isExpanded = expandedIds.has(node.id)
            const isSelected = selectedIds.has(node.id)

            // Check if all children are selected for indeterminate state (optional, just simple check for now)
            // For now, if a folder is selected, it implies checking all children. 
            // Better UI: Indeterminate checkbox if some children selected.
            // Let's keep it simple: if folder is checked, check all. If unchecked, uncheck all.
            // To properly show state, we should check if all descendant leaves are in selectedIds.

            // Logic for indeterminate/checked display
            const nodeAllIds = isFolder ? getAllIds([node]) : [node.id]
            const allChecked = nodeAllIds.every(id => selectedIds.has(id))
            const someChecked = nodeAllIds.some(id => selectedIds.has(id))
            const checkedState = allChecked
            const indeterminate = !allChecked && someChecked

            return (
                <div key={node.id} className="select-none">
                    <div
                        className={`flex items-center py-2 px-2 hover:bg-gray-50 rounded-lg group ${level > 0 ? 'ml-6 border-l border-gray-100 pl-4' : ''}`}
                    >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <input
                                type="checkbox"
                                checked={checkedState}
                                ref={input => {
                                    if (input) input.indeterminate = indeterminate
                                }}
                                onChange={(e) => toggleSelection(node, e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />

                            {isFolder && (
                                <button
                                    onClick={() => toggleExpand(node.id)}
                                    className="p-1 rounded hover:bg-gray-200 text-gray-400 transition-colors"
                                >
                                    <svg
                                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}

                            <div className="flex items-center gap-2 overflow-hidden">
                                <span className="text-xl flex-shrink-0">
                                    {isFolder ? '📁' : '📄'}
                                </span>
                                <span className={`text-sm truncate ${isFolder ? 'font-medium text-gray-700' : 'text-gray-600'}`}>
                                    {node.title || (node.url ? node.url : t("untitled"))}
                                </span>
                            </div>

                            {isFolder && (
                                <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                                    {getFolderCount(node)} {t("bookmarksCount") || "bookmarks"}
                                </span>
                            )}
                        </div>
                    </div>

                    {isFolder && isExpanded && node.children && (
                        <div className="animate-in slide-in-from-top-1 fade-in duration-200">
                            {renderTree(node.children, level + 1)}
                        </div>
                    )}
                </div>
            )
        })
    }

    // Auto-expand root folders initially
    useEffect(() => {
        const rootIds = nodes.map(n => n.id)
        setExpandedIds(new Set(rootIds))
    }, [nodes])

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-[800px] h-[600px] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0">
                    <h2 className="text-xl font-bold text-gray-800">{t("selectBookmarksToImport") || "Select Bookmarks to Import"}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            onChange={handleSelectAll}
                            checked={selectedIds.size > 0 && selectedIds.size === getAllIds(nodes).length}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{t("selectAll") || "Select All"}</span>
                    </label>

                    <div className="h-4 w-px bg-gray-300"></div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={options.addFolderTags}
                            onChange={(e) => setOptions({ ...options, addFolderTags: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">{t("addFolderAsTags") || "Add folder name as tags"}</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={options.skipExisting}
                            onChange={(e) => setOptions({ ...options, skipExisting: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">{t("skipExistingBookmarks") || "Skip existing bookmarks"}</span>
                    </label>
                </div>

                {/* Tree View */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {nodes.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            {t("noBookmarksFound")}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {renderTree(nodes)}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="text-sm text-gray-600">
                            {t("selected") || "Selected"}: <span className="font-bold text-gray-900 text-lg">{selectedLeafCount}</span> {t("bookmarksCount") || "bookmarks"}
                        </div>

                        {/* Stats estimations could go here */}
                        <div className="flex gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                                ⚙️ {t("estChatTokens") || "Est. Tokens"}: {selectedLeafCount * 500}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                            {t("cancel")}
                        </button>
                        <button
                            onClick={() => onConfirm(Array.from(selectedIds), options)}
                            disabled={selectedLeafCount === 0}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all active:scale-95"
                        >
                            {t("startImport") || "Start Import"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
