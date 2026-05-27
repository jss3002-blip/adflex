import {
  isMonitoringActionCode,
  isStrongCleanTrend,
} from "@/src/engine/auxiliarySeverity";

export type ScenarioGuidanceType = "recovery" | "neutral" | "caution";

export type DominantScenario = "recovery" | "neutral" | "caution";

export type StrategicBucket = "weak" | "mixed" | "solid" | "elevated" | "moderate" | "calm";

export type StrategicSignalSlice = {
  label: string;
  detail: string;
  bucket: StrategicBucket;
};

export type StrategicContext = {
  vwap: StrategicSignalSlice;
  close: StrategicSignalSlice;
  volume: StrategicSignalSlice;
  volatility: StrategicSignalSlice;
  week52: StrategicSignalSlice;
  evidenceSignals: string[];
  compositeHint: string;
};

export type ScenarioGuidanceItem = {
  type: ScenarioGuidanceType;
  title: string;
  who: string;
  when: string;
  where: string;
  what: string;
  why: string;
  how: string;
  strategicState: string;
  evidenceSignals: string[];
  mainText: string;
  checkText: string;
  cautionText?: string;
  prioritySignals: string[];
};

export type NextActionChecklistItem = {
  timeLabel: string;
  who: string;
  when: string;
  where: string;
  what: string;
  why: string;
  how: string;
  strategicState: string;
  evidenceSignals: string[];
  displayText: string;
  reasonText: string;
  interpretationText: string;
  priority: number;
};

export type GuidanceTheme =
  | "strong_trend"
  | "vwap_monitor"
  | "volatility_vwap_monitor"
  | "low_liquidity"
  | "false_breakout"
  | "week52_low_rebound"
  | "week52_high_breakout"
  | "general";

export type CloseStrategyTier = "low_range" | "improve" | "stability" | "defense";

export type CloseStrategyState = {
  tier: CloseStrategyTier;
  label: string;
  detail: string;
  checkPhrase: string;
  confirmTitle: string;
  bucket: StrategicBucket;
};

export type GuidanceNarrativePayload = {
  stockName?: string;
  theme: GuidanceTheme;
  dominantScenario: DominantScenario;
  dominantScenarioLabel: string;
  dominantScenarioReason: string;
  oneLineSummary: string;
  recoveryTransitionText: string;
  cautionTransitionText: string;
  checklist: NextActionChecklistItem[];
  scenarioCards: ScenarioGuidanceItem[];
  strategicContext: StrategicContext;
  evidenceSignals: string[];
  prioritySignals: string[];
  prohibitedWordingRules: string[];
  fallbackText: {
    subtitle: string;
    dominantVerdict: string;
    summary: NextTradingDayGuidance["summary"];
  };
};

export type NextTradingDayGuidance = {
  theme: GuidanceTheme;
  subtitle: string;
  topStrategyTitle: string;
  dominantScenario: DominantScenario;
  primaryScenarioLabel: string;
  dominantScenarioReason: string;
  dominantVerdict: string;
  oneLineSummary: string;
  recoveryTransitionText: string;
  cautionTransitionText: string;
  recoveryShiftCondition: string;
  cautionShiftCondition: string;
  strategicContext: StrategicContext;
  narrativePayload: GuidanceNarrativePayload;
  summary: {
    stance: string;
    improvement: string;
    caution: string;
  };
  scenarios: ScenarioGuidanceItem[];
  checklist: NextActionChecklistItem[];
  priorityChecklist: NextActionChecklistItem[];
};

type GuidanceAnalysisResult = {
  finalScore: number;
  state: { primaryState: string };
  action: { actionCode: string; actionScore: number };
  ohlc: {
    closePositionScore: number;
    week52PositionScore: number;
    intradayRangePercent: number;
    upperWickRatio: number;
    lowerWickRatio: number;
  };
  volume: { volumeScore: number; volumeRiskScore: number };
  vwap: {
    isAboveVwap: boolean;
    isNearVwap: boolean;
    vwapDistancePercent: number;
    vwapScore: number;
    vwapRiskScore: number;
  };
  risk: {
    vwapBreakdownRiskScore: number;
    volatilityRiskScore: number;
    trendCollapseRiskScore: number;
    distributionRiskScore: number;
    lowLiquidityOrWeakParticipationRiskScore: number;
    riskScore: number;
  };
  conflictAnalysis?: { conflictScore: number };
  falseSignalAnalysis?: { falseSignalScore: number };
  riskGateOverlay?: { overlayScore: number };
};

type ConfirmationCardLike = {
  categoryKey: string;
  title: string;
};

type VwapUiState = "below" | "near_above" | "clear_above";

const WHO = "개인 투자자가 다음 거래일에 무엇을 관찰할지 정리하는 안내";

function closeRecoveryConditionPhrase(closeState: CloseStrategyState): string {
  switch (closeState.tier) {
    case "low_range":
      return "마감이 저가권을 벗어나면";
    case "improve":
      return "마감 위치가 중상단으로 개선되면";
    case "stability":
      return "마감 안정성이 유지되면";
    default:
      return "마감 방어가 유지되면";
  }
}

function buildGuidanceFocusLine(
  theme: GuidanceTheme,
  vwapState: VwapUiState,
  closeState: CloseStrategyState,
): string {
  switch (theme) {
    case "volatility_vwap_monitor":
      return vwapState === "below" || closeState.tier === "low_range"
        ? "장중 반등보다 회복 흐름이 종가까지 이어지는지가 먼저입니다."
        : "장중 흔들림 이후 변동폭 완화와 마감 위치가 해석의 기준입니다.";
    case "vwap_monitor":
      return vwapState === "below"
        ? "종가까지 유지가 확인되기 전까지는 성급한 방향 판단보다 관찰이 우선입니다."
        : "지지·이탈이 갈리는 구간이므로 종가 마감이 다음 판단의 기준입니다.";
    case "strong_trend":
      return "추세는 유지되지만 상승 속도와 과열 신호를 함께 봐야 합니다.";
    case "week52_high_breakout":
      return "고점권 위치보다 돌파 이후 종가 유지가 더 중요합니다.";
    case "week52_low_rebound":
      return "저점 자체보다 반등이 이어지는지가 더 중요합니다.";
    case "low_liquidity":
      return "가격 움직임보다 거래 참여 회복이 먼저입니다.";
    case "false_breakout":
      return "장중 강세보다 종가까지 유지 여부가 더 중요합니다.";
    default:
      return "조건이 맞춰지기 전까지는 추가 확인이 우선입니다.";
  }
}

function getTopConfirmationCategory(topConfirmationCards: ConfirmationCardLike[]): string | undefined {
  return topConfirmationCards[0]?.categoryKey;
}

export function getVwapUiState(result: GuidanceAnalysisResult): VwapUiState {
  if (!result.vwap.isAboveVwap || result.vwap.vwapDistancePercent < 0) return "below";
  if (result.vwap.isNearVwap) return "near_above";
  return "clear_above";
}

function toCautionContext(result: GuidanceAnalysisResult) {
  return {
    finalScore: result.finalScore,
    closePositionScore: result.ohlc.closePositionScore,
    fiftyTwoWeekPositionScore: result.ohlc.week52PositionScore,
    vwapScore: result.vwap.vwapScore,
    vwapRiskScore: result.vwap.vwapRiskScore,
    vwapBreakdownRisk: result.risk.vwapBreakdownRiskScore,
    trendCollapseRisk: result.risk.trendCollapseRiskScore,
    volatilityRisk: result.risk.volatilityRiskScore,
    intradayRangePercent: result.ohlc.intradayRangePercent,
    upperWickRatio: result.ohlc.upperWickRatio,
    actionCode: result.action.actionCode,
    primaryState: result.state.primaryState,
    actionPriorityScore: result.action.actionScore,
  };
}

function scoreBucket(value: number, weakMax: number, solidMin: number): StrategicBucket {
  if (value <= weakMax) return "weak";
  if (value >= solidMin) return "solid";
  return "mixed";
}

