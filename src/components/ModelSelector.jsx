import { memo } from 'react'

const ModelSelector = memo(function ModelSelector({
  availableModels,
  selectedModels,
  onToggleModel,
  compact = false,
}) {
  return (
    <div className={compact ? 'p-4' : 'p-6'}>
      <h3 className={`${compact ? 'text-sm' : 'text-lg'} font-semibold mb-4 text-slate-200`}>
        LLM Models
      </h3>

      <div className={compact ? 'flex flex-wrap gap-2' : 'space-y-3'}>
        {availableModels.map(model => {
          const isSelected = selectedModels.includes(model.name)

          return (
            <label
              key={model.id}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                compact
                  ? `flex-1 min-w-[120px] justify-center ${
                      isSelected
                        ? 'bg-slate-700 ring-2 ring-indigo-500'
                        : 'bg-slate-800/50 hover:bg-slate-800'
                    }`
                  : isSelected
                  ? 'bg-slate-800 ring-2 ring-indigo-500'
                  : 'bg-slate-800/50 hover:bg-slate-800'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleModel(model.name)}
                className="w-4 h-4 accent-indigo-500 cursor-pointer"
              />
              <div className={compact ? 'hidden' : 'flex items-center gap-2 flex-1'}>
                <div className={`w-2 h-2 rounded-full ${model.color}`} />
                <span className="text-sm font-medium">{model.name}</span>
              </div>
              {compact && (
                <div className="text-xs font-medium">{model.name}</div>
              )}
            </label>
          )
        })}
      </div>

      {selectedModels.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
          <p className="text-xs text-indigo-400 font-medium">
            ✨ {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </div>
  )
})

export default ModelSelector
