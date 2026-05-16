import { clampScore, isFiniteNumber } from "./normalize";

export type StockActionCode =
  | "WATCH_ONLY"
  | "WAIT_CONFIRMATION"
  | "BREAKOUT_MONITOR"
  | "TRUE_BREAKOUT_MONITOR"
  | "PULLBACK_MONITOR"
  | "VWAP_SUPPORT_MONITOR"
  | "VWAP_BREAKDOWN_CHECK"
  | "OVERHEAT_CAUTION"
  | "FALSE_BREAKOUT_CAUTION"
  | "HIGH_RISK_MOMENTUM_CAUTION"
  | "TREND_COLLAPSE_CHECK"
  | "WEAK_PARTICIPATION_CHECK"
  | "RISK_CHECK_REQUIRED"
  | "NO_CLEAR_EDGE";

export type ActionUrgencyLevel = "LOW" | "NORMAL" | "ELEVATED" | "HIGH";

type DetailNumberKey =
  | "ohlcScore"
  | "volumeScore"
  | "vwapScore"
  | "closePositionScore"
  | "week52PositionScore"
  | "previousCloseChangePercent"
  | "intradayRangePercent"
  | "upperWickRatio"
  | "lowerWickRatio"
  | "volumeRatio20d"
  | "vwapDistancePercent"
  | "overheatingRiskScore"
  | "volatilityRiskScore"
  | "distributionRiskScore"
  | "vwapBreakdownRiskScore"
  | "lowLiquidityOrWeakParticipationRiskScore"
  | "trendCollapseRiskScore";

type DetailBooleanKey = "isAboveVwap" | "isNearVwap";

export type ActionCodeInput = {
  primaryState: string;
  stateScore: number;
  confidenceScore: number;
  riskAdjustedScore: number;
  riskScore: number;
} & Partial<Record<"secondaryStates", string[]>> &
  Partial<Record<DetailNumberKey, number>> &
  Partial<Record<DetailBooleanKey, boolean>>;

export type ActionCodeResult = {
  actionCode: StockActionCode;
  urgencyLevel: ActionUrgencyLevel;
  actionScore: number;
  summary: string;
  checklist: string[];
  warnings: string[];
  evidence: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
};

const riskActionCodes: StockActionCode[] = [
  "RISK_CHECK_REQUIRED",
  "FALSE_BREAKOUT_CAUTION",
  "HIGH_RISK_MOMENTUM_CAUTION",
  "VWAP_BREAKDOWN_CHECK",
  "TREND_COLLAPSE_CHECK",
  "OVERHEAT_CAUTION",
  "WEAK_PARTICIPATION_CHECK",
];

const monitorActionCodes: StockActionCode[] = [
  "WATCH_ONLY",
  "WAIT_CONFIRMATION",
  "BREAKOUT_MONITOR",
  "TRUE_BREAKOUT_MONITOR",
  "PULLBACK_MONITOR",
  "VWAP_SUPPORT_MONITOR",
  "NO_CLEAR_EDGE",
];

export function calculateActionScore(
  input: ActionCodeInput,
  actionCode: StockActionCode,
): number {
  let score = input.stateScore;

  if (input.confidenceScore >= 70) score += 8;
  else if (input.confidenceScore < 45) score -= 12;

  if (riskActionCodes.includes(actionCode)) {
    if (input.riskScore >= 80) score += 20;
    else if (input.riskScore >= 65) score += 12;
  } else {
    if (input.riskScore >= 80) score -= 22;
    else if (input.riskScore >= 70) score -= 12;
  }

  if (actionCode === "BREAKOUT_MONITOR") {
    if (input.riskScore < 70) score += 8;
    else score -= 8;
  }
  if (actionCode === "TRUE_BREAKOUT_MONITOR") {
    if (input.riskScore < 70 && input.confidenceScore >= 55) score += 12;
    else score -= 8;
  }
  if (actionCode === "FALSE_BREAKOUT_CAUTION") {
    if (valueAtLeast(input.distributionRiskScore, 70) || input.riskScore >= 65) score += 18;
  }
  if (actionCode === "OVERHEAT_CAUTION") {
    if (valueAtLeast(input.overheatingRiskScore, 70)) score += 18;
  }
  if (actionCode === "VWAP_BREAKDOWN_CHECK") {
    if (valueAtLeast(input.vwapBreakdownRiskScore, 65) || input.isAboveVwap === false) score += 18;
  }
  if (actionCode === "TREND_COLLAPSE_CHECK") {
    if (valueAtLeast(input.trendCollapseRiskScore, 70)) score += 20;
  }
  if (actionCode === "WEAK_PARTICIPATION_CHECK") {
    if (valueAtLeast(input.lowLiquidityOrWeakParticipationRiskScore, 65)) score += 18;
  }
  if (actionCode === "VWAP_SUPPORT_MONITOR") {
    score -= 8;
    if (input.isAboveVwap === true) score += 6;
    if (input.isNearVwap === true) score += 5;
    if (input.riskScore < 65) score += 4;
    if (input.vwapScore !== undefined && input.vwapScore < 65) score -= 6;
    if (input.volumeScore !== undefined && input.volumeScore < 65) score -= 6;
  }
  if (actionCode === "NO_CLEAR_EDGE") {
    score = 50;
    if (input.confidenceScore < 45) score += 22;
    if (input.riskAdjustedScore < 55) score += 12;
  }

  return applyActionScoreCap(score, input, actionCode);
}

