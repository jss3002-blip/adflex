import { clampScore, isFiniteNumber } from "./normalize";

export type StockStateType =
  | "STRONG_UPTREND"
  | "BREAKOUT_ATTEMPT"
  | "TRUE_BREAKOUT_CANDIDATE"
  | "FALSE_BREAKOUT_RISK"
  | "SHORT_TERM_OVERHEATED"
  | "VWAP_SUPPORT_HOLDING"
  | "VWAP_BREAKDOWN_WARNING"
  | "PULLBACK_SETUP"
  | "BOTTOM_REBOUND_ATTEMPT"
  | "TREND_COLLAPSE_RISK"
  | "WEAK_PARTICIPATION"
  | "SIDEWAYS_NEUTRAL"
  | "HIGH_RISK_MOMENTUM"
  | "WATCHLIST";

export type StockStateClassificationInput = {
  ohlcScore: number;
  volumeScore: number;
  vwapScore: number;
  riskScore: number;
  closePositionScore?: number;
  week52PositionScore?: number;
  previousCloseChangePercent?: number;
  intradayRangePercent?: number;
  upperWickRatio?: number;
  lowerWickRatio?: number;
  volumeRatio20d?: number;
  volumeExpansionScore?: number;
  volumeRiskScore?: number;
  isAboveVwap?: boolean;
  isNearVwap?: boolean;
  vwapDistancePercent?: number;
  vwapRiskScore?: number;
  overheatingRiskScore?: number;
  volatilityRiskScore?: number;
  distributionRiskScore?: number;
  vwapBreakdownRiskScore?: number;
  lowLiquidityOrWeakParticipationRiskScore?: number;
  trendCollapseRiskScore?: number;
};

export type StockStateClassificationResult = {
  primaryState: StockStateType;
  secondaryStates: StockStateType[];
  stateScore: number;
  confidenceScore: number;
  riskAdjustedScore: number;
  summary: string;
  warnings: string[];
  evidence: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
};

type StateCandidate = {
  state: StockStateType;
  score: number;
};

function valueOr(value: number | undefined, fallback: number): number {
  return isFiniteNumber(value) ? value : fallback;
}

function addIf(condition: boolean, points: number): number {
  return condition ? points : 0;
}

function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

function hasScore(value: number | undefined, min: number): boolean {
  return isFiniteNumber(value) && value >= min;
}

function lowScore(value: number | undefined, max: number): boolean {
  return isFiniteNumber(value) && value <= max;
}

export function classifyStrongUptrend(input: StockStateClassificationInput): number {
  let score = 0;
  score += addIf(input.ohlcScore >= 75, 25);
  score += addIf(input.volumeScore >= 65, 20);
  score += addIf(input.vwapScore >= 65, 20);
  score += addIf(input.riskScore < 65, 15);
  score += addIf(input.isAboveVwap === true, 10);
  score += addIf(!isFiniteNumber(input.closePositionScore) || input.closePositionScore >= 60, 10);
  return clampScore(score);
}

export function classifyBreakoutAttempt(input: StockStateClassificationInput): number {
  let score = 0;
  score += addIf(hasScore(input.week52PositionScore, 80), 25);
  score += addIf(input.ohlcScore >= 65, 20);
  score += addIf(input.volumeScore >= 60, 15);
  score += addIf(!isFiniteNumber(input.volumeRatio20d) || input.volumeRatio20d >= 120, 15);
  score += addIf(input.riskScore < 75, 15);
  score += addIf(input.vwapScore >= 55, 10);
  return clampScore(score);
}

export function classifyTrueBreakoutCandidate(input: StockStateClassificationInput): number {
  let score = 0;
  score += addIf(hasScore(input.week52PositionScore, 85), 18);
  score += addIf(hasScore(input.closePositionScore, 70), 18);
  score += addIf(input.volumeScore >= 70, 15);
  score += addIf(!isFiniteNumber(input.volumeRatio20d) || input.volumeRatio20d >= 150, 14);
  score += addIf(input.isAboveVwap === true, 14);
  score += addIf(input.vwapScore >= 65, 10);
  score += addIf(!hasScore(input.distributionRiskScore, 60), 6);
  score += addIf(input.riskScore < 70, 5);
  return clampScore(score);
}

