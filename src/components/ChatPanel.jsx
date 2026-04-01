import { Send, Loader } from 'lucide-react'
import { useState, useRef, useEffect, memo } from 'react'
import ChatMessage from './ChatMessage'

const ChatPanel = memo(function ChatPanel({
  messages,
  onSendMessage,
  loading,
  selectedModels,
  astMode,
  onAstModeChange,
}) {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (inputValue.trim() && !loading && selectedModels.length > 0) {
      onSendMessage(inputValue)
      setInputValue('')
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (inputValue.trim() && !loading && selectedModels.length > 0) {
        onSendMessage(inputValue)
        setInputValue('')
      }
    }

    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      if (inputValue.trim() && !loading && selectedModels.length > 0) {
        onSendMessage(inputValue)
        setInputValue('')
      }
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {isEmpty ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-600 to-slate-800 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🤖</span>
                </div>
              </div>
              <h2 className="text-2xl font-semibold mb-2">Start a Conversation</h2>
              <p className="text-slate-400 max-w-sm">
                Paste code below and I'll analyze it using AST parsing and an ensemble of 3 LLMs with confidence scoring.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <ChatMessage key={msg.id} message={msg} index={idx} />
          ))
        )}

        {loading && (
          <div className="flex justify-start animate-fadeIn">
            <div className="flex gap-3 items-center px-4 py-3 rounded-lg bg-slate-800/50 backdrop-blur-sm">
              <Loader size={18} className="text-indigo-400 animate-spin" />
              <span className="text-sm text-slate-300">Querying 3 models in parallel...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm p-4 md:p-6">
        {selectedModels.length === 0 && (
          <div className="mb-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-400">
            Select at least one model to send messages
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedModels.length === 0
                  ? 'Select models first...'
                  : 'Paste code to explain...'
              }
              disabled={loading || selectedModels.length === 0}
              rows={3}
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-50 placeholder-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed resize-none overflow-y-auto"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim() || selectedModels.length === 0}
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 rounded-lg transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              {loading ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>

          {/* AST Mode Toggle + Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">AST Mode:</span>
              <button
                type="button"
                onClick={() => onAstModeChange(astMode === 'with_ast' ? 'without_ast' : 'with_ast')}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                  astMode === 'with_ast'
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600/40'
                }`}
              >
                {astMode === 'with_ast' ? 'AST Enhanced' : 'Plain Prompt'}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Ensemble of 3 models • Enter to send • Shift+Enter for new line
            </p>
          </div>
        </form>
      </div>
    </div>
  )
})

export default ChatPanel
