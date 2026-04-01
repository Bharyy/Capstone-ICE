import { useState, memo } from 'react'

const TABS = ['AST', 'Prompt', 'Models', 'Voting', 'Confidence']

const DebugPanel = memo(function DebugPanel({ debug }) {
  const [activeTab, setActiveTab] = useState('AST')

  if (!debug) return null

  return (
    <div className="mt-3 rounded-lg bg-slate-900/80 border border-slate-700/50 overflow-hidden">
      {/* Tab Bar */}
      <div className="flex border-b border-slate-700/50 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-indigo-600/20 text-indigo-300 border-b-2 border-indigo-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-3 max-h-80 overflow-y-auto text-xs font-mono">
        {activeTab === 'AST' && <ASTTab debug={debug} />}
        {activeTab === 'Prompt' && <PromptTab debug={debug} />}
        {activeTab === 'Models' && <ModelsTab debug={debug} />}
        {activeTab === 'Voting' && <VotingTab debug={debug} />}
        {activeTab === 'Confidence' && <ConfidenceTab debug={debug} />}
      </div>
    </div>
  )
})

function ASTTab({ debug }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-slate-400">Language:</span>
        <span className="text-indigo-300">{debug.language || 'unknown'}</span>
        <span className="text-slate-400 ml-2">Mode:</span>
        <span className="text-indigo-300">{debug.mode}</span>
      </div>
      {debug.ast ? (
        <pre className="whitespace-pre-wrap text-slate-300 bg-slate-950/50 p-2 rounded">
          {JSON.stringify(debug.ast, null, 2)}
        </pre>
      ) : (
        <p className="text-slate-500">No AST generated (language not detected)</p>
      )}
    </div>
  )
}

function PromptTab({ debug }) {
  return (
    <div className="space-y-2">
      <p className="text-slate-400">Prompt sent to all 3 models:</p>
      <pre className="whitespace-pre-wrap text-slate-300 bg-slate-950/50 p-2 rounded leading-relaxed">
        {debug.prompt_sent}
      </pre>
    </div>
  )
}

function ModelsTab({ debug }) {
  const outputs = debug.model_outputs || []
  return (
    <div className="space-y-3">
      {outputs.map((o, i) => (
        <div key={i} className="bg-slate-950/50 p-2 rounded">
          <div className="flex items-center justify-between mb-1">
            <span className={`font-semibold ${o.error ? 'text-red-400' : 'text-green-400'}`}>
              {o.model}
            </span>
            {o.latencyMs && (
              <span className="text-slate-500">{o.latencyMs}ms</span>
            )}
          </div>
          <p className="text-slate-300 whitespace-pre-wrap line-clamp-6">
            {o.text?.slice(0, 500)}{o.text?.length > 500 ? '...' : ''}
          </p>
        </div>
      ))}
    </div>
  )
}

function VotingTab({ debug }) {
  const { ensemble } = debug
  if (!ensemble) return <p className="text-slate-500">No voting data</p>

  const models = debug.model_outputs?.filter(o => !o.error).map(o => o.model) || []

  return (
    <div className="space-y-3">
      <div>
        <span className="text-slate-400">Winner: </span>
        <span className="text-green-400 font-semibold">{ensemble.winner || 'N/A'}</span>
      </div>

      {/* Similarity Matrix */}
      {ensemble.matrix && ensemble.matrix.length > 0 && (
        <div>
          <p className="text-slate-400 mb-1">Pairwise Jaccard Similarity:</p>
          <table className="w-full text-center">
            <thead>
              <tr>
                <th className="text-slate-500 p-1"></th>
                {models.map((m, i) => (
                  <th key={i} className="text-slate-400 p-1 truncate max-w-[80px]">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ensemble.matrix.map((row, i) => (
                <tr key={i}>
                  <td className="text-slate-400 p-1 text-left truncate max-w-[80px]">{models[i]}</td>
                  {row.map((val, j) => (
                    <td key={j} className={`p-1 ${
                      i === j ? 'text-slate-600' : val > 0.5 ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {val.toFixed(3)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Average Similarities */}
      {ensemble.avgSimilarities && (
        <div>
          <p className="text-slate-400 mb-1">Average Similarity to Others:</p>
          {models.map((m, i) => (
            <div key={i} className="flex items-center gap-2 mb-1">
              <span className="text-slate-300 w-32 truncate">{m}</span>
              <div className="flex-1 bg-slate-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    i === ensemble.winnerIndex ? 'bg-green-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${(ensemble.avgSimilarities[i] || 0) * 100}%` }}
                />
              </div>
              <span className="text-slate-400 w-12 text-right">{ensemble.avgSimilarities[i]?.toFixed(3)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ConfidenceTab({ debug }) {
  const { confidence } = debug
  if (!confidence) return <p className="text-slate-500">No confidence data</p>

  const scoreColor = confidence.score >= 0.7 ? 'text-green-400'
    : confidence.score >= 0.4 ? 'text-yellow-400'
    : 'text-red-400'

  return (
    <div className="space-y-3">
      <div className="text-center">
        <p className="text-slate-400 text-sm">Overall Confidence</p>
        <p className={`text-3xl font-bold ${scoreColor}`}>
          {(confidence.score * 100).toFixed(0)}%
        </p>
      </div>

      <div className="space-y-2">
        {Object.entries(confidence.breakdown).map(([key, val]) => {
          const label = key === 'agreement' ? 'Agreement (60%)'
            : key === 'lengthConsistency' ? 'Length Consistency (20%)'
            : 'Structure Quality (20%)'
          return (
            <div key={key}>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>{label}</span>
                <span>{(val * 100).toFixed(0)}%</span>
              </div>
              <div className="bg-slate-800 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-indigo-500"
                  style={{ width: `${val * 100}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DebugPanel
