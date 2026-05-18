import type { StockAnalysisInput as EngineStockAnalysisInput } from "./types";
import { clampScore, isFiniteNumber } from "./normalize";
import { scoreOHLC, type OHLCScoreResult } from "./scoreOHLC";
import { scoreVolume, type VolumeScoreResult } from "./scoreVolume";
import { scoreVWAP, type VWAPScoreResult } from "./scoreVWAP";
import { scoreRisk, type RiskScoreContext, type RiskScoreResult } from "./scoreRisk";
import {
  classifyState,
  type StockStateClassificationInput,
  type StockStateClassificationResult,
} from "./classifyState";
import { getActionCode, type ActionCodeInput, type ActionCodeResult } from "./actionCode";
import { analyzeSignalConflicts, type SignalConflictResult } from "./scoreConflict";
import { analyzeFalseSignalRisk, type FalseSignalResult } from "./scoreFalseSignal";
import { analyzeRiskGateOverlay, type RiskGateOverlayResult } from "./riskGateOverlay";

export type StockAnalysisInput = EngineStockAnalysisInput;

export type StockAnalysisGrade =
  | "EXCELLENT_STRUCTURE"
  | "GOOD_STRUCTURE"
  | "NEUTRAL_STRUCTURE"
  | "CAUTION_STRUCTURE"
  | "HIGH_RISK_STRUCTURE"
  | "UNCLEAR_STRUCTURE";

export type StockAnalysisResult = {
  normalized: ReturnType<typeof normalizeStockInput>;
  ohlc: ReturnType<typeof scoreOHLC>;
  volume: ReturnType<typeof scoreVolume>;
  vwap: ReturnType<typeof scoreVWAP>;
  risk: ReturnType<typeof scoreRisk>;
  state: ReturnType<typeof classifyState>;
  action: ReturnType<typeof getActionCode>;
  conflictAnalysis?: SignalConflictResult;
  falseSignalAnalysis?: FalseSignalResult;
  riskGateOverlay: RiskGateOverlayResult;
  finalScore: number;
  finalGrade: StockAnalysisGrade;
  summary: string;
  warnings: string[];
  evidence: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
};

type EvidenceBucket = {
  positive: string[];
  negative: string[];
  neutral: string[];
};

type EvidenceCarrier = Partial<Record<"evidence", Partial<Record<keyof EvidenceBucket, string[]>>>>;

export function normalizeStockInput(input: StockAnalysisInput): StockAnalysisInput {
  const currentPrice = positiveOr(input.currentPrice, positiveOr(input.close, 0));
  const close = positiveOr(input.close, currentPrice);
  const open = positiveOr(input.open, close);
  const previousClose = positiveOr(input.previousClose, close);
  const high = Math.max(positiveOr(input.high, close), open, close, currentPrice);
  const lowFallback = Math.min(open, close, currentPrice);
  const low = Math.min(positiveOr(input.low, lowFallback), high);

  return {
    ...input,
    currentPrice,
    previousClose,
    open,
    high,
    low,
    close,
    volume: nonNegativeOr(input.volume, 0),
    averageVolume20d: optionalPositive(input.averageVolume20d),
    averageVolume10d: optionalPositive(input.averageVolume10d),
    vwap: optionalPositive(input.vwap),
    week52High: optionalPositive(input.week52High),
    week52Low: optionalPositive(input.week52Low),
  };
}

export function calculateFinalScore(
  ohlcScore: number,
  volumeScore: number,
  vwapScore: number,
  riskScore: number,
  stateScore: number,
  actionScore: number,
): number {
  return clampScore(
    ohlcScore * 0.25 +
      volumeScore * 0.2 +
      vwapScore * 0.2 +
      stateScore * 0.2 +
      actionScore * 0.15 -
      riskScore * 0.2,
  );
}

export function determineFinalGrade(
  finalScore: number,
  riskScore: number,
  confidenceScore: number,
  primaryState?: string,
  actionCode?: string,
): StockAnalysisGrade {
  const hasCautionSignal = isCautionState(primaryState) || isCautionAction(actionCode);
  const hasClearStateOrAction = Boolean(primaryState || actionCode);

  if (riskScore >= 80) return "HIGH_RISK_STRUCTURE";
  if (riskScore >= 65) return "CAUTION_STRUCTURE";
  if (riskScore >= 45 && hasCautionSignal) return "CAUTION_STRUCTURE";
  if (confidenceScore < 40 && riskScore < 45 && !hasCautionSignal) return "UNCLEAR_STRUCTURE";
  if (finalScore < 40 && riskScore < 45 && !hasClearStateOrAction) return "UNCLEAR_STRUCTURE";
  if (finalScore >= 80 && riskScore < 60 && !hasCautionSignal) return "EXCELLENT_STRUCTURE";
  if (finalScore >= 65 && riskScore < 70 && !(hasCautionSignal && riskScore >= 45)) {
    return "GOOD_STRUCTURE";
  }
  if (finalScore >= 45) return "NEUTRAL_STRUCTURE";
  return hasCautionSignal ? "CAUTION_STRUCTURE" : "NEUTRAL_STRUCTURE";
}

