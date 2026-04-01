/**
 * Tokenize text into lowercase word tokens.
 */
function tokenize(text) {
  return text.toLowerCase().match(/\b\w+\b/g) || [];
}

/**
 * Jaccard similarity between two strings (0-1).
 * |A ∩ B| / |A ∪ B|
 */
export function jaccardSimilarity(a, b) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 && setB.size === 0) return 1;

  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
