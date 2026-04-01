/**
 * Call an OpenRouter model.
 * @param {string} prompt
 * @param {string} model - Model ID (e.g. "google/gemma-3-27b-it:free")
 * @returns {Promise<string>}
 */
export async function callOpenRouter(prompt, model) {
  const apiKey = process.env.OPENROUTER_KEY;
  if (!apiKey) throw new Error('OPENROUTER_KEY not configured');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'ICUL Code Explainer',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err?.error?.message || `OpenRouter API error: ${response.status}`;
    const code = err?.error?.code;
    throw new Error(code === 429 ? `${model} rate-limited: ${msg}` : msg);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response from OpenRouter.';
}
