import { isFiniteNumber } from "./normalize";

export type AuxiliaryCautionContext = {
  finalScore?: number;
  totalScore?: number;
  closePositionScore?: number;
  fiftyTwoWeekPositionScore?: number;
  vwapScore?: number;
  vwapRiskScore?: number;
  vwapBreakdownRisk?: number;
  trendCollapseRisk?: number;
  volatilityRisk?: number;
  intradayRangePercent?: number;
  upperWickRatio?: number;
  actionCode?: string;
  primaryState?: string;
  actionPriorityScore?: number;
};

export function valueOr(value: number | undefined, fallback: number): number {
  if (isFiniteNumber(value)) return value;
  return fallback;
}

/** 0 at or below `low`, 1 at or above `high`. */
export function gradedHigh(value: number, low: number, high: number): number {
  if (value <= low) return 0;
  if (value >= high) return 1;
  return (value - low) / (high - low);
}

/** 1 at or below `low`, 0 at or above `high` (lower score = stronger weakness). */
export function gradedLow(value: number, low: number, high: number): number {
  if (value <= low) return 1;
  if (value >= high) return 0;
  return (high - value) / (high - low);
}

export function isMonitoringActionCode(actionCode: string | undefined): boolean {
  return [
    "VWAP_SUPPORT_MONITOR",
    "WAIT_CONFIRMATION",
    "WATCH_ONLY",
    "PULLBACK_MONITOR",
    "BREAKOUT_MONITOR",
    "NO_CLEAR_EDGE",
  ].includes(actionCode || "");
}

export function isMonitoringPrimaryState(primaryState: string | undefined): boolean {
  return [
    "VWAP_SUPPORT_HOLDING",
    "BREAKOUT_ATTEMPT",
    "PULLBACK_IN_UPTREND",
    "RANGE_BOUND",
    "NEUTRAL_CONSOLIDATION",
  ].includes(primaryState || "");
}

export function hasDecentStructure(input: AuxiliaryCautionContext): number {
  const total = valueOr(input.totalScore, valueOr(input.finalScore, 0));
  const week52 = valueOr(input.fiftyTwoWeekPositionScore, 50);
  return Math.max(gradedHigh(total, 48, 58), gradedHigh(week52, 55, 68));
}

export function collectCautionSignalStrengths(input: AuxiliaryCautionContext): number[] {
  const strengths: number[] = [];

  const vwapWeakness = gradedLow(valueOr(input.vwapScore, 65), 48, 72);
  if (vwapWeakness >= 0.12) strengths.push(vwapWeakness * 0.95);

  const vwapRisk = gradedHigh(valueOr(input.vwapRiskScore, 0), 28, 58);
  if (vwapRisk >= 0.12) strengths.push(vwapRisk * 0.85);

  const vwapBreak = gradedHigh(valueOr(input.vwapBreakdownRisk, 0), 30, 68);
  if (vwapBreak >= 0.12) strengths.push(vwapBreak * 0.8);

  const closeWeakness = gradedLow(valueOr(input.closePositionScore, 65), 42, 74);
  if (closeWeakness >= 0.12) strengths.push(closeWeakness * 0.9);

  const volatilitySupport = gradedHigh(valueOr(input.volatilityRisk, 0), 38, 72);
  if (volatilitySupport >= 0.12) strengths.push(volatilitySupport * 0.55);

  const rangeSupport = gradedHigh(valueOr(input.intradayRangePercent, 0), 4.5, 9.5);
  if (rangeSupport >= 0.12) strengths.push(rangeSupport * 0.45);

  const trendRisk = gradedHigh(valueOr(input.trendCollapseRisk, 0), 22, 62);
  if (trendRisk >= 0.12) strengths.push(trendRisk * 0.5);

  const upperWick = gradedHigh(valueOr(input.upperWickRatio, 0), 18, 32);
  if (upperWick >= 0.12) strengths.push(upperWick * 0.4);

  if (isMonitoringActionCode(input.actionCode) && !isStrongCleanTrend(input)) strengths.push(0.32);
  if (isMonitoringPrimaryState(input.primaryState) && !isStrongCleanTrend(input)) strengths.push(0.18);

  const priorityNeed = gradedHigh(valueOr(input.actionPriorityScore, 0), 62, 82);
  if (priorityNeed >= 0.2) strengths.push(priorityNeed * 0.35);

  return strengths;
}

