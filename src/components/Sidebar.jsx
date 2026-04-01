import { Plus, Trash2, MessageSquare } from 'lucide-react'
import { memo } from 'react'

const Sidebar = memo(function Sidebar({
  chats,
  currentChatId,
  onSelectChat,
  onCreateChat,
  onDeleteChat,
}) {
  const formatTime = (timestamp) => {
    const now = Date.now()
    const diff = now - timestamp
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (hours < 1) return 'Today'
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return 'Older'
  }

  return (
    <div className="h-full flex flex-col bg-slate-900/50 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <button
          onClick={onCreateChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors duration-200"
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {chats.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-8">
            <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
            <p>No chats yet</p>
          </div>
        ) : (
          chats.map(chat => (
            <div
              key={chat.id}
              className={`group relative rounded-lg transition-colors duration-200 ${
                currentChatId === chat.id
                  ? 'bg-slate-800 text-indigo-400'
                  : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <button
                onClick={() => onSelectChat(chat.id)}
                className="w-full text-left px-3 py-2.5 flex-1 min-w-0"
              >
                <p className="text-sm font-medium truncate">{chat.title}</p>
                <p className="text-xs mt-1 opacity-60">{formatTime(chat.timestamp)}</p>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteChat(chat.id)
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-slate-700 rounded transition-all duration-150"
                aria-label="Delete chat"
              >
                <Trash2 size={16} className="text-red-400" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 p-3 text-xs text-slate-500">
        <p>ICUL — Code Explainer</p>
      </div>
    </div>
  )
})

export default Sidebar
