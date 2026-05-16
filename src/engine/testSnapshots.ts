import { sampleStockInput } from "../data/sampleStockInput";
import { analyzeStock, type StockAnalysisResult } from "./analyzeStock";
import { getScoreFormulaPolicy } from "./scoreFormulaPolicy";

type SnapshotReadyAnalysis = StockAnalysisResult & {
  conflictAnalysis: NonNullable<StockAnalysisResult["conflictAnalysis"]>;
  falseSignalAnalysis: NonNullable<StockAnalysisResult["falseSignalAnalysis"]>;
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
  assertNumberRange("conflictAnalysis.conflictScore", analysis.conflictAnalysis.conflictScore);
  assertNonEmptyString("conflictAnalysis.severity", analysis.conflictAnalysis.severity);
  assertNumberRange("falseSignalAnalysis.falseSignalScore", analysis.falseSignalAnalysis.falseSignalScore);
  assertNonEmptyString("falseSignalAnalysis.riskLevel", analysis.falseSignalAnalysis.riskLevel);
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
