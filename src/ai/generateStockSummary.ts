/**
 * StockAI — server-only OpenAI customer explanation generator.
 *
 * Architecture (설계도 / score-role separation):
 * - Rule engine (`analyzeStock`) computes finalScore, riskScore, state, actionCode, and auxiliary scores.
 * - This module ONLY rewrites those results into customer-facing Korean copy.
 * - NEVER import from Client Components. NEVER use NEXT_PUBLIC_OPENAI_API_KEY.
 *
 * TODO(next, out of scope here): Yahoo Finance 원본 가격 스케일 검증 — 예: 005930.KS 종목에서
 * UI에 current/close 307,000 등이 표시될 때 provider 단위·조정값이 맞는지 별도 조사 필요.
 */

import OpenAI from "openai";
import type { StockAnalysisResult } from "@/src/engine/analyzeStock";

/** Customer-facing JSON shape returned in API `aiSummary` (read-only narrative). */
export type StockSummaryAiOutput = {
  title: string;
  oneLine: string;
  keyPoints: string[];
  riskComment: string;
  nextCheckpoints: string[];
  caution: string;
  sixWForecast?: SixWForecast;
};

export type SixWForecast = {
  who: string;
  when: string;
  where: string;
  what: string;
  why: string;
  how: string;
  howMuch?: SixWHowMuch;
  consumerDecisionGuide?: SixWConsumerDecisionGuide;
  dynamicReasoning?: SixWDynamicReasoning;
  probabilityNote?: string;
};

export type SixWHowMuch = {
  currentBias: {
    label: string;
    probabilityRange: string;
    reason: string;
  };
  scenarioShift: {
    recoveryIf: string;
    recoveryProbabilityAfterTrigger: string;
    neutralIf: string;
    neutralProbabilityRange: string;
    cautionIf: string;
    cautionProbabilityAfterTrigger: string;
  };
  confidence: {
    level: "낮음" | "보통" | "높음";
    reason: string;
  };
  evidenceScores: {
    label: string;
    value: string;
    meaning: string;
  }[];
};

export type SixWConsumerDecisionGuide = {
  currentMode: string;
  entryBeforeCheck: string[];
  holderCheck: string[];
  avoidOrDelayCondition: string[];
  improvementCondition: string[];
  riskControlFocus: string[];
};

export type SixWDynamicReasoning = {
  stockPersonality: string;
  scoreInterpretationMode: string;
  whyThisStockNeedsThisInterpretation: string;
  flexibleThinkingRules: string[];
};

export type StockSummaryInput = {
  stockName?: string;
  finalScore: number;
  riskScore: number;
  primaryState: string;
  actionCode: string;
  actionPriorityScore: number;
  conflictScore: number | null;
  falseSignalScore: number | null;
  riskGateOverlayScore: number | null;
  closePositionScore: number;
  vwapScore: number;
  vwapRiskScore: number;
  volumeScore: number;
  volatilityRiskScore: number;
  engineSummary: string;
  warnings: string[];
  stateSummary: string;
  actionSummary: string;
  conflictSummary?: string;
  falseSignalSummary?: string;
  riskGateSummary?: string;
  evidence: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  guidanceNarrative?: Record<string, unknown>;
  week52PositionScore?: number;
  vwapBreakdownRiskScore?: number;
  participationWeaknessRisk?: number;
  volumeRiskScore?: number;
  riskGateSeverity?: string;
};

export type RiskLevel = {
  min: number;
  max: number;
  label: string;
  tone: string;
};

export const RISK_LEVEL_RULES: RiskLevel[] = [
  { min: 0, max: 30, label: "낮음", tone: "관리 가능" },
  { min: 31, max: 50, label: "보통", tone: "일부 확인 필요" },
  { min: 51, max: 70, label: "주의", tone: "세부 위험 확인 필요" },
  { min: 71, max: 85, label: "높음", tone: "강한 주의" },
  { min: 86, max: 100, label: "매우 높음", tone: "강한 판단 제한" },
];

export type DetailRiskItem = {
  name: string;
  score: number;
  level: string;
  message: string;
};

export type RiskInterpretation = {
  overallRisk: {
    score: number;
    level: string;
    tone: string;
    message: string;
  };
  keyDetailRisks: DetailRiskItem[];
  interpretationRule: string;
};

export type ConflictExplanation = {
  positiveSide: string;
  cautionSide: string;
  conclusion: string;
};

export type ScoreContext = {
  stockName: string;
  finalScore: number;
  riskScore: number;
  riskLevel: RiskLevel;
  closePositionScore: number;
  vwapScore: number;
  vwapRiskScore: number;
  vwapBreakdownRiskScore: number;
  volumeScore: number;
  volumeRiskScore: number;
  participationWeaknessRisk: number;
  volatilityRiskScore: number;
  week52PositionScore: number;
  conflictScore: number | null;
  falseSignalScore: number | null;
  riskGateOverlayScore: number | null;
  riskGateSeverity: string;
  actionPriorityScore: number;
  canUseSupplyWeakness: boolean;
  canUseWarning: boolean;
  riskInterpretation: RiskInterpretation;
  conflictExplanation: ConflictExplanation;
};

const HIGH_DETAIL_RISK_THRESHOLD = 71;
const HOW_MUCH_DISCLAIMER =
  "위 비중은 가격 상승·하락 확률이 아니라, 현재 조건에서 어떤 해석 시나리오가 더 우세한지를 나타내는 참고 비중입니다.";

const FORBIDDEN_OVERALL_HIGH_RISK_PHRASES = [
  "높은 편",
  "높은 상태",
  "위험이 높다",
  "위험이 높습니다",
  "리스크가 높은 상태",
  "리스크가 큰 상태",
  "강한 위험",
  "현재 리스크가 높은 상태",
  "리스크 점수가 높",
  "리스크가 높",
  "위험 수준",
];

const FORBIDDEN_SIXW_GENERIC = [
  "투자자와 시장 참여자들",
  "주식 시장에서",
  "주식 시장",
  "가격 흐름을 면밀히 분석하여",
  "리스크 관리 차원에서",
  "단기 수급 상황",
  "단기 흐름의 신뢰도를 높이기 위해",
  "시장에서",
  "투자자들이",
  "면밀히 관찰",
];

/** Samsung-like: weak VWAP/close vs strong 52-week — use fixed 6W actor/checkpoint copy. */
export function isVwapCloseWeek52ConflictPattern(ctx: ScoreContext): boolean {
  return (
    ctx.vwapScore < 50 &&
    ctx.closePositionScore <= 40 &&
    ctx.week52PositionScore >= 70
  );
}

function sixWFieldBlob(sixW: Partial<SixWForecast> | undefined): string {
  if (!sixW) return "";
  return [sixW.who, sixW.when, sixW.where, sixW.what, sixW.why, sixW.how]
    .filter((s): s is string => typeof s === "string" && s.length > 0)
    .join("|");
}