export function determineUrgencyLevel(
  input: ActionCodeInput,
  actionCode: StockActionCode,
  actionScore: number,
): ActionUrgencyLevel {
  const isRiskCode = riskActionCodes.includes(actionCode);
  const isMonitorCode = monitorActionCodes.includes(actionCode);

  if ((isRiskCode && input.riskScore >= 80) || (isRiskCode && actionScore >= 85)) return "HIGH";
  if (
    isMonitorCode &&
    input.riskScore < 50 &&
    !(actionScore >= 90 && input.confidenceScore >= 70) &&
    !hasElevatedRiskMetric(input)
  ) {
    if (actionScore >= 50) return "NORMAL";
    return "LOW";
  }
  if (input.riskScore >= 65 || actionScore >= 70) return "ELEVATED";
  if (actionScore >= 50) return "NORMAL";
  return "LOW";
}

export function selectActionCode(input: ActionCodeInput): StockActionCode {
  if (input.riskScore >= 80) return "RISK_CHECK_REQUIRED";
  if (input.primaryState === "TREND_COLLAPSE_RISK" || valueAtLeast(input.trendCollapseRiskScore, 75)) {
    return "TREND_COLLAPSE_CHECK";
  }
  if (input.primaryState === "FALSE_BREAKOUT_RISK" || valueAtLeast(input.distributionRiskScore, 75)) {
    return "FALSE_BREAKOUT_CAUTION";
  }
  if (input.primaryState === "VWAP_BREAKDOWN_WARNING" || valueAtLeast(input.vwapBreakdownRiskScore, 75)) {
    return "VWAP_BREAKDOWN_CHECK";
  }
  if (input.primaryState === "HIGH_RISK_MOMENTUM") return "HIGH_RISK_MOMENTUM_CAUTION";
  if (input.primaryState === "SHORT_TERM_OVERHEATED" || valueAtLeast(input.overheatingRiskScore, 75)) {
    return "OVERHEAT_CAUTION";
  }
  if (input.primaryState === "TRUE_BREAKOUT_CANDIDATE" && input.riskScore < 70) {
    return "TRUE_BREAKOUT_MONITOR";
  }
  if (input.primaryState === "BREAKOUT_ATTEMPT" && input.riskScore < 75) return "BREAKOUT_MONITOR";
  if (input.primaryState === "PULLBACK_SETUP") return "PULLBACK_MONITOR";
  if (input.primaryState === "VWAP_SUPPORT_HOLDING") return "VWAP_SUPPORT_MONITOR";
  if (input.primaryState === "WEAK_PARTICIPATION") return "WEAK_PARTICIPATION_CHECK";
  if (input.primaryState === "WATCHLIST") return "WATCH_ONLY";
  if (input.confidenceScore < 45) return "NO_CLEAR_EDGE";
  if (input.riskAdjustedScore < 40) return "WAIT_CONFIRMATION";
  return "WAIT_CONFIRMATION";
}