export function getCloseStrategyState(closePositionScore: number): CloseStrategyState {
  if (closePositionScore <= 55) {
    return {
      tier: "low_range",
      label: "저가권 마감 압력",
      detail:
        "종가가 당일 범위 하단에 가깝게 마감되어, 다음 거래일 저가권 반복 여부가 해석의 핵심입니다.",
      checkPhrase: "종가가 저가권을 벗어나는지",
      confirmTitle: "종가 저가권 마감 확인",
      bucket: "weak",
    };
  }
  if (closePositionScore <= 70) {
    return {
      tier: "improve",
      label: "마감 위치 개선 구간",
      detail:
        "종가가 저가권으로 크게 밀린 상태는 아니므로, 다음 거래일 종가 위치가 개선되는지가 핵심입니다.",
      checkPhrase: "종가 위치가 개선되는지",
      confirmTitle: "종가 위치 개선 확인",
      bucket: "mixed",
    };
  }
  if (closePositionScore < 80) {
    return {
      tier: "stability",
      label: "종가 안정성 확인 구간",
      detail:
        "종가가 크게 약하지는 않아, 다음 거래일 마감 안정성이 유지되는지가 중요합니다.",
      checkPhrase: "종가 안정성이 유지되는지",
      confirmTitle: "종가 안정성 확인",
      bucket: "mixed",
    };
  }
  return {
    tier: "defense",
    label: "마감 방어 유지",
    detail: "종가 방어가 비교적 양호해, 다음 거래일에도 마감 방어가 이어지는지 보면 됩니다.",
    checkPhrase: "종가 방어가 유지되는지",
    confirmTitle: "종가 방어 유지 확인",
    bucket: "solid",
  };
}

export function getVwapStrategyState(vwapState: VwapUiState, result: GuidanceAnalysisResult): StrategicSignalSlice {
  if (vwapState === "below") {
    return {
      label: "평균 거래 단가 아래 체류",
      detail:
        "현재는 평균 거래 단가 아래에서 회복 여부를 확인해야 하는 구간입니다.",
      bucket: "weak",
    };
  }
  if (vwapState === "near_above") {
    return {
      label: "평균 거래 단가 부근 혼조",
      detail:
        "현재는 평균 거래 단가 부근에서 지지 여부가 완전히 확인되지 않았습니다.",
      bucket: "mixed",
    };
  }
  return {
    label: "평균 거래 단가 위 유지",
    detail: "평균 거래 단가 위 유지가 확인되어, 이탈 여부가 다음 해석의 핵심입니다.",
    bucket: result.vwap.vwapRiskScore >= 45 ? "mixed" : "solid",
  };
}

export function getVolatilityStrategyState(result: GuidanceAnalysisResult): StrategicSignalSlice {
  const elevated =
    result.risk.volatilityRiskScore >= 55 || result.ohlc.intradayRangePercent >= 7.5;
  if (elevated) {
    return {
      label: "장중 흔들림 확대",
      detail:
        "장중 흔들림이 컸기 때문에 고점보다 종가 안정성과 변동폭 완화가 더 중요한 확인 기준입니다.",
      bucket: "elevated",
    };
  }
  if (result.risk.volatilityRiskScore >= 38) {
    return {
      label: "변동성 보통",
      detail: "변동성은 보조 확인 항목이며, VWAP·종가·거래 참여가 우선입니다.",
      bucket: "moderate",
    };
  }
  return {
    label: "변동성 안정",
    detail: "변동성 자체보다 가격 구조와 거래 참여가 해석의 중심입니다.",
    bucket: "calm",
  };
}

export function getVolumeStrategyState(result: GuidanceAnalysisResult): StrategicSignalSlice {
  const bucket = scoreBucket(result.volume.volumeScore, 44, 58);
  if (bucket === "weak") {
    return {
      label: "거래 참여 부족",
      detail:
        "거래 참여가 약해 가격만으로는 움직임 신뢰도를 높이기 어렵습니다.",
      bucket: "weak",
    };
  }
  if (bucket === "solid") {
    return {
      label: "거래 참여 양호",
      detail: "거래 참여가 가격 흐름을 어느 정도 뒷받침하고 있습니다.",
      bucket: "solid",
    };
  }
  return {
    label: "거래 참여 보통",
    detail:
      "거래 참여는 유지되지만, 가격 회복을 강하게 확증할 정도는 아닙니다.",
    bucket: "mixed",
  };
}

function isVolatilityElevated(result: GuidanceAnalysisResult): boolean {
  return result.risk.volatilityRiskScore >= 55 || result.ohlc.intradayRangePercent >= 7.5;
}

function isVwapStressed(vwapState: VwapUiState, result: GuidanceAnalysisResult): boolean {
  return (
    vwapState === "below" ||
    vwapState === "near_above" ||
    result.vwap.vwapRiskScore >= 45 ||
    result.risk.vwapBreakdownRiskScore >= 45
  );
}

/** VWAP + weak close + intraday swing — primary monitor case (e.g. Samsung-like). */
export function isVwapCloseVolatilityDominant(
  result: GuidanceAnalysisResult,
  vwapState: VwapUiState,
  topConfirmationCards: ConfirmationCardLike[] = [],
): boolean {
  const topCat = getTopConfirmationCategory(topConfirmationCards);
  const weakClose =
    result.ohlc.closePositionScore <= 55 ||
    (result.ohlc.closePositionScore <= 72 &&
      (topCat === "close" || topCat === "volatility"));
  const vwapStress = isVwapStressed(vwapState, result);
  const volRelevant =
    isVolatilityElevated(result) ||
    result.ohlc.intradayRangePercent >= 6 ||
    result.risk.volatilityRiskScore >= 45 ||
    topCat === "volatility";
  return vwapStress && weakClose && volRelevant;
}

function isSevereFalseBreakout(result: GuidanceAnalysisResult): boolean {
  const falseScore = result.falseSignalAnalysis?.falseSignalScore || 0;
  return (
    result.state.primaryState === "FALSE_BREAKOUT_RISK" ||
    falseScore >= 50 ||
    (falseScore >= 40 && result.ohlc.upperWickRatio >= 28)
  );
}

export function getWeek52StrategyState(result: GuidanceAnalysisResult): StrategicSignalSlice {
  const w52 = result.ohlc.week52PositionScore;
  if (w52 >= 75) {
    return {
      label: "52주 상단권",
      detail: "고점권에 있어 돌파 품질·윗꼬리·종가 유지가 해석의 핵심입니다.",
      bucket: "solid",
    };
  }
  if (w52 <= 35) {
    return {
      label: "52주 하단권",
      detail: "저점권 반등 신뢰도와 VWAP·거래량 동반이 회복 해석의 핵심입니다.",
      bucket: "weak",
    };
  }
  return {
    label: "52주 중간권",
    detail: "52주 위치보다 당일 VWAP·종가·거래량 구조가 우선입니다.",
    bucket: "mixed",
  };
}

function isBreakoutQualityDominant(
  result: GuidanceAnalysisResult,
  topConfirmationCards: ConfirmationCardLike[],
  vwapState: VwapUiState,
): boolean {
  if (isVwapCloseVolatilityDominant(result, vwapState, topConfirmationCards)) return false;

  const topCat = getTopConfirmationCategory(topConfirmationCards);
  const w52High = result.ohlc.week52PositionScore >= 75;
  const upperWickSignificant = result.ohlc.upperWickRatio >= 22;
  const falseElevated = (result.falseSignalAnalysis?.falseSignalScore || 0) >= 35;
  const distributionElevated = result.risk.distributionRiskScore >= 50;

  if (!w52High) return false;
  if (isVwapStressed(vwapState, result) && isVolatilityElevated(result)) return false;
  if (topCat === "vwap" || topCat === "vwapFake" || topCat === "volatility") return false;

  if (topCat === "vwapFake" && falseElevated) return true;
  if (
    result.state.primaryState === "BREAKOUT_ATTEMPT" ||
    result.state.primaryState === "TRUE_BREAKOUT_CANDIDATE"
  ) {
    return upperWickSignificant || falseElevated || distributionElevated;
  }
  return w52High && (upperWickSignificant || falseElevated) && topCat !== "vwap";
}

export function buildStrategicContext(
  result: GuidanceAnalysisResult,
  theme: GuidanceTheme,
  vwapState: VwapUiState,
): StrategicContext {
  const evidenceSignals: string[] = [];
  const vwap = getVwapStrategyState(vwapState, result);
  const closeState = getCloseStrategyState(result.ohlc.closePositionScore);
  const close: StrategicSignalSlice = {
    label: closeState.label,
    detail: closeState.detail,
    bucket: closeState.bucket,
  };
  const volume = getVolumeStrategyState(result);
  const volatility = getVolatilityStrategyState(result);

  if (vwapState === "below") evidenceSignals.push("VWAP 하방");
  if (vwapState === "near_above") evidenceSignals.push("VWAP 근접");
  if (closeState.tier === "low_range") evidenceSignals.push("약한 종가");
  if (volume.bucket === "weak") evidenceSignals.push("거래량 약세");
  if (volatility.bucket === "elevated") evidenceSignals.push("변동성 확대");

  const week52 = getWeek52StrategyState(result);
  if (week52.label === "52주 상단권") evidenceSignals.push("52주 상단");
  if (week52.label === "52주 하단권") evidenceSignals.push("52주 하단");

  if ((result.falseSignalAnalysis?.falseSignalScore || 0) >= 30) {
    evidenceSignals.push("회복 신뢰도 점검");
  }
  if ((result.riskGateOverlay?.overlayScore || 0) >= 15) {
    evidenceSignals.push("해석 제한 게이트");
  }
  if (
    result.ohlc.upperWickRatio >= 22 &&
    (theme === "false_breakout" || theme === "week52_high_breakout")
  ) {
    evidenceSignals.push("윗꼬리 부담");
  }
  if (theme === "low_liquidity") {
    evidenceSignals.push("유동성·참여 약세");
  }

  const compositeHint = [vwap.label, close.label, volume.label].join(" · ");

  return { vwap, close, volume, volatility, week52, evidenceSignals, compositeHint };
}