/** True when OpenAI (or partial) 6W core is generic, forbidden, or non-actionable. */
export function isSixWCoreGeneric(sixW: Partial<SixWForecast> | undefined): boolean {
  if (!sixW) return true;

  const blob = sixWFieldBlob(sixW);
  if (!blob.trim()) return true;

  for (const phrase of FORBIDDEN_SIXW_GENERIC) {
    if (blob.includes(phrase)) return true;
  }

  const who = (sixW.who ?? "").trim();
  const when = (sixW.when ?? "").trim();
  const where = (sixW.where ?? "").trim();
  const what = (sixW.what ?? "").trim();
  const why = (sixW.why ?? "").trim();

  if (/주식\s*$/.test(who) || (who.includes("주식") && !who.includes("보유") && !who.includes("매수"))) {
    return true;
  }
  if (where === "주식 시장" || where === "시장" || /^주식\s*시장/.test(where)) {
    return true;
  }
  if (when === "다음 거래일" || (when.includes("다음 거래일") && !when.includes("장"))) {
    return true;
  }
  if (what.length > 0 && what.length < 18 && !what.includes("종가") && !what.includes("마감")) {
    return true;
  }
  if (why.includes("신뢰도를 높이기 위해") && !why.includes("부족") && !why.includes("약해")) {
    return true;
  }

  return false;
}

export function shouldUseDeterministicSixWCore(
  ctx: ScoreContext,
  openAiSixW: Partial<SixWForecast> | undefined,
): boolean {
  if (isVwapCloseWeek52ConflictPattern(ctx)) return true;
  if (ctx.vwapBreakdownRiskScore >= 65 && ctx.closePositionScore <= 40) return true;
  return isSixWCoreGeneric(openAiSixW);
}

export function getRiskLevel(score: number): RiskLevel {
  const clamped = Math.max(0, Math.min(100, score));
  const match = RISK_LEVEL_RULES.find((rule) => clamped >= rule.min && clamped <= rule.max);
  return match ?? RISK_LEVEL_RULES[1];
}

