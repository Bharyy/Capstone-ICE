const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

/**
 * Full explain pipeline: AST → prompts → 3 LLMs → ensemble → confidence.
 * @param {string} code
 * @param {string} mode - "with_ast" or "without_ast"
 */
export function explainCode(code, mode = 'with_ast') {
  return request('/explain', {
    method: 'POST',
    body: JSON.stringify({ code, mode }),
  });
}
