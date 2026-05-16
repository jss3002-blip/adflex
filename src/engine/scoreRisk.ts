import { isFiniteNumber, weightedAverageScore } from "./normalize";

export type RiskScoreContext = {
  closePositionScore?: number;
  upperWickRatio?: number;
  lowerWickRatio?: number;
  intradayRangePercent?: number;
  previousCloseChangePercent?: number;
  week52PositionScore?: number;
  volumeRatio20d?: number;
  volumeRiskScore?: number;
  vwapDistancePercent?: number;
  vwapRiskScore?: number;
  isAboveVwap?: boolean;
  isNearVwap?: boolean;
};

export type RiskScoreResult = {
  overheatingRiskScore: number;
  volatilityRiskScore: number;
  distributionRiskScore: number;
  vwapBreakdownRiskScore: number;
  lowLiquidityOrWeakParticipationRiskScore: number;
  trendCollapseRiskScore: number;
  riskScore: number;
  warnings: string[];
  evidence: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
};

export function scoreOverheatingRisk(context: RiskScoreContext): number {
  const { week52PositionScore, previousCloseChangePercent, upperWickRatio, vwapDistancePercent } =
    context;

  if (
    isFiniteNumber(week52PositionScore) &&
    week52PositionScore >= 90 &&
    isFiniteNumber(upperWickRatio) &&
    upperWickRatio >= 35
  ) {
    return 82;
  }

  if (isFiniteNumber(vwapDistancePercent) && vwapDistancePercent >= 7) return 70;

  if (
    isFiniteNumber(week52PositionScore) &&
    week52PositionScore >= 90 &&
    isFiniteNumber(previousCloseChangePercent) &&
    previousCloseChangePercent >= 5
  ) {
    return 68;
  }

  if (isFiniteNumber(week52PositionScore) && week52PositionScore >= 90) return 48;
  if (isFiniteNumber(previousCloseChangePercent) && previousCloseChangePercent >= 5) return 45;

  return 25;
}

export function scoreVolatilityRisk(context: RiskScoreContext): number {
  const { intradayRangePercent } = context;

  if (!isFiniteNumber(intradayRangePercent)) return 50;
  if (intradayRangePercent >= 12) return 88;
  if (intradayRangePercent >= 8) return 70;
  if (intradayRangePercent >= 5) return 52;
  if (intradayRangePercent >= 3) return 38;
  return 25;
}

export function scoreDistributionRisk(context: RiskScoreContext): number {
  const { volumeRatio20d, upperWickRatio, closePositionScore } = context;

  if (
    isFiniteNumber(volumeRatio20d) &&
    volumeRatio20d >= 250 &&
    isFiniteNumber(upperWickRatio) &&
    upperWickRatio >= 40 &&
    isFiniteNumber(closePositionScore) &&
    closePositionScore <= 45
  ) {
    return 90;
  }

  if (
    isFiniteNumber(volumeRatio20d) &&
    volumeRatio20d >= 180 &&
    isFiniteNumber(upperWickRatio) &&
    upperWickRatio >= 35 &&
    isFiniteNumber(closePositionScore) &&
    closePositionScore <= 55
  ) {
    return 78;
  }

  if (
    isFiniteNumber(volumeRatio20d) &&
    volumeRatio20d >= 130 &&
    isFiniteNumber(upperWickRatio) &&
    upperWickRatio >= 45 &&
    isFiniteNumber(closePositionScore) &&
    closePositionScore <= 40
  ) {
    return 68;
  }

  if (
    isFiniteNumber(closePositionScore) &&
    closePositionScore <= 20 &&
    isFiniteNumber(volumeRatio20d) &&
    volumeRatio20d >= 150
  ) {
    return 68;
  }

  if (
    isFiniteNumber(upperWickRatio) &&
    upperWickRatio >= 35 &&
    isFiniteNumber(volumeRatio20d) &&
    volumeRatio20d >= 120
  ) {
    return 48;
  }

  return 28;
}

export function scoreVwapBreakdownRisk(context: RiskScoreContext): number {
  const { isAboveVwap, isNearVwap, closePositionScore, vwapDistancePercent, upperWickRatio } =
    context;

  if (isAboveVwap === false && isFiniteNumber(closePositionScore) && closePositionScore <= 40) {
    return 76;
  }

  if (
    isAboveVwap === false &&
    isFiniteNumber(vwapDistancePercent) &&
    vwapDistancePercent <= -3
  ) {
    return 72;
  }

  if (
    isAboveVwap === true &&
    isFiniteNumber(upperWickRatio) &&
    upperWickRatio >= 35 &&
    isFiniteNumber(closePositionScore) &&
    closePositionScore <= 50
  ) {
    return 70;
  }

  if (isNearVwap === true) return 42;
  if (isAboveVwap === true) return 25;
  if (isAboveVwap === false) return 55;
  return 50;
}

export function scoreLowLiquidityOrWeakParticipationRisk(context: RiskScoreContext): number {
  const { volumeRatio20d } = context;

  if (!isFiniteNumber(volumeRatio20d)) return 50;
  if (volumeRatio20d < 50) return 78;
  if (volumeRatio20d < 80) return 58;
  return 24;
}

