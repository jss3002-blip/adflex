import {
  collectCautionSignalStrengths,
  gradedHigh,
  gradedLow,
  isMonitoringActionCode,
  valueOr,
} from "./auxiliarySeverity";

export type ConfirmationAnalysisContext = {
  finalScore: number;
  ohlc: {
    closePositionScore: number;
    week52PositionScore: number;
    intradayRangePercent: number;
    upperWickRatio?: number;
  };
  volume: { volumeScore: number };
  vwap: { vwapScore: number; vwapRiskScore: number };
  risk: {
    vwapBreakdownRiskScore: number;
    trendCollapseRiskScore: number;
    volatilityRiskScore: number;
  };
  state: { primaryState: string };
  action: { actionCode: string; actionScore: number };
  warnings: string[];
};

export type ConfirmationFallbackCandidate = {
  key: "vwap" | "close" | "volatility" | "volume" | "trend";
  title: string;
  priority: "최우선 확인" | "중요 확인" | "보조 확인";
  score: number;
};

export function buildDynamicConfirmationFallbacks(
  analysis: ConfirmationAnalysisContext,
): ConfirmationFallbackCandidate[] {
  const candidates: ConfirmationFallbackCandidate[] = [];

  if (analysis.action.actionScore < 70) return candidates;

  const vwapWeakness = gradedLow(valueOr(analysis.vwap.vwapScore, 65), 48, 72);
  const vwapRisk = gradedHigh(analysis.vwap.vwapRiskScore, 28, 65);
  const vwapBreak = gradedHigh(analysis.risk.vwapBreakdownRiskScore, 30, 70);
  const vwapScore = Math.max(vwapWeakness * 0.9, vwapRisk * 0.85, vwapBreak * 0.8);
  if (vwapScore >= 0.18 || isMonitoringActionCode(analysis.action.actionCode)) {
    candidates.push({
      key: "vwap",
      title: "VWAP 회복 여부 확인",
      priority: vwapScore >= 0.55 ? "중요 확인" : "보조 확인",
      score: vwapScore + (isMonitoringActionCode(analysis.action.actionCode) ? 0.12 : 0),
    });
  }

  const closeWeakness = gradedLow(analysis.ohlc.closePositionScore, 42, 74);
  if (closeWeakness >= 0.18) {
    candidates.push({
      key: "close",
      title: "종가 위치 개선 확인",
      priority: closeWeakness >= 0.55 ? "중요 확인" : "보조 확인",
      score: closeWeakness,
    });
  }

  const volatilityScore = Math.max(
    gradedHigh(analysis.risk.volatilityRiskScore, 38, 72),
    gradedHigh(analysis.ohlc.intradayRangePercent, 4.5, 9.5),
  );
  if (volatilityScore >= 0.2) {
    candidates.push({
      key: "volatility",
      title: "변동성 완화 확인",
      priority: volatilityScore >= 0.55 ? "중요 확인" : "보조 확인",
      score: volatilityScore,
    });
  }

  const volumeWithoutRecovery =
    analysis.volume.volumeScore >= 50 &&
    (analysis.ohlc.closePositionScore <= 55 || analysis.vwap.vwapScore <= 58);
  if (volumeWithoutRecovery) {
    candidates.push({
      key: "volume",
      title: "거래량 유지 확인",
      priority: "보조 확인",
      score: 0.35 + gradedLow(analysis.vwap.vwapScore, 48, 65) * 0.25,
    });
  }

  if (analysis.risk.trendCollapseRiskScore >= 65) {
    candidates.push({
      key: "trend",
      title: "추세 유지력 확인",
      priority: analysis.risk.trendCollapseRiskScore >= 80 ? "중요 확인" : "보조 확인",
      score: gradedHigh(analysis.risk.trendCollapseRiskScore, 60, 85),
    });
  }

  if (candidates.length > 0) return candidates.sort((a, b) => b.score - a.score);

  const cautionStrengths = collectCautionSignalStrengths({
    finalScore: analysis.finalScore,
    closePositionScore: analysis.ohlc.closePositionScore,
    fiftyTwoWeekPositionScore: analysis.ohlc.week52PositionScore,
    vwapScore: analysis.vwap.vwapScore,
    vwapRiskScore: analysis.vwap.vwapRiskScore,
    vwapBreakdownRisk: analysis.risk.vwapBreakdownRiskScore,
    trendCollapseRisk: analysis.risk.trendCollapseRiskScore,
    volatilityRisk: analysis.risk.volatilityRiskScore,
    intradayRangePercent: analysis.ohlc.intradayRangePercent,
    upperWickRatio: analysis.ohlc.upperWickRatio,
    actionCode: analysis.action.actionCode,
    primaryState: analysis.state.primaryState,
    actionPriorityScore: analysis.action.actionScore,
  });

  if (cautionStrengths.length < 2) return candidates;

  return [
    {
      key: "vwap",
      title: "VWAP 회복 여부 확인",
      priority: "중요 확인",
      score: 0.72,
    },
  ];
}

export function countEffectiveConfirmationItems(analysis: ConfirmationAnalysisContext): number {
  return buildDynamicConfirmationFallbacks(analysis).length + analysis.warnings.length;
}