function formatScore(score: number): string {
  const rounded = Math.round(score * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

export function buildScoreContextFromInput(input: StockSummaryInput): ScoreContext {
  const riskScore = input.riskScore ?? 0;
  const vwapBreakdownRiskScore = input.vwapBreakdownRiskScore ?? 0;
  const participationWeaknessRisk = input.participationWeaknessRisk ?? 0;
  const volumeScore = input.volumeScore ?? 0;
  const volumeRiskScore = input.volumeRiskScore ?? 0;
  const riskGateOverlayScore = input.riskGateOverlayScore ?? 0;
  const riskGateSeverity = input.riskGateSeverity ?? "NONE";

  const keyDetailRisks: DetailRiskItem[] = [];

  if (vwapBreakdownRiskScore >= HIGH_DETAIL_RISK_THRESHOLD) {
    const level = getRiskLevel(vwapBreakdownRiskScore);
    keyDetailRisks.push({
      name: "VWAP 이탈 위험",
      score: vwapBreakdownRiskScore,
      level: level.label,
      message: "평균 거래 단가 기준 단기 회복 신뢰도 확인이 필요합니다.",
    });
  }
  if (input.vwapRiskScore >= HIGH_DETAIL_RISK_THRESHOLD) {
    const level = getRiskLevel(input.vwapRiskScore);
    keyDetailRisks.push({
      name: "VWAP 리스크",
      score: input.vwapRiskScore,
      level: level.label,
      message: "평균 단가 위 회복 여부가 중요합니다.",
    });
  }
  if (input.volatilityRiskScore >= HIGH_DETAIL_RISK_THRESHOLD) {
    const level = getRiskLevel(input.volatilityRiskScore);
    keyDetailRisks.push({
      name: "변동성 위험",
      score: input.volatilityRiskScore,
      level: level.label,
      message: "장중 흔들림 이후 마감 안정성을 함께 봐야 합니다.",
    });
  }

  const riskLevel = getRiskLevel(riskScore);
  const overallMessage = `종합 리스크는 ${riskLevel.label} 수준입니다.`;

  const riskInterpretation: RiskInterpretation = {
    overallRisk: {
      score: riskScore,
      level: riskLevel.label,
      tone: riskLevel.tone,
      message: overallMessage,
    },
    keyDetailRisks,
    interpretationRule:
      "종합 리스크가 보통이어도 세부 위험이 높으면 전체 위험이 높다고 말하지 말고, 세부 확인 신호가 강하다고 표현한다.",
  };

  const week52 = input.week52PositionScore ?? 0;
  const conflictExplanation: ConflictExplanation = {
    positiveSide:
      week52 >= 70
        ? `52주 위치 점수 ${formatScore(week52)}점으로 장기 가격 위치는 양호`
        : week52 > 0
          ? `52주 위치 점수 ${formatScore(week52)}점`
          : "장기 위치 신호는 제한적",
    cautionSide: `VWAP 점수 ${formatScore(input.vwapScore)}점, 종가 위치 점수 ${formatScore(input.closePositionScore)}점으로 단기 흐름은 약함`,
    conclusion: "장기 위치와 단기 흐름이 엇갈리는 구조",
  };

  return {
    stockName: input.stockName?.trim() || "해당 종목",
    finalScore: input.finalScore ?? 0,
    riskScore,
    riskLevel,
    closePositionScore: input.closePositionScore ?? 0,
    vwapScore: input.vwapScore ?? 0,
    vwapRiskScore: input.vwapRiskScore ?? 0,
    vwapBreakdownRiskScore,
    volumeScore,
    volumeRiskScore,
    participationWeaknessRisk,
    volatilityRiskScore: input.volatilityRiskScore ?? 0,
    week52PositionScore: week52,
    conflictScore: input.conflictScore,
    falseSignalScore: input.falseSignalScore,
    riskGateOverlayScore: riskGateOverlayScore,
    riskGateSeverity,
    actionPriorityScore: input.actionPriorityScore ?? 0,
    canUseSupplyWeakness:
      participationWeaknessRisk >= 50 || volumeScore <= 35 || volumeRiskScore >= 60,
    canUseWarning:
      riskScore >= 71 || riskGateSeverity === "BLOCK" || riskGateOverlayScore >= 86,
    riskInterpretation,
    conflictExplanation,
  };
}

export function buildScoreContextFromAnalysis(
  analysis: StockAnalysisResult,
  options?: { stockName?: string },
): ScoreContext {
  return buildScoreContextFromInput(
    buildStockSummaryInputFromAnalysis(analysis, options),
  );
}

export function canUseSupplyWeaknessPhrase(ctx: ScoreContext): boolean {
  return ctx.canUseSupplyWeakness;
}

export function canUseWarningPhrase(ctx: ScoreContext): boolean {
  return ctx.canUseWarning;
}

export function buildRiskComment(ctx: ScoreContext): string {
  const riskScore = ctx.riskScore;
  const riskLevel = ctx.riskLevel;
  const detailLabels = ctx.riskInterpretation.keyDetailRisks.map(
    (item) => `${item.name} ${formatScore(item.score)}점`,
  );

  if (riskScore <= 50 && detailLabels.length > 0) {
    const hasVwapDetail = ctx.riskInterpretation.keyDetailRisks.some((r) =>
      r.name.includes("VWAP"),
    );
    const confirmFocus = hasVwapDetail
      ? "VWAP 회복 여부와 종가 위치 개선"
      : "해당 조건의 회복 여부";
    return `종합 리스크 점수는 ${formatScore(riskScore)}점으로 ${riskLevel.label} 수준입니다. 다만 ${detailLabels.join(", ")}처럼 일부 단기 세부 위험 신호가 높아, 전체 위험을 과도하게 단정하기보다 ${confirmFocus}을 우선 확인해야 합니다.`;
  }

  return `종합 리스크 점수는 ${formatScore(riskScore)}점으로 ${riskLevel.label} 수준입니다. ${riskLevel.tone} 구간에 해당합니다.`;
}

export function buildAiSummaryTitle(ctx: ScoreContext): string {
  const name = ctx.stockName;
  if (ctx.riskScore >= 71) {
    return `${name}, 주요 리스크 경고 구간`;
  }
  if (ctx.vwapBreakdownRiskScore >= 71 && ctx.riskScore < 51) {
    return `${name}, 단기 VWAP 이탈 점검 구간`;
  }
  if (ctx.closePositionScore <= 20) {
    return `${name}, 종가 위치 개선 확인 구간`;
  }
  return `${name}, 다음 흐름 확인 구간`;
}

export function buildCoreSummary(ctx: ScoreContext): string {
  const week52 = ctx.week52PositionScore;
  const longTerm =
    week52 >= 70
      ? `52주 가격 위치는 ${formatScore(week52)}점으로 장기 위치는 양호한 편`
      : week52 > 0
        ? `52주 가격 위치는 ${formatScore(week52)}점`
        : "장기 위치 신호는 제한적";

  if (ctx.canUseSupplyWeakness) {
    return `${longTerm}이지만, 거래 참여 약화 신호가 있어 단기 회복 신뢰도는 추가 확인이 필요한 상태입니다.`;
  }

  return `${longTerm}이지만, VWAP 이탈과 약한 종가 위치가 겹쳐 단기 회복 신뢰도는 아직 확인이 필요한 상태입니다.`;
}

export function buildKeyPoints(ctx: ScoreContext): string[] {
  const points: string[] = [];

  points.push(
    `VWAP 점수 ${formatScore(ctx.vwapScore)}점으로 평균 거래 단가 기준 단기 약세 신호가 나타났습니다.`,
  );

  if (ctx.closePositionScore <= 55) {
    points.push(
      `종가 위치 점수 ${formatScore(ctx.closePositionScore)}점으로 장 마감 기준 매도 압력이 우세했을 가능성이 있습니다.`,
    );
  }

  if (ctx.week52PositionScore >= 70) {
    points.push(
      `52주 위치 점수 ${formatScore(ctx.week52PositionScore)}점은 장기 가격 위치가 아직 양호하다는 제한적 긍정 신호입니다.`,
    );
  }

  if (ctx.conflictScore !== null && ctx.conflictScore >= 55) {
    const week52Clause =
      ctx.week52PositionScore >= 70
        ? `52주 위치 점수는 ${formatScore(ctx.week52PositionScore)}점으로 장기 가격 위치는 양호`
        : ctx.conflictExplanation.positiveSide;
    points.push(
      `신호 충돌 점수는 ${formatScore(ctx.conflictScore)}점입니다. ${week52Clause}하지만, VWAP 점수 ${formatScore(ctx.vwapScore)}점과 종가 위치 점수 ${formatScore(ctx.closePositionScore)}점이 약해 단기 흐름은 아직 확인이 필요한 구조입니다.`,
    );
  }

  if (ctx.falseSignalScore !== null && ctx.falseSignalScore >= 55) {
    points.push(
      `가짜 신호 위험 점수 ${formatScore(ctx.falseSignalScore)}점은 반등처럼 보이는 움직임이 실제 회복으로 이어지는지 추가 확인이 필요한 구간입니다.`,
    );
  }

  if (ctx.riskGateOverlayScore !== null && ctx.riskGateOverlayScore >= 40) {
    points.push(
      `리스크 게이트 점수 ${formatScore(ctx.riskGateOverlayScore)}점은 일부 해석에 제한을 두고 조건 확인을 우선해야 함을 뜻합니다.`,
    );
  }

  return points.slice(0, 5);
}

export function buildCautionText(ctx: ScoreContext): string {
  if (ctx.closePositionScore <= 40 && ctx.vwapScore < 50) {
    return "VWAP 아래 체류와 저가권 종가가 반복되면 단기 회복 신뢰도는 더 낮아질 수 있습니다.";
  }
  if (ctx.falseSignalScore !== null && ctx.falseSignalScore >= 55) {
    return "반등처럼 보이는 장중 움직임이 종가까지 이어지지 않으면 회복 신뢰도 해석은 보수적으로 유지하는 것이 적절합니다.";
  }
  return "단일 점수만으로 방향을 확정하기보다 VWAP·종가·거래 참여가 함께 개선되는지 확인하는 것이 우선입니다.";
}

export function buildNextCheckpoints(): string[] {
  return [
    "평균 거래 단가 위로 회복한 뒤 종가까지 유지되는지 확인하세요.",
    "종가가 당일 범위 저가권을 벗어나 중상단으로 개선되는지 확인하세요.",
    "거래량 증가가 가격 회복과 함께 나타나는지 확인하세요.",
    "장중 반등이 거래 참여를 동반해 VWAP 위에서 마감되는지 확인하세요.",
  ];
}

export function buildSixWForecast(ctx: ScoreContext): SixWForecast {
  if (isVwapCloseWeek52ConflictPattern(ctx)) {
    return {
      who: "단기 매수세와 기존 보유자",
      when: "다음 거래일 장 초반부터 종가까지",
      where: "VWAP 부근과 당일 저가권 이탈 여부에서",
      what: "평균 단가 위 회복과 종가 위치 개선을 확인해야 합니다.",
      why: "52주 위치는 양호하지만 VWAP와 종가 위치가 약해 단기 회복 신뢰도가 아직 부족하기 때문입니다.",
      how: "장중 회복이 거래량을 동반해 VWAP 위에서 종가까지 유지되는지 확인해야 합니다.",
      probabilityNote: HOW_MUCH_DISCLAIMER,
    };
  }

  const week52 = ctx.week52PositionScore;
  const weakVwapClose = ctx.vwapScore < 50 || ctx.closePositionScore <= 40;

  if (weakVwapClose && ctx.vwapBreakdownRiskScore >= 65) {
    return {
      who: "단기 매수세와 기존 보유자",
      when: "다음 거래일 장 초반부터 종가까지",
      where: "단기 기준선(VWAP) 부근과 당일 저가권 이탈 여부에서",
      what: "평균 거래 단가 위 회복과 마감 위치 개선을 확인해야 합니다.",
      why:
        week52 >= 70
          ? "52주 위치는 양호하지만 평균 거래 단가·종가 위치가 약해 가격 회복 신뢰도가 아직 부족하기 때문입니다."
          : `평균 거래 단가 점수 ${formatScore(ctx.vwapScore)}점·종가 위치 ${formatScore(ctx.closePositionScore)}점이 약해 단기 회복 신뢰도 확인이 우선입니다.`,
      how: "장중 회복이 거래량을 동반해 단기 기준선 위에서 종가까지 유지되는지 확인해야 합니다.",
      probabilityNote: HOW_MUCH_DISCLAIMER,
    };
  }

  return {
    who: "단기 매수세와 기존 보유자",
    when: "다음 거래일 장 초반부터 종가까지",
    where: "평균 거래 단가(VWAP) 부근과 당일 가격 범위 하단 이탈 여부에서",
    what: "평균 거래 단가 위 안착과 마감 위치 개선을 확인해야 합니다.",
    why:
      week52 >= 70
        ? `52주 위치 점수 ${formatScore(week52)}점은 양호하나, 단기 기준선·종가 신호가 약해 가격 회복 신뢰도는 추가 확인이 필요합니다.`
        : `종합 리스크 ${formatScore(ctx.riskScore)}점(${ctx.riskLevel.label}) 구간에서 다음 세션의 가격 회복 신뢰도를 점검해야 합니다.`,
    how: "장중 반등이 거래 참여를 동반해 VWAP 위에서 종가까지 이어지는지 확인해야 합니다.",
    probabilityNote: HOW_MUCH_DISCLAIMER,
  };
}

function mergeSixWCoreFields(
  ctx: ScoreContext,
  openAiSixW: Partial<SixWForecast> | undefined,
): Pick<SixWForecast, "who" | "when" | "where" | "what" | "why" | "how"> {
  const deterministic = buildSixWForecast(ctx);

  if (shouldUseDeterministicSixWCore(ctx, openAiSixW)) {
    return {
      who: deterministic.who,
      when: deterministic.when,
      where: deterministic.where,
      what: deterministic.what,
      why: deterministic.why,
      how: deterministic.how,
    };
  }

  const merged = {
    who: sanitizeTextForScoreRules(openAiSixW?.who ?? deterministic.who, ctx),
    when: sanitizeTextForScoreRules(openAiSixW?.when ?? deterministic.when, ctx),
    where: sanitizeTextForScoreRules(openAiSixW?.where ?? deterministic.where, ctx),
    what: sanitizeTextForScoreRules(openAiSixW?.what ?? deterministic.what, ctx),
    why: sanitizeTextForScoreRules(openAiSixW?.why ?? deterministic.why, ctx),
    how: sanitizeTextForScoreRules(openAiSixW?.how ?? deterministic.how, ctx),
  };

  if (isSixWCoreGeneric(merged)) {
    return {
      who: deterministic.who,
      when: deterministic.when,
      where: deterministic.where,
      what: deterministic.what,
      why: deterministic.why,
      how: deterministic.how,
    };
  }

  return merged;
}

function buildHowMuchScenarioWeights(ctx: ScoreContext): SixWHowMuch {
  const cautionLean =
    ctx.vwapBreakdownRiskScore >= 65 ||
    ctx.closePositionScore <= 25 ||
    ctx.vwapScore < 45;
  const recoveryLean =
    ctx.vwapScore >= 55 && ctx.closePositionScore >= 45 && ctx.volumeScore >= 50;
  const neutralLean = !cautionLean && !recoveryLean;

  const currentLabel = cautionLean
    ? "주의 관찰 시나리오 우세"
    : recoveryLean
      ? "회복 확인 시나리오 우세"
      : neutralLean
        ? "중립 유지 시나리오 우세"
        : "관찰 확인 시나리오 우세";

  const currentRange = cautionLean ? "약 65~75%" : recoveryLean ? "약 55~65%" : "약 30~40%";

  const reasonParts: string[] = [];
  if (ctx.vwapBreakdownRiskScore >= 65) {
    reasonParts.push(`VWAP 이탈 위험 ${formatScore(ctx.vwapBreakdownRiskScore)}점`);
  }
  if (ctx.closePositionScore <= 30) {
    reasonParts.push(`종가 위치 ${formatScore(ctx.closePositionScore)}점`);
  }
  if (ctx.vwapScore < 50) {
    reasonParts.push(`VWAP 점수 ${formatScore(ctx.vwapScore)}점`);
  }

  const evidenceScores = [
    {
      label: "종합 리스크",
      value: `${formatScore(ctx.riskScore)}점 · ${ctx.riskLevel.label}`,
      meaning: "전체 위험 수준의 기준",
    },
    {
      label: "VWAP 이탈 위험",
      value: `${formatScore(ctx.vwapBreakdownRiskScore)}점`,
      meaning: "단기 세부 확인 신호",
    },
    {
      label: "종가 위치",
      value: `${formatScore(ctx.closePositionScore)}점`,
      meaning: "마감 위치 확인",
    },
  ];

  return {
    currentBias: {
      label: currentLabel,
      probabilityRange: currentRange,
      reason:
        reasonParts.length > 0
          ? `${reasonParts.join(", ")} 신호가 함께 나타나 현재는 ${currentLabel}로 해석하는 것이 적절합니다.`
          : `종합 리스크 ${formatScore(ctx.riskScore)}점(${ctx.riskLevel.label}) 기준으로 해석 비중을 정리했습니다.`,
    },
    scenarioShift: {
      recoveryIf: "VWAP 위로 회복한 뒤 종가까지 유지되고, 거래량이 가격 회복과 함께 나타나는 경우",
      recoveryProbabilityAfterTrigger: "회복 신뢰도 개선 · 약 55~65%",
      neutralIf: "VWAP 근처 등락이 이어지고 종가 개선이 제한적인 경우",
      neutralProbabilityRange: "중립 유지 가능성 · 약 30~40%",
      cautionIf: "VWAP 아래 체류와 저가권 종가가 반복되는 경우",
      cautionProbabilityAfterTrigger: "주의 관찰 비중 확대 · 약 70~80%",
    },
    confidence: {
      level:
        (ctx.riskGateOverlayScore ?? 0) >= 60 ||
        (ctx.conflictScore !== null && ctx.conflictScore >= 60)
          ? "낮음"
          : "보통",
      reason: "EOD 기준 데이터와 신호 충돌·게이트 요소가 있어 확률보다 조건 확인 비중이 큽니다.",
    },
    evidenceScores,
  };
}

export function buildConsumerDecisionGuide(ctx: ScoreContext): SixWConsumerDecisionGuide {
  const mode =
    ctx.riskScore >= 71
      ? "리스크 점검 모드"
      : ctx.vwapBreakdownRiskScore >= 65 || ctx.closePositionScore <= 25
        ? "관찰 모드"
        : "회복 확인 모드";

  return {
    currentMode: mode,
    entryBeforeCheck: [
      "VWAP 위로 회복한 뒤 종가까지 유지되는지 확인하세요.",
      "저가권 마감이 반복되지 않는지 확인하세요.",
      "거래량 증가가 가격 회복과 함께 나타나는지 확인하세요.",
    ],
    holderCheck: [
      "VWAP 회복 실패가 반복되는지 확인하세요.",
      "종가가 계속 당일 범위 하단에 머무는지 확인하세요.",
      "장중 반등 후 다시 VWAP 아래로 밀리는지 확인하세요.",
    ],
    avoidOrDelayCondition: [
      "VWAP 아래 체류가 이어지고 종가가 다시 저가권에 머무를 경우",
      "거래량은 유지되지만 가격 회복이 동반되지 않을 경우",
      "장중 반등 후 다시 VWAP 아래로 밀릴 경우",
    ],
    improvementCondition: [
      "VWAP 위로 회복한 뒤 종가까지 유지될 경우",
      "종가 위치가 저가권에서 중상단으로 개선될 경우",
      "거래량 증가가 가격 회복과 함께 나타날 경우",
    ],
    riskControlFocus: [
      "장중 반등만 보고 회복으로 단정하지 말 것",
      "VWAP 회복 후 재이탈 여부를 확인할 것",
      "52주 위치가 높다는 이유만으로 단기 약세 신호를 무시하지 말 것",
    ],
  };
}

export function buildDynamicReasoning(ctx: ScoreContext): SixWDynamicReasoning {
  const stockCharacter =
    ctx.volatilityRiskScore >= 65
      ? "대형주이지만, 현재 캔들 기준 장중 변동성과 VWAP 이탈 신호가 함께 나타난 상태"
      : "대형주 기준이지만, 현재는 VWAP·종가 중심의 단기 확인이 필요한 상태";

  const detailHint =
    ctx.riskInterpretation.keyDetailRisks.length > 0
      ? `, ${ctx.riskInterpretation.keyDetailRisks.map((r) => r.name).join("·")} 같은 세부 신호`
      : "";

  return {
    stockPersonality: stockCharacter,
    scoreInterpretationMode: "신중한 관찰",
    whyThisStockNeedsThisInterpretation: `종합 리스크는 ${ctx.riskLevel.label} 수준이지만${detailHint}가 단기 해석을 제한하고 있기 때문입니다.`,
    flexibleThinkingRules: [
      "종합 리스크만 보고 위험하다고 단정하지 않습니다.",
      "52주 위치 점수만 보고 강세라고 단정하지 않습니다.",
      "VWAP 회복 여부와 종가 위치 개선을 우선 확인합니다.",
      "거래량이 가격 회복을 동반하는지 확인합니다.",
      "신호 충돌·가짜 신호 점수는 방향 예측이 아니라 확인 강도를 뜻합니다.",
    ],
  };
}

function sanitizeTextForScoreRules(text: string, ctx: ScoreContext): string {
  let result = text;
  if (ctx.riskScore < 51) {
    for (const phrase of FORBIDDEN_OVERALL_HIGH_RISK_PHRASES) {
      if (result.includes(phrase)) {
        result = result.replaceAll(phrase, "보통 수준");
      }
    }
    result = result.replace(/경고 신호/g, "점검 구간");
    result = result.replace(/경고 구간/g, "확인 구간");
    result = result.replace(/부정적\s*·\s*(\d{1,3}~?\d{1,3}%)/g, "주의 관찰 시나리오 우세 · 약 $1%");
  }
  if (!ctx.canUseSupplyWeakness) {
    result = result.replace(/단기 수급 약화/g, "VWAP 이탈과 약한 종가 위치");
    result = result.replace(/수급 약화/g, "가격 회복 부족");
  }
  for (const phrase of FORBIDDEN_SIXW_GENERIC) {
    if (result.includes(phrase)) {
      result = result.replaceAll(phrase, "");
    }
  }
  return result.replace(/\s{2,}/g, " ").trim();
}

export function normalizeAiSummaryByScoreRules(
  aiSummary: StockSummaryAiOutput,
  ctx: ScoreContext,
): StockSummaryAiOutput {
  const howMuch = buildHowMuchScenarioWeights(ctx);
  const consumer = buildConsumerDecisionGuide(ctx);
  const dynamic = buildDynamicReasoning(ctx);
  const sixWCore = mergeSixWCoreFields(ctx, aiSummary.sixWForecast);

  const mergedSixW: SixWForecast = {
    ...sixWCore,
    howMuch,
    consumerDecisionGuide: consumer,
    dynamicReasoning: dynamic,
    probabilityNote: HOW_MUCH_DISCLAIMER,
  };

  const keyPoints = buildKeyPoints(ctx);
  const openAiKeyPoints = aiSummary.keyPoints?.length ? aiSummary.keyPoints : [];
  const mergedKeyPoints =
    keyPoints.length >= 3
      ? keyPoints
      : [...keyPoints, ...openAiKeyPoints].slice(0, 5);

  return {
    title: buildAiSummaryTitle(ctx),
    oneLine: buildCoreSummary(ctx),
    keyPoints: mergedKeyPoints.length >= 3 ? mergedKeyPoints : buildKeyPoints(ctx),
    riskComment: buildRiskComment(ctx),
    nextCheckpoints: buildNextCheckpoints(),
    caution: buildCautionText(ctx),
    sixWForecast: mergedSixW,
  };
}

export function buildDeterministicAiSummary(ctx: ScoreContext): StockSummaryAiOutput {
  const sixW = buildSixWForecast(ctx);
  return {
    title: buildAiSummaryTitle(ctx),
    oneLine: buildCoreSummary(ctx),
    keyPoints: buildKeyPoints(ctx),
    riskComment: buildRiskComment(ctx),
    nextCheckpoints: buildNextCheckpoints(),
    caution: buildCautionText(ctx),
    sixWForecast: {
      ...sixW,
      howMuch: buildHowMuchScenarioWeights(ctx),
      consumerDecisionGuide: buildConsumerDecisionGuide(ctx),
      dynamicReasoning: buildDynamicReasoning(ctx),
      probabilityNote: HOW_MUCH_DISCLAIMER,
    },
  };
}

export type GenerateStockSummaryResult = {
  ok: boolean;
  source: "openai" | "skipped" | "error";
  data: StockSummaryAiOutput | null;
  error?: string;
};

export const STOCK_SUMMARY_PROMPT_RULES = `
You are StockAI's customer-facing explanation writer (not a scoring engine).
Your job is to explain the rule-engine result in clear Korean for a general investor.

=== Non-negotiable rules ===
- Do NOT modify, recalculate, or invent any score, state, or action code.
- Use ONLY facts from the input JSON (scores, summaries, warnings, evidence).
- This is conditional interpretation only — not buy/sell advice.
- Mention once (in oneLine or riskComment only) that this is not 매수·매도 추천 if helpful; do not repeat that disclaimer everywhere.

=== Tone (Korean) ===
- Calm, observational, easy to read. Short sentences.
- Prefer: "확인이 필요합니다", "관찰 비중이 큽니다", "회복 여부를 봐야 합니다", "단정하기 어렵습니다", "다음 흐름 확인이 중요합니다", "보수적으로 볼 수 있습니다".
- Avoid over-alarming wording: 위험합니다, 폭락, 급락 확정, 무조건, 강력 매도, 반드시 하락, 투자 금지.
- Avoid robotic repetition of: "VWAP 이탈", "단기 수급 약화", "종가 위치", "주의 필요" — vary vocabulary (평균 거래 단가, 마감 위치, 거래 참여, 관찰 구간, etc.).

=== Anti-repetition (critical) ===
- Each JSON field must add NEW information. Never copy the same sentence or phrase into two fields.
- Before finalizing, check: title, oneLine, each keyPoint, riskComment, each nextCheckpoint, and caution must not share identical wording.
- If two fields would say the same thing, keep the sharper version in one field and rephrase or omit in the other.
- Do not start more than one field with the same word (e.g. avoid starting three bullets with "VWAP").

=== Output JSON only (no markdown) ===
{
  "title": string,
  "oneLine": string,
  "keyPoints": string[],
  "riskComment": string,
  "nextCheckpoints": string[],
  "caution": string,
  "sixWForecast"?: {
    "who": string,
    "when": string,
    "where": string,
    "what": string,
    "why": string,
    "how": string,
    "howMuch"?: {
      "currentBias": {
        "label": string,
        "probabilityRange": string,
        "reason": string
      },
      "scenarioShift": {
        "recoveryIf": string,
        "recoveryProbabilityAfterTrigger": string,
        "neutralIf": string,
        "neutralProbabilityRange": string,
        "cautionIf": string,
        "cautionProbabilityAfterTrigger": string
      },
      "confidence": {
        "level": "낮음" | "보통" | "높음",
        "reason": string
      },
      "evidenceScores": {
        "label": string,
        "value": string,
        "meaning": string
      }[]
    },
    "consumerDecisionGuide"?: {
      "currentMode": string,
      "entryBeforeCheck": string[],
      "holderCheck": string[],
      "avoidOrDelayCondition": string[],
      "improvementCondition": string[],
      "riskControlFocus": string[]
    },
    "dynamicReasoning"?: {
      "stockPersonality": string,
      "scoreInterpretationMode": string,
      "whyThisStockNeedsThisInterpretation": string,
      "flexibleThinkingRules": string[]
    },
    "probabilityNote"?: string
  }
}

=== Field-specific guidance ===

title (핵심 한 줄 제목):
- 12~28 Korean characters when possible. One clear focus for the current structure.
- No score numbers. No duplicate of oneLine.

oneLine (한 문장 요약):
- Exactly one sentence. Conditional takeaway for the next session.
- Different angle from title (e.g. title = what matters; oneLine = how to read it).

keyPoints (주요 해석, exactly 4 items when input has enough signals, else 3):
- Each bullet is ONE distinct idea, 1~2 short sentences max.
- Assign topics without overlap:
  1) price / VWAP / average trade price context (use input vwap scores or evidence)
  2) closing position / where the session ended (closePositionScore, state, close-related evidence)
  3) volume / participation (volumeScore, volume evidence)
  4) signal quality: conflict, false signal, or risk gate overlay ONLY if scores/summaries in input support it; otherwise neutral interpretation limit
- Do not repeat the same risk theme twice. Paraphrase; do not paste engine summary verbatim.

riskComment (리스크 코멘트):
- 2~3 sentences max. Tie together riskScore, overlay/conflict/false-signal ONLY if present in input.
- Explain what the risk picture means for interpretation (not a scary warning).
- Must not repeat keyPoints bullets verbatim.

nextCheckpoints (다음 확인 조건, 3~4 items):
- Actionable checks for the next trading day. Each item = different checkpoint.
- Examples of variety (pick only what input supports; do not invent data):
  - 평균 거래 단가 위로 다시 안착하는지
  - 마감이 당일 범위 하단에 머무르지 않는지
  - 거래량 증가가 가격 회복과 함께 나타나는지
  - 장중 반등이 종가까지 이어지는지
- No duplicate checkpoints. No generic "주의하세요" only lines.

caution (주의 문구):
- ONE short calm sentence (under ~80 Korean characters).
- What would make the interpretation more conservative if it happens — conditional, not scary.
- Must not repeat title, oneLine, or any keyPoint opening phrase.

sixWForecast (6하원칙 기반 다음 흐름 예측):
- ALWAYS include sixWForecast when the OpenAI call succeeds.
- who/when/where/what/why/how: one short sentence each. Make it practical: what matters next and how interpretation shifts.
- howMuch: probability ranges must be derived from the provided scores and signals (VWAP/close/volume/risk/overlay/conflict/false-signal).
  - Do not use random numbers. Keep ranges moderate (example: \"45~55%\"), avoid 0%/100%.
  - Avoid extreme confidence unless the input has many severe gates.
- consumerDecisionGuide: this is for consumer usefulness (NOT advice). Provide distinct lists for entry/holder/avoid/improve/risk-control.
- dynamicReasoning: make StockAI feel flexible. Classify stockPersonality, explain scoreInterpretationMode, why needed, and list 3~6 flexibleThinkingRules.
- probabilityNote: one short line on limitations (e.g. scores guide conditions, not certainty).

=== Score-role separation (server enforces; follow strictly) ===
- finalScore = overall structure quality; riskScore = overall risk level (NOT the same thing).
- conflictScore = disagreement between positive and caution signals — explain WHAT conflicts with WHAT.
- falseSignalScore = recovery reliability check — NOT crash prediction. Forbidden: 가짜 반등이다, 하락 가능성이 높다, 속임수 반등, 매도 위험.
- riskGateOverlay = interpretation restriction layer, not a replacement for riskScore.
- actionPriorityScore = what to check first, not overall danger.

Risk level bands (use input riskLevelLabel; do NOT invent):
- 0–30 낮음, 31–50 보통, 51–70 주의, 71–85 높음, 86–100 매우 높음

If riskScore is 0–50 (보통 or lower):
- NEVER say overall risk is high: forbidden — 높은 편, 높은 상태, 위험이 높다, 리스크가 높은 상태, 경고 신호, 강한 위험.
- If detail risks (vwapBreakdownRisk, vwapRiskScore) are 71+, say: "종합 리스크는 보통이지만, 특정 세부 위험은 높다" — do NOT collapse into "risk is high".

"수급 약화" / "단기 수급 약화": ONLY if canUseSupplyWeakness is true in input. Otherwise use VWAP 이탈, 약한 종가 위치, 가격 회복 부족.

"경고": ONLY if canUseWarning is true. Otherwise use 점검, 확인, 관찰, 주의 관찰.

howMuch percentages = scenario interpretation weight, NOT upside/downside probability. Use labels like "주의 관찰 시나리오 우세 · 약 65~75%". Never "부정적 · 65~75%".

6W forbidden generic phrases: 투자자와 시장 참여자들, 주식 시장에서, 가격 흐름을 면밀히 분석하여, 리스크 관리 차원에서, 단기 수급 상황, 면밀히 관찰.

Example (riskScore 43, vwapBreakdown 76, vwapRisk 72, closePosition 6, week52 90, conflict 68, falseSignal 61):
BAD: "리스크 점수가 높은 편입니다." / "현재 리스크가 높은 상태" / "부정적 65~75%" / "삼성전자, VWAP 이탈 경고 신호" / "단기 수급 약화"
GOOD: "종합 리스크는 보통 수준이지만, VWAP 이탈 위험과 VWAP 리스크처럼 일부 단기 세부 위험 신호가 높아 VWAP 회복 여부를 우선 확인해야 합니다." / "주의 관찰 시나리오가 더 우세한 확인 구간" / "52주 위치는 양호하지만 VWAP와 종가 위치가 약해 장기 위치와 단기 흐름이 엇갈리는 구조" / "단기 VWAP 이탈 점검 구간"

=== Prohibited ===
- buy, sell, recommend, 매수, 매도, 매수 추천, 매도 추천, 투자하세요, 추천합니다
- 확정, 무조건, 목표가, 손절가, 수익 보장, 폭락, 급등 확정
`.trim();

const DEFAULT_MODEL = "gpt-4o-mini";

export function isOpenAIApiKeyConfigured(): boolean {
  return getServerOpenAIApiKey() !== null;
}

function getServerOpenAIApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY;
  if (typeof key !== "string") return null;
  const trimmed = key.trim();
  if (!trimmed || trimmed === "your_openai_api_key_here") return null;
  return trimmed;
}

function getStockSummaryModel(override?: string): string {
  return (
    override?.trim() ||
    process.env.OPENAI_STOCK_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    DEFAULT_MODEL
  );
}

function createOpenAIClient(): OpenAI | null {
  const apiKey = getServerOpenAIApiKey();
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export function buildStockSummaryInputFromAnalysis(
  analysis: StockAnalysisResult,
  options?: { stockName?: string; guidanceNarrative?: Record<string, unknown> },
): StockSummaryInput {
  const evidence = {
    positive: [...(analysis.evidence?.positive ?? [])],
    negative: [...(analysis.evidence?.negative ?? [])],
    neutral: [...(analysis.evidence?.neutral ?? [])],
  };

  return {
    stockName: options?.stockName ?? analysis.normalized?.name,
    finalScore: analysis.finalScore,
    riskScore: analysis.risk.riskScore,
    primaryState: analysis.state.primaryState,
    actionCode: analysis.action.actionCode,
    actionPriorityScore: analysis.action.actionScore,
    conflictScore: analysis.conflictAnalysis?.conflictScore ?? null,
    falseSignalScore: analysis.falseSignalAnalysis?.falseSignalScore ?? null,
    riskGateOverlayScore: analysis.riskGateOverlay?.overlayScore ?? null,
    closePositionScore: analysis.ohlc.closePositionScore,
    vwapScore: analysis.vwap.vwapScore,
    vwapRiskScore: analysis.vwap.vwapRiskScore,
    volumeScore: analysis.volume.volumeScore,
    volatilityRiskScore: analysis.risk.volatilityRiskScore,
    week52PositionScore: analysis.ohlc.week52PositionScore,
    vwapBreakdownRiskScore: analysis.risk.vwapBreakdownRiskScore,
    participationWeaknessRisk: analysis.risk.lowLiquidityOrWeakParticipationRiskScore,
    volumeRiskScore: analysis.volume.volumeRiskScore,
    riskGateSeverity: analysis.riskGateOverlay?.severity ?? "NONE",
    engineSummary: analysis.summary,
    warnings: [...(analysis.warnings ?? [])],
    stateSummary: analysis.state.summary,
    actionSummary: analysis.action.summary,
    conflictSummary: analysis.conflictAnalysis?.summaryKo,
    falseSignalSummary: analysis.falseSignalAnalysis?.summaryKo,
    riskGateSummary: analysis.riskGateOverlay?.summaryKo,
    evidence,
    guidanceNarrative: options?.guidanceNarrative,
  };
}

function buildUserMessage(input: StockSummaryInput): string {
  const ctx = buildScoreContextFromInput(input);
  return JSON.stringify(
    {
      task: "Generate customer-facing StockAI summary from rule-engine output (read-only).",
      stockName: input.stockName ?? null,
      scores: {
        finalScore: input.finalScore,
        riskScore: input.riskScore,
        riskLevelLabel: ctx.riskLevel.label,
        riskLevelTone: ctx.riskLevel.tone,
        conflictScore: input.conflictScore,
        falseSignalScore: input.falseSignalScore,
        riskGateOverlayScore: input.riskGateOverlayScore,
        riskGateSeverity: input.riskGateSeverity,
        closePositionScore: input.closePositionScore,
        vwapScore: input.vwapScore,
        vwapRiskScore: input.vwapRiskScore,
        vwapBreakdownRiskScore: input.vwapBreakdownRiskScore,
        week52PositionScore: input.week52PositionScore,
        volumeScore: input.volumeScore,
        volumeRiskScore: input.volumeRiskScore,
        participationWeaknessRisk: input.participationWeaknessRisk,
        volatilityRiskScore: input.volatilityRiskScore,
        actionPriorityScore: input.actionPriorityScore,
      },
      riskInterpretation: ctx.riskInterpretation,
      conflictExplanation: ctx.conflictExplanation,
      wordingGates: {
        canUseSupplyWeakness: ctx.canUseSupplyWeakness,
        canUseWarning: ctx.canUseWarning,
      },
      state: {
        primaryState: input.primaryState,
        summary: input.stateSummary,
      },
      action: {
        actionCode: input.actionCode,
        summary: input.actionSummary,
      },
      engineSummary: input.engineSummary,
      warnings: input.warnings,
      conflictAnalysis: input.conflictSummary
        ? { conflictScore: input.conflictScore, summaryKo: input.conflictSummary }
        : input.conflictScore !== null
          ? { conflictScore: input.conflictScore }
          : null,
      falseSignalAnalysis: input.falseSignalSummary
        ? { falseSignalScore: input.falseSignalScore, summaryKo: input.falseSignalSummary }
        : input.falseSignalScore !== null
          ? { falseSignalScore: input.falseSignalScore }
          : null,
      riskGateOverlay: input.riskGateSummary
        ? { overlayScore: input.riskGateOverlayScore, summaryKo: input.riskGateSummary }
        : input.riskGateOverlayScore !== null
          ? { overlayScore: input.riskGateOverlayScore }
          : null,
      evidence: input.evidence,
      guidanceNarrative: input.guidanceNarrative ?? null,
    },
    null,
    2,
  );
}

function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/i.exec(trimmed);
  return fence ? fence[1].trim() : trimmed;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  return s.length > 0 ? s : null;
}

function asStringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown, maxItems = 6): string[] | null {
  if (!Array.isArray(value)) return null;
  const items = value
    .map((item) => asNonEmptyString(item))
    .filter((item): item is string => Boolean(item))
    .slice(0, maxItems);
  return items.length > 0 ? items : null;
}