export function classifyFalseBreakoutRisk(input: StockStateClassificationInput): number {
  let score = 0;
  score += addIf(hasScore(input.distributionRiskScore, 70), 28);
  score += addIf(hasScore(input.upperWickRatio, 35), 18);
  score += addIf(lowScore(input.closePositionScore, 50), 18);
  score += addIf(!isFiniteNumber(input.volumeRatio20d) || input.volumeRatio20d >= 180, 16);
  score += addIf(input.riskScore >= 65, 20);
  return clampScore(score);
}

export function classifyShortTermOverheated(input: StockStateClassificationInput): number {
  let score = 0;
  score += addIf(hasScore(input.overheatingRiskScore, 70), 28);
  score += addIf(hasScore(input.previousCloseChangePercent, 5), 18);
  score += addIf(hasScore(input.vwapDistancePercent, 7), 18);
  score += addIf(hasScore(input.week52PositionScore, 85), 16);
  score += addIf(hasScore(input.volatilityRiskScore, 60), 12);
  score += addIf(input.riskScore >= 65, 8);
  return clampScore(score);
}

export function classifyVwapSupportHolding(input: StockStateClassificationInput): number {
  let score = 0;
  score += addIf(input.isAboveVwap === true, 25);
  score += addIf(
    input.isNearVwap === true ||
      (isFiniteNumber(input.vwapDistancePercent) &&
        input.vwapDistancePercent >= 0 &&
        input.vwapDistancePercent <= 3),
    20,
  );
  score += addIf(hasScore(input.closePositionScore, 50), 20);
  score += addIf(!hasScore(input.vwapRiskScore, 55), 20);
  score += addIf(input.riskScore < 65, 15);
  return clampScore(score);
}

export function classifyVwapBreakdownWarning(input: StockStateClassificationInput): number {
  let score = 0;
  score += addIf(input.isAboveVwap === false, 25);
  score += addIf(hasScore(input.vwapBreakdownRiskScore, 65), 25);
  score += addIf(lowScore(input.closePositionScore, 45), 18);
  score += addIf(
    !isFiniteNumber(input.vwapDistancePercent) || input.vwapDistancePercent <= -2,
    12,
  );
  score += addIf(input.riskScore >= 60, 20);
  return clampScore(score);
}

export function classifyPullbackSetup(input: StockStateClassificationInput): number {
  let score = 0;
  score += addIf(inRange(input.ohlcScore, 45, 70), 22);
  score += addIf(input.volumeScore >= 45, 16);
  score += addIf(inRange(input.riskScore, 35, 65), 18);
  score += addIf(input.isAboveVwap === true || input.isNearVwap === true, 18);
  score += addIf(
    !isFiniteNumber(input.closePositionScore) || inRange(input.closePositionScore, 35, 65),
    16,
  );
  score += addIf(!hasScore(input.distributionRiskScore, 65), 10);
  return clampScore(score);
}

export function classifyBottomReboundAttempt(input: StockStateClassificationInput): number {
  let score = 0;
  score += addIf(lowScore(input.week52PositionScore, 25), 22);
  score += addIf(hasScore(input.closePositionScore, 55), 20);
  score += addIf(!isFiniteNumber(input.lowerWickRatio) || input.lowerWickRatio >= 25, 16);
  score += addIf(input.volumeScore >= 45, 14);
  score += addIf(!hasScore(input.trendCollapseRiskScore, 70), 14);
  score += addIf(input.riskScore < 75, 14);
  return clampScore(score);
}

export function classifyTrendCollapseRisk(input: StockStateClassificationInput): number {
  let score = 0;
  score += addIf(hasScore(input.trendCollapseRiskScore, 70), 25);
  score += addIf(input.ohlcScore <= 40, 18);
  score += addIf(input.isAboveVwap === false, 18);
  score += addIf(lowScore(input.closePositionScore, 35), 16);
  score += addIf(
    !isFiniteNumber(input.previousCloseChangePercent) || input.previousCloseChangePercent <= -3,
    8,
  );
  score += addIf(input.riskScore >= 70, 15);
  return clampScore(score);
}

