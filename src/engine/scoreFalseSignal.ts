import { clampScore, isFiniteNumber } from "./normalize";

export type FalseSignalRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type FalseSignalType =
  | "FAKE_REBOUND"
  | "DISTRIBUTION_RISK"
  | "WEAK_CLOSE_AFTER_VOLATILITY"
  | "VWAP_RECOVERY_FAILURE"
  | "VOLUME_WITHOUT_PRICE_RECOVERY"
  | "RECOVERY_RELIABILITY_WATCH";

export type FalseSignalInput = {
  finalScore?: number;
  closePositionScore?: number;
  volumeScore?: number;
  volumeRiskScore?: number;
  vwapScore?: number;
  vwapRiskScore?: number;
  volatilityRisk?: number;
  distributionRisk?: number;
  vwapBreakdownRisk?: number;
  trendCollapseRisk?: number;
  dailyChangePercent?: number;
  intradayRangePercent?: number;
  upperWickRatio?: number;
  lowerWickRatio?: number;
  vwapDistancePercent?: number;
};

export type FalseSignalInsight = {
  type: FalseSignalType;
  riskLevel: FalseSignalRiskLevel;
  titleKo: string;
  summaryKo: string;
  evidenceKo: string;
  checkPointKo: string;
  penalty: number;
};

export type FalseSignalResult = {
  falseSignalScore: number;
  riskLevel: FalseSignalRiskLevel;
  signals: FalseSignalInsight[];
  summaryKo: string;
};