function asStringArrayOrEmpty(value: unknown, maxItems = 8): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((s) => s.length > 0)
    .slice(0, maxItems);
}

function parseSixWForecast(record: Record<string, unknown>): SixWForecast | undefined {
  const raw = record.sixWForecast;
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;

  const who = asStringOrEmpty(r.who);
  const when = asStringOrEmpty(r.when);
  const where = asStringOrEmpty(r.where);
  const what = asStringOrEmpty(r.what);
  const why = asStringOrEmpty(r.why);
  const how = asStringOrEmpty(r.how);

  const coreNonEmptyCount = [who, when, where, what, why, how].filter((s) => Boolean(s)).length;
  // If core 6W is completely missing, ignore the forecast entirely.
  if (coreNonEmptyCount === 0) return undefined;

  // howMuch (optional)
  let howMuch: SixWHowMuch | undefined;
  if (r.howMuch && typeof r.howMuch === "object") {
    const hm = r.howMuch as Record<string, unknown>;
    const cb = hm.currentBias && typeof hm.currentBias === "object" ? (hm.currentBias as Record<string, unknown>) : null;
    const ss =
      hm.scenarioShift && typeof hm.scenarioShift === "object" ? (hm.scenarioShift as Record<string, unknown>) : null;
    const conf = hm.confidence && typeof hm.confidence === "object" ? (hm.confidence as Record<string, unknown>) : null;

    const currentBias = cb
      ? {
          label: asStringOrEmpty(cb.label),
          probabilityRange: asStringOrEmpty(cb.probabilityRange),
          reason: asStringOrEmpty(cb.reason),
        }
      : null;

    const scenarioShift = ss
      ? {
          recoveryIf: asStringOrEmpty(ss.recoveryIf),
          recoveryProbabilityAfterTrigger: asStringOrEmpty(ss.recoveryProbabilityAfterTrigger),
          neutralIf: asStringOrEmpty(ss.neutralIf),
          neutralProbabilityRange: asStringOrEmpty(ss.neutralProbabilityRange),
          cautionIf: asStringOrEmpty(ss.cautionIf),
          cautionProbabilityAfterTrigger: asStringOrEmpty(ss.cautionProbabilityAfterTrigger),
        }
      : null;

    const confidence = conf
      ? {
          level: (asStringOrEmpty(conf.level) as SixWHowMuch["confidence"]["level"]) || "보통",
          reason: asStringOrEmpty(conf.reason),
        }
      : null;

    const evidenceScoresRaw = hm.evidenceScores;
    const evidenceScores = Array.isArray(evidenceScoresRaw)
      ? (evidenceScoresRaw as unknown[])
          .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : null))
          .filter((item): item is Record<string, unknown> => Boolean(item))
          .map((item) => ({
            label: asStringOrEmpty(item.label),
            value: asStringOrEmpty(item.value),
            meaning: asStringOrEmpty(item.meaning),
          }))
          .filter((item) => item.label || item.value || item.meaning)
      : [];

    if (currentBias && scenarioShift && confidence) {
      howMuch = {
        currentBias,
        scenarioShift,
        confidence,
        evidenceScores,
      };
    }
  }

  // consumerDecisionGuide (optional)
  let consumerDecisionGuide: SixWConsumerDecisionGuide | undefined;
  if (r.consumerDecisionGuide && typeof r.consumerDecisionGuide === "object") {
    const c = r.consumerDecisionGuide as Record<string, unknown>;
    const currentMode = asStringOrEmpty(c.currentMode);
    const entryBeforeCheck = asStringArrayOrEmpty(c.entryBeforeCheck);
    const holderCheck = asStringArrayOrEmpty(c.holderCheck);
    const avoidOrDelayCondition = asStringArrayOrEmpty(c.avoidOrDelayCondition);
    const improvementCondition = asStringArrayOrEmpty(c.improvementCondition);
    const riskControlFocus = asStringArrayOrEmpty(c.riskControlFocus);

    if (
      currentMode ||
      entryBeforeCheck.length ||
      holderCheck.length ||
      avoidOrDelayCondition.length ||
      improvementCondition.length ||
      riskControlFocus.length
    ) {
      consumerDecisionGuide = {
        currentMode,
        entryBeforeCheck,
        holderCheck,
        avoidOrDelayCondition,
        improvementCondition,
        riskControlFocus,
      };
    }
  }

  // dynamicReasoning (optional)
  let dynamicReasoning: SixWDynamicReasoning | undefined;
  if (r.dynamicReasoning && typeof r.dynamicReasoning === "object") {
    const d = r.dynamicReasoning as Record<string, unknown>;
    const stockPersonality = asStringOrEmpty(d.stockPersonality);
    const scoreInterpretationMode = asStringOrEmpty(d.scoreInterpretationMode);
    const whyThisStockNeedsThisInterpretation = asStringOrEmpty(d.whyThisStockNeedsThisInterpretation);
    const flexibleThinkingRules = asStringArrayOrEmpty(d.flexibleThinkingRules, 10);

    if (
      stockPersonality ||
      scoreInterpretationMode ||
      whyThisStockNeedsThisInterpretation ||
      flexibleThinkingRules.length
    ) {
      dynamicReasoning = {
        stockPersonality,
        scoreInterpretationMode,
        whyThisStockNeedsThisInterpretation,
        flexibleThinkingRules,
      };
    }
  }

  const probabilityNote = asStringOrEmpty(r.probabilityNote);

  return {
    who,
    when,
    where,
    what,
    why,
    how,
    howMuch,
    consumerDecisionGuide,
    dynamicReasoning,
    probabilityNote: probabilityNote || undefined,
  };
}

