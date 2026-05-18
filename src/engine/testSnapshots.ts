import { sampleStockInput } from "../data/sampleStockInput";
import { dedupeConfirmationCards, type ConfirmationCardLike } from "../ui/dedupeConfirmationCards";
import { analyzeStock, type StockAnalysisResult } from "./analyzeStock";
import { analyzeFalseSignalRisk } from "./scoreFalseSignal";
import { analyzeSignalConflicts } from "./scoreConflict";
import { analyzeRiskGateOverlay, type RiskGateInput } from "./riskGateOverlay";
import { getScoreFormulaPolicy } from "./scoreFormulaPolicy";

type SnapshotReadyAnalysis = StockAnalysisResult & {
  conflictAnalysis: NonNullable<StockAnalysisResult["conflictAnalysis"]>;
  falseSignalAnalysis: NonNullable<StockAnalysisResult["falseSignalAnalysis"]>;
  riskGateOverlay: NonNullable<StockAnalysisResult["riskGateOverlay"]>;
};

// 이 테스트는 공식 변경 전 현재 엔진 출력의 기준선을 고정하기 위한 스냅샷입니다.
const result = analyzeStock(sampleStockInput);

const expectedStaticSnapshot = {
  normalizedName: "삼성전자",
  finalScore: 62.72999999999999,
  riskScore: 29.049999999999997,
  primaryState: "VWAP_SUPPORT_HOLDING",
  actionCode: "VWAP_SUPPORT_MONITOR",
  warningsCount: 0,
  conflictScore: 0,
  conflictSeverity: "LOW",
  falseSignalScore: 0,
  falseSignalRiskLevel: "LOW",
};

assertRequiredPoliciesExist();
assertCoreOutputShape(result);
assertStaticSampleSnapshot(result);

// 이 검증은 riskGateOverlay를 실제 점수에 연결하기 전에 독립 모듈 출력이 안정적인지 확인하기 위한 기준선입니다.
const overlay = result.riskGateOverlay;
assertRiskGateOverlaySnapshot(overlay);

// 이 고위험 fixture는 riskGateOverlay가 명확한 VWAP 약세, 약한 종가, 추세 훼손, 변동성 확대 조건에서 실제로 게이트를 활성화하는지 확인하기 위한 기준선입니다.
const highRiskOverlayFixture: RiskGateInput = {
  finalScore: 45,
  totalRiskScore: 49,
  closePositionScore: 15,
  fiftyTwoWeekPositionScore: 78,
  vwapScore: 33,
  vwapRiskScore: 72,
  vwapBreakdownRisk: 76,
  trendCollapseRisk: 82,
  volatilityRisk: 70,
  volumeScore: 59,
  volumeRiskScore: 30,
  distributionRisk: 28,
  participationWeaknessRisk: 24,
  conflictScore: 85,
  falseSignalScore: 81,
  confidenceScore: 56,
  dailyChangePercent: -8.6,
  intradayRangePercent: 10.3,
  vwapDistancePercent: -2.6,
  upperWickRatio: 18,
};
const highRiskOverlay = analyzeRiskGateOverlay(highRiskOverlayFixture);
assertHighRiskOverlaySnapshot(highRiskOverlay);

const moderateCautionFixture = {
  finalScore: 61,
  totalScore: 61,
  totalRiskScore: 33,
  closePositionScore: 75,
  fiftyTwoWeekPositionScore: 68,
  vwapScore: 70,
  vwapRiskScore: 42,
  vwapBreakdownRisk: 42,
  trendCollapseRisk: 25,
  volatilityRisk: 70,
  volumeScore: 55,
  volumeRiskScore: 25,
  distributionRisk: 20,
  participationWeaknessRisk: 18,
  confidenceScore: 62,
  dailyChangePercent: -1.8,
  intradayRangePercent: 9.8,
  vwapDistancePercent: 0.4,
  upperWickRatio: 12,
};
const moderateConflict = analyzeSignalConflicts(moderateCautionFixture);
const moderateFalseSignal = analyzeFalseSignalRisk(moderateCautionFixture);
const moderateOverlay = analyzeRiskGateOverlay({
  ...moderateCautionFixture,
  conflictScore: moderateConflict.conflictScore,
  falseSignalScore: moderateFalseSignal.falseSignalScore,
});
assertModerateCautionAuxiliarySnapshot(moderateConflict, moderateFalseSignal, moderateOverlay);

