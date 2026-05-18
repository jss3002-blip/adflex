export type RiskGateSeverity = "NONE" | "WATCH" | "CAUTION" | "HIGH_RISK" | "BLOCK";

export type RiskGateType =
  | "VWAP_BREAKDOWN_GATE"
  | "WEAK_CLOSE_GATE"
  | "TREND_COLLAPSE_GATE"
  | "VOLATILITY_WEAK_CLOSE_GATE"
  | "VOLUME_WITHOUT_RECOVERY_GATE"
  | "AUXILIARY_RISK_GATE"
  | "DATA_QUALITY_GATE"
  | "RISK_SCORE_DIVERGENCE_GATE"
  | "STATE_COLLAPSE_CLUSTER_GATE"
  | "CONFIDENCE_LIMIT_GATE";

export type RiskGateInput = {
  finalScore?: number;
  totalRiskScore?: number;

  closePositionScore?: number;
  fiftyTwoWeekPositionScore?: number;

  vwapScore?: number;
  vwapRiskScore?: number;
  vwapBreakdownRisk?: number;

  trendCollapseRisk?: number;
  volatilityRisk?: number;

  volumeScore?: number;
  volumeRiskScore?: number;
  distributionRisk?: number;
  participationWeaknessRisk?: number;

  conflictScore?: number;
  falseSignalScore?: number;

  confidenceScore?: number;
  dataQualityScore?: number;

  dailyChangePercent?: number;
  intradayRangePercent?: number;
  vwapDistancePercent?: number;
  upperWickRatio?: number;

  marketRegime?: string;
  stockType?: string;
  dataMode?: string;
  isRealtime?: boolean;
};

export type RiskGateInsight = {
  type: RiskGateType;
  severity: RiskGateSeverity;
  titleKo: string;
  summaryKo: string;
  evidenceKo: string;
  actionKo: string;
  scoreImpactNoteKo: string;
  backtestLabelHint: string;
  weight: number;
};

export type RiskGateOverlayResult = {
  overlayScore: number;
  severity: RiskGateSeverity;
  gates: RiskGateInsight[];
  summaryKo: string;
  interpretationKo: string;
  recommendedActionBiasKo: string;
  scoreImpactKo: string;
  dataQualityNoteKo: string;
  backtestLabelHints: string[];
};