function mapLegacyShape(record: Record<string, unknown>): StockSummaryAiOutput | null {
  const headline = asNonEmptyString(record.headline);
  const summary = asNonEmptyString(record.summary);
  const caution = asNonEmptyString(record.caution);
  const whyThisState = asStringArray(record.whyThisState);
  const nextCheck = asStringArray(record.nextCheck);

  if (!headline || !summary || !caution || !whyThisState || !nextCheck) {
    return null;
  }

  return {
    title: headline,
    oneLine: summary,
    keyPoints: whyThisState,
    riskComment: caution,
    nextCheckpoints: nextCheck,
    caution,
  };
}

export function parseStockSummaryAiOutput(raw: string): StockSummaryAiOutput | null {
  if (!raw.trim()) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFence(raw));
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;
  const record = parsed as Record<string, unknown>;

  const title = asNonEmptyString(record.title);
  const oneLine = asNonEmptyString(record.oneLine);
  const riskComment = asNonEmptyString(record.riskComment);
  const caution = asNonEmptyString(record.caution);
  const keyPoints = asStringArray(record.keyPoints);
  const nextCheckpoints = asStringArray(record.nextCheckpoints);
  const sixWForecast = parseSixWForecast(record);

  if (title && oneLine && riskComment && caution && keyPoints && nextCheckpoints) {
    return { title, oneLine, keyPoints, riskComment, nextCheckpoints, caution, sixWForecast };
  }

  return mapLegacyShape(record);
}