const duplicateConfirmationCards = buildDuplicateConfirmationFixture();
const dedupedConfirmationCards = dedupeConfirmationCards(duplicateConfirmationCards, getConfirmationFixturePreferenceScore);
assertConfirmationCardsDeduped(duplicateConfirmationCards, dedupedConfirmationCards);

console.log("StockAI engine snapshot baseline");
console.log({
  normalizedName: result.normalized.name,
  asOf: result.normalized.asOf,
  finalScore: result.finalScore,
  riskScore: result.risk.riskScore,
  primaryState: result.state.primaryState,
  actionCode: result.action.actionCode,
  warningsCount: result.warnings.length,
  conflictScore: result.conflictAnalysis.conflictScore,
  conflictSeverity: result.conflictAnalysis.severity,
  falseSignalScore: result.falseSignalAnalysis.falseSignalScore,
  falseSignalRiskLevel: result.falseSignalAnalysis.riskLevel,
});
console.log("StockAI risk gate overlay baseline");
console.log({
  overlayScore: overlay.overlayScore,
  severity: overlay.severity,
  activeGateCount: overlay.gates.length,
  activeGateTitles: overlay.gates.map((gate) => gate.titleKo),
  backtestLabelHints: overlay.backtestLabelHints,
});
console.log("StockAI high-risk overlay fixture baseline");
console.log({
  highRiskOverlayScore: highRiskOverlay.overlayScore,
  highRiskSeverity: highRiskOverlay.severity,
  highRiskGateCount: highRiskOverlay.gates.length,
  highRiskGateTypes: highRiskOverlay.gates.map((gate) => gate.type),
  highRiskBacktestLabels: highRiskOverlay.backtestLabelHints,
});
console.log("StockAI moderate caution auxiliary baseline");
console.log({
  moderateConflictScore: moderateConflict.conflictScore,
  moderateFalseSignalScore: moderateFalseSignal.falseSignalScore,
  moderateOverlayScore: moderateOverlay.overlayScore,
  moderateOverlaySeverity: moderateOverlay.severity,
  moderateGateTypes: moderateOverlay.gates.map((gate) => gate.type),
});
console.log("StockAI confirmation dedupe baseline");
console.log({
  beforeConfirmationCount: duplicateConfirmationCards.length,
  afterConfirmationCount: dedupedConfirmationCards.length,
  titles: dedupedConfirmationCards.map((card) => card.title),
});
console.log("StockAI engine snapshot verification passed.");

function assertCoreOutputShape(analysis: StockAnalysisResult): asserts analysis is SnapshotReadyAnalysis {
  assertNonEmptyString("normalized.name", analysis.normalized.name);
  assertNonEmptyString("normalized.asOf", analysis.normalized.asOf);
  assertNumberRange("finalScore", analysis.finalScore);
  assertNumberRange("risk.riskScore", analysis.risk.riskScore);
  assertNonEmptyString("state.primaryState", analysis.state.primaryState);
  assertNonEmptyString("action.actionCode", analysis.action.actionCode);
  if (!analysis.conflictAnalysis) {
    throw new Error("conflictAnalysis must exist in the engine snapshot output.");
  }
  if (!analysis.falseSignalAnalysis) {
    throw new Error("falseSignalAnalysis must exist in the engine snapshot output.");
  }
  if (!analysis.riskGateOverlay) {
    throw new Error("riskGateOverlay must exist in the engine snapshot output.");
  }
  assertNumberRange("conflictAnalysis.conflictScore", analysis.conflictAnalysis.conflictScore);
  assertNonEmptyString("conflictAnalysis.severity", analysis.conflictAnalysis.severity);
  assertNumberRange("falseSignalAnalysis.falseSignalScore", analysis.falseSignalAnalysis.falseSignalScore);
  assertNonEmptyString("falseSignalAnalysis.riskLevel", analysis.falseSignalAnalysis.riskLevel);
  assertNumberRange("riskGateOverlay.overlayScore", analysis.riskGateOverlay.overlayScore);
  assertNonEmptyString("riskGateOverlay.severity", analysis.riskGateOverlay.severity);
  assertArray("riskGateOverlay.gates", analysis.riskGateOverlay.gates);
}