export function generateActionSummary(
  input: ActionCodeInput,
  actionCode: StockActionCode,
  urgencyLevel: ActionUrgencyLevel,
): string {
  let urgencyText = "";
  if (urgencyLevel === "HIGH") urgencyText = " 리스크 확인 강도가 높은 상태입니다.";

  switch (actionCode) {
    case "WATCH_ONLY":
      return `현재 구조는 관심 종목으로 추적할 수 있으나, 명확한 우위가 확인된 상태는 아닙니다.${urgencyText}`;
    case "WAIT_CONFIRMATION":
      return `현재는 추가 확인이 필요한 구간으로, 가격·거래량·VWAP 조건의 일치 여부를 더 점검해야 합니다.${urgencyText}`;
    case "BREAKOUT_MONITOR":
      return `돌파 시도 조건이 일부 확인되어 거래량 유지와 종가 위치를 함께 관찰해야 하는 구간입니다.${urgencyText}`;
    case "TRUE_BREAKOUT_MONITOR":
      return `돌파 후보 조건이 비교적 강하게 나타나며, 거래량 지속성과 VWAP 유지 여부를 확인해야 합니다.${urgencyText}`;
    case "PULLBACK_MONITOR":
      return `조정 구간으로 해석할 여지가 있으며, 지지 유지와 거래량 둔화 여부를 함께 점검해야 합니다.${urgencyText}`;
    case "VWAP_SUPPORT_MONITOR":
      return `VWAP 근처에서 지지 여부를 확인해야 하는 구간입니다.${urgencyText}`;
    case "VWAP_BREAKDOWN_CHECK":
      return `VWAP 이탈 또는 단기 수급 약화 가능성이 있어 추가 확인이 필요한 구간입니다.${urgencyText}`;
    case "OVERHEAT_CAUTION":
      return `단기 과열 신호가 존재하여 추격 판단에는 주의가 필요한 구간입니다.${urgencyText}`;
    case "FALSE_BREAKOUT_CAUTION":
      return `상단 매물 소화 또는 가짜 돌파 가능성이 있어 종가 위치와 윗꼬리 구조를 점검해야 합니다.${urgencyText}`;
    case "HIGH_RISK_MOMENTUM_CAUTION":
      return `상승 에너지는 존재하지만 리스크도 함께 높아 변동성 관리가 중요한 구간입니다.${urgencyText}`;
    case "TREND_COLLAPSE_CHECK":
      return `추세 훼손 가능성이 있어 하락 압력과 지지선 이탈 여부를 점검해야 하는 구간입니다.${urgencyText}`;
    case "WEAK_PARTICIPATION_CHECK":
      return `거래 참여가 약해 신호 신뢰도가 낮을 수 있으므로 거래량 회복 여부를 확인해야 합니다.${urgencyText}`;
    case "RISK_CHECK_REQUIRED":
      return `리스크 점수가 높아 현재 구조를 단순한 긍정 흐름으로 해석하기 어렵습니다.${urgencyText}`;
    case "NO_CLEAR_EDGE":
    default:
      return `현재 점수 조합만으로는 명확한 방향성 우위를 판단하기 어렵습니다.${urgencyText}`;
  }
}

