import { parseCode } from '../parser/index.js';
import { buildPrompt } from './prompts.js';
import { getActiveModels } from './models.js';
import { selectConsensus } from '../ensemble/voting.js';
import { computeConfidence } from '../ensemble/confidence.js';

/**
 * Full explain pipeline: parse → prompt → parallel LLM calls → ensemble → confidence.
 * @param {string} code
 * @param {string} mode - "with_ast" or "without_ast"
 */
export async function explainCode(code, mode = 'with_ast') {
  // 1. Parse AST
  const { language, ast } = parseCode(code);

  // 2. Build prompt
  const prompt = buildPrompt(code, ast, language, mode);

  // 3. Get active models (dynamically resolved)
  const MODELS = await getActiveModels();

  // 4. Call all models in parallel
  console.log(`[explain] Calling ${MODELS.length} models (lang=${language}, mode=${mode})`);
  const settled = await Promise.allSettled(
    MODELS.map(async (m) => {
      const start = Date.now();
      console.log(`[explain]   -> ${m.name} starting...`);
      const text = await m.call(prompt);
      const ms = Date.now() - start;
      console.log(`[explain]   <- ${m.name} OK (${ms}ms, ${text.length} chars)`);
      return { model: m.name, modelId: m.id, text, latencyMs: ms };
    })
  );

  const model_outputs = settled.map((r, i) => {
    if (r.status === 'fulfilled') {
      return r.value;
    }
    console.log(`[explain]   X  ${MODELS[i].name} FAILED: ${r.reason?.message}`);
    return { model: MODELS[i].name, modelId: MODELS[i].id, text: `Error: ${r.reason?.message || 'Unknown error'}`, error: true };
  });

  // 5. Ensemble voting (only on successful responses)
  const successful = model_outputs.filter(o => !o.error);
  const ensemble = selectConsensus(successful);

  // 6. Confidence scoring
  const confidence = successful.length > 0
    ? computeConfidence(ensemble, successful.map(o => o.text), ensemble.winnerIndex)
    : { score: 0, breakdown: { agreement: 0, lengthConsistency: 0, structureQuality: 0 } };

  return {
    language,
    ast,
    prompt_sent: prompt,
    model_outputs,
    ensemble: {
      winner: ensemble.winner,
      winnerIndex: ensemble.winnerIndex,
      matrix: ensemble.matrix,
      avgSimilarities: ensemble.avgSimilarities,
    },
    confidence,
  };
}