export function scoreTrendCollapseRisk(context: RiskScoreContext): number {
  const { week52PositionScore, closePositionScore, previousCloseChangePercent, isAboveVwap } =
    context;

  if (
    isFiniteNumber(closePositionScore) &&
    closePositionScore <= 20 &&
    isAboveVwap === false &&
    isFiniteNumber(previousCloseChangePercent) &&
    previousCloseChangePercent <= -1
  ) {
    return 82;
  }

  if (
    isFiniteNumber(week52PositionScore) &&
    week52PositionScore <= 10 &&
    isFiniteNumber(previousCloseChangePercent) &&
    previousCloseChangePercent <= -3
  ) {
    return 78;
  }

  if (
    isFiniteNumber(week52PositionScore) &&
    week52PositionScore <= 15 &&
    isFiniteNumber(closePositionScore) &&
    closePositionScore <= 40
  ) {
    return 68;
  }

  if (
    isAboveVwap === false &&
    isFiniteNumber(closePositionScore) &&
    closePositionScore <= 30 &&
    isFiniteNumber(previousCloseChangePercent) &&
    previousCloseChangePercent <= -2
  ) {
    return 64;
  }

  if (isFiniteNumber(closePositionScore) && closePositionScore <= 20) return 55;
  return 25;
}

export function scoreRisk(context: RiskScoreContext): RiskScoreResult {
  const overheatingRiskScore = scoreOverheatingRisk(context);
  const volatilityRiskScore = scoreVolatilityRisk(context);
  const distributionRiskScore = scoreDistributionRisk(context);
  const vwapBreakdownRiskScore = scoreVwapBreakdownRisk(context);
  const lowLiquidityOrWeakParticipationRiskScore =
    scoreLowLiquidityOrWeakParticipationRisk(context);
  const trendCollapseRiskScore = scoreTrendCollapseRisk(context);

  const riskScore = weightedAverageScore([
    { score: overheatingRiskScore, weight: 0.18 },
    { score: volatilityRiskScore, weight: 0.17 },
    { score: distributionRiskScore, weight: 0.25 },
    { score: vwapBreakdownRiskScore, weight: 0.2 },
    { score: lowLiquidityOrWeakParticipationRiskScore, weight: 0.1 },
    { score: trendCollapseRiskScore, weight: 0.1 },
  ]);

  const warnings: string[] = [];
  const evidence: RiskScoreResult["evidence"] = {
    positive: [],
    negative: [],
    neutral: [],
  };

  if (riskScore >= 80) {
    warnings.push("종합 리스크 점수가 매우 높아 보수적인 해석이 필요합니다.");
    evidence.negative.push("복수의 위험 신호가 동시에 나타나 리스크 게이트 입력으로 우선 확인해야 합니다.");
  } else if (riskScore >= 65) {
    warnings.push("종합 리스크 점수가 상승해 추가 확인이 필요합니다.");
    evidence.neutral.push("리스크가 중간 이상으로 높아져 강한 신호도 보수적으로 해석해야 합니다.");
  } else {
    evidence.positive.push("현재 종합 리스크는 통제 가능한 범위로 평가됩니다.");
  }

  if (distributionRiskScore >= 75) {
    warnings.push("거래량과 캔들 구조상 분배 또는 가짜 돌파 가능성을 점검해야 합니다.");
    evidence.negative.push("고거래량과 윗꼬리 또는 약한 종가가 결합되어 분배성 매물 위험이 있습니다.");
  }

  if (vwapBreakdownRiskScore >= 70) {
    warnings.push("VWAP 관련 약세 또는 가짜 강세 위험이 높습니다.");
    evidence.negative.push("VWAP 위치와 종가 구조가 약해 평균 체결가 기준 흐름 유지 여부를 확인해야 합니다.");
  }

  if (volatilityRiskScore >= 70) {
    warnings.push("장중 변동성이 높아 신호 안정성이 낮아질 수 있습니다.");
    evidence.neutral.push("장중 변동폭 확대 구간에서는 가격 신호의 지속성을 추가로 확인해야 합니다.");
  }

  if (trendCollapseRiskScore >= 70) {
    warnings.push("추세 붕괴 위험이 높아 상태 유지 조건 확인이 필요합니다.");
    evidence.negative.push("저점권 또는 약한 종가 구조가 추세 붕괴 위험을 높이고 있습니다.");
  }

  if (overheatingRiskScore < 40 && distributionRiskScore < 40 && vwapBreakdownRiskScore < 40) {
    evidence.positive.push("과열, 분배, VWAP 약세 신호가 모두 낮아 핵심 가격 리스크는 제한적입니다.");
  }

  if (lowLiquidityOrWeakParticipationRiskScore >= 50) {
    evidence.neutral.push("거래 참여가 약하거나 확인이 부족해 신호 신뢰도를 보수적으로 봐야 합니다.");
  }

  return {
    overheatingRiskScore,
    volatilityRiskScore,
    distributionRiskScore,
    vwapBreakdownRiskScore,
    lowLiquidityOrWeakParticipationRiskScore,
    trendCollapseRiskScore,
    riskScore,
    warnings,
    evidence,
  };
}
