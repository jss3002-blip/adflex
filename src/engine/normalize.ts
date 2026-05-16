export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function clamp(value: unknown, min: number, max: number): number {
  if (!isFiniteNumber(value)) return min;
  return Math.min(Math.max(value, min), max);
}

export function clampScore(score: unknown): number {
  if (!isFiniteNumber(score)) return 50;
  return clamp(score, 0, 100);
}

export function safeDivide(
  numerator: unknown,
  denominator: unknown,
  fallback: number,
): number {
  if (!isFiniteNumber(numerator) || !isFiniteNumber(denominator) || denominator === 0) {
    return fallback;
  }
  return numerator / denominator;
}

export function percentChange(current: unknown, base: unknown): number {
  if (!isFiniteNumber(current) || !isFiniteNumber(base) || base === 0) return 0;
  return ((current - base) / base) * 100;
}

export function ratioPercent(value: unknown, base: unknown): number {
  if (!isFiniteNumber(value) || !isFiniteNumber(base) || base === 0) return 0;
  return (value / base) * 100;
}

export function linearScore(
  value: unknown,
  minValue: number,
  maxValue: number,
  minScore = 0,
  maxScore = 100,
): number {
  if (
    !isFiniteNumber(value) ||
    !isFiniteNumber(minValue) ||
    !isFiniteNumber(maxValue) ||
    !isFiniteNumber(minScore) ||
    !isFiniteNumber(maxScore) ||
    maxValue === minValue
  ) {
    return 50;
  }

  const ratio = (value - minValue) / (maxValue - minValue);
  return clampScore(minScore + ratio * (maxScore - minScore));
}

export function inverseLinearScore(
  value: unknown,
  minValue: number,
  maxValue: number,
  minScore = 0,
  maxScore = 100,
): number {
  if (
    !isFiniteNumber(value) ||
    !isFiniteNumber(minValue) ||
    !isFiniteNumber(maxValue) ||
    !isFiniteNumber(minScore) ||
    !isFiniteNumber(maxScore) ||
    maxValue === minValue
  ) {
    return 50;
  }

  const ratio = (value - minValue) / (maxValue - minValue);
  return clampScore(maxScore - ratio * (maxScore - minScore));
}

export function bandScore(
  value: unknown,
  bands: Array<{ min: number; max: number; score: number }>,
  fallbackScore = 50,
): number {
  if (!isFiniteNumber(value)) return clampScore(fallbackScore);

  const matched = bands.find((band) => {
    return (
      isFiniteNumber(band.min) &&
      isFiniteNumber(band.max) &&
      isFiniteNumber(band.score) &&
      value >= band.min &&
      value <= band.max
    );
  });

  return clampScore(matched ? matched.score : fallbackScore);
}

export function weightedAverageScore(
  items: Array<{ score: number; weight: number }>,
  fallbackScore = 50,
): number {
  let weightedTotal = 0;
  let totalWeight = 0;

  for (const item of items) {
    if (!isFiniteNumber(item.score) || !isFiniteNumber(item.weight) || item.weight <= 0) {
      continue;
    }

    weightedTotal += clampScore(item.score) * item.weight;
    totalWeight += item.weight;
  }

  if (totalWeight === 0) return clampScore(fallbackScore);
  return clampScore(weightedTotal / totalWeight);
}

export function calculateClosePositionScore(
  high: unknown,
  low: unknown,
  close: unknown,
): number {
  if (!isFiniteNumber(high) || !isFiniteNumber(low) || !isFiniteNumber(close) || high <= low) {
    return 50;
  }

  return clampScore(((close - low) / (high - low)) * 100);
}

export function calculateUpperWickRatio(
  open: unknown,
  high: unknown,
  low: unknown,
  close: unknown,
): number {
  if (
    !isFiniteNumber(open) ||
    !isFiniteNumber(high) ||
    !isFiniteNumber(low) ||
    !isFiniteNumber(close) ||
    high <= low
  ) {
    return 0;
  }

  const upperWick = high - Math.max(open, close);
  const fullRange = high - low;
  return clampScore((upperWick / fullRange) * 100);
}

export function calculateLowerWickRatio(
  open: unknown,
  high: unknown,
  low: unknown,
  close: unknown,
): number {
  if (
    !isFiniteNumber(open) ||
    !isFiniteNumber(high) ||
    !isFiniteNumber(low) ||
    !isFiniteNumber(close) ||
    high <= low
  ) {
    return 0;
  }

  const lowerWick = Math.min(open, close) - low;
  const fullRange = high - low;
  return clampScore((lowerWick / fullRange) * 100);
}

export function calculate52WeekPositionScore(
  currentPrice: unknown,
  week52High: unknown,
  week52Low: unknown,
): number {
  if (
    !isFiniteNumber(currentPrice) ||
    !isFiniteNumber(week52High) ||
    !isFiniteNumber(week52Low) ||
    week52High <= week52Low
  ) {
    return 50;
  }

  return clampScore(((currentPrice - week52Low) / (week52High - week52Low)) * 100);
}

export function calculateVwapDistancePercent(price: unknown, vwap: unknown): number {
  if (!isFiniteNumber(price) || !isFiniteNumber(vwap) || vwap === 0) return 0;
  return ((price - vwap) / vwap) * 100;
}