export function generateActionChecklist(
  input: ActionCodeInput,
  actionCode: StockActionCode,
): string[] {
  if (actionCode === "BREAKOUT_MONITOR" || actionCode === "TRUE_BREAKOUT_MONITOR") {
    return [
      "돌파 구간 이후 거래량이 20일 평균 대비 유지되는지 확인",
      "종가가 고가권에서 유지되는지 확인",
      "VWAP 위 가격 유지 여부 확인",
      "윗꼬리 비율이 과도하게 커지는지 확인",
    ];
  }
  if (actionCode === "FALSE_BREAKOUT_CAUTION") {
    return [
      "윗꼬리 비율과 거래량 급증이 동시에 발생했는지 확인",
      "돌파 후 종가가 중하단으로 밀렸는지 확인",
      "VWAP 이탈 여부 확인",
      "다음 봉에서 거래량 동반 재상승이 나오는지 확인",
    ];
  }
  if (actionCode === "OVERHEAT_CAUTION") {
    return [
      "전일 대비 상승률과 VWAP 이격률이 과도한지 확인",
      "장중 변동폭이 확대되는지 확인",
      "추가 상승보다 변동성 확대 신호가 강한지 확인",
    ];
  }
  if (actionCode === "VWAP_BREAKDOWN_CHECK") {
    return [
      "VWAP 아래에서 가격이 유지되는지 확인",
      "종가 위치가 하단권에 머무는지 확인",
      "거래량 동반 이탈인지 확인",
    ];
  }
  if (actionCode === "PULLBACK_MONITOR") {
    return [
      "조정 과정에서 거래량이 감소하는지 확인",
      "VWAP 또는 주요 가격대에서 지지가 유지되는지 확인",
      "아랫꼬리 반응이 나타나는지 확인",
    ];
  }
  if (actionCode === "TREND_COLLAPSE_CHECK") {
    return [
      "52주 저점 근처에서 추가 이탈이 발생하는지 확인",
      "VWAP 아래 약한 종가가 반복되는지 확인",
      "하락 거래량이 증가하는지 확인",
    ];
  }
  if (actionCode === "WEAK_PARTICIPATION_CHECK") {
    return [
      "20일 평균 대비 거래량 회복 여부 확인",
      "가격 상승이 거래량 없이 발생하는지 확인",
      "신호 신뢰도가 낮은 구간인지 확인",
    ];
  }

  return [
    "가격 점수와 거래량 점수가 같은 방향으로 개선되는지 확인",
    "VWAP 기준 위아래 방향성이 확인되는지 점검",
    "리스크 점수가 낮아지는지 확인",
  ];
}

export function generateActionEvidence(
  input: ActionCodeInput,
  actionCode: StockActionCode,
): ActionCodeResult["evidence"] {
  const evidence: ActionCodeResult["evidence"] = {
    positive: [],
    negative: [],
    neutral: [],
  };

  if (valueAtLeast(input.ohlcScore, 60) && valueAtLeast(input.vwapScore, 55)) {
    evidence.positive.push("가격 점수와 VWAP 점수가 양호하여 기본 흐름은 유지되고 있습니다.");
  }
  if (valueAtLeast(input.volumeScore, 55)) {
    evidence.positive.push("거래량 점수가 일정 수준 이상으로 확인되어 관심 구간으로 볼 수 있습니다.");
  }
  if (input.riskScore < 65) {
    evidence.positive.push("리스크 점수가 과도하지 않아 단기 구조가 완전히 훼손된 상태는 아닙니다.");
  }

  if (input.riskScore >= 65) {
    evidence.negative.push("리스크 점수가 높아 단순한 긍정 신호로 보기 어렵습니다.");
  }
  if (valueAtLeast(input.upperWickRatio, 35) && valueAtLeast(input.volumeRatio20d, 150)) {
    evidence.negative.push("윗꼬리와 거래량 증가가 함께 나타나 상단 매물 부담 가능성이 있습니다.");
  }
  if (actionCode === "VWAP_BREAKDOWN_CHECK" || valueAtLeast(input.vwapBreakdownRiskScore, 70)) {
    evidence.negative.push("VWAP 이탈 가능성이 있어 단기 수급 약화를 점검해야 합니다.");
  }
  if (actionCode === "WEAK_PARTICIPATION_CHECK") {
    evidence.negative.push("거래량 참여가 약해 신호 신뢰도가 낮을 수 있습니다.");
  }

  evidence.neutral.push("일부 조건은 양호하지만 방향성 판단에는 추가 확인이 필요합니다.");
  if (Math.abs(valueOr(input.ohlcScore, 50) - valueOr(input.volumeScore, 50)) >= 20) {
    evidence.neutral.push("가격 흐름과 거래량 흐름이 완전히 일치하지 않아 관망 성격이 남아 있습니다.");
  }
  evidence.neutral.push("현재 상태는 대응보다 관찰과 조건 확인에 가까운 구간입니다.");

  return evidence;
}

