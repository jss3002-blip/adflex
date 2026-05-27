/**
 * StockAI — server-only OpenAI customer explanation generator.
 *
 * Architecture (설계도 / score-role separation):
 * - Rule engine (`analyzeStock`) computes finalScore, riskScore, state, actionCode, and auxiliary scores.
 * - This module ONLY rewrites those results into customer-facing Korean copy.
 * - NEVER import from Client Components. NEVER use NEXT_PUBLIC_OPENAI_API_KEY.
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
};

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
  return JSON.stringify(
    {
      task: "Generate customer-facing StockAI summary from rule-engine output (read-only).",
      stockName: input.stockName ?? null,
      scores: {
        finalScore: input.finalScore,
        riskScore: input.riskScore,
        conflictScore: input.conflictScore,
        falseSignalScore: input.falseSignalScore,
        riskGateOverlayScore: input.riskGateOverlayScore,
        closePositionScore: input.closePositionScore,
        vwapScore: input.vwapScore,
        vwapRiskScore: input.vwapRiskScore,
        volumeScore: input.volumeScore,
        volatilityRiskScore: input.volatilityRiskScore,
        actionPriorityScore: input.actionPriorityScore,
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
  const client = createOpenAIClient();
  if (!client) {
    return {
      ok: false,
      source: "skipped",
      data: null,
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
          content: `${buildUserMessage(input)}\n\nWrite all string values in Korean. Ensure keyPoints and nextCheckpoints are non-repetitive and each covers a different angle.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content?.trim()) {
      const error = new Error("OpenAI returned an empty response");
      console.error("[StockAI] AI summary generation failed", error);
      return {
        ok: false,
        source: "error",
        data: null,
        error: error.message,
      };
    }

    const data = parseStockSummaryAiOutput(content);
    if (!data) {
      const error = new Error("Failed to parse OpenAI JSON response");
      console.error("[StockAI] AI summary generation failed", error);
      return {
        ok: false,
        source: "error",
        data: null,
        error: error.message,
      };
    }

    console.log("[StockAI] AI summary generated", data);
    return { ok: true, source: "openai", data };
  } catch (error) {
    console.error("[StockAI] AI summary generation failed", error);
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      source: "error",
      data: null,
      error: message,
    };
  }
}