export function buildRiskContext(
  normalized: StockAnalysisInput,
  ohlc: OHLCScoreResult,
  volume: VolumeScoreResult,
  vwap: VWAPScoreResult,
): RiskScoreContext {
  const context: RiskScoreContext = {
    closePositionScore: ohlc.closePositionScore,
    upperWickRatio: ohlc.upperWickRatio,
    lowerWickRatio: ohlc.lowerWickRatio,
    intradayRangePercent: ohlc.intradayRangePercent,
    previousCloseChangePercent: ohlc.previousCloseChangePercent,
    week52PositionScore: ohlc.week52PositionScore,
    volumeRatio20d: volume.volumeRatio20d,
    volumeRiskScore: volume.volumeRiskScore,
    vwapDistancePercent: vwap.vwapDistancePercent,
    vwapRiskScore: vwap.vwapRiskScore,
    isAboveVwap: vwap.isAboveVwap,
    isNearVwap: vwap.isNearVwap,
  };

  if (!isFiniteNumber(normalized.currentPrice)) return context;
  return context;
}

export function buildStateClassificationInput(
  normalized: StockAnalysisInput,
  ohlc: OHLCScoreResult,
  volume: VolumeScoreResult,
  vwap: VWAPScoreResult,
  risk: RiskScoreResult,
): StockStateClassificationInput {
  const stateInput: StockStateClassificationInput = {
    ohlcScore: ohlc.priceLocationScore,
    volumeScore: volume.volumeScore,
    vwapScore: vwap.vwapScore,
    riskScore: risk.riskScore,
    closePositionScore: ohlc.closePositionScore,
    week52PositionScore: ohlc.week52PositionScore,
    previousCloseChangePercent: ohlc.previousCloseChangePercent,
    intradayRangePercent: ohlc.intradayRangePercent,
    upperWickRatio: ohlc.upperWickRatio,
    lowerWickRatio: ohlc.lowerWickRatio,
    volumeRatio20d: volume.volumeRatio20d,
    volumeExpansionScore: volume.volumeActivityScore,
    volumeRiskScore: volume.volumeRiskScore,
    isAboveVwap: vwap.isAboveVwap,
    isNearVwap: vwap.isNearVwap,
    vwapDistancePercent: vwap.vwapDistancePercent,
    vwapRiskScore: vwap.vwapRiskScore,
    overheatingRiskScore: risk.overheatingRiskScore,
    volatilityRiskScore: risk.volatilityRiskScore,
    distributionRiskScore: risk.distributionRiskScore,
    vwapBreakdownRiskScore: risk.vwapBreakdownRiskScore,
    lowLiquidityOrWeakParticipationRiskScore: risk.lowLiquidityOrWeakParticipationRiskScore,
    trendCollapseRiskScore: risk.trendCollapseRiskScore,
  };

  if (!isFiniteNumber(normalized.currentPrice)) return stateInput;
  return stateInput;
}

export function buildActionCodeInput(
  state: StockStateClassificationResult,
  ohlc: OHLCScoreResult,
  volume: VolumeScoreResult,
  vwap: VWAPScoreResult,
  risk: RiskScoreResult,
): ActionCodeInput {
  return {
    primaryState: state.primaryState,
    secondaryStates: state.secondaryStates,
    stateScore: state.stateScore,
    confidenceScore: state.confidenceScore,
    riskAdjustedScore: state.riskAdjustedScore,
    riskScore: risk.riskScore,
    ohlcScore: ohlc.priceLocationScore,
    volumeScore: volume.volumeScore,
    vwapScore: vwap.vwapScore,
    closePositionScore: ohlc.closePositionScore,
    week52PositionScore: ohlc.week52PositionScore,
    previousCloseChangePercent: ohlc.previousCloseChangePercent,
    intradayRangePercent: ohlc.intradayRangePercent,
    upperWickRatio: ohlc.upperWickRatio,
    lowerWickRatio: ohlc.lowerWickRatio,
    volumeRatio20d: volume.volumeRatio20d,
    isAboveVwap: vwap.isAboveVwap,
    isNearVwap: vwap.isNearVwap,
    vwapDistancePercent: vwap.vwapDistancePercent,
    overheatingRiskScore: risk.overheatingRiskScore,
    volatilityRiskScore: risk.volatilityRiskScore,
    distributionRiskScore: risk.distributionRiskScore,
    vwapBreakdownRiskScore: risk.vwapBreakdownRiskScore,
    lowLiquidityOrWeakParticipationRiskScore: risk.lowLiquidityOrWeakParticipationRiskScore,
    trendCollapseRiskScore: risk.trendCollapseRiskScore,
  };
}

