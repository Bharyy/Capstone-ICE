import { callOpenRouter } from './openrouter.js';

// Ranked preference list — models known to produce quality code explanations.
// The system picks the top N available free models from this list at runtime.
const PREFERRED_FREE_MODELS = [
  'google/gemma-3-27b-it:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'qwen/qwen3-coder:free',
  'google/gemma-3-12b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'openai/gpt-oss-120b:free',
  'openai/gpt-oss-20b:free',
];

const OPENROUTER_MODELS_COUNT = 2;
let cachedFreeIds = null;
let cachedModels = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch the full list of free model IDs from OpenRouter.
 */
async function fetchFreeModelIds() {
  const apiKey = process.env.OPENROUTER_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!res.ok) return [];

    const data = await res.json();
    return data.data
      .filter(m => m.pricing?.prompt === '0' && m.pricing?.completion === '0')
      .map(m => m.id);
  } catch (err) {
    console.error('[models] Failed to fetch OpenRouter models:', err.message);
    return [];
  }
}

/**
 * Pick top N models from the preference list that exist in the free set.
 */
function pickModels(freeIds, count, exclude = []) {
  const freeSet = new Set(freeIds);
  const excludeSet = new Set(exclude);
  const selected = [];

  // First pass: preference list
  for (const id of PREFERRED_FREE_MODELS) {
    if (freeSet.has(id) && !excludeSet.has(id)) {
      selected.push(id);
      if (selected.length >= count) return selected;
    }
  }

  // Second pass: any remaining free model (skip tiny ones)
  for (const id of freeIds) {
    if (!selected.includes(id) && !excludeSet.has(id) && !id.includes('1.2b') && !id.includes('3b')) {
      selected.push(id);
      if (selected.length >= count) return selected;
    }
  }

  return selected;
}

/**
 * Create an OpenRouter model caller with automatic fallback on 429/rate-limit.
 */
function makeOpenRouterCaller(primaryId, freeIds) {
  return async (prompt) => {
    try {
      return await callOpenRouter(prompt, primaryId);
    } catch (err) {
      if (err.message.includes('rate-limit') || err.message.includes('429')) {
        // Find a fallback model
        const usedIds = cachedModels ? cachedModels.map(m => m.id) : [primaryId];
        const fallbacks = pickModels(freeIds, 1, usedIds);
        if (fallbacks.length > 0) {
          console.log(`[models] ${primaryId} rate-limited, falling back to ${fallbacks[0]}`);
          return await callOpenRouter(prompt, fallbacks[0]);
        }
      }
      throw err;
    }
  };
}

/**
 * Get the active model configs for the ensemble pipeline.
 * Gemini is always included. OpenRouter models are dynamically selected.
 */
export async function getActiveModels() {
  const now = Date.now();
  if (cachedModels && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedModels;
  }

  console.log('[models] Refreshing available free models from OpenRouter...');
  const freeIds = await fetchFreeModelIds();
  cachedFreeIds = freeIds;
  const orModels = pickModels(freeIds, OPENROUTER_MODELS_COUNT);
  console.log('[models] Selected OpenRouter models:', orModels);

  const models = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', call: (prompt) => callGeminiDynamic(prompt) },
  ];

  for (const id of orModels) {
    const shortName = id.split('/').pop().replace(/:free$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    models.push({
      id,
      name: shortName,
      call: makeOpenRouterCaller(id, freeIds),
    });
  }

  cachedModels = models;
  cacheTimestamp = now;
  return models;
}

// Lazy import to avoid circular dependency
let _callGemini = null;
async function callGeminiDynamic(prompt) {
  if (!_callGemini) {
    const mod = await import('./gemini.js');
    _callGemini = mod.callGemini;
  }
  return _callGemini(prompt);
}
