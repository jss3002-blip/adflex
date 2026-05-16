import { sampleStockInput } from "../data/sampleStockInput";
import { analyzeStock } from "./analyzeStock";

const result = analyzeStock(sampleStockInput);

assertNumberRange("finalScore", result.finalScore);
assertNumberRange("ohlc.priceLocationScore", result.ohlc.priceLocationScore);
assertNumberRange("volume.volumeScore", result.volume.volumeScore);
assertNumberRange("vwap.vwapScore", result.vwap.vwapScore);
assertNumberRange("risk.riskScore", result.risk.riskScore);
assertNumberRange("state.stateScore", result.state.stateScore);
assertNumberRange("state.confidenceScore", result.state.confidenceScore);
assertNumberRange("action.actionScore", result.action.actionScore);

assertStructure();

console.log("StockAI analyzeStock compact verification");
console.log({
  finalScore: result.finalScore,
  finalGrade: result.finalGrade,
  primaryState: result.state.primaryState,
  secondaryStates: result.state.secondaryStates,
  stateScore: result.state.stateScore,
  confidenceScore: result.state.confidenceScore,
  actionCode: result.action.actionCode,
  urgencyLevel: result.action.urgencyLevel,
  actionScore: result.action.actionScore,
  riskScore: result.risk.riskScore,
  riskWarningsCount: result.risk.warnings.length,
  finalWarningsCount: result.warnings.length,
  positiveEvidenceCount: result.evidence.positive.length,
  negativeEvidenceCount: result.evidence.negative.length,
  neutralEvidenceCount: result.evidence.neutral.length,
  summary: result.summary,
});

console.dir(result, { depth: null });

console.log("StockAI analyzeStock verification passed.");

function assertNumberRange(label: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number.`);
  }

  if (value < 0 || value > 100) {
    throw new Error(`${label} must be between 0 and 100.`);
  }
}

function assertStructure(): void {
  if (!result.finalGrade) {
    throw new Error("finalGrade is missing.");
  }

  if (!result.summary) {
    throw new Error("summary is missing.");
  }

  if (!result.state.primaryState) {
    throw new Error("state.primaryState is missing.");
  }

  if (!result.action.actionCode) {
    throw new Error("action.actionCode is missing.");
  }

  if (!result.evidence) {
    throw new Error("evidence is missing.");
  }

  if (!Array.isArray(result.warnings)) {
    throw new Error("warnings must be an array.");
  }
}