function assertStaticSampleSnapshot(analysis: SnapshotReadyAnalysis): void {
  assertEqual("normalized.name", analysis.normalized.name, expectedStaticSnapshot.normalizedName);
  assertApproxEqual("finalScore", analysis.finalScore, expectedStaticSnapshot.finalScore);
  assertApproxEqual("risk.riskScore", analysis.risk.riskScore, expectedStaticSnapshot.riskScore);
  assertEqual("state.primaryState", analysis.state.primaryState, expectedStaticSnapshot.primaryState);
  assertEqual("action.actionCode", analysis.action.actionCode, expectedStaticSnapshot.actionCode);
  assertEqual("warnings.length", analysis.warnings.length, expectedStaticSnapshot.warningsCount);
  assertEqual(
    "conflictAnalysis.conflictScore",
    analysis.conflictAnalysis.conflictScore,
    expectedStaticSnapshot.conflictScore,
  );
  assertEqual(
    "conflictAnalysis.severity",
    analysis.conflictAnalysis.severity,
    expectedStaticSnapshot.conflictSeverity,
  );
  assertEqual(
    "falseSignalAnalysis.falseSignalScore",
    analysis.falseSignalAnalysis.falseSignalScore,
    expectedStaticSnapshot.falseSignalScore,
  );
  assertEqual(
    "falseSignalAnalysis.riskLevel",
    analysis.falseSignalAnalysis.riskLevel,
    expectedStaticSnapshot.falseSignalRiskLevel,
  );
}

function assertRiskGateOverlaySnapshot(overlayResult: ReturnType<typeof analyzeRiskGateOverlay>): void {
  assertNumberRange("riskGateOverlay.overlayScore", overlayResult.overlayScore);
  assertNonEmptyString("riskGateOverlay.severity", overlayResult.severity);
  assertArray("riskGateOverlay.gates", overlayResult.gates);
  assertNonEmptyString("riskGateOverlay.summaryKo", overlayResult.summaryKo);
  assertNonEmptyString("riskGateOverlay.interpretationKo", overlayResult.interpretationKo);
  assertNonEmptyString("riskGateOverlay.recommendedActionBiasKo", overlayResult.recommendedActionBiasKo);
  assertArray("riskGateOverlay.backtestLabelHints", overlayResult.backtestLabelHints);
}

