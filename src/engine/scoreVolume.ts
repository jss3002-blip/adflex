import type { StockAnalysisInput } from "./types";
import {
  bandScore,
  clampScore,
  isFiniteNumber,
  ratioPercent,
  weightedAverageScore,
} from "./normalize";

export type VolumeScoreResult = {
  volumeRatio20d: number;
  volumeRatio10d: number;
  volumeActivityScore: number;
  volumeReliabilityScore: number;
  volumeRiskScore: number;
  volumeScore: number;
  warnings: string[];
  evidence: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
};

export type VolumeScoreContext = {
  closePositionScore?: number;
  upperWickRatio?: number;
};

export function calculateVolumeRatio(
  volume: number,
  averageVolume: number | undefined,
): number {
  if (!isFiniteNumber(averageVolume) || averageVolume <= 0) return 100;
  return ratioPercent(volume, averageVolume);
}

export function scoreVolumeActivity(volumeRatio20d: number): number {
  return bandScore(volumeRatio20d, [
    { min: Number.NEGATIVE_INFINITY, max: 49.999, score: 15 },
    { min: 50, max: 79.999, score: 35 },
    { min: 80, max: 119.999, score: 50 },
    { min: 120, max: 149.999, score: 65 },
    { min: 150, max: 199.999, score: 80 },
    { min: 200, max: 300, score: 90 },
    { min: 300.001, max: Number.POSITIVE_INFINITY, score: 95 },
  ]);
}

export function scoreVolumeReliability(
  volumeRatio20d: number,
  closePositionScore?: number,
): number {
  let score = 55;

  if (volumeRatio20d < 80) score -= 18;
  else if (volumeRatio20d >= 150) score += 12;

  if (isFiniteNumber(closePositionScore)) {
    if (volumeRatio20d >= 150 && closePositionScore >= 60) score += 18;
    if (volumeRatio20d >= 150 && closePositionScore <= 40) score -= 22;
    if (closePositionScore >= 80) score += 6;
    if (closePositionScore <= 20) score -= 8;
  }

  return clampScore(score);
}

export function scoreVolumeRisk(
  volumeRatio20d: number,
  upperWickRatio?: number,
  closePositionScore?: number,
): number {
  const hasUpperWick = isFiniteNumber(upperWickRatio);
  const hasClosePosition = isFiniteNumber(closePositionScore);

  if (
    volumeRatio20d >= 300 &&
    hasUpperWick &&
    upperWickRatio >= 35 &&
    hasClosePosition &&
    closePositionScore <= 50
  ) {
    return 88;
  }

  if (volumeRatio20d >= 200 && hasUpperWick && upperWickRatio >= 35) return 72;
  if (volumeRatio20d < 80) return 45;
  if (volumeRatio20d >= 300) return 58;
  if (volumeRatio20d >= 150) return 35;

  return 30;
}

export function scoreVolume(
  input: StockAnalysisInput,
  context: VolumeScoreContext = {},
): VolumeScoreResult {
  const warnings: string[] = [];
  const evidence: VolumeScoreResult["evidence"] = {
    positive: [],
    negative: [],
    neutral: [],
  };

  if (!isFiniteNumber(input.averageVolume20d) || input.averageVolume20d <= 0) {
    warnings.push("20일 평균 거래량이 없어 거래량 비율을 중립 기준으로 처리했습니다.");
  }

  if (!isFiniteNumber(input.averageVolume10d) || input.averageVolume10d <= 0) {
    warnings.push("10일 평균 거래량이 없어 단기 거래량 비교를 중립 기준으로 처리했습니다.");
  }

  const volumeRatio20d = calculateVolumeRatio(input.volume, input.averageVolume20d);
  const volumeRatio10d = calculateVolumeRatio(input.volume, input.averageVolume10d);
  const volumeActivityScore = scoreVolumeActivity(volumeRatio20d);
  const volumeReliabilityScore = scoreVolumeReliability(
    volumeRatio20d,
    context.closePositionScore,
  );
  const volumeRiskScore = scoreVolumeRisk(
    volumeRatio20d,
    context.upperWickRatio,
    context.closePositionScore,
  );
  const volumeScore = weightedAverageScore([
    { score: volumeActivityScore, weight: 0.45 },
    { score: volumeReliabilityScore, weight: 0.4 },
    { score: 100 - volumeRiskScore, weight: 0.15 },
  ]);

  if (
    volumeRatio20d >= 150 &&
    isFiniteNumber(context.closePositionScore) &&
    context.closePositionScore >= 60
  ) {
    evidence.positive.push("거래량이 20일 평균 대비 의미 있게 증가했고 종가 위치도 양호해 가격 신뢰도를 보강합니다.");
  } else if (volumeRatio20d >= 150) {
    evidence.neutral.push("거래량은 의미 있게 증가했지만 가격 구조 확인이 함께 필요합니다.");
  }

  if (
    volumeRatio20d >= 300 &&
    isFiniteNumber(context.upperWickRatio) &&
    context.upperWickRatio >= 35
  ) {
    evidence.negative.push("거래량이 과도하게 증가한 상태에서 윗꼬리가 커 분배성 매물 가능성을 점검해야 합니다.");
  }

  if (
    volumeRatio20d >= 150 &&
    isFiniteNumber(context.closePositionScore) &&
    context.closePositionScore <= 40
  ) {
    evidence.negative.push("거래량 증가에도 종가 위치가 약해 고점 매도 또는 약한 마감 가능성이 있습니다.");
  }

  if (volumeRatio20d < 80) {
    evidence.negative.push("20일 평균 대비 거래 참여가 약해 가격 움직임의 신뢰도가 낮을 수 있습니다.");
  } else if (volumeRatio20d >= 80 && volumeRatio20d < 120) {
    evidence.neutral.push("거래량은 평균 범위에 있어 단독으로 강한 신호로 보기 어렵습니다.");
  }

  if (volumeRatio10d >= 120 && volumeRatio20d >= 120) {
    evidence.positive.push("10일 및 20일 평균 대비 거래량이 모두 증가해 단기 관심 유입이 확인됩니다.");
  }

  return {
    volumeRatio20d,
    volumeRatio10d,
    volumeActivityScore,
    volumeReliabilityScore,
    volumeRiskScore,
    volumeScore,
    warnings,
    evidence,
  };
}
