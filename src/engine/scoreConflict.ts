import { clampScore, isFiniteNumber } from "./normalize";

export type ConflictSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ConflictType =
  | "LONG_TERM_STRONG_BUT_SHORT_TERM_WEAK"
  | "VOLUME_ACTIVE_BUT_PRICE_WEAK"
  | "RISK_MODERATE_BUT_KEY_RISK_HIGH"
  | "VWAP_WEAK_BUT_VOLUME_ALIVE"
  | "VOLATILITY_HIGH_WITH_WEAK_CLOSE";

export type SignalConflictInput = {
  totalScore?: number;
  closePositionScore?: number;
  fiftyTwoWeekPositionScore?: number;
  volumeScore?: number;
  volumeRiskScore?: number;
  vwapScore?: number;
  vwapRiskScore?: number;
  totalRiskScore?: number;
  volatilityRisk?: number;
  distributionRisk?: number;
  vwapBreakdownRisk?: number;
  participationWeaknessRisk?: number;
  trendCollapseRisk?: number;
  dailyChangePercent?: number;
  intradayRangePercent?: number;
  vwapDistancePercent?: number;
};

export type SignalConflictInsight = {
  type: ConflictType;
  severity: ConflictSeverity;
  titleKo: string;
  summaryKo: string;
  evidenceKo: string;
  checkPointKo: string;
  penalty: number;
};

export type SignalConflictResult = {
  conflictScore: number;
  severity: ConflictSeverity;
  conflicts: SignalConflictInsight[];
  summaryKo: string;
};

export function analyzeSignalConflicts(input: SignalConflictInput): SignalConflictResult {
  const conflicts: SignalConflictInsight[] = [];

  if (isLongTermStrongButShortTermWeak(input)) {
    conflicts.push({
      type: "LONG_TERM_STRONG_BUT_SHORT_TERM_WEAK",
      severity: "HIGH",
      titleKo: "장기 위치는 양호하지만 단기 흐름은 약함",
      summaryKo: "52주 가격 위치는 양호하지만 VWAP 또는 종가 위치가 약해 단기 수급 확인이 필요합니다.",
      evidenceKo: `52주 위치 점수 ${formatScore(input.fiftyTwoWeekPositionScore)}점, VWAP 점수 ${formatScore(input.vwapScore)}점, 종가 위치 점수 ${formatScore(input.closePositionScore)}점 기준입니다.`,
      checkPointKo: "고점권 부담이 커지는지, 다음 거래일 VWAP 회복과 종가 위치 개선이 함께 나타나는지 확인해야 합니다.",
      penalty: 16,
    });
  }

  if (isVolumeActiveButPriceWeak(input)) {
    conflicts.push({
      type: "VOLUME_ACTIVE_BUT_PRICE_WEAK",
      severity: "MEDIUM",
      titleKo: "거래량은 살아 있지만 가격 회복은 약함",
      summaryKo: "거래량 참여는 유지되지만 가격이 강하게 회복되지 않아 우위 흐름으로 단정하기 어렵습니다.",
      evidenceKo: `거래량 점수 ${formatScore(input.volumeScore)}점, 종가 위치 점수 ${formatScore(input.closePositionScore)}점, VWAP 점수 ${formatScore(input.vwapScore)}점 기준입니다.`,
      checkPointKo: "거래량 증가가 종가 회복과 VWAP 회복을 동반하는지 확인해야 합니다.",
      penalty: 10,
    });
  }

  if (isRiskModerateButKeyRiskHigh(input)) {
    conflicts.push({
      type: "RISK_MODERATE_BUT_KEY_RISK_HIGH",
      severity: "HIGH",
      titleKo: "종합 리스크는 보통이지만 핵심 위험은 높음",
      summaryKo: "전체 리스크는 극단 구간이 아니어도 VWAP 이탈 또는 추세 훼손 같은 핵심 위험이 높을 수 있습니다.",
      evidenceKo: `종합 리스크 ${formatScore(input.totalRiskScore)}점, 추세 붕괴 위험 ${formatScore(input.trendCollapseRisk)}점, VWAP 이탈 위험 ${formatScore(input.vwapBreakdownRisk)}점, VWAP 리스크 ${formatScore(input.vwapRiskScore)}점 기준입니다.`,
      checkPointKo: "전체 점수보다 세부 핵심 위험이 먼저 낮아지는지 확인해야 합니다.",
      penalty: 16,
    });
  }

  if (isVwapWeakButVolumeAlive(input)) {
    conflicts.push({
      type: "VWAP_WEAK_BUT_VOLUME_ALIVE",
      severity: "MEDIUM",
      titleKo: "VWAP는 약하지만 거래 참여는 남아 있음",
      summaryKo: "평균 거래 단가 기준 흐름은 약하지만 거래 참여가 완전히 꺼진 상태는 아닙니다.",
      evidenceKo: `VWAP 점수 ${formatScore(input.vwapScore)}점, 거래량 점수 ${formatScore(input.volumeScore)}점, VWAP 이격률 ${formatPercent(input.vwapDistancePercent)} 기준입니다.`,
      checkPointKo: "거래량이 유지되는 상태에서 VWAP 회복이 실제로 나타나는지 확인해야 합니다.",
      penalty: 8,
    });
  }

  if (isVolatilityHighWithWeakClose(input)) {
    conflicts.push({
      type: "VOLATILITY_HIGH_WITH_WEAK_CLOSE",
      severity: "HIGH",
      titleKo: "변동성은 높고 종가 위치는 약함",
      summaryKo: "장중 흔들림이 큰 상태에서 종가도 약하면 가격 신호의 안정성이 낮아질 수 있습니다.",
      evidenceKo: `변동성 위험 ${formatScore(input.volatilityRisk)}점, 종가 위치 점수 ${formatScore(input.closePositionScore)}점, 장중 변동폭 ${formatPercent(input.intradayRangePercent)} 기준입니다.`,
      checkPointKo: "다음 거래일 변동폭이 줄어들고 종가가 중상단 이상에 남는지 확인해야 합니다.",
      penalty: 12,
    });
  }

  const conflictScore = clampScore(
    conflicts.reduce((total, conflict) => total + conflict.penalty, 0) + getConflictSeverityBooster(input),
  );
  const severity = getConflictSeverity(conflictScore);

  return {
    conflictScore,
    severity,
    conflicts,
    summaryKo: buildConflictSummary(conflictScore, severity, conflicts),
  };
}