export function getDominantGuidanceTheme(
  result: GuidanceAnalysisResult,
  topConfirmationCards: ConfirmationCardLike[],
): GuidanceTheme {
  const vwapState = getVwapUiState(result);
  const topCat = getTopConfirmationCategory(topConfirmationCards);
  const volHigh = isVolatilityElevated(result) || topCat === "volatility";
  const vwapStress = isVwapStressed(vwapState, result);
  const vwapCloseVolDominant = isVwapCloseVolatilityDominant(
    result,
    vwapState,
    topConfirmationCards,
  );
  const auxLow =
    (result.falseSignalAnalysis?.falseSignalScore || 0) < 25 &&
    (result.riskGateOverlay?.overlayScore || 0) < 15;

  // Hard rule: VWAP stress + weak close + intraday swing beats breakout / mild false-breakout cues.
  if (vwapCloseVolDominant && !isSevereFalseBreakout(result)) {
    return volHigh ? "volatility_vwap_monitor" : "vwap_monitor";
  }

  if (topCat === "volatility" && vwapStress) {
    return "volatility_vwap_monitor";
  }

  if (
    topCat === "vwap" &&
    vwapStress &&
    (volHigh || result.ohlc.closePositionScore <= 55)
  ) {
    return volHigh ? "volatility_vwap_monitor" : "vwap_monitor";
  }

  if (
    (isStrongCleanTrend(toCautionContext(result)) ||
      result.state.primaryState === "STRONG_UPTREND") &&
    vwapState === "clear_above" &&
    result.ohlc.closePositionScore >= 70 &&
    auxLow &&
    topCat !== "volatility" &&
    topCat !== "vwap" &&
    topCat !== "vwapFake"
  ) {
    return "strong_trend";
  }

  if (
    topCat === "volume" &&
    (result.volume.volumeScore < 45 || result.risk.lowLiquidityOrWeakParticipationRiskScore >= 55)
  ) {
    return "low_liquidity";
  }
  if (
    result.state.primaryState === "WEAK_PARTICIPATION" ||
    (result.risk.lowLiquidityOrWeakParticipationRiskScore >= 60 &&
      result.volume.volumeScore < 50 &&
      !isBreakoutQualityDominant(result, topConfirmationCards, vwapState) &&
      result.ohlc.week52PositionScore < 75)
  ) {
    return "low_liquidity";
  }

  if (
    isSevereFalseBreakout(result) &&
    !vwapCloseVolDominant &&
    (topCat === "vwapFake" || result.state.primaryState === "FALSE_BREAKOUT_RISK")
  ) {
    return "false_breakout";
  }

  if (
    (result.state.primaryState === "BOTTOM_REBOUND_ATTEMPT" ||
      result.ohlc.week52PositionScore <= 35) &&
    topCat !== "volatility" &&
    topCat !== "vwap" &&
    !isBreakoutQualityDominant(result, topConfirmationCards, vwapState)
  ) {
    return "week52_low_rebound";
  }

  if (
    isBreakoutQualityDominant(result, topConfirmationCards, vwapState) &&
    !vwapCloseVolDominant
  ) {
    return "week52_high_breakout";
  }

  if (
    vwapStress &&
    volHigh &&
    (topCat === "vwap" ||
      topCat === "vwapFake" ||
      topCat === "volatility" ||
      topCat === "close" ||
      isMonitoringActionCode(result.action.actionCode) ||
      result.state.primaryState === "VWAP_SUPPORT_HOLDING")
  ) {
    return "volatility_vwap_monitor";
  }

  if (
    topCat === "vwap" ||
    topCat === "close" ||
    isMonitoringActionCode(result.action.actionCode) ||
    result.state.primaryState === "VWAP_SUPPORT_HOLDING"
  ) {
    return "vwap_monitor";
  }

  if (volHigh && vwapStress) return "volatility_vwap_monitor";

  return "general";
}

/** @deprecated Use getDominantGuidanceTheme */
export const getPrimaryGuidanceTheme = getDominantGuidanceTheme;

function getThemeScenarioLabel(
  theme: GuidanceTheme,
  dominant: DominantScenario,
  vwapState: VwapUiState,
  result: GuidanceAnalysisResult,
): string {
  const themeDefault: Record<GuidanceTheme, string> = {
    strong_trend: "추세 유지 확인 우세",
    vwap_monitor: "중립·관찰 우세",
    volatility_vwap_monitor:
      vwapState === "below" && isVolatilityElevated(result)
        ? "주의 관찰 우세"
        : "중립·관찰 우세",
    low_liquidity: "거래 참여 확인 우세",
    false_breakout: "주의 관찰 우세",
    week52_low_rebound: "저점 회복 확인 우세",
    week52_high_breakout: "돌파 품질 확인 우세",
    general: "중립·관찰 우세",
  };

  if (dominant === "recovery") return "회복 확인 우세";
  if (dominant === "caution" && theme !== "strong_trend") return "주의 관찰 우세";
  return themeDefault[theme];
}

export function buildDominantScenarioReason(
  result: GuidanceAnalysisResult,
  theme: GuidanceTheme,
  dominant: DominantScenario,
  vwapState: VwapUiState,
  ctx: StrategicContext,
  closeState: CloseStrategyState,
): string {
  if (theme === "volatility_vwap_monitor") {
    if (vwapState === "below" || closeState.tier === "low_range") {
      return "현재는 평균 거래 단가 아래에서 회복 여부를 확인해야 하고, 장중 흔들림 이후 종가 위치가 약했기 때문에 회복 확정보다는 보수적 관찰에 더 가까운 흐름입니다.";
    }
    if (dominant === "caution") {
      return "현재는 평균 거래 단가 부근에서 지지가 불확실하고 장중 흔들림이 컸기 때문에, 회복 확정보다는 보수적 관찰 비중이 상대적으로 큽니다.";
    }
    return "현재는 평균 거래 단가 부근 지지와 변동폭 완화가 함께 확인되어야 하며, 장중 흔들림 이후 마감 위치가 해석의 중심입니다.";
  }
  if (theme === "vwap_monitor") {
    if (vwapState === "below") {
      return "현재는 평균 거래 단가 아래에서 회복 여부를 확인해야 하는 구간이며, 종가까지의 유지가 확인되기 전까지는 관찰 비중이 큽니다.";
    }
    return "현재는 평균 거래 단가 부근에서 지지·이탈이 갈리는 구간이며, 종가 마감 위치가 다음 해석의 기준입니다.";
  }
  if (theme === "strong_trend") {
    return "현재는 추세와 지지가 비교적 양호해, 무리한 경계보다 추세 유지와 과열 완화 여부를 함께 보는 것이 적절합니다.";
  }
  if (theme === "week52_high_breakout") {
    return "현재는 고점권 위치보다 돌파 이후 종가 유지와 윗꼬리 축소가 해석의 중심이며, 장중 강세만으로는 단정하기 어렵습니다.";
  }
  if (theme === "week52_low_rebound") {
    return "현재는 저점 자체보다 반등 이후 VWAP·거래 참여 동반이 이어지는지가 회복 신뢰도의 핵심입니다.";
  }
  if (theme === "low_liquidity") {
    return "현재는 가격 변화보다 거래 참여가 충분히 뒷받침되는지가 먼저이며, 참여 없는 움직임은 신뢰도가 낮을 수 있습니다.";
  }
  if (theme === "false_breakout") {
    return "현재는 장중 강세보다 종가 유지와 윗꼬리 해소가 중요하며, 회복 실패 신호가 겹치면 보수적 관찰 비중이 커질 수 있습니다.";
  }
  if (dominant === "caution") {
    return `현재는 ${ctx.vwap.label}과 ${closeState.label}이(가) 겹쳐, 주의 관찰 해석의 비중이 상대적으로 큽니다.`;
  }
  return `현재는 ${ctx.compositeHint} 구조로, 방향 단정보다 조건 확인이 우선인 구간입니다.`;
}

