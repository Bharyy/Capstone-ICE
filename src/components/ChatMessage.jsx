import { memo, useState } from 'react'

const ChatMessage = memo(function ChatMessage({ message, index }) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const [showAST, setShowAST] = useState(false)

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
              : message.model === 'OpenRouter'
              ? 'bg-orange-600 text-white'
              : 'bg-green-600 text-white'
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

        {/* Model Badge and AST Info for Assistant Messages */}
        {isAssistant && message.model && (
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <div className="flex items-center justify-between">
              <p className="text-xs opacity-70 font-medium">{message.model}</p>
              {message.ast && (
                <button
                  onClick={() => setShowAST(!showAST)}
                  className="text-xs px-2 py-1 rounded bg-slate-700/50 hover:bg-slate-700 transition-colors"
                >
                  {showAST ? 'Hide' : 'Show'} AST
                </button>
              )}
            </div>
            
            {message.language && message.language !== 'none' && (
              <p className="text-xs opacity-60 mt-1">
                Language: {message.language}
              </p>
            )}

            {showAST && message.ast && (
              <div className="mt-2 p-2 rounded bg-slate-900/50 text-xs font-mono overflow-x-auto">
                <pre className="whitespace-pre-wrap text-slate-300">{message.ast}</pre>
              </div>
            )}
          </div>
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




