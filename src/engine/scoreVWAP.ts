import type { StockAnalysisInput } from "./types";
import {
  calculateVwapDistancePercent,
  clampScore,
  isFiniteNumber,
  weightedAverageScore,
} from "./normalize";

export type VWAPScoreResult = {
  hasVwap: boolean;
  vwapDistancePercent: number;
  vwapPositionScore: number;
  vwapReliabilityScore: number;
  vwapRiskScore: number;
  vwapScore: number;
  isAboveVwap: boolean;
  isNearVwap: boolean;
  warnings: string[];
  evidence: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
};

export type VWAPScoreContext = {
  closePositionScore?: number;
  upperWickRatio?: number;
  volumeRatio20d?: number;
};

export function scoreVwapPosition(vwapDistancePercent: number): number {
  if (!isFiniteNumber(vwapDistancePercent)) return 50;

  if (vwapDistancePercent < -3) return 25;
  if (vwapDistancePercent < -1) return 40;
  if (vwapDistancePercent <= 1) return 55;
  if (vwapDistancePercent <= 3) return 70;
  if (vwapDistancePercent <= 7) return 82;
  return 74;
}

export function scoreVwapReliability(
  vwapDistancePercent: number,
  closePositionScore?: number,
  volumeRatio20d?: number,
): number {
  if (!isFiniteNumber(vwapDistancePercent)) return 50;

  let score = 50;
  const isAboveVwap = vwapDistancePercent > 0;
  const isNearVwap = vwapDistancePercent >= -1 && vwapDistancePercent <= 1;

  if (isAboveVwap) score += 10;
  if (vwapDistancePercent < -1) score -= 10;
  if (isNearVwap) score += 2;

  if (isFiniteNumber(closePositionScore)) {
    if (isAboveVwap && closePositionScore >= 70) score += 16;
    if (isAboveVwap && closePositionScore <= 40) score -= 16;
    if (vwapDistancePercent < 0 && closePositionScore <= 40) score -= 14;
  }

  if (isFiniteNumber(volumeRatio20d)) {
    if (isAboveVwap && volumeRatio20d >= 150) score += 12;
    if (volumeRatio20d < 80) score -= 8;
  }

  return clampScore(score);
}

export function scoreVwapRisk(
  vwapDistancePercent: number,
  upperWickRatio?: number,
  closePositionScore?: number,
): number {
  if (!isFiniteNumber(vwapDistancePercent)) return 50;

  const hasUpperWick = isFiniteNumber(upperWickRatio);
  const hasClosePosition = isFiniteNumber(closePositionScore);

  if (vwapDistancePercent < 0 && hasClosePosition && closePositionScore <= 40) {
    return 72;
  }

  if (
    vwapDistancePercent > 0 &&
    hasUpperWick &&
    upperWickRatio >= 35 &&
    hasClosePosition &&
    closePositionScore <= 50
  ) {
    return 76;
  }

  if (vwapDistancePercent > 7) return 62;
  if (vwapDistancePercent < -3) return 58;
  if (vwapDistancePercent >= -1 && vwapDistancePercent <= 1) return 35;

  return 42;
}

export function scoreVWAP(
  input: StockAnalysisInput,
  context: VWAPScoreContext = {},
): VWAPScoreResult {
  const warnings: string[] = [];
  const evidence: VWAPScoreResult["evidence"] = {
    positive: [],
    negative: [],
    neutral: [],
  };

  if (!isFiniteNumber(input.vwap) || input.vwap <= 0) {
    warnings.push("VWAP 데이터가 없어 VWAP 관련 점수를 중립값으로 처리했습니다.");
    evidence.neutral.push("VWAP가 없어 가격 위치 판단은 다른 가격·거래량 지표와 함께 확인해야 합니다.");

    return {
      hasVwap: false,
      vwapDistancePercent: 0,
      vwapPositionScore: 50,
      vwapReliabilityScore: 50,
      vwapRiskScore: 50,
      vwapScore: 50,
      isAboveVwap: false,
      isNearVwap: false,
      warnings,
      evidence,
    };
  }

  const vwapDistancePercent = calculateVwapDistancePercent(input.currentPrice, input.vwap);
  const vwapPositionScore = scoreVwapPosition(vwapDistancePercent);
  const vwapReliabilityScore = scoreVwapReliability(
    vwapDistancePercent,
    context.closePositionScore,
    context.volumeRatio20d,
  );
  const vwapRiskScore = scoreVwapRisk(
    vwapDistancePercent,
    context.upperWickRatio,
    context.closePositionScore,
  );
  const vwapScore = weightedAverageScore([
    { score: vwapPositionScore, weight: 0.45 },
    { score: vwapReliabilityScore, weight: 0.35 },
    { score: 100 - vwapRiskScore, weight: 0.2 },
  ]);
  const isAboveVwap = vwapDistancePercent > 0;
  const isNearVwap = vwapDistancePercent >= -1 && vwapDistancePercent <= 1;

  if (
    isAboveVwap &&
    isFiniteNumber(context.closePositionScore) &&
    context.closePositionScore >= 70
  ) {
    evidence.positive.push("가격이 VWAP 위에 있고 종가 위치도 강해 매수 우위 흐름이 유지되는지 확인할 수 있습니다.");
  } else if (isAboveVwap) {
    evidence.positive.push("가격이 VWAP 위에 있어 평균 체결가 대비 우위 상태입니다.");
  }

  if (isAboveVwap && isFiniteNumber(context.volumeRatio20d) && context.volumeRatio20d >= 150) {
    evidence.positive.push("VWAP 상단 흐름에 의미 있는 거래량 증가가 동반되어 신호 신뢰도를 보강합니다.");
  }

  if (!isAboveVwap && !isNearVwap) {
    evidence.negative.push("가격이 VWAP 아래에 있어 매도 압력 또는 평균 단가 하회 상태를 점검해야 합니다.");
  }

  if (
    isAboveVwap &&
    isFiniteNumber(context.upperWickRatio) &&
    context.upperWickRatio >= 35 &&
    isFiniteNumber(context.closePositionScore) &&
    context.closePositionScore <= 50
  ) {
    evidence.negative.push("VWAP 위에 있어도 윗꼬리와 약한 종가가 함께 나타나면 가짜 강세 가능성을 점검해야 합니다.");
  }

  if (vwapDistancePercent > 7) {
    evidence.neutral.push("가격이 VWAP에서 크게 벌어져 강한 흐름과 추격 과열 위험을 함께 확인해야 합니다.");
  }

  if (isNearVwap) {
    evidence.neutral.push("가격이 VWAP 근처에 있어 방향성 확정보다는 추가 흐름 확인이 필요합니다.");
  }

  return {
    hasVwap: true,
    vwapDistancePercent,
    vwapPositionScore,
    vwapReliabilityScore,
    vwapRiskScore,
    vwapScore,
    isAboveVwap,
    isNearVwap,
    warnings,
    evidence,
  };
}