function scoreScenarioLean(
  result: GuidanceAnalysisResult,
  theme: GuidanceTheme,
  vwapState: VwapUiState,
  ctx: StrategicContext,
): { recovery: number; neutral: number; caution: number } {
  let recovery = 0;
  let neutral = 0;
  let caution = 0;

  if (vwapState === "clear_above") recovery += 18;
  else if (vwapState === "near_above") {
    neutral += 22;
    caution += 8;
  } else {
    caution += 22;
    recovery += 4;
  }

  if (ctx.close.bucket === "solid") recovery += 16;
  else if (ctx.close.bucket === "mixed") neutral += 14;
  else caution += 16;

  if (ctx.volume.bucket === "solid") recovery += 12;
  else if (ctx.volume.bucket === "mixed") neutral += 10;
  else caution += 12;

  if (ctx.volatility.bucket === "elevated") caution += 14;
  else if (ctx.volatility.bucket === "moderate") neutral += 6;

  caution += Math.min(20, (result.falseSignalAnalysis?.falseSignalScore || 0) / 4);
  caution += Math.min(16, (result.riskGateOverlay?.overlayScore || 0) / 3);
  caution += Math.min(12, result.risk.trendCollapseRiskScore / 8);

  switch (theme) {
    case "strong_trend":
      recovery += 28;
      neutral += 12;
      break;
    case "vwap_monitor":
      neutral += 26;
      caution += 6;
      break;
    case "volatility_vwap_monitor":
      if (vwapState === "below" || ctx.close.bucket === "weak") {
        caution += 24;
        neutral += 14;
      } else {
        neutral += 20;
        caution += 10;
      }
      if (ctx.volatility.bucket === "elevated") caution += 8;
      break;
    case "false_breakout":
      caution += 28;
      neutral += 14;
      break;
    case "low_liquidity":
      neutral += 22;
      caution += 14;
      break;
    case "week52_high_breakout":
      neutral += 18;
      recovery += 8;
      caution += 10;
      break;
    case "week52_low_rebound":
      neutral += 20;
      recovery += 10;
      caution += 8;
      break;
    default:
      neutral += 16;
  }

  return { recovery, neutral, caution };
}

export function resolveDominantScenario(
  result: GuidanceAnalysisResult,
  theme: GuidanceTheme,
  vwapState: VwapUiState,
  ctx: StrategicContext,
  closeState: CloseStrategyState,
): {
  dominantScenario: DominantScenario;
  primaryScenarioLabel: string;
  dominantScenarioReason: string;
  dominantVerdict: string;
} {
  const scores = scoreScenarioLean(result, theme, vwapState, ctx);
  const dominant: DominantScenario =
    scores.recovery >= scores.neutral && scores.recovery >= scores.caution
      ? "recovery"
      : scores.caution > scores.neutral && scores.caution > scores.recovery
        ? "caution"
        : "neutral";

  const primaryScenarioLabel = getThemeScenarioLabel(theme, dominant, vwapState, result);
  const dominantScenarioReason = buildDominantScenarioReason(
    result,
    theme,
    dominant,
    vwapState,
    ctx,
    closeState,
  );

  const dominantVerdict = `현재 흐름만 보면 ${primaryScenarioLabel}입니다. ${dominantScenarioReason}`;

  return { dominantScenario: dominant, primaryScenarioLabel, dominantScenarioReason, dominantVerdict };
}

export function getTopStrategyTitle(theme: GuidanceTheme, vwapState: VwapUiState): string {
  switch (theme) {
    case "volatility_vwap_monitor":
      return vwapState === "below"
        ? "VWAP 회복과 종가 위치 개선이 핵심입니다."
        : "VWAP 회복과 종가 안정성이 핵심입니다.";
    case "vwap_monitor":
      return "VWAP 회복과 종가 위치 개선이 핵심입니다.";
    case "strong_trend":
      return "추세 유지와 과열 완화 여부가 핵심입니다.";
    case "week52_high_breakout":
      return "돌파 이후 종가 유지와 윗꼬리 축소가 핵심입니다.";
    case "week52_low_rebound":
      return "저점 이후 회복 신뢰도 확인이 핵심입니다.";
    case "low_liquidity":
      return "거래 참여 회복이 핵심입니다.";
    case "false_breakout":
      return "종가 유지와 윗꼬리 해소가 핵심입니다.";
    default:
      return "다음 조건 확인이 해석의 핵심입니다.";
  }
}

function getGuidanceSubtitle(
  theme: GuidanceTheme,
  vwapState: VwapUiState,
  closeState: CloseStrategyState,
): string {
  return buildGuidanceFocusLine(theme, vwapState, closeState);
}

export function buildThemeSpecificSummary(
  result: GuidanceAnalysisResult,
  theme: GuidanceTheme,
  ctx: StrategicContext,
  vwapState: VwapUiState,
  closeState: CloseStrategyState,
): string {
  return buildOneLineSummary(result, theme, ctx, vwapState, closeState);
}

export function buildOneLineSummary(
  result: GuidanceAnalysisResult,
  theme: GuidanceTheme,
  ctx: StrategicContext,
  vwapState: VwapUiState,
  closeState: CloseStrategyState,
): string {
  switch (theme) {
    case "volatility_vwap_monitor":
      if (vwapState === "below" || closeState.tier === "low_range") {
        return "다음 거래일에는 장중 반등 자체보다 VWAP 위 회복이 종가까지 유지되는지와, 종가가 저가권을 벗어나는지가 핵심입니다.";
      }
      return "다음 거래일에는 변동폭이 줄어들면서 평균 거래 단가 위 흐름이 종가까지 유지되는지가 핵심입니다.";
    case "vwap_monitor":
      return vwapState === "below"
        ? "다음 거래일에는 VWAP 위 회복이 종가까지 이어지는지, 종가가 저가권을 벗어나는지가 핵심입니다."
        : `다음 거래일에는 평균 거래 단가 위 유지와 ${
            closeState.tier === "low_range" ? "종가 위치 개선" : "종가 안정성"
          }이 핵심입니다.`;
    case "strong_trend":
      return "현재는 흐름이 비교적 양호하므로, 무리한 경계보다 추세 유지와 과열 여부를 함께 확인하는 것이 적절합니다.";
    case "week52_high_breakout":
      return "현재는 고점권 위치 자체보다 돌파 이후 종가가 유지되는지와 윗꼬리가 줄어드는지가 더 중요합니다.";
    case "week52_low_rebound":
      return "현재는 가격이 낮다는 사실보다 저점 이후 회복이 실제로 이어지는지를 확인하는 것이 중요합니다.";
    case "low_liquidity":
      return "현재는 가격 변화보다 거래 참여가 충분히 뒷받침되는지가 먼저 확인되어야 합니다.";
    case "false_breakout":
      return "현재는 장중 강한 움직임보다 그 움직임이 종가까지 유지되는지가 더 중요합니다.";
    default:
      if (vwapState === "near_above") {
        return "현재는 평균 거래 단가 부근에서 지지·이탈이 갈리는 구간이므로, 종가까지의 유지 여부가 핵심입니다.";
      }
      return "현재는 방향 단정보다 가격 구조(VWAP·종가·거래 참여)가 함께 개선되는지를 보는 구간입니다.";
  }
}

export function buildThemeSpecificTransitions(
  result: GuidanceAnalysisResult,
  theme: GuidanceTheme,
  vwapState: VwapUiState,
  ctx: StrategicContext,
  closeState: CloseStrategyState,
): { recovery: string; caution: string } {
  return buildTransitionConditions(result, theme, vwapState, ctx, closeState);
}