export function classifyWeakParticipation(input: StockStateClassificationInput): number {
  let score = 0;
  score += addIf(hasScore(input.lowLiquidityOrWeakParticipationRiskScore, 65), 30);
  score += addIf(input.volumeScore <= 40, 25);
  score += addIf(!isFiniteNumber(input.volumeRatio20d) || input.volumeRatio20d < 80, 25);
  score += addIf(input.ohlcScore < 75, 20);
  return clampScore(score);
}

export function classifyHighRiskMomentum(input: StockStateClassificationInput): number {
  let score = 0;
  score += addIf(input.ohlcScore >= 65, 16);
  score += addIf(input.volumeScore >= 65, 16);
  score += addIf(input.vwapScore >= 55, 12);
  score += addIf(input.riskScore >= 70, 24);
  score += addIf(
    hasScore(input.volatilityRiskScore, 65) ||
      hasScore(input.distributionRiskScore, 65) ||
      hasScore(input.overheatingRiskScore, 70),
    32,
  );
  return clampScore(score);
}

export function classifySidewaysNeutral(input: StockStateClassificationInput): number {
  const baseMatch =
    inRange(input.ohlcScore, 40, 60) &&
    inRange(input.volumeScore, 35, 60) &&
    inRange(input.vwapScore, 40, 60) &&
    inRange(input.riskScore, 35, 60);

  if (!baseMatch) return 20;
  return 68;
}

export function classifyWatchlist(input: StockStateClassificationInput): number {
  const moderateSignalCount = [
    input.ohlcScore >= 60,
    input.volumeScore >= 55,
    input.vwapScore >= 55,
  ].filter(Boolean).length;

  let score = 30;
  score += moderateSignalCount * 15;
  score += addIf(input.riskScore < 75, 20);
  score += addIf(input.riskScore < 60, 10);
  score -= addIf(input.ohlcScore >= 75 && input.volumeScore >= 65 && input.vwapScore >= 65, 12);
  return clampScore(score);
}

export function classifyState(
  input: StockStateClassificationInput,
): StockStateClassificationResult {
  const candidates: StateCandidate[] = [
    { state: "STRONG_UPTREND", score: classifyStrongUptrend(input) },
    { state: "BREAKOUT_ATTEMPT", score: classifyBreakoutAttempt(input) },
    { state: "TRUE_BREAKOUT_CANDIDATE", score: classifyTrueBreakoutCandidate(input) },
    { state: "FALSE_BREAKOUT_RISK", score: classifyFalseBreakoutRisk(input) },
    { state: "SHORT_TERM_OVERHEATED", score: classifyShortTermOverheated(input) },
    { state: "VWAP_SUPPORT_HOLDING", score: classifyVwapSupportHolding(input) },
    { state: "VWAP_BREAKDOWN_WARNING", score: classifyVwapBreakdownWarning(input) },
    { state: "PULLBACK_SETUP", score: classifyPullbackSetup(input) },
    { state: "BOTTOM_REBOUND_ATTEMPT", score: classifyBottomReboundAttempt(input) },
    { state: "TREND_COLLAPSE_RISK", score: classifyTrendCollapseRisk(input) },
    { state: "WEAK_PARTICIPATION", score: classifyWeakParticipation(input) },
    { state: "SIDEWAYS_NEUTRAL", score: classifySidewaysNeutral(input) },
    { state: "HIGH_RISK_MOMENTUM", score: classifyHighRiskMomentum(input) },
    { state: "WATCHLIST", score: classifyWatchlist(input) },
  ];

  const sorted = [...candidates].sort((a, b) => priorityAdjustedScore(b, input) - priorityAdjustedScore(a, input));
  const primary = sorted[0] ? sorted[0] : { state: "SIDEWAYS_NEUTRAL" as const, score: 50 };
  const secondaryStates = sorted
    .filter((candidate) => candidate.state !== primary.state && candidate.score >= 55)
    .slice(0, 4)
    .map((candidate) => candidate.state);

  const secondScore = sorted[1] ? sorted[1].score : 0;
  const confidenceScore = calculateClassificationConfidence(primary.score, secondScore);
  const riskAdjustedScore = clampScore(
    input.ohlcScore * 0.3 + input.volumeScore * 0.25 + input.vwapScore * 0.25 - input.riskScore * 0.2,
  );

  const warnings = buildWarnings(primary.state, input);
  const evidence = buildEvidence(input, primary.state);

  return {
    primaryState: primary.state,
    secondaryStates,
    stateScore: clampScore(primary.score),
    confidenceScore,
    riskAdjustedScore,
    summary: buildSummary(primary.state, input),
    warnings,
    evidence,
  };
}