export async function generateStockSummary(
  input: StockSummaryInput,
  options?: { model?: string },
): Promise<GenerateStockSummaryResult> {
  const ctx = buildScoreContextFromInput(input);
  const fallback = buildDeterministicAiSummary(ctx);

  const client = createOpenAIClient();
  if (!client) {
    return {
      ok: true,
      source: "skipped",
      data: fallback,
      error: "OPENAI_API_KEY is not configured",
    };
  }

  const model = getStockSummaryModel(options?.model);

  try {
    console.log("[StockAI] AI summary request start");

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: STOCK_SUMMARY_PROMPT_RULES },
        {
          role: "user",
          content: `${buildUserMessage(input)}\n\nWrite all string values in Korean. Each keyPoint must cite at least one score. Respect riskInterpretation and wordingGates. Server will normalize title, riskComment, howMuch, and consumerDecisionGuide.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content?.trim()) {
      console.error("[StockAI] AI summary generation failed: empty response");
      return {
        ok: true,
        source: "error",
        data: fallback,
        error: "OpenAI returned an empty response",
      };
    }

    const parsed = parseStockSummaryAiOutput(content);
    if (!parsed) {
      console.error("[StockAI] AI summary generation failed: parse error");
      return {
        ok: true,
        source: "error",
        data: fallback,
        error: "Failed to parse OpenAI JSON response",
      };
    }

    const data = normalizeAiSummaryByScoreRules(parsed, ctx);
    console.log("[StockAI] AI summary generated (normalized)", data);
    return { ok: true, source: "openai", data };
  } catch (error) {
    console.error("[StockAI] AI summary generation failed", error);
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: true,
      source: "error",
      data: fallback,
      error: message,
    };
  }
}