export function generateActionWarnings(
  input: ActionCodeInput,
  actionCode: StockActionCode,
  urgencyLevel: ActionUrgencyLevel,
): string[] {
  const warnings: string[] = [];

  if (input.riskScore >= 80) warnings.push("리스크 점수가 매우 높아 해석에 주의가 필요합니다.");
  else if (input.riskScore >= 65) warnings.push("리스크 점수가 중간 이상으로 상승했습니다.");
  if (actionCode === "RISK_CHECK_REQUIRED") warnings.push("현재 구조를 단순한 긍정 흐름으로 보기 어렵습니다.");
  if (actionCode === "FALSE_BREAKOUT_CAUTION") warnings.push("상단 매물 소화 또는 가짜 돌파 가능성을 점검해야 합니다.");
  if (actionCode === "HIGH_RISK_MOMENTUM_CAUTION") warnings.push("강한 흐름과 높은 리스크가 동시에 나타납니다.");
  if (actionCode === "VWAP_BREAKDOWN_CHECK") warnings.push("VWAP 이탈 신호가 있어 단기 수급 약화 가능성이 있습니다.");
  if (actionCode === "TREND_COLLAPSE_CHECK") warnings.push("추세 훼손 가능성이 있어 추가 하락 압력을 확인해야 합니다.");
  if (valueAtLeast(input.distributionRiskScore, 75)) warnings.push("분배성 매물 또는 가짜 돌파 위험이 높습니다.");
  if (valueAtLeast(input.vwapBreakdownRiskScore, 70)) warnings.push("VWAP 약세 위험 점수가 높습니다.");
  if (valueAtLeast(input.trendCollapseRiskScore, 70)) warnings.push("추세 훼손 위험 점수가 높습니다.");
  if (valueAtLeast(input.volatilityRiskScore, 70)) warnings.push("장중 변동성 위험 점수가 높습니다.");
  if (valueAtLeast(input.overheatingRiskScore, 75)) warnings.push("단기 과열 신호가 강해 변동성 확대 가능성이 있습니다.");
  if (input.confidenceScore < 45) warnings.push("분류 신뢰도가 낮아 현재 상태를 단정하기 어렵습니다.");
  if (urgencyLevel === "HIGH") warnings.push("우선 확인이 필요한 리스크 조건이 존재합니다.");

  return warnings;
}

export function getActionCode(input: ActionCodeInput): ActionCodeResult {
  const actionCode = selectActionCode(input);
  const actionScore = calculateActionScore(input, actionCode);
  const urgencyLevel = determineUrgencyLevel(input, actionCode, actionScore);

  return {
    actionCode,
    urgencyLevel,
    actionScore,
    summary: generateActionSummary(input, actionCode, urgencyLevel),
    checklist: generateActionChecklist(input, actionCode),
    warnings: generateActionWarnings(input, actionCode, urgencyLevel),
    evidence: generateActionEvidence(input, actionCode),
  };
}

function valueAtLeast(value: number | undefined, threshold: number): boolean {
  return isFiniteNumber(value) && value >= threshold;
}

function valueOr(value: number | undefined, fallback: number): number {
  if (isFiniteNumber(value)) return value;
  return fallback;
}

function applyActionScoreCap(
  rawScore: number,
  input: ActionCodeInput,
  actionCode: StockActionCode,
): number {
  let score = clampScore(rawScore);

  if (actionCode === "WATCH_ONLY") score = Math.min(score, 72);
  if (actionCode === "WAIT_CONFIRMATION") score = Math.min(score, 76);
  if (actionCode === "PULLBACK_MONITOR") score = Math.min(score, 84);
  if (actionCode === "NO_CLEAR_EDGE") score = Math.min(score, 78);

  if (actionCode === "BREAKOUT_MONITOR" && !hasStrongBreakoutConfirmation(input)) {
    score = Math.min(score, 86);
  }

  if (actionCode === "TRUE_BREAKOUT_MONITOR" && !hasStrongBreakoutConfirmation(input)) {
    score = Math.min(score, 90);
  }

  if (actionCode === "VWAP_SUPPORT_MONITOR" && !hasExceptionalVwapSupportMonitor(input)) {
    if (valueOr(input.vwapScore, 50) < 65 || valueOr(input.volumeScore, 50) < 65) {
      score = Math.min(score, 82);
    } else {
      score = Math.min(score, 85);
    }
  }

  if (monitorActionCodes.includes(actionCode) && !hasExceptionalMonitorConfirmation(input)) {
    score = Math.min(score, 88);
  }

  if (riskActionCodes.includes(actionCode) && score >= 95 && !hasAlignedRiskConfirmation(input)) {
    score = 94;
  }

  if (riskActionCodes.includes(actionCode)) {
    const matchingRiskScore = getMatchingRiskMetric(input, actionCode);

    if (input.riskScore < 60) score = Math.min(score, 88);
    if (input.riskScore < 65 && input.confidenceScore < 65) score = Math.min(score, 90);
    if (!(input.riskScore >= 70 && matchingRiskScore >= 80)) score = Math.min(score, 94);
    if (
      ["FALSE_BREAKOUT_CAUTION", "TREND_COLLAPSE_CHECK", "VWAP_BREAKDOWN_CHECK", "OVERHEAT_CAUTION"].includes(
        actionCode,
      ) &&
      !(matchingRiskScore >= 75 && input.riskScore >= 65 && (input.confidenceScore >= 60 || input.stateScore >= 85))
    ) {
      score = Math.min(score, 90);
    }
  }

  if (score >= 100 && !hasExceptionalMonitorConfirmation(input) && !hasAlignedRiskConfirmation(input)) {
    score = 95;
  }

  return clampScore(score);
}