export function analyzeFalseSignalRisk(input: FalseSignalInput): FalseSignalResult {
  const signals: FalseSignalInsight[] = [];

  if (isFakeRebound(input)) {
    signals.push({
      type: "FAKE_REBOUND",
      riskLevel: "MEDIUM",
      titleKo: "가짜 반등 위험",
      summaryKo: "장중 움직임은 있었지만 VWAP와 종가 위치가 약해 반등 신뢰도를 조심해서 봐야 하는 상태입니다.",
      evidenceKo: `VWAP 점수 ${formatScore(input.vwapScore)}점, 종가 위치 점수 ${formatScore(input.closePositionScore)}점, 장중 변동폭 ${formatPercent(input.intradayRangePercent)} 기준으로 판단했습니다.`,
      checkPointKo: "다음 거래일 VWAP 위로 회복한 뒤 종가까지 유지되는지 확인해야 합니다.",
      penalty: 14,
    });
  }

  if (isDistributionRisk(input)) {
    signals.push({
      type: "DISTRIBUTION_RISK",
      riskLevel: "MEDIUM",
      titleKo: "상단 매물 출회 위험",
      summaryKo: "거래량은 유지됐지만 고점 부근에서 밀린 흔적이 있어 상단 대기 물량이 우세했을 가능성이 있습니다.",
      evidenceKo: `윗꼬리 비율 ${formatPercent(input.upperWickRatio)}, 거래량 점수 ${formatScore(input.volumeScore)}점, 종가 위치 점수 ${formatScore(input.closePositionScore)}점 기준입니다.`,
      checkPointKo: "다음 거래일 고점권을 다시 회복하는지, 또는 반등 시마다 매물이 반복되는지 확인해야 합니다.",
      penalty: 8,
    });
  }

  if (isWeakCloseAfterVolatility(input)) {
    signals.push({
      type: "WEAK_CLOSE_AFTER_VOLATILITY",
      riskLevel: "MEDIUM",
      titleKo: "변동성 확대 후 약한 종가",
      summaryKo: "장중 흔들림이 컸지만 마감 위치가 약해 가격 신호의 안정성이 낮아진 상태입니다.",
      evidenceKo: `변동성 위험 ${formatScore(input.volatilityRisk)}점, 종가 위치 점수 ${formatScore(input.closePositionScore)}점 기준으로 장 마감 수급 약화를 점검합니다.`,
      checkPointKo: "다음 거래일 변동폭이 줄어들고 종가가 중상단 이상에 남는지 확인해야 합니다.",
      penalty: 12,
    });
  }

  if (isVwapRecoveryFailure(input)) {
    signals.push({
      type: "VWAP_RECOVERY_FAILURE",
      riskLevel: "MEDIUM",
      titleKo: "VWAP 회복 실패 위험",
      summaryKo: "가격이 평균 거래 단가 아래에 머물러 단기 반등 신뢰도가 낮아질 수 있는 상태입니다.",
      evidenceKo: `VWAP 리스크 점수 ${formatScore(input.vwapRiskScore)}점, VWAP 이격률 ${formatPercent(input.vwapDistancePercent)} 기준입니다.`,
      checkPointKo: "VWAP 재돌파 후 다시 이탈하지 않고 종가까지 유지되는지 확인해야 합니다.",
      penalty: 14,
    });
  }

  if (isVolumeWithoutPriceRecovery(input)) {
    signals.push({
      type: "VOLUME_WITHOUT_PRICE_RECOVERY",
      riskLevel: "LOW",
      titleKo: "거래량 대비 가격 회복 부족",
      summaryKo: "거래량은 유지되고 있지만 가격이 충분히 회복되지 못해 강한 우위 흐름으로 확정하기 어렵습니다.",
      evidenceKo: `거래량 점수 ${formatScore(input.volumeScore)}점, 종가 위치 점수 ${formatScore(input.closePositionScore)}점, VWAP 점수 ${formatScore(input.vwapScore)}점 기준입니다.`,
      checkPointKo: "거래량 증가가 가격 회복과 함께 나타나는지 확인해야 합니다.",
      penalty: 9,
    });
  }

  if (isRecoveryReliabilityWatch(input) && signals.length === 0) {
    signals.push({
      type: "RECOVERY_RELIABILITY_WATCH",
      riskLevel: "LOW",
      titleKo: "회복 신뢰도 관찰",
      summaryKo:
        "확정적인 가짜 신호는 아니지만, 장중 변동성이 큰 상태에서 VWAP 리스크나 종가 확인 조건이 남아 있어 회복 신뢰도를 낮은 강도로 관찰해야 합니다.",
      evidenceKo: `종합 점수 ${formatScore(input.finalScore)}점, 변동성 위험 ${formatScore(input.volatilityRisk)}점, 장중 변동폭 ${formatPercent(input.intradayRangePercent)}, VWAP 리스크 ${formatScore(input.vwapRiskScore)}점, 종가 위치 점수 ${formatScore(input.closePositionScore)}점 기준입니다.`,
      checkPointKo:
        "위험 확정이 아니라 약한 관찰 단계입니다. 다음 흐름에서 변동폭이 완화되고 VWAP와 종가 위치가 함께 안정되는지 확인해야 합니다.",
      penalty: 14,
    });
  }

  const rawFalseSignalScore =
    signals.reduce((total, signal) => total + signal.penalty, 0) + getFalseSignalSeverityBooster(input);
  const falseSignalScore = calibrateFalseSignalScore(rawFalseSignalScore, input, signals);
  const riskLevel = getFalseSignalRiskLevel(falseSignalScore);
  const normalizedSignals = signals.map((signal) => ({
    ...signal,
    riskLevel: getFalseSignalRiskLevel(signal.penalty),
  }));

  return {
    falseSignalScore,
    riskLevel,
    signals: normalizedSignals,
    summaryKo: buildFalseSignalSummary(falseSignalScore, riskLevel, normalizedSignals),
  };
}

function isFakeRebound(input: FalseSignalInput): boolean {
  return (
    safeNumber(input.vwapScore, 50) <= 40 &&
    safeNumber(input.closePositionScore, 50) <= 30 &&
    safeNumber(input.intradayRangePercent, 0) >= 5
  );
}

function isDistributionRisk(input: FalseSignalInput): boolean {
  return (
    safeNumber(input.upperWickRatio, 0) >= 15 &&
    safeNumber(input.volumeScore, 50) >= 50 &&
    safeNumber(input.closePositionScore, 50) <= 40
  );
}

function isWeakCloseAfterVolatility(input: FalseSignalInput): boolean {
  return safeNumber(input.volatilityRisk, 0) >= 70 && safeNumber(input.closePositionScore, 50) <= 30;
}

function isVwapRecoveryFailure(input: FalseSignalInput): boolean {
  return safeNumber(input.vwapRiskScore, 0) >= 70 && safeNumber(input.vwapDistancePercent, 0) < 0;
}

function isVolumeWithoutPriceRecovery(input: FalseSignalInput): boolean {
  return (
    safeNumber(input.volumeScore, 50) >= 50 &&
    (safeNumber(input.closePositionScore, 50) <= 30 || safeNumber(input.vwapScore, 50) <= 40)
  );
}

