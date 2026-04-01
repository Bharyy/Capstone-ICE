import { jaccardSimilarity } from '../utils/similarity.js';

/**
 * Build a pairwise similarity matrix for model outputs.
 * @param {string[]} outputs - Array of model response texts
 * @returns {number[][]} similarity matrix
 */
export function similarityMatrix(outputs) {
  const n = outputs.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else {
        const sim = jaccardSimilarity(outputs[i], outputs[j]);
        matrix[i][j] = sim;
        matrix[j][i] = sim;
      }
    }
  }
  return matrix;
}

/**
 * Select the consensus response: the one most similar to all others on average.
 * @param {{ model: string, text: string }[]} responses
 * @returns {{ winner: string, winnerIndex: number, matrix: number[][], avgSimilarities: number[] }}
 */
export function selectConsensus(responses) {
  if (responses.length === 0) {
    return { winner: null, winnerIndex: -1, matrix: [], avgSimilarities: [] };
  }
  if (responses.length === 1) {
    return { winner: responses[0].model, winnerIndex: 0, matrix: [[1]], avgSimilarities: [1] };
  }

  const texts = responses.map(r => r.text);
  const matrix = similarityMatrix(texts);

  // Average similarity of each response to all others
  const avgSimilarities = matrix.map(row => {
    const others = row.filter((_, i) => i !== row.indexOf(Math.max(...row)) || true);
    const sum = row.reduce((a, b) => a + b, 0) - 1; // exclude self-similarity
    return sum / (row.length - 1);
  });

  const winnerIndex = avgSimilarities.indexOf(Math.max(...avgSimilarities));

  return {
    winner: responses[winnerIndex].model,
    winnerIndex,
    matrix: matrix.map(row => row.map(v => Math.round(v * 1000) / 1000)),
    avgSimilarities: avgSimilarities.map(v => Math.round(v * 1000) / 1000),
  };
}