function hasStrongBreakoutConfirmation(input: ActionCodeInput): boolean {
  return (
    valueOr(input.vwapScore, 50) >= 70 &&
    valueOr(input.volumeScore, 50) >= 70 &&
    input.confidenceScore >= 70 &&
    input.riskScore < 55 &&
    input.isAboveVwap === true &&
    !valueAtLeast(input.distributionRiskScore, 60)
  );
}

function hasExceptionalVwapSupportMonitor(input: ActionCodeInput): boolean {
  return (
    input.isAboveVwap === true &&
    valueOr(input.vwapScore, 50) >= 75 &&
    valueOr(input.volumeScore, 50) >= 70 &&
    input.confidenceScore >= 70 &&
    input.riskScore < 45
  );
}

function hasExceptionalMonitorConfirmation(input: ActionCodeInput): boolean {
  return hasStrongBreakoutConfirmation(input) || hasExceptionalVwapSupportMonitor(input);
}

function hasAlignedRiskConfirmation(input: ActionCodeInput): boolean {
  const confirmationCount = [
    input.riskScore >= 80,
    valueAtLeast(input.distributionRiskScore, 75),
    valueAtLeast(input.vwapBreakdownRiskScore, 70),
    valueAtLeast(input.trendCollapseRiskScore, 70),
    valueAtLeast(input.volatilityRiskScore, 70),
    valueAtLeast(input.overheatingRiskScore, 75),
    valueAtLeast(input.lowLiquidityOrWeakParticipationRiskScore, 75),
  ].filter(Boolean).length;

  return confirmationCount >= 2;
}

function hasElevatedRiskMetric(input: ActionCodeInput): boolean {
  return (
    valueAtLeast(input.distributionRiskScore, 65) ||
    valueAtLeast(input.vwapBreakdownRiskScore, 65) ||
    valueAtLeast(input.trendCollapseRiskScore, 65) ||
    valueAtLeast(input.volatilityRiskScore, 70) ||
    valueAtLeast(input.overheatingRiskScore, 70)
  );
}

function getMatchingRiskMetric(input: ActionCodeInput, actionCode: StockActionCode): number {
  if (actionCode === "TREND_COLLAPSE_CHECK") return valueOr(input.trendCollapseRiskScore, 0);
  if (actionCode === "FALSE_BREAKOUT_CAUTION") return valueOr(input.distributionRiskScore, 0);
  if (actionCode === "VWAP_BREAKDOWN_CHECK") return valueOr(input.vwapBreakdownRiskScore, 0);
  if (actionCode === "OVERHEAT_CAUTION") return valueOr(input.overheatingRiskScore, 0);
  if (actionCode === "HIGH_RISK_MOMENTUM_CAUTION") {
    return Math.max(
      valueOr(input.volatilityRiskScore, 0),
      valueOr(input.distributionRiskScore, 0),
      valueOr(input.overheatingRiskScore, 0),
    );
  }
  if (actionCode === "RISK_CHECK_REQUIRED") return input.riskScore;
  if (actionCode === "WEAK_PARTICIPATION_CHECK") {
    return valueOr(input.lowLiquidityOrWeakParticipationRiskScore, 0);
  }

  return input.riskScore;
}
