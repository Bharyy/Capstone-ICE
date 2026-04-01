/**
 * Compute a confidence score for the ensemble result.
 *
 * Weighted formula:
 *   60% agreement  — average pairwise similarity
 *   20% length consistency — 1 - (stdDev / mean) of response lengths
 *   20% structure quality — presence of code blocks, bullet points, headers
 *
 * @param {{ matrix: number[][], avgSimilarities: number[] }} voting
 * @param {string[]} texts - Raw response texts
 * @param {number} winnerIndex
 * @returns {{ score: number, breakdown: { agreement: number, lengthConsistency: number, structureQuality: number } }}
 */
export function computeConfidence(voting, texts, winnerIndex) {
  // 1) Agreement: average of avgSimilarities
  const agreement = voting.avgSimilarities.length > 0
    ? voting.avgSimilarities.reduce((a, b) => a + b, 0) / voting.avgSimilarities.length
    : 0;

  // 2) Length consistency: 1 - coefficient of variation
  const lengths = texts.map(t => t.length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, l) => sum + (l - mean) ** 2, 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 0;
  const lengthConsistency = Math.max(0, 1 - cv);

  // 3) Structure quality of the winning response
  const winner = texts[winnerIndex] || '';
  let structurePoints = 0;
  if (/```/.test(winner)) structurePoints += 0.3;       // code blocks
  if (/^[-*]\s/m.test(winner)) structurePoints += 0.25;  // bullet points
  if (/^#{1,3}\s/m.test(winner)) structurePoints += 0.2; // headers
  if (winner.length > 200) structurePoints += 0.15;      // substantive length
  if (/\d\./.test(winner)) structurePoints += 0.1;       // numbered items
  const structureQuality = Math.min(1, structurePoints);

  const score = 0.6 * agreement + 0.2 * lengthConsistency + 0.2 * structureQuality;

  return {
    score: Math.round(score * 100) / 100,
    breakdown: {
      agreement: Math.round(agreement * 100) / 100,
      lengthConsistency: Math.round(lengthConsistency * 100) / 100,
      structureQuality: Math.round(structureQuality * 100) / 100,
    },
  };
}
