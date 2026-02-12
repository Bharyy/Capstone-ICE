import { Menu, X, Plus, Trash2 } from 'lucide-react'
import { useState, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import ChatPanel from './components/ChatPanel'
import ModelSelector from './components/ModelSelector'
import { generateAST } from '../ast/astRouter.js'

// Static model configuration
const AVAILABLE_MODELS = [
  { id: 'gemini', name: 'Gemini', color: 'bg-green-600' },
  { id: 'openrouter', name: 'OpenRouter', color: 'bg-orange-600' },
  { id: 'gpt4', name: 'GPT-4', color: 'bg-indigo-600' },
  { id: 'claude', name: 'Claude', color: 'bg-purple-600' },
  { id: 'llama', name: 'Llama 2', color: 'bg-blue-600' },
]

// ========================================
// In production, API calls should go through your backend
// to protect API keys and implement rate limiting
// ========================================

async function callGemini(prompt) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  
  if (!apiKey) {
    return 'Error: Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.'
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData?.error?.message || `API Error: ${response.status}`)
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received from Gemini.'
  } catch (error) {
    console.error('Gemini API Error:', error)
    return `Error: ${error.message}`
  }
}

async function callOpenRouter(prompt) {
  const apiKey = import.meta.env.VITE_OPENROUTER_KEY
  
  if (!apiKey) {
    return 'Error: OpenRouter API key not configured. Please set VITE_OPENROUTER_KEY in your .env file.'
  }

  try {
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Multi-LLM Chat'
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData?.error?.message || `API Error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || 'No response received from OpenRouter.'
  } catch (error) {
    console.error('OpenRouter API Error:', error)
    return `Error: ${error.message}`
  }
}

// ========================================
// Currently Gemini and OpenRouter are operational
// ========================================

async function getModelResponse(modelName, userInput) {
  switch (modelName) {
    case 'Gemini':
      return await callGemini(userInput)
    
    case 'OpenRouter':
      return await callOpenRouter(userInput)
    
    case 'GPT-4':
    case 'Claude':
    case 'Llama 2':
      // Placeholder for future implementation
      return 'Thank you for asking. This model is not operational yet.'
    
    default:
      return 'Unknown model selected.'
  }
}

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
        content: 'Hello! I\'m your multi-LLM assistant. You can select multiple models and chat with them simultaneously. How can I help you today?',
        timestamp: Date.now() - 3600000,
      }
    ]
  })
  const [selectedModels, setSelectedModels] = useState(['Gemini'])
  const [loading, setLoading] = useState(false)

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

    // Generate AST for the user's input
    const { language, ast } = generateAST(content)

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
      // ========================================
      // Parallel Model Execution with AST
      // Generate AST and send to both Gemini and OpenRouter
      // ========================================
      
      // Create enhanced prompt with AST
      const enhancedPrompt = language !== 'none' && language !== 'unknown'
        ? `${content}\n\n${ast}\n\nPlease analyze the code above along with its AST structure.`
        : content;

      const modelPromises = selectedModels.map(async (modelName) => {
        const response = await getModelResponse(modelName, enhancedPrompt)
        return { modelName, response, ast, language }
      })

      const results = await Promise.all(modelPromises)

      // Add all model responses to messages with AST info
      setMessages(prev => ({
        ...prev,
        [currentChatId]: [
          ...prev[currentChatId],
          ...results.map(({ modelName, response, ast, language }, index) => ({
            id: `${Date.now()}-${index}`,
            role: 'assistant',
            content: response,
            model: modelName,
            ast: language !== 'none' && language !== 'unknown' ? ast : null,
            language,
            timestamp: Date.now(),
          }))
        ]
      }))
    } catch (error) {
      console.error('Error getting model responses:', error)
      // Add error message
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
  }, [currentChatId, selectedModels])

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

          <h1 className="text-lg font-semibold hidden md:block">Multi-LLM Chat</h1>

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