function buildTransitionConditions(
  result: GuidanceAnalysisResult,
  theme: GuidanceTheme,
  vwapState: VwapUiState,
  ctx: StrategicContext,
  closeState: CloseStrategyState,
): { recovery: string; caution: string } {
  let recovery = "VWAP 위 유지와 종가 중상단 회복이 함께 나타나면 회복 신뢰도가 개선될 수 있습니다.";
  let caution =
    "VWAP 이탈과 약한 종가가 반복되면 주의 해석을 강화해 보수적으로 추적하는 것이 적절합니다.";

  switch (theme) {
    case "volatility_vwap_monitor":
      recovery =
        vwapState === "below" || closeState.tier === "low_range"
          ? "다음 거래일에 VWAP 위로 회복한 뒤 종가까지 유지되고, 종가가 당일 범위 중상단으로 개선되면 회복 신뢰도가 높아질 수 있습니다."
          : "평균 거래 단가 위 흐름이 종가까지 유지되고 변동폭이 완화되면 회복 신뢰도가 개선될 수 있습니다.";
      caution =
        closeState.tier === "low_range" || vwapState === "below"
          ? "VWAP 아래 체류가 길어지고 종가가 다시 저가권에 머물면 주의 해석의 비중이 더 커질 수 있습니다."
          : "VWAP 회복이 지연되고 종가 안정성이 약해지면 주의 해석의 비중이 더 커질 수 있습니다.";
      break;
    case "vwap_monitor":
      recovery =
        vwapState === "below"
          ? "평균 거래 단가 위로 회복한 뒤 종가까지 유지되고 마감 위치가 개선되면 회복 신뢰도가 높아질 수 있습니다."
          : "평균 거래 단가 위 흐름이 종가까지 유지되고 마감 위치가 개선되면 회복 신뢰도가 높아질 수 있습니다.";
      caution =
        closeState.tier === "low_range"
          ? "평균 거래 단가 아래 체류와 저가권 종가가 반복되면 주의 관찰 시나리오의 비중이 커질 수 있습니다."
          : "평균 거래 단가 아래 체류와 종가 약화가 반복되면 주의 관찰 시나리오의 비중이 커질 수 있습니다.";
      break;
    case "strong_trend":
      recovery =
        "지지선과 평균 거래 단가 위 흐름이 유지되고 과열이 완화되면 추세 유지 신뢰도가 높아질 수 있습니다.";
      caution =
        "상승 속도는 유지되지만 종가가 약해지고 과열 신호가 커지면 단기 부담을 함께 봐야 합니다.";
      break;
    case "week52_high_breakout":
      recovery =
        "고점권 돌파 이후 종가가 상단에 남고 윗꼬리가 줄어들면 돌파 품질이 개선될 수 있습니다.";
      caution =
        "윗꼬리가 반복되고 종가가 밀리면 가짜 돌파 가능성을 함께 확인해야 합니다.";
      break;
    case "week52_low_rebound":
      recovery =
        "저점권 반등 이후 평균 거래 단가 회복과 거래량 동반이 확인되면 회복 신뢰도가 높아질 수 있습니다.";
      caution =
        "평균 거래 단가 회복 실패와 약한 종가가 반복되면 저점 반등 신뢰도는 낮아질 수 있습니다.";
      break;
    case "low_liquidity":
      recovery =
        "가격 회복이 거래량 회복과 함께 나타나면 움직임 신뢰도가 개선될 수 있습니다.";
      caution =
        "거래량이 부족한 상태에서 가격만 흔들리면 신뢰도 낮은 움직임으로 해석해야 합니다.";
      break;
    case "false_breakout":
      recovery =
        "고점 돌파 후 종가가 상단에 남고 윗꼬리가 줄면 돌파 품질이 개선될 수 있습니다.";
      caution =
        "윗꼬리가 반복되고 종가가 밀리면 가짜 돌파 가능성을 함께 확인해야 합니다.";
      break;
    default:
      break;
  }

  if (ctx.volume.bucket === "weak" && theme === "low_liquidity") {
    recovery = "거래 참여가 늘어난 뒤 가격이 안정되면 움직임 신뢰도가 개선될 수 있습니다.";
  }

  return { recovery, caution };
}

function buildTopSummary(
  result: GuidanceAnalysisResult,
  theme: GuidanceTheme,
  vwapState: VwapUiState,
  ctx: StrategicContext,
  oneLineSummary: string,
  recoveryTransition: string,
  cautionTransition: string,
): NextTradingDayGuidance["summary"] {
  const priorityHint =
    result.action.actionScore >= 70
      ? " (대응 우선순위가 높다는 것은 위험 확정이 아니라 확인할 항목이 많다는 뜻입니다.)"
      : "";

  return {
    stance: `${oneLineSummary}${priorityHint}`,
    improvement: recoveryTransition,
    caution: cautionTransition,
  };
}

function buildRecoveryScenario(
  result: GuidanceAnalysisResult,
  theme: GuidanceTheme,
  vwapState: VwapUiState,
  ctx: StrategicContext,
): ScenarioGuidanceItem {
  const prioritySignals: string[] = [];
  if (vwapState !== "clear_above" || result.vwap.vwapRiskScore >= 35) prioritySignals.push("VWAP");
  if (result.ohlc.closePositionScore <= 72) prioritySignals.push("종가 위치");
  if (result.volume.volumeScore >= 45) prioritySignals.push("거래량");
  if (result.risk.volatilityRiskScore >= 45) prioritySignals.push("변동성");

  let mainText =
    "다음 거래일에 평균 거래 단가 위에서 버티는 흐름이 종가까지 이어지고, 마감 위치가 개선되면 회복 신뢰도가 높아질 수 있습니다.";
  const closeState = getCloseStrategyState(result.ohlc.closePositionScore);
  if (theme === "volatility_vwap_monitor") {
    mainText =
      vwapState === "below" || closeState.tier === "low_range"
        ? "다음 거래일에 평균 거래 단가 위로 회복한 뒤 그 흐름이 종가까지 유지되고, 마감 위치가 저가권을 벗어나면 회복 신뢰도가 높아질 수 있습니다."
        : "평균 거래 단가 위 흐름이 유지되고 변동폭이 완화되며 마감이 안정되면 회복 신뢰도가 높아질 수 있습니다.";
  } else if (theme === "vwap_monitor") {
    mainText =
      vwapState === "below"
        ? `평균 거래 단가 위로 회복한 뒤 종가까지 유지되고, ${closeRecoveryConditionPhrase(closeState)} 회복 신뢰도가 높아질 수 있습니다.`
        : `평균 거래 단가 위에서 버티는 흐름이 종가까지 이어지고, ${closeRecoveryConditionPhrase(closeState)} 회복 신뢰도가 높아질 수 있습니다.`;
  } else if (theme === "strong_trend") {
    mainText =
      "지지선·평균 거래 단가 위 흐름이 유지되고 거래 과열 없이 마감이 방어되면 추세 유지 신뢰도가 높아질 수 있습니다.";
  } else if (theme === "week52_high_breakout") {
    mainText =
      "고점권에서 윗꼬리가 줄고 종가가 상단에 남으며 거래 참여가 유지되면 돌파 품질이 개선될 수 있습니다.";
  } else if (theme === "week52_low_rebound") {
    mainText =
      "저점권 반등 후 평균 거래 단가 회복과 거래 참여 동반이 이어지면 회복 신뢰도를 높일 수 있습니다.";
  } else if (theme === "low_liquidity") {
    mainText =
      "거래 참여 회복과 함께 가격이 안정되면 움직임 신뢰도가 개선될 수 있습니다.";
  } else if (theme === "false_breakout") {
    mainText =
      "고점 돌파 후 종가가 유지되고 윗꼬리가 줄면 돌파·반등 품질이 개선될 수 있습니다.";
  } else if (vwapState === "near_above") {
    mainText =
      "평균 거래 단가 위 지지가 유지되고 " +
      (ctx.close.bucket === "weak" ? "마감이 중상단으로 개선되면" : "마감 방어가 이어지면") +
      " 단기 지지 확인으로 해석할 수 있습니다.";
  }

  const strategicState = `${ctx.vwap.label} · ${ctx.close.label} · ${ctx.volume.label}`;

  return {
    type: "recovery",
    title: "회복 시나리오",
    who: WHO,
    when: "다음 거래일 장중~종가, 필요 시 다음 1~3거래일",
    where: "평균 거래 단가 위·근접 구간, 종가 위치, 거래 참여 구간",
    what: prioritySignals.length > 0 ? prioritySignals.join(", ") : "VWAP, 종가, 거래량",
    why: "회복 신뢰도와 단기 지지 확인을 위해 방향 단정 대신 조건 충족 여부를 봅니다.",
    how: "조건이 충족되면 관찰 강도를 완화하고 회복 가능성을 점검할 수 있으며, 실패 시 추가 확인이 필요합니다.",
    strategicState,
    evidenceSignals: ctx.evidenceSignals,
    mainText,
    checkText: "위 조건이 같은 방향으로 개선되는지 추적하세요.",
    prioritySignals,
  };
}

