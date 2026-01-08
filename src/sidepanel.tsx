import "~src/styles/globals.css"

export const IndexSidePanel = () => {
  return (
    <div className="flex flex-col h-screen p-4 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">AiPrivaMark Side Panel</h1>
      <div className="flex-1 overflow-y-auto">
        {/* Bookmark list will go here */}
        <p className="text-gray-500 italic">No bookmarks analyzed yet.</p>
      </div>
    </div>
  )
}

export default IndexSidePanel