function isLongTermStrongButShortTermWeak(input: SignalConflictInput): boolean {
  return (
    valueOr(input.fiftyTwoWeekPositionScore, 50) >= 70 &&
    (valueOr(input.vwapScore, 50) <= 40 || valueOr(input.closePositionScore, 50) <= 30)
  );
}

function isVolumeActiveButPriceWeak(input: SignalConflictInput): boolean {
  return (
    valueOr(input.volumeScore, 50) >= 50 &&
    (valueOr(input.closePositionScore, 50) <= 30 || valueOr(input.vwapScore, 50) <= 40)
  );
}

function isRiskModerateButKeyRiskHigh(input: SignalConflictInput): boolean {
  return (
    valueOr(input.totalRiskScore, 50) < 60 &&
    (valueOr(input.trendCollapseRisk, 0) >= 80 ||
      valueOr(input.vwapBreakdownRisk, 0) >= 70 ||
      valueOr(input.vwapRiskScore, 0) >= 70)
  );
}

function isVwapWeakButVolumeAlive(input: SignalConflictInput): boolean {
  return valueOr(input.vwapScore, 50) <= 40 && valueOr(input.volumeScore, 50) >= 50;
}

function isVolatilityHighWithWeakClose(input: SignalConflictInput): boolean {
  return valueOr(input.volatilityRisk, 0) >= 70 && valueOr(input.closePositionScore, 50) <= 30;
}

function getConflictSeverity(score: number): ConflictSeverity {
  if (score >= 80) return "CRITICAL";
  if (score >= 55) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}

function getConflictSeverityBooster(input: SignalConflictInput): number {
  let booster = 0;

  if (valueOr(input.trendCollapseRisk, 0) >= 80 && valueOr(input.closePositionScore, 50) <= 20) {
    booster += 6;
  }
  if (valueOr(input.vwapBreakdownRisk, 0) >= 75 && valueOr(input.vwapScore, 50) <= 35) {
    booster += 4;
  }

  return booster;
}

function buildConflictSummary(
  conflictScore: number,
  severity: ConflictSeverity,
  conflicts: SignalConflictInsight[],
): string {
  if (conflicts.length === 0) {
    return "현재 주요 신호 간 충돌은 크지 않습니다. 단일 점수보다 가격, 거래량, VWAP, 리스크 흐름이 같은 방향으로 유지되는지 확인하면 됩니다.";
  }

  const levelText = getAuxiliarySeverityLabel(severity);
  return `신호 충돌 점수는 보조 분석 기준으로 ${levelText}. 긍정적으로 보이는 지표와 단기 약세 리스크가 함께 나타나므로, ${conflicts[0].titleKo} 조건을 우선 확인해야 합니다.`;
}

function getAuxiliarySeverityLabel(severity: ConflictSeverity): string {
  if (severity === "CRITICAL") return "매우 높은 편입니다";
  if (severity === "HIGH") return "높은 편입니다";
  if (severity === "MEDIUM") return "보통 수준입니다";
  return "낮은 편입니다";
}

function valueOr(value: number | undefined, fallback: number): number {
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