function isRecoveryReliabilityWatch(input: FalseSignalInput): boolean {
  const hasVolatilityCaution =
    safeNumber(input.intradayRangePercent, 0) >= 8 || safeNumber(input.volatilityRisk, 0) >= 65;
  const hasRecoveryRecheckCondition =
    safeNumber(input.vwapRiskScore, 0) >= 35 ||
    safeNumber(input.closePositionScore, 100) <= 75 ||
    safeNumber(input.upperWickRatio, 0) >= 25;
  const isNotCollapsed = safeNumber(input.finalScore, 50) >= 40;

  return hasVolatilityCaution && hasRecoveryRecheckCondition && isNotCollapsed;
}

function getFalseSignalRiskLevel(score: number): FalseSignalRiskLevel {
  if (score >= 80) return "CRITICAL";
  if (score >= 55) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}

function getFalseSignalSeverityBooster(input: FalseSignalInput): number {
  let booster = 0;

  if (safeNumber(input.vwapRiskScore, 0) >= 75 && safeNumber(input.vwapDistancePercent, 0) < 0) {
    booster += 3;
  }
  if (safeNumber(input.closePositionScore, 50) <= 20 && safeNumber(input.intradayRangePercent, 0) >= 8) {
    booster += 3;
  }

  return Math.min(booster, 3);
}

function calibrateFalseSignalScore(
  rawScore: number,
  input: FalseSignalInput,
  signals: FalseSignalInsight[],
): number {
  let score = rawScore;

  if (signals.length >= 4) {
    score -= Math.min(2, signals.length - 3);
  }

  if (hasOverlappingRecoveryFailure(input) && signals.length >= 4 && rawScore > 70) {
    score -= 2;
  }

  if (!hasExtremeFalseSignalCluster(input)) {
    score = Math.min(score, 66);
  }

  return clampScore(score);
}

function hasOverlappingRecoveryFailure(input: FalseSignalInput): boolean {
  return (
    safeNumber(input.vwapScore, 50) <= 40 &&
    safeNumber(input.vwapRiskScore, 0) >= 70 &&
    safeNumber(input.closePositionScore, 50) <= 30
  );
}

function hasExtremeFalseSignalCluster(input: FalseSignalInput): boolean {
  return (
    safeNumber(input.vwapRiskScore, 0) >= 90 &&
    safeNumber(input.distributionRisk, 0) >= 80 &&
    safeNumber(input.upperWickRatio, 0) >= 30 &&
    safeNumber(input.closePositionScore, 50) <= 10 &&
    safeNumber(input.volatilityRisk, 0) >= 85
  );
}

function buildFalseSignalSummary(
  falseSignalScore: number,
  riskLevel: FalseSignalRiskLevel,
  signals: FalseSignalInsight[],
): string {
  if (signals.length === 0) {
    return "현재 표면적으로 강해 보이는 신호와 내부 약세 구조가 크게 충돌하는 가짜 강세 위험은 뚜렷하지 않습니다.";
  }

  const levelText = getAuxiliaryRiskLevelLabel(riskLevel);
  return `가짜 신호 위험은 보조 분석 기준으로 ${levelText}. 장중 움직임이 있었더라도 VWAP와 종가 위치가 약하면 반등 신뢰도 확인이 필요하며, 가장 먼저 ${signals[0].titleKo} 조건을 확인해야 합니다.`;
}

function getAuxiliaryRiskLevelLabel(riskLevel: FalseSignalRiskLevel): string {
  if (riskLevel === "CRITICAL") return "매우 높은 편입니다";
  if (riskLevel === "HIGH") return "높은 편입니다";
  if (riskLevel === "MEDIUM") return "보통 수준입니다";
  return "낮은 강도의 관찰 신호입니다";
}

function safeNumber(value: number | undefined, fallback: number): number {
  if (isFiniteNumber(value)) return value;
  return fallback;
}

function formatScore(value: number | undefined): string {
  if (!isFiniteNumber(value)) return "-";
  return value.toFixed(0);
}

function formatPercent(value: number | undefined): string {
  if (!isFiniteNumber(value)) return "-";
  return `${value.toFixed(1)}%`;
}
