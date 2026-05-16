import { sampleStockInput } from "../data/sampleStockInput";
import { analyzeStock, type StockAnalysisResult } from "./analyzeStock";
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
