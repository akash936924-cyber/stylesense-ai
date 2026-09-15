/** Pure vector math for similarity ranking (pgvector does this in-DB later). */

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function topKBySimilarity<T>(
  query: number[],
  candidates: { item: T; embedding: number[] }[],
  k: number,
): { item: T; score: number }[] {
  return candidates
    .map(({ item, embedding }) => ({ item, score: cosineSimilarity(query, embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