function buildNeutralScenario(
  result: GuidanceAnalysisResult,
  theme: GuidanceTheme,
  vwapState: VwapUiState,
  ctx: StrategicContext,
): ScenarioGuidanceItem {
  const prioritySignals = ["VWAP", "종가", "거래량"];
  let mainText =
    "평균 거래 단가 근처 등락과 보통 수준의 거래 참여가 이어지면, 아직 회복도 이탈도 확정하기 어려운 관찰 구간입니다.";
  if (theme === "volatility_vwap_monitor") {
    mainText =
      "평균 거래 단가 근처에서 등락이 이어지고 종가가 뚜렷하게 개선되지 않으면, 회복도 이탈도 확정하기 어려운 관찰 구간으로 보는 것이 적절합니다.";
  } else if (theme === "vwap_monitor" || vwapState === "near_above") {
    mainText =
      "평균 거래 단가 근처에서 등락이 이어지면 지지·이탈이 확정되지 않은 확인 구간이며, 종가 마감이 해석의 기준입니다.";
  } else if (ctx.volume.bucket === "mixed") {
    mainText =
      "거래 참여는 보통 수준이라 가격 방향만으로 회복·이탈을 단정하기 어렵고, 평균 거래 단가와 종가를 함께 봐야 합니다.";
  } else if (theme === "strong_trend") {
    mainText =
      "추세는 유지되지만 상승 속도가 둔화되면 과열 완화 구간으로 볼 수 있으며, 지지 유지를 관찰하면 됩니다.";
  } else if (theme === "week52_high_breakout") {
    mainText = "고점권 횡보는 돌파 후 소화일 수 있으나, 종가·거래 참여 확인이 필요합니다.";
  } else if (theme === "week52_low_rebound") {
    mainText =
      "저점권 반등 후 평균 거래 단가 부근에서 머무르면 회복 확인 전 대기 구간입니다.";
  }

  return {
    type: "neutral",
    title: "중립 시나리오",
    who: WHO,
    when: "다음 거래일 장중, 다음 1~3거래일",
    where: "평균 거래 단가 근처, 당일 고저 범위, 종가 위치",
    what: prioritySignals.join(", "),
    why: "신호가 혼재되면 방향 확정보다 관찰·추적이 안전한 해석 프레임입니다.",
    how: "조건이 혼재되면 중립 유지·추가 확인·방향성 확정 보류로 해석합니다.",
    strategicState: ctx.compositeHint,
    evidenceSignals: ctx.evidenceSignals,
    mainText,
    checkText: "등락이 이어져도 종가와 평균 거래 단가가 어느 쪽으로 기울는지 추적하세요.",
    prioritySignals,
  };
}

function buildCautionScenario(
  result: GuidanceAnalysisResult,
  theme: GuidanceTheme,
  vwapState: VwapUiState,
  ctx: StrategicContext,
): ScenarioGuidanceItem {
  const prioritySignals: string[] = [];
  if (vwapState === "below" || result.vwap.vwapRiskScore >= 50) prioritySignals.push("VWAP 이탈");
  if (result.ohlc.closePositionScore <= 45) prioritySignals.push("약한 종가");
  if (result.volume.volumeScore < 45 || result.volume.volumeRiskScore >= 50) {
    prioritySignals.push("거래 참여 둔화");
  }
  if (result.risk.volatilityRiskScore >= 55) prioritySignals.push("변동성 확대");
  if ((result.falseSignalAnalysis?.falseSignalScore || 0) >= 30) {
    prioritySignals.push("회복 신뢰도");
  }
  if ((result.riskGateOverlay?.overlayScore || 0) >= 15) {
    prioritySignals.push("해석 제한");
  }

  let mainText =
    "평균 거래 단가 아래 체류가 길어지고 종가가 다시 약해지면, 장중 반등보다 지지 실패 가능성을 더 크게 봐야 합니다.";
  if (theme === "volatility_vwap_monitor") {
    mainText =
      "평균 거래 단가 아래 체류가 길어지고 종가가 다시 저가권에 머무르면, 장중 반등보다 지지 실패 가능성을 더 크게 봐야 합니다.";
  } else if (theme === "vwap_monitor" && (vwapState === "below" || vwapState === "near_above")) {
    mainText =
      "평균 거래 단가 아래 체류가 길어지고 종가가 다시 약해지면, 장중 반등보다 지지 실패 가능성을 더 크게 봐야 합니다.";
  } else if (theme === "strong_trend") {
    mainText =
      "추세는 유지되나 종가 방어가 약해지고 과열 신호가 커지면, 단기 조정·부담 가능성을 함께 봐야 합니다.";
  } else if (theme === "false_breakout" || theme === "week52_high_breakout") {
    mainText =
      "윗꼬리가 반복되고 종가가 밀리면 가짜 돌파·상단 부담 가능성을 조건부로 확인해야 합니다.";
  } else if (ctx.volatility.bucket === "elevated" && ctx.close.bucket !== "solid") {
    mainText =
      "장중 흔들림 뒤 종가까지 약하면, 변동성 확대가 단기 위험 신호로 해석될 수 있습니다.";
  } else if (theme === "low_liquidity") {
    mainText =
      "거래 참여 없이 가격만 흔들리면 신뢰도 낮은 움직임으로 보수적으로 해석해야 합니다.";
  }

  return {
    type: "caution",
    title: "주의 시나리오",
    who: WHO,
    when: "다음 거래일 장중~종가, 반복 시 1~3거래일",
    where: "평균 거래 단가 아래·저가권 종가·거래 참여 구간",
    what: prioritySignals.length > 0 ? prioritySignals.join(", ") : "VWAP, 종가, 거래량",
    why: "여러 약세 조건이 겹치면 단일 지표보다 해석 신뢰도가 높아집니다.",
    how: "조건 실패 시 주의 해석을 강화하고 회복 신뢰도 약화·보수적 추적으로 전환합니다.",
    strategicState: `${ctx.vwap.label} · ${ctx.close.label}`,
    evidenceSignals: [...ctx.evidenceSignals, ...prioritySignals],
    mainText,
    checkText: "약세 조건이 같은 방향으로 겹치는지 확인하세요.",
    cautionText: "한 가지 조건만으로 방향을 단정하지 마세요.",
    prioritySignals,
  };
}

function getChecklistGroupBoost(topConfirmationCards: ConfirmationCardLike[]): Record<string, number> {
  const boost: Record<string, number> = {
    vwap: 0,
    close: 0,
    intraday: 0,
    volume: 0,
    caution: 0,
  };
  const top = topConfirmationCards[0];
  if (!top) return boost;

  const group =
    top.categoryKey === "vwap" || top.categoryKey === "vwapFake"
      ? "vwap"
      : top.categoryKey === "close"
        ? "close"
        : top.categoryKey === "volatility"
          ? "intraday"
          : top.categoryKey === "volume"
            ? "volume"
            : "caution";

  boost[group] = 40;
  return boost;
}

export function buildThemeSpecificChecklist(
  result: GuidanceAnalysisResult,
  theme: GuidanceTheme,
  topConfirmationCards: ConfirmationCardLike[],
): NextActionChecklistItem[] {
  const vwapState = getVwapUiState(result);
  const ctx = buildStrategicContext(result, theme, vwapState);
  return buildNextActionChecklist(result, theme, vwapState, ctx, topConfirmationCards);
}