export function computeOverlapSeverity(strengths: number[]): number {
  if (strengths.length === 0) return 0;

  const average = strengths.reduce((sum, value) => sum + value, 0) / strengths.length;
  const overlapBoost = Math.min(0.28, Math.max(0, strengths.length - 2) * 0.07);
  return Math.min(1, average * (1 + overlapBoost));
}

export function scaleWatchScore(base: number, span: number, severity: number, cap: number): number {
  if (severity <= 0) return 0;
  return Math.min(cap, Math.round(base + severity * span));
}

export function isStrongCleanTrend(input: AuxiliaryCautionContext): boolean {
  return (
    valueOr(input.finalScore, valueOr(input.totalScore, 0)) >= 72 &&
    valueOr(input.vwapScore, 0) >= 68 &&
    valueOr(input.closePositionScore, 0) >= 72 &&
    valueOr(input.vwapRiskScore, 100) <= 48 &&
    valueOr(input.trendCollapseRisk, 100) <= 40 &&
    valueOr(input.vwapBreakdownRisk, 100) <= 45
  );
}

export function hasStableCleanStructure(input: AuxiliaryCautionContext): boolean {
  if (isStrongCleanTrend(input)) return true;

  const strengths = collectCautionSignalStrengths(input);
  const structure = hasDecentStructure(input);
  const monitoring =
    isMonitoringActionCode(input.actionCode) || isMonitoringPrimaryState(input.primaryState);
  const priorityHigh = valueOr(input.actionPriorityScore, 0) >= 70;

  return (
    strengths.length <= 1 &&
    structure < 0.45 &&
    !monitoring &&
    !priorityHigh &&
    valueOr(input.vwapScore, 100) >= 68 &&
    valueOr(input.vwapRiskScore, 100) <= 32 &&
    valueOr(input.closePositionScore, 100) >= 68 &&
    valueOr(input.volatilityRisk, 100) <= 42
  );
}

export function shouldEmitLowStrengthAuxiliary(input: AuxiliaryCautionContext): boolean {
  if (hasStableCleanStructure(input)) return false;

  const structure = hasDecentStructure(input);
  const strengths = collectCautionSignalStrengths(input);
  const monitoring =
    isMonitoringActionCode(input.actionCode) || isMonitoringPrimaryState(input.primaryState);
  const priorityHigh = valueOr(input.actionPriorityScore, 0) >= 68;

  if (structure < 0.28 && !priorityHigh && !monitoring) return false;
  if (strengths.length < 2 && !monitoring && !priorityHigh) return false;

  return computeOverlapSeverity(strengths) >= 0.14 || (monitoring && strengths.length >= 2);
}

export function computeDynamicWatchSeverity(input: AuxiliaryCautionContext): number {
  if (!shouldEmitLowStrengthAuxiliary(input)) return 0;

  const structure = hasDecentStructure(input);
  const strengths = collectCautionSignalStrengths(input);
  const overlap = computeOverlapSeverity(strengths);
  const monitoring =
    isMonitoringActionCode(input.actionCode) || isMonitoringPrimaryState(input.primaryState);

  let severity = structure * overlap;
  if (monitoring) severity = Math.max(severity, overlap * 0.75 + 0.08);
  if (valueOr(input.actionPriorityScore, 0) >= 75) severity = Math.max(severity, overlap * 0.7 + 0.1);

  return Math.min(1, severity);
}