function priorityAdjustedScore(
  candidate: StateCandidate,
  input: StockStateClassificationInput,
): number {
  let adjusted = candidate.score;

  if (
    candidate.state === "HIGH_RISK_MOMENTUM" &&
    candidate.score >= 75 &&
    !(classifyStrongUptrend(input) >= candidate.score + 12 && input.riskScore < 65)
  ) {
    adjusted += 20;
  }

  if (
    ["FALSE_BREAKOUT_RISK", "TREND_COLLAPSE_RISK", "VWAP_BREAKDOWN_WARNING"].includes(
      candidate.state,
    ) &&
    candidate.score >= 75
  ) {
    adjusted += 18;
  }

  if (candidate.state === "SHORT_TERM_OVERHEATED" && candidate.score >= 75 && input.riskScore >= 70) {
    adjusted += 12;
  }

  return adjusted;
}

function calculateClassificationConfidence(topScore: number, secondScore: number): number {
  const gap = topScore - secondScore;

  if (topScore >= 75 && gap >= 15) return 85;
  if (topScore >= 65 && gap >= 8) return 70;
  if (topScore >= 55) return 58;
  return 45;
}

function buildSummary(state: StockStateType, input: StockStateClassificationInput): string {
  switch (state) {
    case "STRONG_UPTREND":
      return "현재 구조는 강한 상승 흐름에 가까우나, 리스크 점수와 거래량 지속 여부를 함께 확인해야 합니다.";
    case "BREAKOUT_ATTEMPT":
      return "돌파 시도 조건은 존재하지만, 돌파 유지력과 거래량 확인이 아직 중요합니다.";
    case "TRUE_BREAKOUT_CANDIDATE":
      return "돌파 후보 조건이 비교적 뚜렷하나, 가짜 돌파와 상단 매물 소화 여부를 함께 점검해야 합니다.";
    case "FALSE_BREAKOUT_RISK":
      return "상단 매물 소화 또는 가짜 돌파 가능성을 함께 점검해야 하는 구간입니다.";
    case "SHORT_TERM_OVERHEATED":
      return "단기 과열 신호가 있어 추격성 해석보다 변동성과 유지력을 우선 확인해야 합니다.";
    case "VWAP_SUPPORT_HOLDING":
      return "VWAP 부근에서 가격이 유지되는 흐름이 관찰되며, 지지 지속 여부를 확인해야 합니다.";
    case "VWAP_BREAKDOWN_WARNING":
      return "VWAP 이탈 여부를 확인해야 하는 구간이며, 단기 수급 약화 가능성을 점검해야 합니다.";
    case "PULLBACK_SETUP":
      return "눌림 구조 가능성은 있으나, 지지선과 VWAP 회복 여부를 확인해야 합니다.";
    case "BOTTOM_REBOUND_ATTEMPT":
      return "저점 반등 시도 가능성이 있으나, 기술적 반등에 그칠 위험도 함께 확인해야 합니다.";
    case "TREND_COLLAPSE_RISK":
      return "추세 붕괴 위험이 커지고 있어 상태 유지 조건과 리스크 게이트를 우선 확인해야 합니다.";
    case "WEAK_PARTICIPATION":
      return "거래 참여가 약해 가격 신호의 신뢰도를 보수적으로 해석해야 합니다.";
    case "HIGH_RISK_MOMENTUM":
      return "가격과 거래량 흐름은 강하지만 리스크도 높아 고위험 모멘텀 구간으로 해석됩니다.";
    case "WATCHLIST":
      return "관심 종목으로 추적할 수 있으나 리스크 조건 확인이 필요합니다.";
    case "SIDEWAYS_NEUTRAL":
    default:
      return `가격, 거래량, VWAP 흐름이 뚜렷하게 한쪽으로 기울지 않은 중립 구간입니다. 리스크 점수 ${valueOr(input.riskScore, 50).toFixed(0)}점을 함께 확인해야 합니다.`;
  }
}