function buildNextActionChecklist(
  result: GuidanceAnalysisResult,
  theme: GuidanceTheme,
  vwapState: VwapUiState,
  ctx: StrategicContext,
  topConfirmationCards: ConfirmationCardLike[],
): NextActionChecklistItem[] {
  const boost = getChecklistGroupBoost(topConfirmationCards);
  const evidence = ctx.evidenceSignals;
  const closeState = getCloseStrategyState(result.ohlc.closePositionScore);

  let openDisplay = "초반에 평균 거래 단가 위에서 버티는지 먼저 확인하세요.";
  let openInterpretation =
    "초반부터 이탈하면 종가 확인 전까지 방향을 단정하기 어렵습니다.";
  if (theme === "volatility_vwap_monitor") {
    if (vwapState === "below") {
      openDisplay = "초반에 평균 거래 단가 위로 회복하는지 먼저 확인하세요.";
      openInterpretation =
        "초반부터 회복이 지연되면 종가 확인 전까지 방향을 단정하기 어렵습니다.";
    }
  } else if (theme === "strong_trend") {
    openDisplay = "초반에 지지선과 평균 거래 단가 위 흐름이 유지되는지 확인하세요.";
    openInterpretation = "추세 유지 구간에서는 초반 이탈이 단기 부담 신호가 될 수 있습니다.";
  } else if (vwapState === "below") {
    openDisplay = "초반에 평균 거래 단가 위로 회복하는지 먼저 확인하세요.";
    openInterpretation =
      "회복이 늦어지면 당일 내내 약한 해석이 이어질 수 있습니다.";
  } else if (theme === "low_liquidity") {
    openDisplay = "초반 거래 참여가 살아나는지, 가격만 급변하지 않는지 확인하세요.";
    openInterpretation = "참여 없는 급변은 신뢰도 낮은 움직임으로 볼 수 있습니다.";
  } else if (theme === "week52_low_rebound") {
    openDisplay = "초반에 저점을 다시 깨지 않고 평균 거래 단가 쪽으로 회복하는지 확인하세요.";
    openInterpretation = "저점 재이탈이 나오면 반등 신뢰도는 약해질 수 있습니다.";
  }

  let intradayDisplay =
    "평균 거래 단가를 잠깐 이탈하는지보다, 이탈 후 빠르게 회복하는지를 보세요.";
  let intradayInterpretation =
    "회복 시간이 길어질수록 단기 지지 신뢰도는 낮아질 수 있습니다.";
  if (theme === "volatility_vwap_monitor" && ctx.volatility.bucket === "elevated") {
    intradayDisplay =
      vwapState === "below"
        ? "장중에는 평균 거래 단가를 잠깐 이탈하는지보다, 이탈 후 회복 속도와 VWAP 아래 체류 시간, 변동폭 완화 여부를 보세요."
        : "장중 흔들림이 줄고 VWAP 이탈 후 회복이 빠른지, 변동폭이 완화되는지 확인하세요.";
    intradayInterpretation =
      "회복 실패 시간이 길어질수록 단기 지지 신뢰도는 낮아질 수 있습니다.";
  } else if (ctx.volatility.bucket === "elevated" && theme !== "strong_trend") {
    intradayDisplay =
      "이탈 여부와 함께 장중 변동폭이 줄어드는지, 종가 쪽으로 안정되는지 보세요.";
    intradayInterpretation =
      "장중 흔들림 이후 변동폭 완화가 없으면 종가 확인 전까지 보수적으로 볼 수 있습니다.";
  } else if (theme === "false_breakout" || theme === "week52_high_breakout") {
    intradayDisplay = "고점 돌파 후 가격이 유지되는지, 윗꼬리가 커지지 않는지 보세요.";
    intradayInterpretation =
      "장중 강세가 종가까지 이어지지 않으면 돌파 품질은 약해질 수 있습니다.";
  } else if (theme === "low_liquidity") {
    intradayDisplay = "거래량 없이 가격만 급변하는 구간이 있는지 확인하세요.";
    intradayInterpretation = "참여 없는 급변은 해석 신뢰도를 낮춥니다.";
  }

  let closeDisplay = `${closeState.checkPhrase} 확인하세요.`;
  let closeInterpretation =
    "장중 반등보다 마감 위치가 회복 신뢰도를 더 잘 보여줍니다.";
  if (closeState.tier === "stability" || closeState.tier === "defense") {
    closeDisplay = "종가가 약해지기보다 안정적으로 유지되는지 확인하세요.";
  } else if (closeState.tier === "improve") {
    closeDisplay = "종가가 당일 범위 중상단 쪽으로 개선되는지 확인하세요.";
  } else if (closeState.tier === "low_range") {
    closeDisplay =
      "종가에는 당일 범위의 저가권을 벗어나 중상단 쪽으로 올라오는지 확인하세요.";
    closeInterpretation =
      "장중 반등이 있더라도 마감이 저가권에 머무르면 회복 신뢰도는 제한적으로 봐야 합니다.";
  }
  if (
    (theme === "false_breakout" || theme === "week52_high_breakout") &&
    result.ohlc.upperWickRatio >= 22
  ) {
    closeDisplay = "윗꼬리가 줄고 종가가 유지되는지 확인하세요.";
    closeInterpretation =
      "윗꼬리가 크면 상단 부담·가짜 돌파 가능성을 함께 봐야 합니다.";
  }

  let volumeDisplay =
    ctx.volume.bucket === "weak"
      ? "가격 회복이 거래 참여 회복과 함께 나오는지 확인하세요."
      : ctx.volume.bucket === "mixed"
        ? "거래량이 유지되는지만 보지 말고, 가격 회복이 함께 나오는지 확인하세요."
        : "가격 회복이 거래 참여 유지와 함께 나오는지 확인하세요.";
  let volumeInterpretation =
    ctx.volume.bucket === "weak"
      ? "거래 참여 없이 오른 가격은 아직 확증 신호로 보기 어렵습니다."
      : "거래량만 있고 가격이 회복되지 않으면 아직 확증 신호로 보기 어렵습니다.";
  if (result.volume.volumeScore >= 55 && result.ohlc.closePositionScore <= 50) {
    volumeDisplay = "거래는 붙었지만 종가가 약하지 않은지(분배 가능성) 확인하세요.";
    volumeInterpretation =
      "거래량과 약한 마감이 겹치면 가격 회복 품질을 의심할 여지가 있습니다.";
  }

  let cautionDisplay = "평균 거래 단가·종가·거래 참여가 동시에 약해지는지 확인하세요.";
  let cautionInterpretation =
    "여러 조건이 같은 방향으로 약해질 때 주의 해석이 강해집니다.";
  if (theme === "volatility_vwap_monitor") {
    cautionDisplay =
      "평균 거래 단가 아래 체류, 약한 종가, 변동성 확대가 동시에 반복되는지 확인하세요.";
    cautionInterpretation =
      "여러 조건이 같은 방향으로 약해질 때 주의 해석이 강해집니다.";
  }
  const cautionParts: string[] = [];
  if (result.risk.trendCollapseRiskScore >= 60) cautionParts.push("추세 훼손");
  if (ctx.volatility.bucket === "elevated" && theme !== "volatility_vwap_monitor") {
    cautionParts.push("변동성 확대");
  }
  if ((result.falseSignalAnalysis?.falseSignalScore || 0) >= 30) {
    cautionParts.push("회복 신뢰도 약화");
  }
  if ((result.riskGateOverlay?.overlayScore || 0) >= 15) {
    cautionParts.push("원점수 해석 제한");
  }
  if (cautionParts.length > 0 && theme !== "volatility_vwap_monitor" && theme !== "vwap_monitor") {
    cautionDisplay = `${cautionParts.join("·")} 신호가 겹치는지 확인하세요.`;
    cautionInterpretation =
      "복합 약세가 겹치면 단일 지표보다 보수적 해석이 타당해질 수 있습니다.";
  }
  if (theme === "strong_trend") {
    cautionDisplay = "지지선 이탈·과열 신호·약한 종가가 함께 나타나는지 확인하세요.";
    cautionInterpretation =
      "추세 구간에서는 무리한 공포보다 지지·과열·마감의 조합을 봅니다.";
  }

  const items: NextActionChecklistItem[] = [
    {
      timeLabel: "장 초반",
      who: WHO,
      when: "다음 거래일 장 초반",
      where: "평균 거래 단가 위·아래 전환 구간",
      what: "평균 거래 단가 안착·회복",
      why: "장 초반 안착은 당일 평균 거래 단가 위 지지 여부를 보는 기준입니다.",
      how: openInterpretation,
      strategicState: ctx.vwap.label,
      evidenceSignals: evidence,
      displayText: openDisplay,
      reasonText: ctx.vwap.detail,
      interpretationText: openInterpretation,
      priority: 80 + boost.vwap,
    },
    {
      timeLabel: "장중",
      who: WHO,
      when: "다음 거래일 장중",
      where: "평균 거래 단가, 당일 고저 범위",
      what: "이탈 후 회복 속도",
      why: "일시적 이탈보다 회복 실패 시간이 단기 신뢰도에 더 중요합니다.",
      how: intradayInterpretation,
      strategicState: ctx.volatility.label,
      evidenceSignals: evidence,
      displayText: intradayDisplay,
      reasonText: "회복 실패 시간이 길수록 지지 신뢰도가 낮아질 수 있습니다.",
      interpretationText: intradayInterpretation,
      priority: 70 + boost.vwap + boost.intraday,
    },
    {
      timeLabel: "종가",
      who: WHO,
      when: "다음 거래일 종가",
      where: "당일 범위 중상단·저가권",
      what: "마감 위치",
      why: ctx.close.detail,
      how: closeInterpretation,
      strategicState: ctx.close.label,
      evidenceSignals: evidence,
      displayText: closeDisplay,
      reasonText: ctx.close.detail,
      interpretationText: closeInterpretation,
      priority: 90 + boost.close,
    },
    {
      timeLabel: "거래량",
      who: WHO,
      when: "다음 거래일 장중~종가",
      where: "거래 참여 대비 가격 구간",
      what: "거래 참여·가격 동행",
      why: ctx.volume.detail,
      how: volumeInterpretation,
      strategicState: ctx.volume.label,
      evidenceSignals: evidence,
      displayText: volumeDisplay,
      reasonText: ctx.volume.detail,
      interpretationText: volumeInterpretation,
      priority: 60 + boost.volume,
    },
    {
      timeLabel: "주의 조건",
      who: WHO,
      when: "다음 거래일~다음 1~3거래일",
      where: "복합 약세 신호 구간",
      what: "VWAP·종가·거래 참여 동시 약화",
      why: "여러 약세 조건이 겹치면 해석 신뢰도가 높아집니다.",
      how: cautionInterpretation,
      strategicState: ctx.compositeHint,
      evidenceSignals: [...evidence, ...cautionParts],
      displayText: cautionDisplay,
      reasonText: "복합 신호는 단일 지표보다 해석 가중치가 큽니다.",
      interpretationText: cautionInterpretation,
      priority: 50 + boost.caution,
    },
  ];

  return items.sort((a, b) => b.priority - a.priority).slice(0, 5);
}

