import { memo } from 'react'

const ChatMessage = memo(function ChatMessage({ message, index }) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  return (
    <div
      className={`flex gap-3 message-enter ${isUser ? 'justify-end' : 'justify-start'}`}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* Avatar */}
      {isAssistant && (
        <div className="flex-shrink-0 mt-0.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            message.model === 'GPT-4'
              ? 'bg-indigo-600 text-white'
              : message.model === 'Claude'
              ? 'bg-purple-600 text-white'
              : message.model === 'Llama 2'
              ? 'bg-blue-600 text-white'
              : 'bg-orange-600 text-white'
          }`}>
            {message.model ? message.model.charAt(0) : '🤖'}
          </div>
        </div>
      )}

      {/* Message Content */}
      <div
        className={`max-w-xl md:max-w-2xl px-4 py-3 rounded-lg ${
          isUser
            ? 'bg-indigo-600 text-white rounded-br-none'
            : 'bg-slate-800 text-slate-50 rounded-bl-none'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

        {/* Model Badge for Assistant Messages */}
        {isAssistant && message.model && (
          <p className="text-xs mt-2 opacity-70 font-medium">{message.model}</p>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
            U
          </div>
        </div>
      )}
    </div>
  )
})

export default ChatMessage