function assertHighRiskOverlaySnapshot(overlayResult: ReturnType<typeof analyzeRiskGateOverlay>): void {
  assertNumberRange("highRiskOverlay.overlayScore", overlayResult.overlayScore);
  assertGreaterThan("highRiskOverlay.overlayScore", overlayResult.overlayScore, 0);
  assertNotEqual("highRiskOverlay.severity", overlayResult.severity, "NONE");
  assertNotEqual("highRiskOverlay.severity", overlayResult.severity, "BLOCK");
  assertLessThan("highRiskOverlay.overlayScore", overlayResult.overlayScore, 100);
  assertGreaterThan("highRiskOverlay.gates.length", overlayResult.gates.length, 0);
  assertGreaterThan("highRiskOverlay.backtestLabelHints.length", overlayResult.backtestLabelHints.length, 0);

  for (const gate of overlayResult.gates) {
    assertNonEmptyString("highRiskOverlay.gate.titleKo", gate.titleKo);
  }

  assertIncludesSome("highRiskOverlay.gateTypes", overlayResult.gates.map((gate) => gate.type), [
    "VWAP_BREAKDOWN_GATE",
    "WEAK_CLOSE_GATE",
    "TREND_COLLAPSE_GATE",
    "VOLATILITY_WEAK_CLOSE_GATE",
    "VOLUME_WITHOUT_RECOVERY_GATE",
    "AUXILIARY_RISK_GATE",
    "RISK_SCORE_DIVERGENCE_GATE",
    "STATE_COLLAPSE_CLUSTER_GATE",
  ]);
}

function assertModerateCautionAuxiliarySnapshot(
  conflictResult: ReturnType<typeof analyzeSignalConflicts>,
  falseSignalResult: ReturnType<typeof analyzeFalseSignalRisk>,
  overlayResult: ReturnType<typeof analyzeRiskGateOverlay>,
): void {
  const combinedAuxiliaryScore =
    conflictResult.conflictScore + falseSignalResult.falseSignalScore + overlayResult.overlayScore;

  assertGreaterThan("moderateCaution.combinedAuxiliaryScore", combinedAuxiliaryScore, 0);
  assertGreaterThan("moderateCaution.conflictScore", conflictResult.conflictScore, 0);
  assertBetween("moderateCaution.conflictScore", conflictResult.conflictScore, 12, 28);
  assertGreaterThan("moderateCaution.falseSignalScore", falseSignalResult.falseSignalScore, 0);
  assertBetween("moderateCaution.falseSignalScore", falseSignalResult.falseSignalScore, 10, 24);
  assertGreaterThan("moderateCaution.overlayScore", overlayResult.overlayScore, 0);
  assertBetween("moderateCaution.overlayScore", overlayResult.overlayScore, 20, 35);
  assertEqual("moderateCaution.overlaySeverity", overlayResult.severity, "WATCH");
  assertNotEqual("moderateCaution.overlaySeverity", overlayResult.severity, "HIGH_RISK");
  assertNotEqual("moderateCaution.overlaySeverity", overlayResult.severity, "BLOCK");
}

function buildDuplicateConfirmationFixture(): ConfirmationCardLike[] {
  return [
    {
      title: "장중 변동성 확대 후 종가 위치 확인",
      badge: "확인 필요",
      priority: "중요 확인",
      meaning: "장중 흔들림 이후 마감 위치를 확인해야 합니다.",
      evidence: "변동성 위험 70점 기준입니다.",
      nextCheck: "다음 거래일 변동폭 완화 여부를 확인해야 합니다.",
    },
    {
      title: "장중 변동성 확대 후 종가 위치 확인",
      badge: "확인 필요",
      priority: "중요 확인",
      meaning: "장중 흔들림 이후 마감 위치와 VWAP 유지 여부를 함께 확인해야 합니다.",
      evidence: "변동성 위험 70점, 장중 변동폭 9.8%, 종가 위치 점수 75점 기준입니다.",
      nextCheck: "다음 거래일 변동폭이 줄고 VWAP와 종가 위치가 유지되는지 확인해야 합니다.",
    },
    {
      title: "VWAP 회복 여부 확인",
      badge: "확인 필요",
      priority: "보조 확인",
      meaning: "VWAP 기준 가격 안정성을 확인합니다.",
      evidence: "VWAP 점수 70점 기준입니다.",
      nextCheck: "VWAP 위 유지 여부를 확인해야 합니다.",
    },
    {
      title: "종가 저가권 마감 확인",
      badge: "확인 필요",
      priority: "보조 확인",
      meaning: "종가 위치가 약한지 확인합니다.",
      evidence: "종가 위치 점수 기준입니다.",
      nextCheck: "다음 종가 개선 여부를 확인해야 합니다.",
    },
  ];
}