export function analyzeRiskGateOverlay(input: RiskGateInput): RiskGateOverlayResult {
  const gates: RiskGateInsight[] = [];

  if (
    hasNumber(input.vwapScore) &&
    input.vwapScore <= 40 &&
    ((hasNumber(input.vwapRiskScore) && input.vwapRiskScore >= 70) ||
      (hasNumber(input.vwapBreakdownRisk) && input.vwapBreakdownRisk >= 70))
  ) {
    const severity =
      (hasNumber(input.vwapRiskScore) && input.vwapRiskScore >= 80) ||
      (hasNumber(input.vwapBreakdownRisk) && input.vwapBreakdownRisk >= 80)
        ? "HIGH_RISK"
        : "CAUTION";
    gates.push({
      type: "VWAP_BREAKDOWN_GATE",
      severity,
      titleKo: "VWAP 평균 단가 회복 실패 게이트",
      summaryKo:
        "VWAP 이탈 게이트는 단순히 가격이 VWAP 아래에 있는지만 보는 조건이 아니라, 시장 참여자의 평균 거래 단가 회복에 실패한 상태에서 VWAP 리스크와 단기 수급 불안이 함께 나타났는지를 확인하는 구조 점검 게이트입니다. 이 조건이 활성화되면 장중 반등이나 거래량 증가를 곧바로 회복 신호로 해석하지 않고, VWAP 재돌파 후 종가까지 유지되는지를 먼저 확인해야 합니다.",
      evidenceKo: `VWAP 점수 ${formatScore(input.vwapScore)}, VWAP 리스크 점수 ${formatScore(input.vwapRiskScore)}, VWAP 이탈 위험 ${formatScore(input.vwapBreakdownRisk)}, VWAP 이격률 ${formatPercent(input.vwapDistancePercent)} 기준으로 평균 단가 회복 실패 가능성을 점검했습니다.`,
      actionKo:
        "고객은 이 신호를 방향 확정이 아니라 단기 확인 우선 조건으로 봐야 합니다. 다음 흐름에서 VWAP 위 회복, 종가 유지, 거래량의 질이 함께 개선되는지 확인하는 것이 핵심입니다.",
      scoreImpactNoteKo:
        "현재 원점수는 변경하지 않지만, 이 게이트는 향후 riskGatedInterpretationScore에서 VWAP 회복 실패를 단순 평균보다 우선 반영할 수 있는 근거가 됩니다.",
      backtestLabelHint: "vwap_reclaim_failure_label",
      weight: 15,
    });
  }

  if (hasNumber(input.closePositionScore) && input.closePositionScore <= 20) {
    const severity = input.closePositionScore <= 10 ? "HIGH_RISK" : "CAUTION";
    gates.push({
      type: "WEAK_CLOSE_GATE",
      severity,
      titleKo: "저가권 종가 마감 게이트",
      summaryKo:
        "약한 종가 게이트는 단순히 캔들 모양이 나쁘다는 뜻이 아닙니다. 장중에 반등이 있었더라도 마감으로 갈수록 가격 방어가 약해졌고, 다음 거래일 초반 심리와 VWAP 회복 신뢰도에 영향을 줄 수 있다는 점을 확인하는 구조 점검 게이트입니다.",
      evidenceKo: `종가 위치 점수 ${formatScore(input.closePositionScore)}, 일간 변화율 ${formatPercent(input.dailyChangePercent)}, 장중 변동폭 ${formatPercent(input.intradayRangePercent)} 기준으로 장 마감 가격 방어력이 약했는지 확인했습니다.`,
      actionKo:
        "고객은 이 신호를 단독 판단으로 보지 말고 다음 거래일 시초가, VWAP 회복, 종가 위치 개선 여부를 함께 확인해야 합니다. 핵심은 상태가 회복되는지 또는 저가권 마감이 반복되는지입니다.",
      scoreImpactNoteKo:
        "현재 finalScore는 그대로 두지만, 약한 종가가 VWAP 약세나 변동성 확대와 결합되면 단순 평균 점수보다 마감 구조를 우선 해석해야 합니다.",
      backtestLabelHint: "weak_close_failure",
      weight: 11,
    });
  }

  if (hasNumber(input.trendCollapseRisk) && input.trendCollapseRisk >= 80) {
    const severity = input.trendCollapseRisk >= 85 ? "HIGH_RISK" : "CAUTION";
    gates.push({
      type: "TREND_COLLAPSE_GATE",
      severity,
      titleKo: "추세 유지력 약화 게이트",
      summaryKo:
        "추세 붕괴 게이트는 추세가 확정적으로 무너졌다고 단정하는 조건이 아닙니다. StockAI 관점에서는 좋은 상태가 유지되는지, VWAP와 주요 가격선을 회복하는지, 종가가 더 강해지는지를 확인하는 상태 유지력 점검 신호입니다.",
      evidenceKo: `추세 붕괴 위험 ${formatScore(input.trendCollapseRisk)}, VWAP 점수 ${formatScore(input.vwapScore)}, 종가 위치 점수 ${formatScore(input.closePositionScore)} 기준으로 단순 조정과 상태 유지 실패 가능성을 구분했습니다.`,
      actionKo:
        "고객은 이 신호를 추세 확정 판단이 아니라 상태 유지 조건 점검으로 해석해야 합니다. 다음 거래일 VWAP 회복, 주요 가격선 회복, 강한 종가가 함께 나오는지 확인해야 합니다.",
      scoreImpactNoteKo:
        "현재 상태 분류와 action label은 바꾸지 않지만, 향후에는 추세 유지력 약화가 rawCompositeScore보다 해석 우선순위를 높이는 게이트가 될 수 있습니다.",
      backtestLabelHint: "trend_failure_label",
      weight: 15,
    });
  }

  if (
    hasNumber(input.volatilityRisk) &&
    input.volatilityRisk >= 70 &&
    hasNumber(input.closePositionScore) &&
    input.closePositionScore <= 30
  ) {
    const severity = input.volatilityRisk >= 85 ? "HIGH_RISK" : "CAUTION";
    gates.push({
      type: "VOLATILITY_WEAK_CLOSE_GATE",
      severity,
      titleKo: "변동성 확대 후 약한 종가 게이트",
      summaryKo:
        "변동성 확대 자체는 방향을 말해주지 않습니다. 문제는 장중 흔들림이 커진 뒤 종가가 약하게 끝나는 구조입니다. 이 조합은 가격 발견이 불안정했고 후속 유지력이 약할 수 있음을 보여주므로 단순 반등 신호보다 마감 안정성을 우선 확인해야 합니다.",
      evidenceKo: `변동성 위험 ${formatScore(input.volatilityRisk)}, 종가 위치 점수 ${formatScore(input.closePositionScore)}, 장중 변동폭 ${formatPercent(input.intradayRangePercent)} 기준으로 흔들림 이후 마감 품질을 점검했습니다.`,
      actionKo:
        "고객은 다음 거래일 변동폭이 줄어드는지, 종가가 중상단 이상으로 회복되는지, VWAP 위 유지가 나타나는지 확인해야 합니다.",
      scoreImpactNoteKo:
        "현재 점수 보정은 적용하지 않지만, 향후에는 높은 변동성과 약한 종가의 결합을 신호 안정성 감점으로 사용할 수 있습니다.",
      backtestLabelHint: "weak_close_after_volatility_label",
      weight: 10,
    });
  }

  if (
    hasNumber(input.volumeScore) &&
    input.volumeScore >= 50 &&
    ((hasNumber(input.closePositionScore) && input.closePositionScore <= 30) ||
      (hasNumber(input.vwapScore) && input.vwapScore <= 40))
  ) {
    gates.push({
      type: "VOLUME_WITHOUT_RECOVERY_GATE",
      severity: "CAUTION",
      titleKo: "거래 참여 대비 가격 회복 부족 게이트",
      summaryKo:
        "StockAI는 거래량을 자동으로 긍정 신호로 보지 않습니다. 거래 참여가 있어도 가격이 VWAP를 회복하지 못하거나 종가가 약하면, 그 거래량은 회복의 힘이 아니라 공급 압력 흡수 실패, 분배, 실패한 참여일 수 있습니다.",
      evidenceKo: `거래량 점수 ${formatScore(input.volumeScore)}, 거래량 리스크 ${formatScore(input.volumeRiskScore)}, 종가 위치 점수 ${formatScore(input.closePositionScore)}, VWAP 점수 ${formatScore(input.vwapScore)} 기준으로 거래량과 가격 회복의 동행 여부를 확인했습니다.`,
      actionKo:
        "고객은 거래량 증가만 보고 구조가 좋아졌다고 판단하지 말고, 가격 회복과 VWAP 유지가 거래량과 함께 나타나는지 확인해야 합니다.",
      scoreImpactNoteKo:
        "현재 volumeScore는 유지하지만, 향후 위험 게이트 해석에서는 거래량이 가격 회복을 동반하지 못한 경우 긍정 해석을 제한할 수 있습니다.",
      backtestLabelHint: "volume_without_recovery_label",
      weight: 8,
    });
  }

  if (
    (hasNumber(input.conflictScore) && input.conflictScore >= 80) ||
    (hasNumber(input.falseSignalScore) && input.falseSignalScore >= 80)
  ) {
    gates.push({
      type: "AUXILIARY_RISK_GATE",
      severity: "CAUTION",
      titleKo: "보조 구조 위험 게이트",
      summaryKo:
        "보조 위험 게이트는 종합 리스크 점수와 같은 의미가 아닙니다. conflictScore와 falseSignalScore는 평균 점수 안에 잘 드러나지 않는 신호 충돌, 가짜 반등, 표면적 강세와 내부 약세의 불일치를 따로 보는 구조 점검 신호입니다.",
      evidenceKo: `신호 충돌 점수 ${formatScore(input.conflictScore)}, 가짜 신호 위험 ${formatScore(input.falseSignalScore)}, 종합 리스크 ${formatScore(input.totalRiskScore)} 기준으로 숨은 구조 위험이 평균 리스크와 다른지 확인했습니다.`,
      actionKo:
        "고객은 보조 위험 점수를 종합 리스크와 직접 비교하지 말고, 단기 확인 우선순위를 정하는 참고 신호로 해석해야 합니다.",
      scoreImpactNoteKo:
        "현재 총점과 리스크 점수는 바꾸지 않지만, 향후에는 보조 위험이 높을 때 rawCompositeScore와 risk-gated interpretation을 분리하는 근거가 됩니다.",
      backtestLabelHint: hasNumber(input.falseSignalScore) && input.falseSignalScore >= 80 ? "false_rebound_label" : "signal_conflict_failure_label",
      weight: 9,
    });
  }

  if (
    (hasNumber(input.dataQualityScore) && input.dataQualityScore < 60) ||
    (hasNumber(input.confidenceScore) && input.confidenceScore < 50)
  ) {
    const severity = getDataQualityGateSeverity(input);
    gates.push({
      type: "DATA_QUALITY_GATE",
      severity,
      titleKo: "데이터 품질 및 해석 신뢰도 제한 게이트",
      summaryKo:
        "데이터 품질 게이트는 StockAI의 안전장치입니다. 데이터가 지연되었거나, 추정값이거나, 결측이 있거나, 백테스트 기준으로 재현하기 어려운 상태라면 좋은 점수도 강하게 해석하면 안 됩니다. 분석 강도보다 데이터 사용 가능 여부가 먼저입니다.",
      evidenceKo: `데이터 품질 점수 ${formatScore(input.dataQualityScore)}, 신뢰도 점수 ${formatScore(input.confidenceScore)}, 데이터 모드 ${formatText(input.dataMode)}, 실시간 여부 ${formatRealtime(input.isRealtime)} 기준으로 강한 판단 제한 필요성을 확인했습니다.`,
      actionKo:
        "고객은 이 신호가 활성화되면 강한 해석보다 데이터 보강, 기준일 확인, 실시간성 확인, 사람 검토 성격을 우선해야 합니다.",
      scoreImpactNoteKo:
        "현재 점수는 변경하지 않지만, 향후에는 dataQualityScore가 낮을 때 action strength와 riskGatedInterpretationScore를 제한하는 핵심 게이트가 됩니다.",
      backtestLabelHint: "data_quality_limit_label",
      weight: 18,
    });
  }

  if (isRiskScoreDivergenceActive(input)) {
    gates.push({
      type: "RISK_SCORE_DIVERGENCE_GATE",
      severity: "CAUTION",
      titleKo: "평균 리스크와 핵심 위험 괴리 게이트",
      summaryKo:
        "이 게이트는 StockAI의 핵심 차별점 중 하나입니다. 종합 리스크가 보통처럼 보여도 VWAP 리스크, 약한 종가, 추세 붕괴, 가짜 신호, 신호 충돌 같은 핵심 위험이 집중되어 있으면 평균 점수가 위험을 숨길 수 있습니다.",
      evidenceKo: `종합 리스크 ${formatScore(input.totalRiskScore)}, VWAP 리스크 ${formatScore(input.vwapRiskScore)}, 추세 붕괴 위험 ${formatScore(input.trendCollapseRisk)}, 신호 충돌 ${formatScore(input.conflictScore)}, 가짜 신호 위험 ${formatScore(input.falseSignalScore)}, 종가 위치 ${formatScore(input.closePositionScore)} 기준으로 평균 리스크와 세부 핵심 위험의 괴리를 확인했습니다.`,
      actionKo:
        "고객은 리스크가 보통이라는 표현만 보고 안심하지 말고, 실제로 어떤 핵심 위험이 높은지 먼저 확인해야 합니다.",
      scoreImpactNoteKo:
        "현재 totalRiskScore는 유지하지만, 향후 리스크 게이트 해석에서는 평균 기반 점수보다 집중 위험 조건을 우선 반영할 수 있습니다.",
      backtestLabelHint: "risk_gate_override_label",
      weight: 8,
    });
  }

  if (getStateCollapseClusterCount(input) >= 3) {
    gates.push({
      type: "STATE_COLLAPSE_CLUSTER_GATE",
      severity: "HIGH_RISK",
      titleKo: "상태 유지 실패 클러스터 게이트",
      summaryKo:
        "상태 붕괴 클러스터 게이트는 하나의 약한 신호를 과대해석하지 않습니다. 약한 종가, VWAP 약세, 추세 훼손 위험, 변동성 확대, 큰 하락이 동시에 나타나는지를 확인해 현재 상태가 유지되는지 아니면 회복 전 확인이 필요한지 구분합니다.",
      evidenceKo: `종가 위치 ${formatScore(input.closePositionScore)}, VWAP 점수 ${formatScore(input.vwapScore)}, 추세 붕괴 위험 ${formatScore(input.trendCollapseRisk)}, 변동성 위험 ${formatScore(input.volatilityRisk)}, 일간 변화율 ${formatPercent(input.dailyChangePercent)} 기준으로 상태 유지 실패 조건의 군집 여부를 확인했습니다.`,
      actionKo:
        "고객은 이 신호를 직접적인 방향 예측이 아니라 상태 유지 실패 가능성 점검으로 봐야 합니다. 다음 흐름에서 VWAP 회복, 변동성 축소, 강한 종가가 함께 나오는지가 중요합니다.",
      scoreImpactNoteKo:
        "현재 state classification은 변경하지 않지만, 향후에는 상태 붕괴 클러스터가 활성화될 때 상태 확정보다 확인 대기 해석을 우선할 수 있습니다.",
      backtestLabelHint: "state_collapse_label",
      weight: 14,
    });
  }

  if (hasNumber(input.confidenceScore) && input.confidenceScore < 50) {
    gates.push({
      type: "CONFIDENCE_LIMIT_GATE",
      severity: "CAUTION",
      titleKo: "해석 신뢰도 제한 게이트",
      summaryKo:
        "신뢰도 제한 게이트는 종목의 매력도를 평가하는 조건이 아닙니다. 일부 점수가 좋아 보여도 데이터 부족, 신호 충돌, 가짜 신호 가능성, 공급자 freshness 문제 때문에 해석 자체를 강하게 말하기 어려운 상태를 표시합니다.",
      evidenceKo: `신뢰도 점수 ${formatScore(input.confidenceScore)}, 데이터 품질 ${formatScore(input.dataQualityScore)}, 신호 충돌 ${formatScore(input.conflictScore)}, 가짜 신호 위험 ${formatScore(input.falseSignalScore)} 기준으로 해석 신뢰도 제한 여부를 확인했습니다.`,
      actionKo:
        "고객은 이 신호가 활성화되면 점수의 높고 낮음보다 분석 신뢰도와 데이터 조건을 먼저 확인해야 합니다.",
      scoreImpactNoteKo:
        "현재 점수는 변경하지 않지만, 향후에는 confidenceScore가 낮을 때 강한 판단을 제한하고 사람 검토 성격을 강화할 수 있습니다.",
      backtestLabelHint: "low_confidence_failure_label",
      weight: 10,
    });
  }

  if (gates.length === 0) {
    return {
      overlayScore: 0,
      severity: "NONE",
      gates: [],
      summaryKo: "현재 활성화된 리스크 게이트는 없습니다.",
      interpretationKo: "현재 원점수 해석을 제한할 만한 핵심 게이트는 감지되지 않았습니다.",
      recommendedActionBiasKo: "기존 분석 결과를 기준으로 관찰할 수 있습니다.",
      scoreImpactKo: "현재 단계에서는 점수 보정이 적용되지 않습니다.",
      dataQualityNoteKo: "데이터 품질 게이트는 활성화되지 않았습니다.",
      backtestLabelHints: [],
    };
  }

  const overlayScore = calculateOverlayScore(gates);
  const severity = getOverlaySeverity(overlayScore, gates);

  return {
    overlayScore,
    severity,
    gates,
    summaryKo: buildSummary(gates, overlayScore, severity),
    interpretationKo: buildInterpretation(gates),
    recommendedActionBiasKo: buildRecommendedActionBias(severity, gates),
    scoreImpactKo: buildScoreImpact(gates),
    dataQualityNoteKo: buildDataQualityNote(gates),
    backtestLabelHints: buildBacktestLabelHints(gates),
  };
}

