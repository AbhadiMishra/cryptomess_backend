export function sanitizeVector(input) {
  if (!input) {
    return null;
  }

  let source = input;

  if (typeof input === "string") {
    try {
      source = JSON.parse(input);
    } catch {
      return null;
    }
  }

  if (!Array.isArray(source) || source.length === 0) {
    return null;
  }

  const vector = source.map(Number).filter((value) => Number.isFinite(value));

  return vector.length ? vector : null;
}

export function generateDummyVector(length = 16) {
  return Array.from({ length }, () => Math.random());
}

export function cosineSimilarity(a = [], b = []) {
  const maxLength = Math.min(a.length, b.length);
  if (!maxLength) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < maxLength; i += 1) {
    const valueA = Number(a[i]);
    const valueB = Number(b[i]);

    if (!Number.isFinite(valueA) || !Number.isFinite(valueB)) {
      continue;
    }

    dot += valueA * valueB;
    normA += valueA * valueA;
    normB += valueB * valueB;
  }

  if (!normA || !normB) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