function assertConfirmationCardsDeduped(
  originalCards: ConfirmationCardLike[],
  dedupedCards: ConfirmationCardLike[],
): void {
  assertEqual("confirmationCards.beforeCount", originalCards.length, 4);
  assertEqual("confirmationCards.afterCount", dedupedCards.length, 3);
  assertUniqueStrings("confirmationCards.titles", dedupedCards.map((card) => `${card.badge}-${card.title}`));

  const volatilityCard = dedupedCards.find((card) => card.title === "장중 변동성 확대 후 종가 위치 확인");
  if (!volatilityCard || !volatilityCard.evidence.includes("장중 변동폭 9.8%")) {
    throw new Error("confirmationCards should keep the richer duplicate card for the volatility title.");
  }
}

function getConfirmationFixturePreferenceScore(card: ConfirmationCardLike): number {
  if (card.priority === "최우선 확인") return 3;
  if (card.priority === "중요 확인") return 2;
  if (card.priority === "보조 확인") return 1;
  return 0;
}

function assertRequiredPoliciesExist(): void {
  const policyKeys = [
    "volumeScore",
    "vwapScore",
    "vwapRiskScore",
    "volatilityRisk",
    "trendCollapseRisk",
    "conflictScore",
    "falseSignalScore",
    "totalRiskScore",
  ];

  for (const key of policyKeys) {
    if (!getScoreFormulaPolicy(key)) {
      throw new Error(`Missing score formula policy: ${key}`);
    }
  }
}

function assertNumberRange(label: string, value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`${label} must be a finite number between 0 and 100. Received: ${value}`);
  }
}

function assertNonEmptyString(label: string, value: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
}

function assertArray(label: string, value: unknown[]): void {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }
}

function assertGreaterThan(label: string, actual: number, minimumExclusive: number): void {
  if (!Number.isFinite(actual) || actual <= minimumExclusive) {
    throw new Error(`${label} must be greater than ${minimumExclusive}. Received: ${actual}.`);
  }
}

function assertLessThan(label: string, actual: number, maximumExclusive: number): void {
  if (!Number.isFinite(actual) || actual >= maximumExclusive) {
    throw new Error(`${label} must be less than ${maximumExclusive}. Received: ${actual}.`);
  }
}

function assertBetween(label: string, actual: number, minimumInclusive: number, maximumInclusive: number): void {
  if (!Number.isFinite(actual) || actual < minimumInclusive || actual > maximumInclusive) {
    throw new Error(
      `${label} must be between ${minimumInclusive} and ${maximumInclusive}. Received: ${actual}.`,
    );
  }
}

function assertNotEqual<T>(label: string, actual: T, unexpected: T): void {
  if (actual === unexpected) {
    throw new Error(`${label} must not be ${String(unexpected)}.`);
  }
}

function assertIncludesSome<T>(label: string, actual: T[], expectedAny: T[]): void {
  if (!expectedAny.some((expected) => actual.includes(expected))) {
    throw new Error(`${label} must include at least one expected value. Received: ${actual.join(", ")}.`);
  }
}

function assertUniqueStrings(label: string, values: string[]): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} must not contain duplicate values. Received: ${values.join(", ")}.`);
  }
}

function assertEqual<T>(label: string, actual: T, expected: T): void {
  if (actual !== expected) {
    throw new Error(`${label} snapshot changed. Expected ${String(expected)}, received ${String(actual)}.`);
  }
}

function assertApproxEqual(label: string, actual: number, expected: number, tolerance = 0.000001): void {
  if (!Number.isFinite(actual) || Math.abs(actual - expected) > tolerance) {
    throw new Error(`${label} snapshot changed. Expected ${expected}, received ${actual}.`);
  }
}