export function generateFinalSummary(
  finalGrade: StockAnalysisGrade,
  finalScore: number,
  riskScore: number,
  state: StockStateClassificationResult,
  action: ActionCodeResult,
): string {
  const scoreText = `종합 점수 ${finalScore.toFixed(0)}점, 리스크 점수 ${riskScore.toFixed(0)}점 기준입니다.`;
  const stateText = `현재 상태는 ${state.primaryState}, 대응 라벨은 ${action.actionCode}입니다.`;

  switch (finalGrade) {
    case "EXCELLENT_STRUCTURE":
      return `현재 종합 구조는 가격·거래량·VWAP 조건이 비교적 잘 맞물린 강한 흐름에 가깝습니다. ${scoreText} ${stateText}`;
    case "GOOD_STRUCTURE":
      return `현재 종합 구조는 양호한 편이며, 상태 분류와 대응 라벨이 같은 방향으로 정렬되는지 확인할 필요가 있습니다. ${scoreText} ${stateText}`;
    case "NEUTRAL_STRUCTURE":
      return `현재 종합 구조는 중립에 가까우며, 가격·거래량·VWAP 중 일부 조건의 추가 확인이 필요합니다. ${scoreText} ${stateText}`;
    case "CAUTION_STRUCTURE":
      return `현재 종합 구조에는 주의가 필요한 신호가 포함되어 있습니다. 특히 VWAP 이탈, 약한 종가 위치, 변동성 확대 여부를 함께 점검해야 합니다. ${scoreText} ${stateText}`;
    case "HIGH_RISK_STRUCTURE":
      return `현재 리스크 점수가 높아 단순한 긍정 흐름으로 해석하기 어렵습니다. 과열, 이탈, 분배 가능성을 함께 점검해야 합니다. ${scoreText} ${stateText}`;
    case "UNCLEAR_STRUCTURE":
    default:
      return `현재 점수 조합만으로는 명확한 우위나 위험 방향을 단정하기 어렵습니다. 추가 데이터와 다음 흐름 확인이 필요합니다. ${scoreText} ${stateText}`;
  }
}

export function mergeFinalWarnings(
  risk: RiskScoreResult,
  state: StockStateClassificationResult,
  action: ActionCodeResult,
): string[] {
  return uniqueStrings([...risk.warnings, ...state.warnings, ...action.warnings]);
}

export function mergeFinalEvidence(
  ohlc: OHLCScoreResult,
  volume: VolumeScoreResult,
  vwap: VWAPScoreResult,
  risk: RiskScoreResult,
  state: StockStateClassificationResult,
  action: ActionCodeResult,
): EvidenceBucket {
  const carriers: EvidenceCarrier[] = [ohlc, volume, vwap, risk, state, action];

  return {
    positive: uniqueStrings(collectEvidence(carriers, "positive")),
    negative: uniqueStrings(collectEvidence(carriers, "negative")),
    neutral: uniqueStrings(collectEvidence(carriers, "neutral")),
  };
}

