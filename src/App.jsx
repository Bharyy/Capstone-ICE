import { Menu, X, Plus } from 'lucide-react'
import { useState, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import ChatPanel from './components/ChatPanel'
import ModelSelector from './components/ModelSelector'
import { explainCode } from './api/client.js'

// Static model configuration (display only — actual LLM calls happen server-side)
const AVAILABLE_MODELS = [
  { id: 'gemini', name: 'Gemini', color: 'bg-green-600' },
  { id: 'openrouter', name: 'OpenRouter', color: 'bg-orange-600' },
  { id: 'gpt4', name: 'GPT-4', color: 'bg-indigo-600' },
  { id: 'claude', name: 'Claude', color: 'bg-purple-600' },
  { id: 'llama', name: 'Llama 2', color: 'bg-blue-600' },
]

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [chats, setChats] = useState([
    { id: '1', title: 'Getting Started with AI', timestamp: Date.now() - 86400000 }
  ])
  const [currentChatId, setCurrentChatId] = useState('1')
  const [messages, setMessages] = useState({
    '1': [
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m your multi-LLM code explainer. Paste some code and I\'ll analyze it using AST parsing and an ensemble of 3 models. How can I help you today?',
        timestamp: Date.now() - 3600000,
      }
    ]
  })
  const [selectedModels, setSelectedModels] = useState(['Gemini'])
  const [loading, setLoading] = useState(false)
  const [astMode, setAstMode] = useState('with_ast')

  const createNewChat = useCallback(() => {
    const newId = Date.now().toString()
    const newChat = {
      id: newId,
      title: 'New Chat',
      timestamp: Date.now()
    }
    setChats(prev => [newChat, ...prev])
    setMessages(prev => ({ ...prev, [newId]: [] }))
    setCurrentChatId(newId)
  }, [])

  const deleteChat = useCallback((chatId) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId))
    setMessages(prev => {
      const updated = { ...prev }
      delete updated[chatId]
      return updated
    })

    if (currentChatId === chatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatId)
      if (remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].id)
      }
    }
  }, [currentChatId, chats])

  const handleSendMessage = useCallback(async (content) => {
    if (!content.trim() || selectedModels.length === 0) return

    // Add user message
    setMessages(prev => ({
      ...prev,
      [currentChatId]: [...(prev[currentChatId] || []), {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: Date.now(),
      }]
    }))

    // Update chat title if first message
    setChats(prev => prev.map(chat =>
      chat.id === currentChatId && chat.title === 'New Chat'
        ? { ...chat, title: content.slice(0, 30) + (content.length > 30 ? '...' : '') }
        : chat
    ))

    setLoading(true)

    try {
      // Call backend ensemble pipeline
      const result = await explainCode(content, astMode)

      // The ensemble winner is the primary response
      const winnerOutput = result.model_outputs[result.ensemble.winnerIndex]
      const primaryContent = winnerOutput?.text || 'No response received.'

      // Add ensemble response as a single assistant message with debug data attached
      setMessages(prev => ({
        ...prev,
        [currentChatId]: [
          ...prev[currentChatId],
          {
            id: `${Date.now()}-ensemble`,
            role: 'assistant',
            content: primaryContent,
            model: `Ensemble (${result.ensemble.winner})`,
            timestamp: Date.now(),
            // Debug data for the DebugPanel
            debug: {
              language: result.language,
              ast: result.ast,
              prompt_sent: result.prompt_sent,
              model_outputs: result.model_outputs,
              ensemble: result.ensemble,
              confidence: result.confidence,
              mode: astMode,
            },
          }
        ]
      }))
    } catch (error) {
      console.error('Error getting response:', error)
      setMessages(prev => ({
        ...prev,
        [currentChatId]: [...prev[currentChatId], {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Error: ${error.message}`,
          model: 'System',
          timestamp: Date.now(),
        }]
      }))
    } finally {
      setLoading(false)
    }
  }, [currentChatId, selectedModels, astMode])

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50">
      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'w-64' : 'w-0'
      } transition-all duration-300 flex-shrink-0 border-r border-slate-800`}>
        {sidebarOpen && (
          <Sidebar
            chats={chats}
            currentChatId={currentChatId}
            onSelectChat={setCurrentChatId}
            onCreateChat={createNewChat}
            onDeleteChat={deleteChat}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-14 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm flex items-center justify-between px-4 md:px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors lg:hidden"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <h1 className="text-lg font-semibold hidden md:block">ICUL — Intelligent Code Explainer</h1>

          <div className="flex-1" />

          <button
            onClick={createNewChat}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="New chat"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex overflow-hidden">
          <ChatPanel
            messages={messages[currentChatId] || []}
            onSendMessage={handleSendMessage}
            loading={loading}
            selectedModels={selectedModels}
            astMode={astMode}
            onAstModeChange={setAstMode}
          />

          {/* Model Selector Sidebar */}
          <div className="w-64 border-l border-slate-800 bg-slate-900/30 backdrop-blur-sm hidden lg:block overflow-y-auto">
            <ModelSelector
              availableModels={AVAILABLE_MODELS}
              selectedModels={selectedModels}
              onToggleModel={(modelName) => {
                setSelectedModels(prev =>
                  prev.includes(modelName)
                    ? prev.filter(m => m !== modelName)
                    : [...prev, modelName]
                )
              }}
            />
          </div>
        </div>

        {/* Mobile Model Selector */}
        <div className="lg:hidden border-t border-slate-800 bg-slate-900/30 backdrop-blur-sm max-h-32 overflow-y-auto">
          <ModelSelector
            availableModels={AVAILABLE_MODELS}
            selectedModels={selectedModels}
            onToggleModel={(modelName) => {
              setSelectedModels(prev =>
                prev.includes(modelName)
                  ? prev.filter(m => m !== modelName)
                  : [...prev, modelName]
              )
            }}
            compact
          />
        </div>
      </div>
    </div>
  )
}