function buildWarnings(state: StockStateType, input: StockStateClassificationInput): string[] {
  const warnings: string[] = [];

  if (state === "FALSE_BREAKOUT_RISK") warnings.push("가짜 돌파 또는 고점 분배 가능성이 높은 상태입니다.");
  if (state === "TREND_COLLAPSE_RISK") warnings.push("추세 붕괴 위험이 우선 확인 대상입니다.");
  if (state === "HIGH_RISK_MOMENTUM") warnings.push("강한 모멘텀과 높은 리스크가 동시에 나타납니다.");
  if (state === "VWAP_BREAKDOWN_WARNING") warnings.push("VWAP 이탈 또는 평균 단가 하회 위험을 점검해야 합니다.");
  if (input.riskScore >= 80) warnings.push("종합 리스크 점수가 매우 높아 보수적인 해석이 필요합니다.");
  else if (input.riskScore >= 65) warnings.push("종합 리스크 점수가 중간 이상으로 상승했습니다.");
  if (hasScore(input.distributionRiskScore, 75)) warnings.push("분배 또는 가짜 돌파 위험 점수가 높습니다.");
  if (hasScore(input.vwapBreakdownRiskScore, 70)) warnings.push("VWAP 약세 위험 점수가 높습니다.");
  if (hasScore(input.trendCollapseRiskScore, 70)) warnings.push("추세 붕괴 위험 점수가 높습니다.");
  if (hasScore(input.volatilityRiskScore, 70)) warnings.push("장중 변동성 위험 점수가 높습니다.");
  if (hasScore(input.overheatingRiskScore, 75)) warnings.push("단기 과열 위험 점수가 높습니다.");

  return warnings;
}

function buildEvidence(
  input: StockStateClassificationInput,
  primaryState: StockStateType,
): StockStateClassificationResult["evidence"] {
  const evidence: StockStateClassificationResult["evidence"] = {
    positive: [],
    negative: [],
    neutral: [],
  };

  if (input.ohlcScore >= 65 && input.volumeScore >= 60) {
    evidence.positive.push("가격 점수와 거래량 점수가 동시에 양호하여 상승 흐름의 기본 조건이 확인됩니다.");
  }

  if (input.isAboveVwap === true) {
    evidence.positive.push("VWAP 위에서 가격이 유지되어 단기 매수세 유지 가능성이 있습니다.");
  }

  if (input.riskScore < 65) {
    evidence.positive.push("리스크 점수가 과도하게 높지 않아 현재 구조가 급격히 훼손된 상태는 아닙니다.");
  } else {
    evidence.negative.push("리스크 점수가 높아 추격 판단에는 주의가 필요합니다.");
  }

  if (hasScore(input.upperWickRatio, 35) && hasScore(input.volumeRatio20d, 150)) {
    evidence.negative.push("윗꼬리 비율과 거래량 증가가 동시에 나타나 고점 분배 또는 가짜 돌파 가능성이 있습니다.");
  }

  if (input.isAboveVwap === false && lowScore(input.closePositionScore, 45)) {
    evidence.negative.push("VWAP 아래에서 종가 위치가 약해 단기 수급 이탈 위험이 있습니다.");
  }

  if (lowScore(input.week52PositionScore, 15) && lowScore(input.closePositionScore, 40)) {
    evidence.negative.push("52주 저점 부근에서 약한 종가가 나타나 추세 붕괴 위험을 점검해야 합니다.");
  }

  if (
    primaryState === "SIDEWAYS_NEUTRAL" ||
    primaryState === "WATCHLIST" ||
    Math.abs(input.ohlcScore - input.volumeScore) >= 20
  ) {
    evidence.neutral.push("일부 점수는 양호하지만 상태 분류를 확정하기에는 추가 확인이 필요합니다.");
  }

  if (input.isNearVwap === true) {
    evidence.neutral.push("VWAP 근처에서 방향성이 확정되지 않은 중립 구간입니다.");
  }

  if (evidence.neutral.length === 0) {
    evidence.neutral.push("가격 흐름과 거래량 흐름이 완전히 일치하는지 추가 확인이 필요합니다.");
  }

  return evidence;
}