export function analyzeStock(input: StockAnalysisInput): StockAnalysisResult {
  const normalized = normalizeStockInput(input);
  const ohlc = scoreOHLC(normalized);
  const volume = scoreVolume(normalized, {
    closePositionScore: ohlc.closePositionScore,
    upperWickRatio: ohlc.upperWickRatio,
  });
  const vwap = scoreVWAP(normalized, {
    closePositionScore: ohlc.closePositionScore,
    upperWickRatio: ohlc.upperWickRatio,
    volumeRatio20d: volume.volumeRatio20d,
  });
  const risk = scoreRisk(buildRiskContext(normalized, ohlc, volume, vwap));
  const state = classifyState(buildStateClassificationInput(normalized, ohlc, volume, vwap, risk));
  const action = getActionCode(buildActionCodeInput(state, ohlc, volume, vwap, risk));
  const finalScore = calculateFinalScore(
    ohlc.priceLocationScore,
    volume.volumeScore,
    vwap.vwapScore,
    risk.riskScore,
    state.stateScore,
    action.actionScore,
  );
  const finalGrade = determineFinalGrade(
    finalScore,
    risk.riskScore,
    state.confidenceScore,
    state.primaryState,
    action.actionCode,
  );
  const conflictAnalysis = analyzeSignalConflicts({
    totalScore: finalScore,
    closePositionScore: ohlc.closePositionScore,
    fiftyTwoWeekPositionScore: ohlc.week52PositionScore,
    volumeScore: volume.volumeScore,
    volumeRiskScore: volume.volumeRiskScore,
    vwapScore: vwap.vwapScore,
    vwapRiskScore: vwap.vwapRiskScore,
    totalRiskScore: risk.riskScore,
    volatilityRisk: risk.volatilityRiskScore,
    distributionRisk: risk.distributionRiskScore,
    vwapBreakdownRisk: risk.vwapBreakdownRiskScore,
    participationWeaknessRisk: risk.lowLiquidityOrWeakParticipationRiskScore,
    trendCollapseRisk: risk.trendCollapseRiskScore,
    dailyChangePercent: ohlc.previousCloseChangePercent,
    intradayRangePercent: ohlc.intradayRangePercent,
    vwapDistancePercent: vwap.vwapDistancePercent,
  });
  const falseSignalAnalysis = analyzeFalseSignalRisk({
    finalScore,
    closePositionScore: ohlc.closePositionScore,
    volumeScore: volume.volumeScore,
    volumeRiskScore: volume.volumeRiskScore,
    vwapScore: vwap.vwapScore,
    vwapRiskScore: vwap.vwapRiskScore,
    volatilityRisk: risk.volatilityRiskScore,
    distributionRisk: risk.distributionRiskScore,
    vwapBreakdownRisk: risk.vwapBreakdownRiskScore,
    trendCollapseRisk: risk.trendCollapseRiskScore,
    dailyChangePercent: ohlc.previousCloseChangePercent,
    intradayRangePercent: ohlc.intradayRangePercent,
    upperWickRatio: ohlc.upperWickRatio,
    lowerWickRatio: ohlc.lowerWickRatio,
    vwapDistancePercent: vwap.vwapDistancePercent,
  });
  const riskGateOverlay = analyzeRiskGateOverlay({
    finalScore,
    totalRiskScore: risk.riskScore,
    closePositionScore: ohlc.closePositionScore,
    fiftyTwoWeekPositionScore: ohlc.week52PositionScore,
    vwapScore: vwap.vwapScore,
    vwapRiskScore: vwap.vwapRiskScore,
    vwapBreakdownRisk: risk.vwapBreakdownRiskScore,
    trendCollapseRisk: risk.trendCollapseRiskScore,
    volatilityRisk: risk.volatilityRiskScore,
    volumeScore: volume.volumeScore,
    volumeRiskScore: volume.volumeRiskScore,
    distributionRisk: risk.distributionRiskScore,
    participationWeaknessRisk: risk.lowLiquidityOrWeakParticipationRiskScore,
    conflictScore: conflictAnalysis.conflictScore,
    falseSignalScore: falseSignalAnalysis.falseSignalScore,
    confidenceScore: state.confidenceScore,
    dailyChangePercent: ohlc.previousCloseChangePercent,
    intradayRangePercent: ohlc.intradayRangePercent,
    vwapDistancePercent: vwap.vwapDistancePercent,
    upperWickRatio: ohlc.upperWickRatio,
    marketRegime: normalized.marketRegime,
    stockType: normalized.stockType,
    dataMode: normalized.analysisMode,
    isRealtime: normalized.metadata?.isRealtime,
  });
  const customerFacingAction = {
    ...action,
    actionScore: calibrateCustomerFacingActionPriorityScore(action.actionScore, {
      actionCode: action.actionCode,
      totalRiskScore: risk.riskScore,
      confidenceScore: state.confidenceScore,
      closePositionScore: ohlc.closePositionScore,
      vwapScore: vwap.vwapScore,
      vwapBreakdownRisk: risk.vwapBreakdownRiskScore,
      trendCollapseRisk: risk.trendCollapseRiskScore,
      volatilityRisk: risk.volatilityRiskScore,
      overlayScore: riskGateOverlay.overlayScore,
      overlaySeverity: riskGateOverlay.severity,
    }),
  };

  return {
    normalized,
    ohlc,
    volume,
    vwap,
    risk,
    state,
    action: customerFacingAction,
    conflictAnalysis,
    falseSignalAnalysis,
    riskGateOverlay,
    finalScore,
    finalGrade,
    summary: generateFinalSummary(finalGrade, finalScore, risk.riskScore, state, action),
    warnings: mergeFinalWarnings(risk, state, action),
    evidence: mergeFinalEvidence(ohlc, volume, vwap, risk, state, action),
  };
}