const PROHIBITED_WORDING_RULES = [
  "매수하세요",
  "매도하세요",
  "상승 확정",
  "하락 확정",
  "목표가",
  "손절가",
  "수익 보장",
  "무조건",
];

export function buildGuidanceNarrativePayload(
  result: GuidanceAnalysisResult,
  guidance: Omit<NextTradingDayGuidance, "narrativePayload">,
  stockName?: string,
): GuidanceNarrativePayload {
  const prioritySignals = [
    ...new Set(
      guidance.scenarios.flatMap((scenario) => scenario.prioritySignals).concat(
        guidance.strategicContext.evidenceSignals,
      ),
    ),
  ];

  return {
    stockName,
    theme: guidance.theme,
    dominantScenario: guidance.dominantScenario,
    dominantScenarioLabel: guidance.primaryScenarioLabel,
    dominantScenarioReason: guidance.dominantScenarioReason,
    oneLineSummary: guidance.oneLineSummary,
    recoveryTransitionText: guidance.recoveryTransitionText,
    cautionTransitionText: guidance.cautionTransitionText,
    checklist: guidance.checklist,
    scenarioCards: guidance.scenarios,
    strategicContext: guidance.strategicContext,
    evidenceSignals: guidance.strategicContext.evidenceSignals,
    prioritySignals,
    prohibitedWordingRules: PROHIBITED_WORDING_RULES,
    fallbackText: {
      subtitle: guidance.subtitle,
      dominantVerdict: guidance.dominantVerdict,
      summary: guidance.summary,
    },
  };
}

export function buildThemeSpecificScenarioCards(
  result: GuidanceAnalysisResult,
  theme: GuidanceTheme,
  vwapState: VwapUiState,
  ctx: StrategicContext,
): ScenarioGuidanceItem[] {
  return [
    buildRecoveryScenario(result, theme, vwapState, ctx),
    buildNeutralScenario(result, theme, vwapState, ctx),
    buildCautionScenario(result, theme, vwapState, ctx),
  ];
}

export function getScenarioDominance(
  result: GuidanceAnalysisResult,
  theme: GuidanceTheme,
  vwapState: VwapUiState,
  ctx: StrategicContext,
  closeState: CloseStrategyState,
) {
  return resolveDominantScenario(result, theme, vwapState, ctx, closeState);
}

export function buildNextTradingDayGuidance(
  result: GuidanceAnalysisResult,
  topConfirmationCards: ConfirmationCardLike[],
): NextTradingDayGuidance {
  const theme = getDominantGuidanceTheme(result, topConfirmationCards);
  const vwapState = getVwapUiState(result);
  const closeState = getCloseStrategyState(result.ohlc.closePositionScore);
  const strategicContext = buildStrategicContext(result, theme, vwapState);
  const { dominantScenario, primaryScenarioLabel, dominantScenarioReason, dominantVerdict } =
    resolveDominantScenario(result, theme, vwapState, strategicContext, closeState);
  const subtitle = getGuidanceSubtitle(theme, vwapState, closeState);
  const oneLineSummary = buildOneLineSummary(
    result,
    theme,
    strategicContext,
    vwapState,
    closeState,
  );
  const transitions = buildTransitionConditions(
    result,
    theme,
    vwapState,
    strategicContext,
    closeState,
  );
  const summary = buildTopSummary(
    result,
    theme,
    vwapState,
    strategicContext,
    oneLineSummary,
    transitions.recovery,
    transitions.caution,
  );
  const checklist = buildThemeSpecificChecklist(result, theme, topConfirmationCards);
  const scenarios = buildThemeSpecificScenarioCards(result, theme, vwapState, strategicContext);
  const topStrategyTitle = getTopStrategyTitle(theme, vwapState);

  const guidanceCore: Omit<NextTradingDayGuidance, "narrativePayload"> = {
    theme,
    subtitle,
    topStrategyTitle,
    dominantScenario,
    primaryScenarioLabel,
    dominantScenarioReason,
    dominantVerdict,
    oneLineSummary,
    recoveryTransitionText: transitions.recovery,
    cautionTransitionText: transitions.caution,
    recoveryShiftCondition: transitions.recovery,
    cautionShiftCondition: transitions.caution,
    strategicContext,
    summary,
    scenarios,
    checklist,
    priorityChecklist: checklist,
  };

  const narrativePayload = buildGuidanceNarrativePayload(result, guidanceCore);

  return { ...guidanceCore, narrativePayload };
}

type NextTradingDayGuidanceSectionProps = {
  result: GuidanceAnalysisResult;
  topConfirmationCards: ConfirmationCardLike[];
};

const DOMINANT_BADGE_CLASS: Record<DominantScenario, string> = {
  recovery: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  neutral: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
  caution: "border-amber-300/30 bg-amber-300/10 text-amber-100",
};

export function NextTradingDayGuidanceSection({
  result,
  topConfirmationCards,
}: NextTradingDayGuidanceSectionProps) {
  const guidance = buildNextTradingDayGuidance(result, topConfirmationCards);
  const dominantCard = guidance.scenarios.find((s) => s.type === guidance.dominantScenario);

  return (
    <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.045] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-100">다음 거래일 대응 요약</p>
          <p className="mt-1 text-xs font-medium leading-6 text-emerald-50/80">
            {guidance.topStrategyTitle}
          </p>
          <p className="mt-0.5 text-[11px] leading-5 text-emerald-50/55">{guidance.subtitle}</p>
        </div>
        <span
          className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold ${DOMINANT_BADGE_CLASS[guidance.dominantScenario]}`}
        >
          {guidance.primaryScenarioLabel}
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-100/70">
          현재 우세 시나리오
        </p>
        <p className="mt-2 text-sm leading-6 text-white/85">{guidance.dominantScenarioReason}</p>
      </div>

      <p className="mt-4 text-[11px] font-semibold text-emerald-100/75">다음 거래일 한 줄 전략</p>
      <p className="mt-1 text-sm font-medium leading-6 text-white/88">{guidance.oneLineSummary}</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] px-3 py-2.5">
          <p className="text-[11px] font-semibold text-emerald-100/90">회복 전환 조건</p>
          <p className="mt-1.5 text-xs leading-5 text-white/72">{guidance.recoveryTransitionText}</p>
        </div>
        <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.05] px-3 py-2.5">
          <p className="text-[11px] font-semibold text-amber-100/90">주의 전환 조건</p>
          <p className="mt-1.5 text-xs leading-5 text-white/72">{guidance.cautionTransitionText}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <p className="text-xs font-semibold text-white/80">다음 거래일 체크리스트</p>
        <ul className="mt-3 divide-y divide-white/10">
          {guidance.checklist.map((item) => (
            <li key={item.timeLabel} className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className="w-14 shrink-0 text-[11px] font-semibold leading-5 text-emerald-100/85">
                {item.timeLabel}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-5 text-white/78">{item.displayText}</p>
                <p className="mt-1 text-[11px] leading-5 text-white/48">{item.interpretationText}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {guidance.scenarios.map((scenario) => {
          const isDominant = scenario.type === guidance.dominantScenario;
          return (
            <div
              key={scenario.type}
              className={`rounded-xl border p-2.5 ${
                scenario.type === "recovery"
                  ? "border-emerald-300/20 bg-emerald-300/[0.05]"
                  : scenario.type === "neutral"
                    ? "border-cyan-300/15 bg-cyan-300/[0.04]"
                    : "border-amber-300/20 bg-amber-300/[0.05]"
              } ${isDominant ? "ring-1 ring-white/15" : "opacity-90"}`}
            >
              <p className="text-[11px] font-semibold text-white/80">
                {scenario.title}
                {isDominant ? (
                  <span className="ml-1.5 text-[10px] font-normal text-white/45">· 우세</span>
                ) : null}
              </p>
              <p className="mt-1.5 text-[11px] leading-5 text-white/65">{scenario.mainText}</p>
            </div>
          );
        })}
      </div>

      {dominantCard ? (
        <p className="mt-3 text-[10px] leading-5 text-white/38">
          {dominantCard.checkText} StockAI는 매수·매도 명령이 아니라 조건부 시나리오와 다음 확인 규칙을
          제공합니다.
        </p>
      ) : null}
    </div>
  );
}
