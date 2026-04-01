import { memo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import DebugPanel from './DebugPanel'

const ChatMessage = memo(function ChatMessage({ message, index }) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const [showDebug, setShowDebug] = useState(false)

  return (
    <div
      className={`flex gap-3 message-enter ${isUser ? 'justify-end' : 'justify-start'}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Assistant Avatar */}
      {isAssistant && (
        <div className="flex-shrink-0 mt-0.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            message.model?.includes('Ensemble')
              ? 'bg-gradient-to-br from-indigo-600 to-green-600 text-white'
              : 'bg-green-600 text-white'
          }`}>
            {message.model?.includes('Ensemble') ? 'E' : message.model ? message.model.charAt(0) : 'A'}
          </div>
        </div>
      )}

      {/* Message Content */}
      <div className={`max-w-xl md:max-w-2xl lg:max-w-4xl px-4 py-3 rounded-lg ${
        isUser
          ? 'bg-indigo-600 text-white rounded-br-none'
          : 'bg-slate-800 text-slate-50 rounded-bl-none'
      }`}>

        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose-custom">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Model Badge + Debug Toggle */}
        {isAssistant && message.model && (
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs opacity-70 font-medium">{message.model}</span>
                {message.debug?.confidence && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    message.debug.confidence.score >= 0.7
                      ? 'bg-green-500/20 text-green-400'
                      : message.debug.confidence.score >= 0.4
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {(message.debug.confidence.score * 100).toFixed(0)}% confidence
                  </span>
                )}
              </div>
              {message.debug && (
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="text-xs px-2 py-1 rounded bg-slate-700/50 hover:bg-slate-700 transition-colors"
                >
                  {showDebug ? 'Hide' : 'Show'} Internal Processing
                </button>
              )}
            </div>

            {showDebug && message.debug && (
              <DebugPanel debug={message.debug} />
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