type CustomerFacingActionPriorityContext = {
  actionCode: string;
  totalRiskScore: number;
  confidenceScore: number;
  closePositionScore: number;
  vwapScore: number;
  vwapBreakdownRisk: number;
  trendCollapseRisk: number;
  volatilityRisk: number;
  overlayScore: number;
  overlaySeverity: string;
};

function calibrateCustomerFacingActionPriorityScore(
  rawScore: number,
  context: CustomerFacingActionPriorityContext,
): number {
  let score = rawScore;

  if (isNormalCautionPriorityCluster(context)) {
    score = Math.min(score, 78);
  }

  if (context.overlayScore >= 75 && context.totalRiskScore < 60 && context.overlaySeverity !== "BLOCK") {
    score = Math.min(score, 78);
  }

  if (context.overlayScore >= 55 && context.totalRiskScore < 55 && context.confidenceScore < 70) {
    score = Math.min(score, 76);
  }

  return clampScore(score);
}

function isNormalCautionPriorityCluster(context: CustomerFacingActionPriorityContext): boolean {
  const isMonitorAction = [
    "VWAP_SUPPORT_MONITOR",
    "WAIT_CONFIRMATION",
    "WATCH_ONLY",
    "PULLBACK_MONITOR",
    "NO_CLEAR_EDGE",
  ].includes(context.actionCode);

  if (!isMonitorAction) return false;
  if (context.totalRiskScore >= 65 || context.overlaySeverity === "BLOCK") return false;

  const overlappingRiskCount = [
    context.vwapScore <= 40 || context.vwapBreakdownRisk >= 70,
    context.closePositionScore <= 30,
    context.trendCollapseRisk >= 70,
    context.volatilityRisk >= 70,
  ].filter(Boolean).length;

  return overlappingRiskCount >= 2;
}

function positiveOr(value: unknown, fallback: number): number {
  if (isFiniteNumber(value) && value > 0) return value;
  if (isFiniteNumber(fallback) && fallback > 0) return fallback;
  return 0;
}

function nonNegativeOr(value: unknown, fallback: number): number {
  if (isFiniteNumber(value) && value >= 0) return value;
  if (isFiniteNumber(fallback) && fallback >= 0) return fallback;
  return 0;
}

function optionalPositive(value: unknown): number | undefined {
  if (isFiniteNumber(value) && value > 0) return value;
  return undefined;
}

function uniqueStrings(values: string[]): string[] {
  const result: string[] = [];

  for (const value of values) {
    if (!result.includes(value)) result.push(value);
  }

  return result;
}

function collectEvidence(carriers: EvidenceCarrier[], key: keyof EvidenceBucket): string[] {
  const collected: string[] = [];

  for (const carrier of carriers) {
    const evidence = carrier.evidence;
    if (!evidence) continue;
    const values = evidence[key];
    if (!values) continue;
    collected.push(...values);
  }

  return collected;
}

function isCautionState(state: string | undefined): boolean {
  return [
    "FALSE_BREAKOUT_RISK",
    "SHORT_TERM_OVERHEATED",
    "VWAP_BREAKDOWN_WARNING",
    "TREND_COLLAPSE_RISK",
    "HIGH_RISK_MOMENTUM",
    "WEAK_PARTICIPATION",
  ].includes(state || "");
}

function isCautionAction(actionCode: string | undefined): boolean {
  return [
    "RISK_CHECK_REQUIRED",
    "FALSE_BREAKOUT_CAUTION",
    "HIGH_RISK_MOMENTUM_CAUTION",
    "VWAP_BREAKDOWN_CHECK",
    "TREND_COLLAPSE_CHECK",
    "OVERHEAT_CAUTION",
    "WEAK_PARTICIPATION_CHECK",
  ].includes(actionCode || "");
}