export function getRiskGateSeverityLabelKo(severity: RiskGateSeverity): string {
  if (severity === "NONE") return "게이트 없음";
  if (severity === "WATCH") return "관찰";
  if (severity === "CAUTION") return "주의";
  if (severity === "HIGH_RISK") return "고위험";
  return "강한 판단 제한";
}

export function clampOverlayScore(value: number): number {
  if (!isFiniteNumber(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function calculateOverlayScore(gates: RiskGateInsight[]): number {
  let score = gates.reduce((total, gate) => total + gate.weight, 0);

  if (hasGate(gates, "VWAP_BREAKDOWN_GATE") && hasGate(gates, "WEAK_CLOSE_GATE")) {
    score += 2;
  }
  if (hasGate(gates, "TREND_COLLAPSE_GATE") && hasGate(gates, "STATE_COLLAPSE_CLUSTER_GATE")) {
    score += 2;
  }
  if (gates.some((gate) => gate.type === "DATA_QUALITY_GATE" && gate.severity === "BLOCK")) {
    score += 6;
  }

  const overlappingPriceStructureCount = [
    hasGate(gates, "VWAP_BREAKDOWN_GATE"),
    hasGate(gates, "WEAK_CLOSE_GATE"),
    hasGate(gates, "TREND_COLLAPSE_GATE"),
    hasGate(gates, "VOLATILITY_WEAK_CLOSE_GATE"),
    hasGate(gates, "STATE_COLLAPSE_CLUSTER_GATE"),
  ].filter(Boolean).length;

  if (overlappingPriceStructureCount >= 4) {
    score -= Math.min(8, (overlappingPriceStructureCount - 3) * 4);
  }

  return clampOverlayScore(score);
}

function getOverlaySeverity(score: number, gates: RiskGateInsight[]): RiskGateSeverity {
  if (score === 0) return "NONE";
  if (score < 30) return "WATCH";
  if (score < 55) return "CAUTION";
  if (!shouldUseBlockSeverity(score, gates)) return "HIGH_RISK";
  return "BLOCK";
}

function shouldUseBlockSeverity(score: number, gates: RiskGateInsight[]): boolean {
  if (score < 90) return false;
  if (hasSevereDataQualityLimit(gates)) return true;

  return (
    gates.length >= 8 &&
    hasGate(gates, "STATE_COLLAPSE_CLUSTER_GATE") &&
    gates.some((gate) => gate.severity === "HIGH_RISK") &&
    score >= 95
  );
}

function hasSevereDataQualityLimit(gates: RiskGateInsight[]): boolean {
  return gates.some(
    (gate) =>
      (gate.type === "DATA_QUALITY_GATE" && (gate.severity === "BLOCK" || gate.severity === "HIGH_RISK")) ||
      (gate.type === "CONFIDENCE_LIMIT_GATE" && gate.severity === "HIGH_RISK"),
  );
}

function getDataQualityGateSeverity(input: RiskGateInput): RiskGateSeverity {
  if (hasNumber(input.dataQualityScore) && input.dataQualityScore < 35) return "BLOCK";
  if (hasNumber(input.dataQualityScore) && input.dataQualityScore < 50) return "HIGH_RISK";
  return "CAUTION";
}

function isRiskScoreDivergenceActive(input: RiskGateInput): boolean {
  if (!hasNumber(input.totalRiskScore) || input.totalRiskScore >= 60) return false;

  const concentratedRiskCount = [
    hasNumber(input.vwapRiskScore) && input.vwapRiskScore >= 70,
    hasNumber(input.trendCollapseRisk) && input.trendCollapseRisk >= 80,
    hasNumber(input.falseSignalScore) && input.falseSignalScore >= 80,
    hasNumber(input.conflictScore) && input.conflictScore >= 80,
    hasNumber(input.closePositionScore) && input.closePositionScore <= 20,
  ].filter(Boolean).length;

  return concentratedRiskCount >= 2;
}

function getStateCollapseClusterCount(input: RiskGateInput): number {
  return [
    hasNumber(input.closePositionScore) && input.closePositionScore <= 20,
    hasNumber(input.vwapScore) && input.vwapScore <= 40,
    hasNumber(input.trendCollapseRisk) && input.trendCollapseRisk >= 80,
    hasNumber(input.volatilityRisk) && input.volatilityRisk >= 70,
    hasNumber(input.dailyChangePercent) && input.dailyChangePercent <= -5,
  ].filter(Boolean).length;
}

function buildSummary(
  gates: RiskGateInsight[],
  overlayScore: number,
  severity: RiskGateSeverity,
): string {
  const topGateTitles = gates.slice(0, 3).map((gate) => gate.titleKo).join(", ");
  const hasStateGate = hasGate(gates, "STATE_COLLAPSE_CLUSTER_GATE") || hasGate(gates, "TREND_COLLAPSE_GATE");
  const hasFalseSignalGate = hasGate(gates, "AUXILIARY_RISK_GATE") || hasGate(gates, "VOLUME_WITHOUT_RECOVERY_GATE");
  const hasDataGate = hasGate(gates, "DATA_QUALITY_GATE") || hasGate(gates, "CONFIDENCE_LIMIT_GATE");
  const focus = hasDataGate
    ? "데이터 품질과 해석 신뢰도 제한"
    : hasStateGate
      ? "상태 유지 실패 또는 상태 붕괴 점검"
      : hasFalseSignalGate
        ? "신호 충돌과 가짜 신호 제거"
        : "핵심 구조 위험 확인";

  return `총 ${gates.length}개의 리스크 게이트가 활성화되었습니다. 오버레이 점수는 ${overlayScore.toFixed(0)}점이며 ${getRiskGateSeverityLabelKo(severity)} 단계입니다. 핵심 확인 영역은 ${focus}입니다. 특히 ${topGateTitles} 조건은 단순 점수 평균으로 놓칠 수 있는 구조 위험을 보완하므로, 원점수를 그대로 보더라도 해석은 더 신중해야 합니다.`;
}

function buildInterpretation(gates: RiskGateInsight[]): string {
  const contextText = gates.some((gate) => gate.type === "DATA_QUALITY_GATE" || gate.type === "CONFIDENCE_LIMIT_GATE")
    ? "데이터 품질 또는 신뢰도 제한이 함께 감지되어 강한 해석을 줄이는 것이 우선입니다."
    : "데이터 제한 게이트가 핵심 원인은 아니며, 주로 가격 구조와 신호 조합을 기준으로 해석을 보완합니다.";

  return `이 오버레이는 finalScore, riskScore, 상태 분류, action label을 변경하지 않습니다. 역할은 원점수가 겉으로는 무난해 보여도 VWAP 회복 실패, 약한 종가, 거래량 대비 회복 부족, 보조 구조 위험 같은 조건이 있으면 해석을 더 조심해야 한다고 알려주는 것입니다. 직접적인 판단 신호가 아니라 구조 점검과 확인 우선순위 레이어입니다. ${contextText}`;
}

function buildRecommendedActionBias(
  severity: RiskGateSeverity,
  gates: RiskGateInsight[],
): string {
  if (severity === "BLOCK") {
    return "강한 판단 제한 단계입니다. 원점수만으로 강하게 해석하기보다 데이터 품질, VWAP 회복, 종가 개선, 핵심 위험 완화를 먼저 확인해야 합니다.";
  }
  if (severity === "HIGH_RISK") {
    return "리스크 관리 우선 해석이 필요합니다. 관찰보다 확인 우선 비중을 높이고, 상태 유지 실패 조건이 완화되는지 점검해야 합니다.";
  }
  if (severity === "CAUTION") {
    return "확인 우선 관점이 적절합니다. 기존 분석을 유지하되 VWAP, 종가 위치, 거래량 회복, 보조 위험 신호가 같은 방향으로 개선되는지 확인해야 합니다.";
  }
  if (gates.some((gate) => gate.type === "VOLUME_WITHOUT_RECOVERY_GATE")) {
    return "관찰 유지가 가능하지만 거래량만 긍정으로 해석하지 말고 가격 회복 동반 여부를 함께 확인해야 합니다.";
  }
  return "기존 분석 결과를 기준으로 관찰할 수 있으며, 활성화된 게이트의 확인 항목만 추가 점검하면 됩니다.";
}

function buildScoreImpact(gates: RiskGateInsight[]): string {
  const hasAverageRiskGate = hasGate(gates, "RISK_SCORE_DIVERGENCE_GATE");
  const hasStateGate = hasGate(gates, "STATE_COLLAPSE_CLUSTER_GATE");

  if (hasAverageRiskGate || hasStateGate) {
    return "현재 단계에서는 finalScore나 riskScore를 보정하지 않습니다. 다만 이 오버레이는 향후 rawCompositeScore와 riskGatedInterpretationScore를 분리할 때, 평균 점수보다 핵심 위험 조건을 우선 반영하는 근거가 됩니다.";
  }

  return "현재 단계에서는 점수 보정이 적용되지 않습니다. 이 결과는 원점수를 바꾸지 않고 해석의 주의 수준과 확인 우선순위를 보완하는 참고 레이어입니다.";
}

function buildDataQualityNote(gates: RiskGateInsight[]): string {
  const dataGate = gates.find((gate) => gate.type === "DATA_QUALITY_GATE");
  const confidenceGate = gates.find((gate) => gate.type === "CONFIDENCE_LIMIT_GATE");

  if (dataGate && confidenceGate) {
    return "데이터 품질 게이트와 신뢰도 제한 게이트가 함께 활성화되었습니다. 좋은 점수보다 데이터 기준일, 실시간성, 결측 여부, 해석 신뢰도를 먼저 확인해야 합니다.";
  }
  if (dataGate) {
    return "데이터 품질 게이트가 활성화되었습니다. 데이터가 지연, 추정, 결측, 또는 재현성 제한 상태일 수 있으므로 강한 해석을 제한해야 합니다.";
  }
  if (confidenceGate) {
    return "데이터 품질 게이트는 직접 활성화되지 않았지만 해석 신뢰도 제한이 감지되었습니다. 신호 충돌과 가짜 신호 가능성을 함께 확인해야 합니다.";
  }
  return "데이터 품질 게이트는 활성화되지 않았습니다.";
}

function buildBacktestLabelHints(gates: RiskGateInsight[]): string[] {
  const labels: string[] = [];

  for (const gate of gates) {
    labels.push(gate.backtestLabelHint);
    if (gate.type === "AUXILIARY_RISK_GATE") {
      labels.push("signal_conflict_failure_label", "false_rebound_label");
    }
    if (gate.type === "STATE_COLLAPSE_CLUSTER_GATE") {
      labels.push("state_collapse_label", "rebound_failure_label");
    }
  }

  return uniqueStrings(labels);
}

function hasGate(gates: RiskGateInsight[], type: RiskGateType): boolean {
  return gates.some((gate) => gate.type === type);
}

function uniqueStrings(values: string[]): string[] {
  const result: string[] = [];

  for (const value of values) {
    if (!result.includes(value)) result.push(value);
  }

  return result;
}

function hasNumber(value: number | undefined): value is number {
  return isFiniteNumber(value);
}

function safeNumber(value: number | undefined, fallback: number): number {
  if (isFiniteNumber(value)) return value;
  return fallback;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatScore(value: number | undefined): string {
  if (!isFiniteNumber(value)) return "데이터 없음";
  return `${safeNumber(value, 0).toFixed(0)}점`;
}

function formatPercent(value: number | undefined): string {
  if (!isFiniteNumber(value)) return "데이터 없음";
  return `${safeNumber(value, 0).toFixed(1)}%`;
}

function formatText(value: string | undefined): string {
  if (!value) return "확인 불가";
  return value;
}

function formatRealtime(value: boolean | undefined): string {
  if (value === true) return "실시간";
  if (value === false) return "비실시간";
  return "확인 불가";
}
