/**
 * StockAI formula policy layer.
 *
 * Source of truth:
 * - 설계도.txt: variable standardization, risk gates, missing-data policy, backtest labels, market-regime and stock-type validation.
 * - 주식 ai 구체화.txt: current price as state data, VWAP maintenance, state maintenance/collapse, true/false breakout, and false-signal removal.
 *
 * This file intentionally does not change runtime scoring logic. It defines the official policy language
 * that current and future scoring modules should align with.
 */

export type ScoreDirection = "POSITIVE" | "RISK" | "AUXILIARY_RISK";

export type MissingDataPolicy = "NEUTRAL" | "PENALIZE" | "IGNORE" | "BLOCK_ANALYSIS";

export type RiskGateLevel = "NONE" | "WATCH" | "CAUTION" | "HIGH_RISK" | "BLOCK";

export type TimeHorizon = "INTRADAY" | "SHORT_TERM" | "MID_TERM" | "LONG_TERM";

export type ScoreRangeRule = {
  min?: number;
  max?: number;
  score: number;
  labelKo: string;
  descriptionKo: string;
};

export type ScoreFormulaPolicy = {
  key: string;
  koreanName: string;
  direction: ScoreDirection;
  timeHorizon: TimeHorizon[];

  meaningKo: string;
  inputData: string[];
  formulaKo: string;
  normalizationKo: string;
  scoreConversionKo: string;

  rangeRules: ScoreRangeRule[];

  missingDataPolicy: MissingDataPolicy;
  missingDataKo: string;
  confidencePenaltyKo: string;

  usedIn: string[];

  riskGateLevel: RiskGateLevel;
  riskGateKo: string;

  conflictLogicKo: string;
  falseSignalLogicKo: string;
  stateTransitionKo: string;
  actionCodeConnectionKo: string;

  backtestValidationKo: string;
  backtestLabels: string[];

  interpretationCautionKo: string;
  marketRegimeAdjustmentKo: string;
  stockTypeAdjustmentKo: string;
  futureImprovementKo: string;
};

const riskRangeRules: ScoreRangeRule[] = [
  {
    min: 80,
    max: 100,
    score: 90,
    labelKo: "매우 높음",
    descriptionKo: "핵심 위험 조건이 강하게 나타나며 단기 확인 우선순위를 크게 높여야 합니다.",
  },
  {
    min: 55,
    max: 79.999,
    score: 70,
    labelKo: "높음",
    descriptionKo: "위험 조건이 뚜렷해 단순 평균보다 보수적으로 해석해야 합니다.",
  },
  {
    min: 30,
    max: 54.999,
    score: 45,
    labelKo: "보통",
    descriptionKo: "일부 위험 조건이 있으나 추가 확인 전까지 확정 판단은 제한합니다.",
  },
  {
    min: 0,
    max: 29.999,
    score: 15,
    labelKo: "낮음",
    descriptionKo: "현재 위험 신호는 제한적이지만 데이터 품질과 상태 변화를 계속 확인합니다.",
  },
];

const auxiliaryRiskRangeRules: ScoreRangeRule[] = [
  {
    min: 80,
    max: 100,
    score: 90,
    labelKo: "보조 분석 기준 매우 높음",
    descriptionKo: "종합 리스크가 아니라 신호 충돌 또는 가짜 신호 가능성이 강한 구조입니다.",
  },
  {
    min: 55,
    max: 79.999,
    score: 70,
    labelKo: "보조 분석 기준 높음",
    descriptionKo: "단기 확인 우선순위를 높여야 하는 보조 위험 신호입니다.",
  },
  {
    min: 30,
    max: 54.999,
    score: 45,
    labelKo: "보조 분석 기준 보통",
    descriptionKo: "보조 위험 신호가 일부 있으나 핵심 조건 재확인이 필요합니다.",
  },
  {
    min: 0,
    max: 29.999,
    score: 15,
    labelKo: "보조 분석 기준 낮음",
    descriptionKo: "현재 신호 충돌이나 가짜 신호 가능성은 제한적입니다.",
  },
];

const positiveQualityRangeRules: ScoreRangeRule[] = [
  {
    min: 80,
    max: 100,
    score: 90,
    labelKo: "매우 높음",
    descriptionKo: "해석 신뢰도 또는 구조 품질이 높지만 리스크 게이트와 함께 확인해야 합니다.",
  },
  {
    min: 60,
    max: 79.999,
    score: 70,
    labelKo: "양호",
    descriptionKo: "분석에 사용할 수 있는 품질이 있으나 충돌 신호와 데이터 한계를 함께 봅니다.",
  },
  {
    min: 40,
    max: 59.999,
    score: 50,
    labelKo: "보통",
    descriptionKo: "판단은 가능하지만 확정적인 해석보다 추가 확인이 필요합니다.",
  },
  {
    min: 0,
    max: 39.999,
    score: 25,
    labelKo: "낮음",
    descriptionKo: "해석 신뢰도가 낮아 강한 행동 코드보다 보류 또는 검토 성격을 강화해야 합니다.",
  },
];

export const SCORE_FORMULA_POLICIES: ScoreFormulaPolicy[] = [
  {
    key: "closePositionScore",
    koreanName: "종가 위치 점수",
    direction: "POSITIVE",
    timeHorizon: ["INTRADAY", "SHORT_TERM"],
    meaningKo:
      "종가가 당일 고가와 저가 사이에서 얼마나 강한 위치에 마감했는지 평가합니다. 종가가 고가권에 가까울수록 장 마감 기준 수급 우위 가능성이 높고, 저가권에 가까울수록 약한 마감 압력이 우세했을 가능성이 높습니다.",
    inputData: ["high", "low", "close"],
    formulaKo: "closePositionRatio = (close - low) / (high - low) * 100",
    normalizationKo: "고가와 저가의 차이를 기준으로 종가의 상대 위치를 0~100 범위로 정규화합니다.",
    scoreConversionKo:
      "80~100은 고가권 마감, 60~79는 중상단 마감, 40~59는 중립, 20~39는 저가권 근접, 0~19는 저가권 마감으로 해석합니다.",
    rangeRules: [
      {
        min: 80,
        max: 100,
        score: 90,
        labelKo: "고가권 마감",
        descriptionKo: "장 마감까지 가격 방어력이 강하게 유지된 상태입니다.",
      },
      {
        min: 60,
        max: 79.999,
        score: 70,
        labelKo: "중상단 마감",
        descriptionKo: "종가 위치가 양호하지만 VWAP와 거래량 확인이 필요합니다.",
      },
      {
        min: 40,
        max: 59.999,
        score: 50,
        labelKo: "중립",
        descriptionKo: "마감 위치만으로는 방향성을 확정하기 어렵습니다.",
      },
      {
        min: 20,
        max: 39.999,
        score: 30,
        labelKo: "저가권 근접",
        descriptionKo: "장 마감 가격 방어력이 약해 단기 확인이 필요합니다.",
      },
      {
        min: 0,
        max: 19.999,
        score: 10,
        labelKo: "저가권 마감",
        descriptionKo: "약한 종가가 반복되면 상태 유지 실패 후보로 전환할 수 있습니다.",
      },
    ],
    missingDataPolicy: "NEUTRAL",
    missingDataKo: "고가와 저가가 같거나 데이터가 부족한 경우 중립값 50으로 처리합니다.",
    confidencePenaltyKo: "고가, 저가, 종가 중 핵심 가격 데이터가 없으면 신뢰도 감점이 필요합니다.",
    usedIn: ["price structure", "trend risk", "false signal detection", "action priority", "weak close detection"],
    riskGateLevel: "CAUTION",
    riskGateKo: "종가 위치 점수가 20 이하이고 VWAP 점수도 낮으면 단기 약세 게이트를 활성화할 수 있습니다.",
    conflictLogicKo:
      "52주 위치 점수가 높더라도 종가 위치 점수가 낮으면 장기 위치는 양호하지만 단기 마감 수급은 약한 충돌 신호로 해석합니다.",
    falseSignalLogicKo:
      "거래량이 증가했는데 종가 위치가 낮으면 강한 참여가 아니라 상단 매물 출회 또는 가짜 반등일 수 있습니다.",
    stateTransitionKo: "종가 위치가 연속으로 저가권에 머물면 상태 유지 실패 또는 추세 훼손 후보로 전환합니다.",
    actionCodeConnectionKo:
      "종가 위치 점수가 매우 낮고 VWAP 이탈이 동반되면 WAIT_CONFIRMATION, RISK_REDUCTION, EXIT_PRIORITY 후보 판단에 사용합니다.",
    backtestValidationKo:
      "종가 위치 점수 구간별로 다음 1일, 3일, 5일 수익률과 하락 확률을 비교해 검증합니다.",
    backtestLabels: [
      "return_1d",
      "return_3d",
      "return_5d",
      "max_drawdown_3d",
      "weak_close_failure",
      "overnight_gap_down_label",
    ],
    interpretationCautionKo: "하루 종가 위치만으로 추세를 확정하지 말고 VWAP, 거래량, 변동성과 함께 해석해야 합니다.",
    marketRegimeAdjustmentKo:
      "하락장에서는 약한 종가의 위험 가중치를 높이고, 강한 상승장에서는 단기 약한 종가를 일시 조정으로 완화할 수 있습니다.",
    stockTypeAdjustmentKo:
      "저유동성 종목에서는 종가 위치가 왜곡될 수 있으므로 거래대금과 체결 밀도 기준을 함께 확인해야 합니다.",
    futureImprovementKo: "분봉 데이터가 연결되면 장중 종가 회복 패턴과 동시호가 체결 강도를 함께 보정할 수 있습니다.",
  },
  {
    key: "fiftyTwoWeekPositionScore",
    koreanName: "52주 위치 점수",
    direction: "POSITIVE",
    timeHorizon: ["MID_TERM", "LONG_TERM"],
    meaningKo:
      "현재 가격이 최근 52주 고가와 저가 사이에서 어디에 위치하는지 평가합니다. 장기 가격 위치를 파악하는 데 유용하지만, 단기 흐름이 약하면 고점 부담 신호가 될 수 있습니다.",
    inputData: ["currentPrice", "high52w", "low52w"],
    formulaKo: "fiftyTwoWeekPosition = (currentPrice - low52w) / (high52w - low52w) * 100",
    normalizationKo: "52주 고저 범위를 기준으로 현재가의 상대 위치를 0~100으로 정규화합니다.",
    scoreConversionKo:
      "높을수록 장기 가격 위치가 강합니다. 단, VWAP와 종가 위치가 약하면 긍정이 아니라 고점 부담으로 해석할 수 있습니다.",
    rangeRules: [
      {
        min: 85,
        max: 100,
        score: 90,
        labelKo: "52주 고점권",
        descriptionKo: "장기 위치는 강하지만 단기 유지 실패 시 고점 부담으로 전환될 수 있습니다.",
      },
      {
        min: 65,
        max: 84.999,
        score: 75,
        labelKo: "상단 위치",
        descriptionKo: "장기 가격 위치가 양호하지만 VWAP와 종가 확인이 필요합니다.",
      },
      {
        min: 40,
        max: 64.999,
        score: 50,
        labelKo: "중립 위치",
        descriptionKo: "장기 위치만으로는 우위 또는 약세를 확정하기 어렵습니다.",
      },
      {
        min: 20,
        max: 39.999,
        score: 30,
        labelKo: "하단 위치",
        descriptionKo: "장기 가격 위치가 낮아 회복 신뢰도 확인이 필요합니다.",
      },
      {
        min: 0,
        max: 19.999,
        score: 10,
        labelKo: "52주 저점권",
        descriptionKo: "저점권 반등 가능성과 추가 하락 위험을 동시에 확인해야 합니다.",
      },
    ],
    missingDataPolicy: "NEUTRAL",
    missingDataKo: "52주 고저 데이터가 부족하면 중립값 50으로 처리합니다.",
    confidencePenaltyKo: "52주 고저 데이터가 충분하지 않으면 장기 위치 해석 신뢰도를 낮춥니다.",
    usedIn: ["long-term price location", "conflict analysis", "state classification support", "high-position burden detection"],
    riskGateLevel: "WATCH",
    riskGateKo:
      "52주 위치가 높지만 VWAP 이탈, 종가 저가권, 추세 붕괴 위험이 동시에 높으면 고점권 부담 게이트를 활성화할 수 있습니다.",
    conflictLogicKo:
      "52주 위치 점수는 양호하지만 VWAP 점수와 종가 위치 점수가 낮으면 장기 위치 양호와 단기 흐름 약세의 충돌로 해석합니다.",
    falseSignalLogicKo:
      "고점권에서 거래량 증가와 약한 종가가 함께 발생하면 강세 지속이 아니라 매물 출회 가능성을 점검해야 합니다.",
    stateTransitionKo: "고점권에서 VWAP 회복 실패가 반복되면 강세 상태에서 주의 상태로 전환합니다.",
    actionCodeConnectionKo:
      "장기 위치는 양호하지만 단기 위험이 크면 즉시 우위 판단이 아니라 WAIT_CONFIRMATION 또는 WATCHLIST 성격으로 연결합니다.",
    backtestValidationKo: "52주 위치 구간별 다음 5일, 20일 수익률과 최대 낙폭을 비교해 검증합니다.",
    backtestLabels: [
      "return_5d",
      "return_20d",
      "max_drawdown_5d",
      "high_position_failure_label",
      "breakout_follow_through_label",
    ],
    interpretationCautionKo: "높은 52주 위치 점수는 항상 우위 신호가 아닙니다. 단기 수급과 함께 봐야 합니다.",
    marketRegimeAdjustmentKo:
      "상승장에서는 52주 상단 위치를 추세 지속 신호로 볼 수 있지만, 하락장에서는 고점권 반등 실패 위험을 더 크게 봅니다.",
    stockTypeAdjustmentKo: "테마주와 저유동성 종목에서는 52주 고점권이 과열 또는 분배 위험으로 바뀔 수 있습니다.",
    futureImprovementKo: "업종 상대 52주 위치와 시장 레짐을 함께 반영하면 정확도가 높아집니다.",
  },
  {
    key: "volumeScore",
    koreanName: "거래량 점수",
    direction: "POSITIVE",
    timeHorizon: ["INTRADAY", "SHORT_TERM"],
    meaningKo:
      "현재 거래량이 최근 평균 대비 얼마나 의미 있게 유지되는지 평가합니다. 거래량이 충분하면 관심과 참여가 남아 있다는 뜻이지만, 가격 회복이 동반되지 않으면 분배 위험으로 바뀔 수 있습니다.",
    inputData: ["currentVolume", "averageVolume20d", "averageVolume10d", "closePositionScore", "vwapScore"],
    formulaKo: "volumeRatio20d = currentVolume / averageVolume20d * 100",
    normalizationKo: "20일 평균 거래량 대비 현재 거래량 비율을 기준으로 시장 참여 강도를 정규화합니다.",
    scoreConversionKo:
      "평균 대비 너무 낮으면 관심 약화, 평균 이상이면 참여 유지, 과도하게 높으면서 종가가 약하면 분배 가능성으로 해석합니다.",
    rangeRules: [
      {
        min: 200,
        score: 90,
        labelKo: "거래량 매우 활발",
        descriptionKo: "참여는 강하지만 종가와 VWAP가 약하면 분배 위험으로 재해석해야 합니다.",
      },
      {
        min: 120,
        max: 199.999,
        score: 75,
        labelKo: "거래량 양호",
        descriptionKo: "시장 관심이 유지되며 가격 회복 동반 여부가 중요합니다.",
      },
      {
        min: 80,
        max: 119.999,
        score: 50,
        labelKo: "보통",
        descriptionKo: "평균 범위의 거래 참여로 단독 신호로는 제한적입니다.",
      },
      {
        min: 50,
        max: 79.999,
        score: 30,
        labelKo: "거래량 약함",
        descriptionKo: "참여 약화 가능성이 있어 상태 유지력을 낮게 봅니다.",
      },
      {
        min: 0,
        max: 49.999,
        score: 10,
        labelKo: "거래 참여 부족",
        descriptionKo: "신호 신뢰도가 낮아 보수적 해석이 필요합니다.",
      },
    ],
    missingDataPolicy: "NEUTRAL",
    missingDataKo:
      "평균 거래량 데이터가 부족하면 중립값 50으로 처리합니다. 20일 평균이 없으면 10일 평균을 임시 참고할 수 있습니다.",
    confidencePenaltyKo:
      "평균 거래량 기준이 부족하면 거래량 신호 신뢰도를 낮추고, 실시간 거래량 지연이 있으면 단기 판단을 제한합니다.",
    usedIn: ["volume structure", "false signal detection", "distribution risk", "participation weakness", "breakout reliability"],
    riskGateLevel: "WATCH",
    riskGateKo: "거래량 점수가 높지만 종가 위치 점수와 VWAP 점수가 낮으면 거래량을 긍정이 아니라 매물 출회 가능성으로 재해석합니다.",
    conflictLogicKo: "거래량은 살아 있지만 가격 회복이 약하면 거래 참여 유지와 가격 회복 부족의 충돌로 해석합니다.",
    falseSignalLogicKo: "거래량 증가가 가격 회복 없이 나타나면 가짜 반등, 분배, 상단 매물 출회 위험으로 연결합니다.",
    stateTransitionKo:
      "거래량 증가가 VWAP 회복과 종가 강세로 이어지면 회복 상태로 전환할 수 있고, 약한 종가와 동반되면 위험 상태로 전환합니다.",
    actionCodeConnectionKo:
      "거래량 점수 단독으로 즉시 우위 판단을 만들지 않고, VWAP 회복과 종가 위치 개선이 확인될 때 WATCHLIST 또는 WAIT_CONFIRMATION으로 연결합니다.",
    backtestValidationKo: "거래량 비율과 종가 위치 조합별 다음 1일, 3일 수익률 및 하락 확률을 비교합니다.",
    backtestLabels: [
      "return_1d",
      "return_3d",
      "return_5d",
      "max_drawdown_3d",
      "volume_follow_through_label",
      "distribution_layer_label",
    ],
    interpretationCautionKo: "거래량 증가는 항상 긍정이 아닙니다. 가격 회복과 함께 나타나는지가 핵심입니다.",
    marketRegimeAdjustmentKo:
      "상승장에서는 거래량 증가의 긍정 가중치를 높일 수 있지만, 하락장에서는 반등 실패 또는 매물 출회 가능성을 더 크게 봅니다.",
    stockTypeAdjustmentKo: "테마주에서는 거래량 피크 후 급감 여부가 중요하고, 대형주는 외국인과 기관 수급을 함께 봐야 합니다.",
    futureImprovementKo: "투자자별 수급, 프로그램 매매, 체결 강도를 연결하면 거래량 점수의 품질이 높아집니다.",
  },
  {
    key: "vwapScore",
    koreanName: "VWAP 점수",
    direction: "POSITIVE",
    timeHorizon: ["INTRADAY", "SHORT_TERM"],
    meaningKo:
      "현재 가격이 평균 거래 단가인 VWAP 대비 얼마나 안정적인 위치에 있는지 평가합니다. VWAP 위에 있으면 평균 단가를 회복한 상태로 볼 수 있고, VWAP 아래에 있으면 단기 압력 또는 평균 단가 하회 상태로 볼 수 있습니다.",
    inputData: ["currentPrice", "vwap", "vwapDistancePercent"],
    formulaKo: "vwapDistancePercent = (currentPrice - vwap) / vwap * 100",
    normalizationKo: "VWAP 대비 이격률을 기준으로 가격의 평균 단가 회복 여부를 점수화합니다.",
    scoreConversionKo: "VWAP 위 일정 거리 이상은 긍정, VWAP 근처는 중립, VWAP 아래는 약세로 해석합니다.",
    rangeRules: [
      {
        min: 3,
        score: 85,
        labelKo: "VWAP 위 강세",
        descriptionKo: "평균 단가 위에서 가격이 안정적으로 유지되는 상태입니다.",
      },
      {
        min: 0,
        max: 2.999,
        score: 60,
        labelKo: "VWAP 위 또는 근접",
        descriptionKo: "평균 단가를 회복했지만 유지 여부 확인이 필요합니다.",
      },
      {
        min: -1,
        max: -0.001,
        score: 45,
        labelKo: "VWAP 근처 약세",
        descriptionKo: "VWAP 근처에서 방향성이 확정되지 않은 상태입니다.",
      },
      {
        min: -3,
        max: -1.001,
        score: 25,
        labelKo: "VWAP 아래 약세",
        descriptionKo: "평균 단가 회복 실패 가능성을 확인해야 합니다.",
      },
      {
        max: -3.001,
        score: 10,
        labelKo: "VWAP 이탈 심화",
        descriptionKo: "VWAP 회복 전까지 단기 신뢰도를 낮게 봅니다.",
      },
    ],
    missingDataPolicy: "NEUTRAL",
    missingDataKo:
      "VWAP 계산 데이터가 부족하면 중립값 50으로 처리하고, 실시간 VWAP가 아니라 EOD 추정치인 경우 주의 문구를 붙입니다.",
    confidencePenaltyKo: "VWAP가 추정값이거나 실시간 값이 아니면 VWAP 기반 판단 신뢰도를 낮춥니다.",
    usedIn: ["VWAP structure", "false signal detection", "action priority", "trend risk", "state maintenance"],
    riskGateLevel: "CAUTION",
    riskGateKo: "VWAP 점수가 40 이하이고 VWAP 리스크가 70 이상이면 VWAP 이탈 주의 게이트를 활성화합니다.",
    conflictLogicKo: "거래량은 유지되지만 VWAP 점수가 낮으면 거래 참여는 있으나 평균 단가 회복이 약한 충돌로 해석합니다.",
    falseSignalLogicKo: "장중 반등이 있어도 VWAP 위에서 종가까지 유지하지 못하면 가짜 반등 가능성으로 해석합니다.",
    stateTransitionKo: "VWAP 회복 후 종가까지 유지되면 회복 조건, VWAP 재이탈이 반복되면 상태 붕괴 조건으로 연결합니다.",
    actionCodeConnectionKo:
      "VWAP 아래에서는 WAIT_CONFIRMATION을 우선하고, VWAP 회복 후 유지가 확인되면 WATCHLIST로 전환할 수 있습니다.",
    backtestValidationKo: "VWAP 이격률 구간별 다음 1일, 3일 수익률과 VWAP 재회복 확률을 검증합니다.",
    backtestLabels: [
      "return_1d",
      "return_3d",
      "vwap_hold_label",
      "vwap_loss_label",
      "vwap_reclaim_label",
      "false_rebound_label",
    ],
    interpretationCautionKo: "일봉 기반 VWAP는 장중 실시간 VWAP와 차이가 있을 수 있으므로 데이터 모드를 함께 표시해야 합니다.",
    marketRegimeAdjustmentKo:
      "상승장에서는 VWAP 일시 이탈을 눌림으로 볼 수 있지만, 하락장에서는 추세 훼손 신호로 더 강하게 반영합니다.",
    stockTypeAdjustmentKo: "저유동성 종목에서는 VWAP 왜곡 가능성이 있으므로 거래대금과 체결 밀도를 함께 확인해야 합니다.",
    futureImprovementKo: "분봉 실시간 VWAP와 장중 VWAP 재돌파 및 재이탈 횟수를 추가하면 정밀도가 높아집니다.",
  },
  {
    key: "vwapRiskScore",
    koreanName: "VWAP 리스크 점수",
    direction: "RISK",
    timeHorizon: ["INTRADAY", "SHORT_TERM"],
    meaningKo:
      "가격이 평균 거래 단가를 회복하지 못하거나 VWAP 아래에서 머무르는 위험을 평가합니다. 높을수록 평균 단가 하회, 가짜 반등, 단기 압력 가능성이 높습니다.",
    inputData: ["vwapScore", "vwapDistancePercent", "closePositionScore", "volumeScore"],
    formulaKo:
      "VWAP 리스크는 VWAP 이격률이 음수이고 종가 위치가 약할수록 증가합니다. 거래량이 유지되는데 VWAP 회복이 실패하면 추가 위험으로 반영합니다.",
    normalizationKo: "VWAP 하회 정도, 종가 약세, 거래량 동반 여부를 조합해 0~100 위험 점수로 정규화합니다.",
    scoreConversionKo: "0~29 낮음, 30~54 보통, 55~79 높음, 80~100 매우 높음으로 해석합니다.",
    rangeRules: riskRangeRules,
    missingDataPolicy: "NEUTRAL",
    missingDataKo: "VWAP 데이터가 부족하면 중립 위험 50으로 처리하되, VWAP 기반 판단 신뢰도는 낮춥니다.",
    confidencePenaltyKo: "VWAP가 없거나 추정값이면 VWAP 리스크 판단의 신뢰도를 낮춥니다.",
    usedIn: ["risk structure", "false signal detection", "action priority", "state classification"],
    riskGateLevel: "HIGH_RISK",
    riskGateKo: "VWAP 리스크가 70 이상이고 추세 붕괴 위험 또는 종가 약세가 동반되면 강한 확인 필요 조건으로 처리합니다.",
    conflictLogicKo: "종합 리스크가 보통이어도 VWAP 리스크가 높으면 핵심 세부 리스크 우선 확인 신호로 분리합니다.",
    falseSignalLogicKo: "VWAP 리스크가 높은데 장중 반등이 나타나면 반등 신뢰도보다 평균 단가 회복 실패 여부를 우선 확인합니다.",
    stateTransitionKo:
      "VWAP 리스크가 반복적으로 높게 유지되면 VWAP 이탈 주의 구간에서 추세 훼손 점검 상태로 전환할 수 있습니다.",
    actionCodeConnectionKo: "VWAP 리스크가 높으면 WAIT_CONFIRMATION, RISK_REDUCTION, AVOID 후보 판단에 사용합니다.",
    backtestValidationKo: "VWAP 리스크 점수 구간별 다음 1일, 3일 VWAP 회복 실패율과 하락 확률을 검증합니다.",
    backtestLabels: [
      "return_1d",
      "return_3d",
      "vwap_reclaim_failure_label",
      "false_rebound_label",
      "max_drawdown_3d",
    ],
    interpretationCautionKo: "VWAP 리스크는 직접 판단 신호가 아니라 평균 단가 회복 실패 가능성을 나타내는 위험 지표입니다.",
    marketRegimeAdjustmentKo: "하락장에서는 VWAP 리스크 가중치를 높이고, 상승장에서는 단기 눌림 가능성을 함께 고려합니다.",
    stockTypeAdjustmentKo: "대형주는 VWAP 리스크와 외국인/기관 수급을 함께 보고, 테마주는 거래량 피크와 함께 봐야 합니다.",
    futureImprovementKo: "장중 VWAP 재돌파 실패 횟수와 체결 강도를 반영하면 개선됩니다.",
  },
  {
    key: "volatilityRisk",
    koreanName: "변동성 위험",
    direction: "RISK",
    timeHorizon: ["INTRADAY", "SHORT_TERM"],
    meaningKo:
      "장중 고가와 저가의 차이가 커져 가격 신호 안정성이 낮아질 가능성을 평가합니다. 변동성이 높으면서 종가가 약하면 신호 신뢰도가 더 낮아집니다.",
    inputData: ["high", "low", "previousClose", "closePositionScore"],
    formulaKo: "intradayRangePercent = (high - low) / previousClose * 100",
    normalizationKo: "전일 종가 대비 장중 변동폭을 기준으로 위험 점수를 산출합니다.",
    scoreConversionKo: "장중 변동폭이 클수록 위험이 높아지며, 종가 위치 점수가 낮으면 추가 위험으로 해석합니다.",
    rangeRules: [
      {
        min: 10,
        score: 90,
        labelKo: "매우 높음",
        descriptionKo: "가격 신호 안정성이 낮아져 단기 확인 우선순위를 높여야 합니다.",
      },
      {
        min: 6,
        max: 9.999,
        score: 70,
        labelKo: "높음",
        descriptionKo: "장중 흔들림이 커서 종가 위치와 함께 해석해야 합니다.",
      },
      {
        min: 3,
        max: 5.999,
        score: 45,
        labelKo: "보통",
        descriptionKo: "일반적인 변동성 범위이나 다른 약세 신호와 조합해야 합니다.",
      },
      {
        min: 0,
        max: 2.999,
        score: 15,
        labelKo: "낮음",
        descriptionKo: "가격 신호 안정성 훼손은 제한적입니다.",
      },
    ],
    missingDataPolicy: "NEUTRAL",
    missingDataKo: "전일 종가 또는 고저가 데이터가 부족하면 중립 위험 50으로 처리합니다.",
    confidencePenaltyKo: "전일 종가 추정값을 사용하면 변동성 위험 해석 신뢰도를 낮춥니다.",
    usedIn: ["risk structure", "signal stability", "false signal detection", "action priority"],
    riskGateLevel: "CAUTION",
    riskGateKo: "변동성 위험이 70 이상이고 종가 위치 점수가 30 이하이면 신호 안정성 저하 게이트를 활성화합니다.",
    conflictLogicKo: "장중 변동성은 높지만 종가가 약하면 방향성보다 불안정성을 우선 해석합니다.",
    falseSignalLogicKo: "장중 움직임이 커도 종가가 약하면 가짜 반등 또는 흔들림 확대 후 약세로 해석합니다.",
    stateTransitionKo:
      "변동성 확대 후 종가 회복이 실패하면 주의 상태로 전환하고, 변동성 축소와 종가 회복이 함께 나오면 안정화 조건으로 봅니다.",
    actionCodeConnectionKo: "변동성 위험이 높으면 추격 판단을 제한하고 WAIT_CONFIRMATION 또는 HUMAN_REVIEW 성격을 강화합니다.",
    backtestValidationKo: "변동성 위험 구간별 다음 1일 변동폭 축소 여부와 갭 하락 확률을 검증합니다.",
    backtestLabels: [
      "return_1d",
      "max_drawdown_1d",
      "volatility_contraction_label",
      "gap_down_label",
      "weak_close_after_volatility_label",
    ],
    interpretationCautionKo: "변동성이 높다는 것만으로 상승 또는 하락 방향을 확정할 수 없습니다. 종가 위치와 함께 해석해야 합니다.",
    marketRegimeAdjustmentKo:
      "고변동성 시장에서는 기준을 완화하고, 저변동성 시장에서는 같은 변동폭도 더 큰 위험으로 볼 수 있습니다.",
    stockTypeAdjustmentKo: "저유동성 종목과 테마주는 변동성 위험 기준을 더 보수적으로 적용합니다.",
    futureImprovementKo: "ATR, 분봉 변동성, 장중 체결 분포를 추가하면 더 정확해집니다.",
  },
  {
    key: "trendCollapseRisk",
    koreanName: "추세 붕괴 위험",
    direction: "RISK",
    timeHorizon: ["SHORT_TERM", "MID_TERM"],
    meaningKo:
      "현재 추세가 유지되지 못하고 약세로 전환될 가능성을 평가합니다. 약한 종가, VWAP 이탈, 주요 가격선 회복 실패가 함께 나타날수록 위험이 증가합니다.",
    inputData: ["closePositionScore", "vwapScore", "vwapRiskScore", "dailyChangePercent", "volatilityRisk", "movingAveragePosition"],
    formulaKo: "추세 붕괴 위험은 종가 약세, VWAP 이탈, 큰 하락률, 높은 변동성, 주요 이동평균 이탈 조건을 조합해 산출합니다.",
    normalizationKo: "각 약세 조건을 가중 합산한 뒤 0~100 범위로 정규화합니다.",
    scoreConversionKo: "0~29 낮음, 30~54 보통, 55~79 높음, 80~100 매우 높음으로 해석합니다.",
    rangeRules: riskRangeRules,
    missingDataPolicy: "NEUTRAL",
    missingDataKo: "이동평균 데이터가 부족하면 VWAP, 종가 위치, 변동성만으로 보수적으로 평가합니다.",
    confidencePenaltyKo: "이동평균 또는 추세 기준 데이터가 부족하면 추세 붕괴 위험 신뢰도를 낮춥니다.",
    usedIn: ["risk structure", "state classification", "action priority", "conflict analysis", "state collapse detection"],
    riskGateLevel: "HIGH_RISK",
    riskGateKo: "추세 붕괴 위험이 80 이상이면 종합점수가 중립이어도 주의 필요 구조를 우선 표시할 수 있습니다.",
    conflictLogicKo: "52주 위치가 양호해도 추세 붕괴 위험이 높으면 장기 위치보다 단기 약세 위험을 우선 해석합니다.",
    falseSignalLogicKo: "장중 반등이 있어도 추세 붕괴 위험이 높고 종가가 약하면 반등보다 유지 실패 위험을 우선합니다.",
    stateTransitionKo:
      "추세 붕괴 위험이 높고 VWAP 회복 실패가 반복되면 주의 필요 구조 또는 추세 훼손 점검 상태로 전환합니다.",
    actionCodeConnectionKo: "추세 붕괴 위험이 높으면 WAIT_CONFIRMATION, RISK_REDUCTION, EXIT_PRIORITY 후보 판단에 사용합니다.",
    backtestValidationKo: "추세 붕괴 위험 점수 구간별 다음 3일, 5일 하락 지속 확률과 반등 실패율을 검증합니다.",
    backtestLabels: [
      "return_3d",
      "return_5d",
      "max_drawdown_5d",
      "trend_failure_label",
      "rebound_failure_label",
      "vwap_reclaim_failure_label",
    ],
    interpretationCautionKo: "추세 붕괴 위험은 확정 붕괴가 아니라 유지 조건을 확인해야 하는 위험 신호입니다.",
    marketRegimeAdjustmentKo: "하락장에서는 추세 붕괴 위험 가중치를 높이고, 상승장에서는 단기 눌림과 구분해야 합니다.",
    stockTypeAdjustmentKo: "대형주는 이동평균과 수급을 함께 보고, 테마주는 고점 실패와 거래량 피크를 더 중요하게 봅니다.",
    futureImprovementKo: "20일 및 60일 이동평균, 저점 갱신 여부, ADX를 연결하면 더 정교해집니다.",
  },
  {
    key: "conflictScore",
    koreanName: "신호 충돌 점수",
    direction: "AUXILIARY_RISK",
    timeHorizon: ["SHORT_TERM"],
    meaningKo:
      "긍정적으로 보이는 지표와 단기 약세 리스크가 동시에 나타나는 정도를 평가합니다. 예를 들어 52주 위치는 양호하지만 VWAP와 종가 위치가 약한 경우가 해당됩니다.",
    inputData: [
      "fiftyTwoWeekPositionScore",
      "volumeScore",
      "closePositionScore",
      "vwapScore",
      "totalRiskScore",
      "trendCollapseRisk",
      "vwapBreakdownRisk",
      "volatilityRisk",
    ],
    formulaKo:
      "장기 위치 양호와 단기 약세, 거래량 유지와 가격 회복 부족, 종합 리스크 보통과 핵심 리스크 높음 등의 조건을 점수화합니다.",
    normalizationKo: "충돌 조건별 보조 penalty를 합산하되 100점에 쉽게 도달하지 않도록 보수적으로 정규화합니다.",
    scoreConversionKo:
      "0~29 낮음, 30~54 보통, 55~79 높음, 80~100 매우 높음으로 해석하되, 이는 종합 리스크가 아니라 보조 분석 점수입니다.",
    rangeRules: auxiliaryRiskRangeRules,
    missingDataPolicy: "IGNORE",
    missingDataKo: "일부 입력값이 없으면 해당 충돌 조건만 제외하고 계산합니다.",
    confidencePenaltyKo: "충돌 분석에 필요한 핵심 점수가 부족하면 해당 충돌 조건은 제외하고, 보조 분석 신뢰도를 낮춥니다.",
    usedIn: ["conflict analysis", "explanation quality", "action priority support", "risk interpretation"],
    riskGateLevel: "WATCH",
    riskGateKo: "충돌 점수가 높으면 직접적인 판단이 아니라 단기 확인 우선순위를 높이는 보조 신호로 사용합니다.",
    conflictLogicKo: "충돌 점수 자체가 신호 간 불일치 구조를 설명하는 지표입니다.",
    falseSignalLogicKo: "긍정 신호가 존재해도 VWAP, 종가, 변동성 조건이 약하면 가짜 강세 가능성과 함께 해석합니다.",
    stateTransitionKo: "충돌 점수가 높게 유지되면 상태 판단을 확정하지 않고 WAIT_CONFIRMATION 성격을 강화합니다.",
    actionCodeConnectionKo: "충돌 점수가 높으면 WAIT_CONFIRMATION, WATCHLIST, RISK_REDUCTION 후보 판단에 사용합니다.",
    backtestValidationKo: "충돌 점수 구간별 다음 3일 수익률 분산, 신호 실패율, VWAP 회복 실패율을 검증합니다.",
    backtestLabels: [
      "return_3d",
      "max_drawdown_3d",
      "signal_conflict_failure_label",
      "vwap_reclaim_failure_label",
      "follow_through_failure_label",
    ],
    interpretationCautionKo: "conflictScore는 종목 전체 위험도가 아니라 신호 충돌 강도입니다. totalRiskScore와 직접 비교하면 안 됩니다.",
    marketRegimeAdjustmentKo: "하락장에서는 신호 충돌을 더 보수적으로 보고, 상승장에서는 일부 충돌을 눌림으로 해석할 수 있습니다.",
    stockTypeAdjustmentKo: "테마주에서는 긍정 신호와 약세 신호 충돌이 더 빠르게 발생하므로 기준을 보수적으로 적용합니다.",
    futureImprovementKo: "시장 레짐과 업종 상대 강도를 반영하면 충돌 해석 정확도가 높아집니다.",
  },
  {
    key: "falseSignalScore",
    koreanName: "가짜 신호 위험 점수",
    direction: "AUXILIARY_RISK",
    timeHorizon: ["INTRADAY", "SHORT_TERM"],
    meaningKo:
      "겉으로는 거래량이나 장중 움직임이 있어 보이지만 실제로는 반등 신뢰도가 낮거나 상단 매물 출회 가능성이 있는지를 평가합니다.",
    inputData: [
      "closePositionScore",
      "volumeScore",
      "vwapScore",
      "vwapRiskScore",
      "volatilityRisk",
      "upperWickRatio",
      "intradayRangePercent",
      "vwapDistancePercent",
    ],
    formulaKo:
      "가짜 반등, 상단 매물 출회, 변동성 확대 후 약한 종가, VWAP 회복 실패, 거래량 대비 가격 회복 부족 조건을 점수화합니다.",
    normalizationKo: "가짜 신호 조건별 보조 penalty를 합산하되 과도하게 100점에 도달하지 않도록 완화된 penalty를 사용합니다.",
    scoreConversionKo:
      "0~29 낮음, 30~54 보통, 55~79 높음, 80~100 매우 높음으로 해석하되, 이는 종합 리스크가 아니라 보조 분석 점수입니다.",
    rangeRules: auxiliaryRiskRangeRules,
    missingDataPolicy: "IGNORE",
    missingDataKo: "일부 입력값이 없으면 해당 가짜 신호 조건만 제외하고 계산합니다.",
    confidencePenaltyKo: "윗꼬리, 거래량, VWAP, 종가 위치 데이터가 부족하면 가짜 신호 판단 신뢰도를 낮춥니다.",
    usedIn: ["false signal detection", "explanation quality", "action priority support", "fake rebound detection"],
    riskGateLevel: "WATCH",
    riskGateKo: "가짜 신호 위험이 높으면 단기 반등 신뢰도 확인 항목을 우선 표시합니다.",
    conflictLogicKo: "거래량과 장중 변동성은 존재하지만 VWAP와 종가가 약하면 표면적 강세와 내부 약세의 불일치로 해석합니다.",
    falseSignalLogicKo: "이 지표 자체가 가짜 반등, 상단 매물 출회, VWAP 회복 실패, 거래량 대비 가격 회복 부족을 감지합니다.",
    stateTransitionKo: "가짜 신호 위험이 높게 유지되면 반등 상태를 확정하지 않고 확인 대기 상태로 유지합니다.",
    actionCodeConnectionKo: "가짜 신호 위험이 높으면 WAIT_CONFIRMATION 또는 RISK_REDUCTION 성격을 강화합니다.",
    backtestValidationKo: "가짜 신호 위험 점수 구간별 다음 1일, 3일 반등 실패율과 종가 재약화 확률을 검증합니다.",
    backtestLabels: [
      "return_1d",
      "return_3d",
      "false_rebound_label",
      "distribution_layer_label",
      "weak_close_after_volatility_label",
      "vwap_reclaim_failure_label",
    ],
    interpretationCautionKo:
      "falseSignalScore는 직접적인 하락 예측이 아니라 반등 신뢰도와 구조 안정성 확인을 위한 보조 위험 점수입니다.",
    marketRegimeAdjustmentKo: "하락장에서는 가짜 반등 위험을 더 강하게 보고, 상승장에서는 일시적 눌림과 구분해야 합니다.",
    stockTypeAdjustmentKo: "테마주와 저유동성 종목에서는 가짜 신호 위험을 더 보수적으로 적용합니다.",
    futureImprovementKo: "분봉 체결 강도, 호가 잔량, 프로그램 매매 흐름을 반영하면 가짜 신호 감지가 정교해집니다.",
  },
  {
    key: "totalRiskScore",
    koreanName: "종합 리스크 점수",
    direction: "RISK",
    timeHorizon: ["SHORT_TERM", "MID_TERM"],
    meaningKo:
      "가격 구조, 변동성, VWAP, 추세, 거래 참여 약화 등 여러 위험 요소를 종합해 현재 종목의 전체 위험도를 평가합니다.",
    inputData: ["volatilityRisk", "vwapRiskScore", "trendCollapseRisk", "volumeRiskScore", "participationWeaknessRisk", "distributionRisk"],
    formulaKo: "각 리스크 항목을 가중 평균하거나 리스크 게이트 조건을 반영해 종합 위험 점수를 산출합니다.",
    normalizationKo:
      "세부 리스크 점수를 0~100 기준으로 통합합니다. 특정 핵심 리스크가 매우 높으면 단순 평균보다 보수적으로 해석할 수 있습니다.",
    scoreConversionKo: "0~29 낮음, 30~54 보통, 55~79 높음, 80~100 매우 높음으로 해석합니다.",
    rangeRules: riskRangeRules,
    missingDataPolicy: "NEUTRAL",
    missingDataKo: "일부 리스크 항목이 부족하면 사용 가능한 리스크 항목만 계산하되, 데이터 부족 경고를 표시합니다.",
    confidencePenaltyKo: "핵심 리스크 항목이 부족하면 종합 리스크 신뢰도를 낮춥니다.",
    usedIn: ["risk summary", "action priority", "final interpretation", "customer guide", "risk management"],
    riskGateLevel: "HIGH_RISK",
    riskGateKo: "종합 리스크가 보통이어도 VWAP 리스크나 추세 붕괴 위험이 매우 높으면 핵심 세부 리스크 우선 경고를 표시합니다.",
    conflictLogicKo:
      "totalRiskScore가 낮거나 보통이어도 conflictScore와 falseSignalScore가 높으면 보조 분석 기준으로 단기 확인 우선순위를 높입니다.",
    falseSignalLogicKo: "종합 리스크가 보통이어도 가짜 신호 위험이 높으면 반등 신뢰도를 낮게 해석해야 합니다.",
    stateTransitionKo: "종합 리스크가 높아지고 핵심 리스크가 동시 상승하면 주의 필요 구조에서 위험 관리 우선 상태로 전환합니다.",
    actionCodeConnectionKo: "종합 리스크 점수가 높으면 RISK_REDUCTION, AVOID, HUMAN_REVIEW 후보 판단에 사용합니다.",
    backtestValidationKo: "종합 리스크 점수 구간별 다음 1일, 3일, 5일 최대 낙폭과 손실 확률을 검증합니다.",
    backtestLabels: [
      "return_1d",
      "return_3d",
      "return_5d",
      "max_drawdown_3d",
      "max_drawdown_5d",
      "risk_reduction_success_label",
    ],
    interpretationCautionKo: "종합 리스크 점수는 단일 판단이 아니라 위험 관리 기준입니다.",
    marketRegimeAdjustmentKo:
      "하락장과 고변동성장에서는 리스크 점수 가중치를 높이고, 강한 상승장에서는 일부 리스크를 완화할 수 있습니다.",
    stockTypeAdjustmentKo: "저유동성 종목, 테마주, 바이오주는 리스크 점수 기준을 더 보수적으로 적용합니다.",
    futureImprovementKo: "시장 레짐, 업종 상대 강도, 실시간 수급 데이터를 반영하면 정확도가 높아집니다.",
  },
  {
    key: "volumeRiskScore",
    koreanName: "거래량 리스크 점수",
    direction: "RISK",
    timeHorizon: ["INTRADAY", "SHORT_TERM"],
    meaningKo:
      "거래량 증가가 실제 가격 회복으로 이어지는지, 아니면 약한 종가와 윗꼬리 속에서 분배 또는 실패한 참여로 바뀌는지 평가합니다. StockAI에서는 거래량을 단순 긍정으로 보지 않고 가격 진행 품질과 함께 해석합니다.",
    inputData: ["volumeRatio20d", "closePositionScore", "vwapScore", "upperWickRatio", "priceProgress", "currentVolume", "averageVolume20d"],
    formulaKo:
      "volumeRatio20d를 기본 축으로 삼고, 종가 위치 약화, VWAP 회복 실패, 윗꼬리 확대, 가격 진행 부족이 함께 나타나면 거래량 리스크를 높입니다.",
    normalizationKo:
      "평균 대비 거래량 비율을 0~100 위험 축으로 변환한 뒤, 가격 회복이 약한 조건을 추가 위험으로 반영합니다. 거래량이 많아도 가격이 진행하지 못하면 긍정 점수가 아니라 위험 점수로 재해석합니다.",
    scoreConversionKo: "0~29 낮음, 30~54 보통, 55~79 높음, 80~100 매우 높음으로 해석합니다.",
    rangeRules: riskRangeRules,
    missingDataPolicy: "NEUTRAL",
    missingDataKo: "거래량 또는 평균 거래량이 부족하면 중립 위험 50으로 처리하고, 거래량 기반 신호의 판단 범위를 제한합니다.",
    confidencePenaltyKo: "평균 거래량, 종가 위치, VWAP 중 하나라도 부족하면 거래량 리스크 판단 신뢰도를 낮춥니다.",
    usedIn: ["volume structure", "distribution risk", "false signal detection", "action priority", "breakout reliability"],
    riskGateLevel: "CAUTION",
    riskGateKo:
      "거래량 리스크가 높고 종가 위치 또는 VWAP 점수가 약하면 거래량 증가를 강세가 아니라 분배 또는 실패한 참여 게이트로 처리합니다.",
    conflictLogicKo:
      "거래량 점수는 높지만 종가 위치와 VWAP가 약하면 표면적 참여와 실제 가격 회복 부족이 충돌하는 신호로 해석합니다.",
    falseSignalLogicKo:
      "거래량 증가가 가격 회복 없이 나타나면 가짜 강세, 거래량 없는 후속 진행, 상단 매물 출회 위험을 감지합니다.",
    stateTransitionKo:
      "거래량 리스크가 반복되면 회복 상태를 확정하지 않고 확인 대기 또는 상태 유지 실패 후보로 전환합니다.",
    actionCodeConnectionKo:
      "높은 거래량 리스크는 즉시 긍정 행동이 아니라 WAIT_CONFIRMATION, RISK_REDUCTION, AVOID 후보 판단에 사용합니다.",
    backtestValidationKo:
      "거래량 리스크 구간별 다음 1일, 3일 수익률과 3일 최대 낙폭, 거래량 후속 실패율을 검증합니다.",
    backtestLabels: [
      "volume_failure_label",
      "distribution_layer_label",
      "return_1d",
      "return_3d",
      "max_drawdown_3d",
      "follow_through_failure_label",
    ],
    interpretationCautionKo:
      "거래량 증가는 참여의 존재만 보여줄 뿐 방향을 확정하지 않습니다. 약한 종가, VWAP 실패, 윗꼬리와 함께 나타나면 위험 신호입니다.",
    marketRegimeAdjustmentKo:
      "상승장에서는 거래량 증가의 긍정 여지를 남기되, 하락장과 횡보장에서는 거래량 급증 후 가격 진행 실패를 더 보수적으로 봅니다.",
    stockTypeAdjustmentKo:
      "대형주는 기관·외국인 수급과 함께 보고, 테마주와 저유동성 종목은 거래량 피크 후 급격한 분배 가능성을 더 강하게 반영합니다.",
    futureImprovementKo:
      "체결 강도, 호가 잔량, 프로그램 매매, 분봉 거래량 피크 이후 가격 진행률을 연결하면 거래량 리스크 해석이 정교해집니다.",
  },
  {
    key: "vwapBreakdownRisk",
    koreanName: "VWAP 이탈 위험",
    direction: "RISK",
    timeHorizon: ["INTRADAY", "SHORT_TERM"],
    meaningKo:
      "가격이 시장 참여자 평균 단가인 VWAP를 잃거나 회복에 실패하는 위험을 평가합니다. VWAP 이탈은 평균 단가 방어 실패이므로 약한 종가, 거래량, 추세 붕괴 위험과 결합될수록 중요해집니다.",
    inputData: ["vwapDistancePercent", "vwapScore", "vwapRiskScore", "closePositionScore", "volumeScore", "reclaimFailure", "isAboveVwap"],
    formulaKo:
      "VWAP 이격률이 음수이거나 VWAP 점수가 낮을수록 위험을 높이고, 종가 위치 약화, 거래량 동반, 재돌파 실패, 추세 붕괴 위험이 있으면 추가 위험으로 해석합니다.",
    normalizationKo:
      "VWAP 하회 정도와 회복 실패 조건을 0~100 위험 점수로 정규화합니다. 단순 이탈보다 종가까지 회복하지 못한 구조를 더 중요하게 봅니다.",
    scoreConversionKo: "0~29 낮음, 30~54 보통, 55~79 높음, 80~100 매우 높음으로 해석합니다.",
    rangeRules: riskRangeRules,
    missingDataPolicy: "NEUTRAL",
    missingDataKo: "VWAP가 없으면 중립 위험 50으로 처리하되, VWAP 기반 상태 유지 판단은 제한합니다.",
    confidencePenaltyKo: "VWAP가 추정값이거나 지연 데이터이면 이탈 위험 판단 신뢰도를 낮추고 데이터 모드를 함께 표시해야 합니다.",
    usedIn: ["VWAP structure", "risk gate", "state collapse detection", "false signal detection", "action priority"],
    riskGateLevel: "HIGH_RISK",
    riskGateKo:
      "VWAP 이탈 위험이 높고 종가 위치나 추세 붕괴 위험이 함께 약하면 단순 점수 평균보다 VWAP 이탈 게이트를 우선 적용합니다.",
    conflictLogicKo:
      "거래량 또는 52주 위치가 좋아 보여도 VWAP 이탈이 크면 표면적 긍정과 평균 단가 방어 실패가 충돌하는 구조입니다.",
    falseSignalLogicKo:
      "장중 반등이 있었더라도 VWAP 재돌파 후 유지하지 못하면 가짜 반등 또는 false reclaim으로 해석합니다.",
    stateTransitionKo:
      "VWAP 이탈 후 회복 실패가 반복되면 VWAP 지지 상태에서 VWAP 이탈 주의 또는 추세 훼손 점검 상태로 전환합니다.",
    actionCodeConnectionKo:
      "높은 VWAP 이탈 위험은 WAIT_CONFIRMATION, RISK_REDUCTION, EXIT_PRIORITY, AVOID 후보 판단에 사용합니다.",
    backtestValidationKo:
      "VWAP 이탈 위험 구간별 다음 3일 수익률, VWAP 회복 실패율, 3일 최대 낙폭을 검증합니다.",
    backtestLabels: [
      "vwap_loss_label",
      "vwap_reclaim_failure_label",
      "false_rebound_label",
      "max_drawdown_3d",
      "return_3d",
    ],
    interpretationCautionKo:
      "VWAP 이탈은 직접적인 예측이 아니라 평균 단가 방어 실패 여부를 확인하는 구조 신호입니다.",
    marketRegimeAdjustmentKo:
      "상승장에서는 단기 VWAP 이탈을 눌림으로 볼 수 있지만, 하락장과 고변동성장에서는 추세 훼손 신호로 더 강하게 반영합니다.",
    stockTypeAdjustmentKo:
      "저유동성 종목은 VWAP 왜곡 가능성이 있어 거래대금과 체결 밀도를 함께 보고, 대형주는 기관·외국인 평균 단가 관점과 함께 봅니다.",
    futureImprovementKo:
      "분봉 VWAP 유지 시간, VWAP 재돌파 실패 횟수, 장중 체결 강도, 호가 흡수 여부를 추가하면 회복 실패 감지가 개선됩니다.",
  },
  {
    key: "distributionRisk",
    koreanName: "분배 위험",
    direction: "RISK",
    timeHorizon: ["INTRADAY", "SHORT_TERM"],
    meaningKo:
      "거래량이 존재하지만 가격이 전진하지 못하고 윗꼬리, 약한 종가, 고점 돌파 실패가 나타나는 구조를 평가합니다. 이는 강한 수급이 아니라 공급 압력 또는 상단 매물 출회일 수 있습니다.",
    inputData: ["upperWickRatio", "volumeScore", "closePositionScore", "repeatedHighFailure", "priceProgressScore", "vwapLoss", "volumeRatio20d"],
    formulaKo:
      "윗꼬리 비율, 거래량 증가, 약한 종가, 가격 진행 부족, VWAP 이탈, 반복 고점 실패를 조합해 분배 위험을 산출합니다.",
    normalizationKo:
      "고거래량과 약한 가격 진행 조건을 0~100 위험 점수로 정규화합니다. 거래량만 높으면 중립적이지만 윗꼬리와 약한 종가가 결합되면 위험을 높입니다.",
    scoreConversionKo: "0~29 낮음, 30~54 보통, 55~79 높음, 80~100 매우 높음으로 해석합니다.",
    rangeRules: riskRangeRules,
    missingDataPolicy: "NEUTRAL",
    missingDataKo: "윗꼬리, 거래량, 종가 위치 중 일부가 없으면 사용 가능한 항목만 보수적으로 반영하고 중립 위험을 기본값으로 둡니다.",
    confidencePenaltyKo: "분배 판단에 필요한 캔들 구조나 거래량 기준이 부족하면 분배 위험 신뢰도를 낮춥니다.",
    usedIn: ["risk structure", "false breakout detection", "false signal detection", "state collapse detection", "action priority"],
    riskGateLevel: "HIGH_RISK",
    riskGateKo:
      "분배 위험이 높고 VWAP 이탈 또는 약한 종가가 동반되면 긍정 점수보다 분배 위험 게이트를 우선 적용합니다.",
    conflictLogicKo:
      "거래량 점수나 장기 위치가 좋아도 윗꼬리와 약한 종가가 크면 표면적 강세와 실제 공급 압력이 충돌합니다.",
    falseSignalLogicKo:
      "돌파처럼 보이는 움직임이 윗꼬리와 거래량 피크 후 실패로 끝나면 가짜 돌파 또는 상단 분배로 분류합니다.",
    stateTransitionKo:
      "분배 위험이 반복되면 돌파 시도 또는 반등 상태를 확정하지 않고 주의 필요 구조나 상태 붕괴 후보로 전환합니다.",
    actionCodeConnectionKo: "높은 분배 위험은 RISK_REDUCTION, EXIT_PRIORITY, AVOID 후보 판단에 사용합니다.",
    backtestValidationKo:
      "분배 위험 구간별 다음 1일, 5일 수익률, 5일 최대 낙폭, 돌파 실패율과 상단 분배 라벨을 검증합니다.",
    backtestLabels: [
      "distribution_layer_label",
      "failed_breakout_label",
      "top_distribution_label",
      "return_1d",
      "return_5d",
      "max_drawdown_5d",
    ],
    interpretationCautionKo:
      "분배 위험은 거래량이 많다는 사실을 부정하는 것이 아니라, 그 거래량이 가격 전진으로 연결되지 않았는지를 확인하는 지표입니다.",
    marketRegimeAdjustmentKo:
      "상승장에서는 일부 윗꼬리를 소화 과정으로 볼 수 있지만, 하락장·횡보장에서는 고점 실패와 거래량 피크를 더 위험하게 봅니다.",
    stockTypeAdjustmentKo:
      "테마주와 바이오주는 상단 분배가 빠르게 진행될 수 있어 보수적으로 적용하고, 대형주는 반복 고점 실패와 수급 전환을 함께 확인합니다.",
    futureImprovementKo:
      "반복 고점 실패 횟수, 체결 분포, 호가 매물대, 프로그램 매매 전환, 뉴스 반응 둔화를 반영하면 분배 감지가 강화됩니다.",
  },
  {
    key: "participationWeaknessRisk",
    koreanName: "참여 약화 위험",
    direction: "RISK",
    timeHorizon: ["INTRADAY", "SHORT_TERM"],
    meaningKo:
      "가격 움직임을 뒷받침할 거래 참여와 유동성이 충분한지 평가합니다. 참여가 약한 움직임은 상태 유지력이 낮고 false breakout으로 이어질 수 있습니다.",
    inputData: ["volumeRatio20d", "averageVolume20d", "averageVolume10d", "liquidity", "participationQuality", "turnoverValue"],
    formulaKo:
      "평균 대비 거래량, 단기 거래량 변화, 유동성, 체결 가능성, 후속 거래 참여를 조합해 참여 약화 위험을 산출합니다.",
    normalizationKo:
      "거래량과 유동성 부족을 0~100 위험 점수로 정규화합니다. 낮은 거래량, 얇은 유동성, 후속 참여 부재는 위험을 높입니다.",
    scoreConversionKo: "0~29 낮음, 30~54 보통, 55~79 높음, 80~100 매우 높음으로 해석합니다.",
    rangeRules: riskRangeRules,
    missingDataPolicy: "NEUTRAL",
    missingDataKo: "거래량 평균 또는 유동성 데이터가 부족하면 중립 위험 50으로 처리하고 신호 확정력을 제한합니다.",
    confidencePenaltyKo: "평균 거래량, 거래대금, 체결 가능성 데이터가 부족하면 참여 약화 위험과 전체 confidenceScore를 함께 낮춥니다.",
    usedIn: ["participation quality", "liquidity risk", "breakout reliability", "confidence adjustment", "action priority"],
    riskGateLevel: "CAUTION",
    riskGateKo:
      "참여 약화 위험이 높으면 긍정 가격 신호가 있어도 돌파 신뢰도를 낮추고 확인 대기 게이트를 적용할 수 있습니다.",
    conflictLogicKo:
      "가격은 좋아 보이지만 거래 참여가 부족하면 가격 상태와 참여 품질이 충돌하는 신호로 해석합니다.",
    falseSignalLogicKo:
      "거래 참여가 약한 돌파나 반등은 유지력이 낮아 가짜 돌파 또는 회복 실패 가능성을 높입니다.",
    stateTransitionKo:
      "참여 약화가 지속되면 WATCHLIST 또는 회복 시도 상태를 확정하지 않고 신뢰도 낮은 관찰 상태로 유지합니다.",
    actionCodeConnectionKo:
      "높은 참여 약화 위험은 action 강도를 낮추고 WATCHLIST, WAIT_CONFIRMATION, HUMAN_REVIEW 성격을 강화합니다.",
    backtestValidationKo:
      "참여 약화 위험 구간별 다음 3일 수익률, 돌파 실패율, 3일 최대 낙폭과 저유동성 실패 라벨을 검증합니다.",
    backtestLabels: [
      "weak_participation_label",
      "low_liquidity_failure_label",
      "breakout_failure_label",
      "return_3d",
      "max_drawdown_3d",
    ],
    interpretationCautionKo:
      "참여 약화 위험은 가격 방향이 아니라 신호를 실제로 유지할 수 있는 시장 참여 기반이 약한지를 보여줍니다.",
    marketRegimeAdjustmentKo:
      "하락장과 유동성 축소 국면에서는 참여 약화의 위험을 높이고, 강한 상승장에서는 업종 순환과 거래대금 유입 여부를 함께 봅니다.",
    stockTypeAdjustmentKo:
      "저유동성 종목은 기준을 가장 보수적으로 적용하고, 대형주는 평균 거래대금과 기관·외국인 참여 변화를 함께 확인합니다.",
    futureImprovementKo:
      "호가 스프레드, 체결 밀도, 거래대금, 슬리피지 추정, 상대 유동성 지표를 연결하면 참여 품질 평가가 개선됩니다.",
  },
  {
    key: "actionPriorityScore",
    koreanName: "대응 우선순위 점수",
    direction: "AUXILIARY_RISK",
    timeHorizon: ["INTRADAY", "SHORT_TERM"],
    meaningKo:
      "종목의 매력도가 아니라 사용자가 위험 조건을 얼마나 우선적으로 점검해야 하는지 나타내는 보조 위험 점수입니다. 높을수록 확인 우선순위가 높다는 뜻이지 긍정 행동의 강도가 아닙니다.",
    inputData: ["vwapBreakdownRisk", "trendCollapseRisk", "volatilityRisk", "closePositionScore", "falseSignalScore", "conflictScore", "totalRiskScore"],
    formulaKo:
      "VWAP 이탈, 추세 붕괴, 변동성 확대, 약한 종가, 가짜 신호 위험, 신호 충돌, 종합 리스크를 조합해 확인 우선순위를 산출합니다.",
    normalizationKo:
      "각 위험 조건을 0~100 확인 우선순위 축으로 정규화합니다. 단일 위험보다 여러 구조 위험이 동시에 나타날 때 점수가 높아져야 합니다.",
    scoreConversionKo:
      "0~29 낮음, 30~54 보통, 55~79 높음, 80~100 매우 높음으로 해석하되, 이는 매력도가 아니라 확인 우선순위입니다.",
    rangeRules: auxiliaryRiskRangeRules,
    missingDataPolicy: "PENALIZE",
    missingDataKo: "핵심 위험 입력이 부족하면 보수적으로 확인 우선순위를 낮추기보다 confidenceScore를 낮추고 HUMAN_REVIEW 가능성을 높입니다.",
    confidencePenaltyKo: "VWAP, 종가 위치, 리스크, 보조 분석 점수가 부족하면 대응 우선순위 해석 신뢰도를 낮춥니다.",
    usedIn: ["action code support", "customer checklist", "risk prioritization", "human review routing", "explanation quality"],
    riskGateLevel: "WATCH",
    riskGateKo:
      "대응 우선순위 점수가 높으면 단순 긍정 점수보다 확인 항목을 먼저 표시하고, 위험 게이트의 UI·행동 코드 반영을 강화합니다.",
    conflictLogicKo:
      "conflictScore가 높은 상태에서 actionPriorityScore도 높으면 점수 평균보다 신호 불일치 점검이 우선입니다.",
    falseSignalLogicKo:
      "falseSignalScore가 높으면 대응 우선순위는 반등 신뢰도 확인과 VWAP 회복 여부를 우선 체크하도록 연결됩니다.",
    stateTransitionKo:
      "대응 우선순위가 높게 유지되면 상태 확정보다 WAIT_CONFIRMATION 또는 위험 관리 우선 상태로 전환할 수 있습니다.",
    actionCodeConnectionKo:
      "WAIT_CONFIRMATION, WATCHLIST, RISK_REDUCTION, EXIT_PRIORITY, AVOID, HUMAN_REVIEW 후보를 정렬하는 보조 기준으로 사용합니다.",
    backtestValidationKo:
      "대응 우선순위 구간별 위험 회피 성공률, 3일 최대 낙폭 방어, action-code 성공 라벨을 검증합니다.",
    backtestLabels: [
      "action_priority_success_label",
      "risk_reduction_success_label",
      "avoid_success_label",
      "false_rebound_label",
      "max_drawdown_3d",
    ],
    interpretationCautionKo:
      "높은 대응 우선순위 점수는 좋은 기회가 아니라 먼저 확인할 위험 조건이 많다는 뜻입니다.",
    marketRegimeAdjustmentKo:
      "하락장과 고변동성장에서는 같은 위험 조건도 우선순위를 높이고, 상승장에서는 일시 눌림과 구조 붕괴를 분리해 봅니다.",
    stockTypeAdjustmentKo:
      "테마주와 저유동성 종목은 높은 우선순위를 더 보수적으로 해석하고, 대형주는 수급·VWAP 회복 여부를 함께 확인합니다.",
    futureImprovementKo:
      "실시간 알림, 호가 공백, 뉴스 이벤트, 프로그램 매매 전환을 연결하면 대응 우선순위를 더 정확히 정렬할 수 있습니다.",
  },
  {
    key: "finalScore",
    koreanName: "최종 종합 점수",
    direction: "POSITIVE",
    timeHorizon: ["SHORT_TERM", "MID_TERM"],
    meaningKo:
      "가격, 거래량, VWAP, 상태, 대응 점수를 종합하고 리스크를 차감한 원시 복합 구조 점수입니다. 다만 StockAI에서는 finalScore를 리스크 게이트 적용 전의 rawCompositeScore로 보고, 별도의 riskGatedInterpretationScore 개념이 필요합니다.",
    inputData: ["ohlcScore", "volumeScore", "vwapScore", "stateScore", "actionScore", "riskScore", "riskGateSignals"],
    formulaKo:
      "현재 엔진은 ohlcScore, volumeScore, vwapScore, stateScore, actionScore의 가중 합에서 riskScore를 차감해 finalScore를 산출합니다.",
    normalizationKo:
      "서로 다른 도메인 점수를 0~100 기준으로 통합하되, 리스크 점수는 음수 기여로 반영합니다. 향후에는 rawCompositeScore와 riskGatedInterpretationScore를 분리해야 합니다.",
    scoreConversionKo:
      "높을수록 기본 구조는 양호하지만, VWAP 이탈·추세 붕괴·가짜 신호 위험 게이트가 켜지면 높은 finalScore도 주의 구조로 해석할 수 있습니다.",
    rangeRules: positiveQualityRangeRules,
    missingDataPolicy: "PENALIZE",
    missingDataKo: "핵심 도메인 점수가 부족하면 중립 대체값을 쓰더라도 confidenceScore를 낮추고 finalScore 해석을 제한해야 합니다.",
    confidencePenaltyKo: "가격, 거래량, VWAP, 리스크, 상태 분류 중 하나라도 데이터 품질이 낮으면 최종 점수 신뢰도를 낮춥니다.",
    usedIn: ["final interpretation", "grade support", "customer summary", "backtest bucket", "action code context"],
    riskGateLevel: "WATCH",
    riskGateKo:
      "finalScore가 높아도 VWAP 이탈, 추세 붕괴, 분배, 가짜 신호 위험이 강하면 리스크 게이트가 단순 평균 해석을 override해야 합니다.",
    conflictLogicKo:
      "finalScore가 높지만 conflictScore도 높으면 긍정 점수와 단기 위험이 충돌하는 구조로 설명해야 합니다.",
    falseSignalLogicKo:
      "finalScore가 높아도 falseSignalScore가 높으면 표면적 점수와 실제 반등 신뢰도를 분리해 해석해야 합니다.",
    stateTransitionKo:
      "finalScore는 상태 전환의 참고값이지만, 상태 유지·붕괴 판단은 VWAP 유지, 종가 위치, 리스크 게이트를 함께 봐야 합니다.",
    actionCodeConnectionKo:
      "finalScore 단독으로 행동 코드를 결정하지 않고 리스크 게이트, confidenceScore, dataQualityScore, 상태 분류, 보조 위험 점수를 함께 반영합니다.",
    backtestValidationKo:
      "finalScore 구간별 다음 1일, 3일, 5일 수익률과 5일 최대 낙폭, 리스크 게이트 override 성공 여부를 검증합니다.",
    backtestLabels: [
      "return_1d",
      "return_3d",
      "return_5d",
      "max_drawdown_5d",
      "final_score_bucket_label",
      "risk_gate_override_label",
    ],
    interpretationCautionKo:
      "finalScore는 구조 점수이지 직접 행동 신호가 아닙니다. 높은 점수도 리스크 게이트가 켜지면 주의 또는 확인 대기로 해석해야 합니다.",
    marketRegimeAdjustmentKo:
      "상승장에서는 긍정 구성 요소를 더 신뢰할 수 있지만, 하락장·횡보장에서는 같은 finalScore라도 리스크 게이트 비중을 높여야 합니다.",
    stockTypeAdjustmentKo:
      "대형주는 안정성과 수급 지속성을 함께 보고, 테마주·저유동성 종목은 finalScore보다 변동성·분배·유동성 위험을 우선합니다.",
    futureImprovementKo:
      "rawCompositeScore, riskGatedInterpretationScore, backtestExpectedValueScore를 분리하면 최종 점수의 설명력과 검증 가능성이 높아집니다.",
  },
  {
    key: "confidenceScore",
    koreanName: "분석 신뢰도 점수",
    direction: "POSITIVE",
    timeHorizon: ["INTRADAY", "SHORT_TERM", "MID_TERM"],
    meaningKo:
      "현재 해석이 얼마나 신뢰 가능한지를 나타냅니다. 데이터 품질, 결측, 신호 일치도, conflictAnalysis, falseSignalAnalysis, 공급자 freshness, 샘플 안정성을 함께 반영해야 합니다.",
    inputData: ["dataCompleteness", "missingDataPenalty", "signalConsistency", "conflictScore", "falseSignalScore", "providerFreshness", "sampleStability"],
    formulaKo:
      "기본 신뢰도에서 데이터 결측, 공급자 지연, 신호 충돌, 가짜 신호 위험, 백테스트 표본 부족을 차감하고 신호 일치도와 데이터 안정성을 가산합니다.",
    normalizationKo:
      "데이터 품질과 신호 일치도를 0~100 신뢰도 축으로 정규화합니다. 신호가 강해도 데이터나 구조 충돌이 약하면 신뢰도는 낮아져야 합니다.",
    scoreConversionKo: "80~100 매우 높음, 60~79 양호, 40~59 보통, 0~39 낮음으로 해석합니다.",
    rangeRules: positiveQualityRangeRules,
    missingDataPolicy: "PENALIZE",
    missingDataKo: "핵심 데이터가 없거나 지연되면 분석을 유지하더라도 confidenceScore를 낮추고 일부 판단을 제한합니다.",
    confidencePenaltyKo: "VWAP 없음, 분봉 없음, 공급자 지연, 샘플 대체, 백테스트 표본 부족은 신뢰도 감점으로 연결해야 합니다.",
    usedIn: ["state classification", "action code strength", "human review routing", "explanation quality", "data safety"],
    riskGateLevel: "WATCH",
    riskGateKo:
      "confidenceScore가 낮으면 긍정 점수나 낮은 리스크 점수보다 데이터 불확실성 게이트를 우선 적용할 수 있습니다.",
    conflictLogicKo:
      "conflictScore가 높으면 신호들이 같은 방향으로 정렬되지 않았다는 뜻이므로 confidenceScore를 낮추는 근거가 됩니다.",
    falseSignalLogicKo:
      "falseSignalScore가 높으면 표면적 강세 해석의 신뢰도가 낮아져 확인 대기 성격이 강해집니다.",
    stateTransitionKo:
      "신뢰도가 낮으면 상태 전환을 확정하지 않고 관찰, 확인 대기, HUMAN_REVIEW 후보로 유지합니다.",
    actionCodeConnectionKo:
      "낮은 confidenceScore는 행동 강도를 낮추고 WAIT_CONFIRMATION 또는 HUMAN_REVIEW 후보 판단에 사용합니다.",
    backtestValidationKo:
      "신뢰도 구간별 신호 성공률, 모델 오류율, 예측 안정성, action-code 성공률을 검증합니다.",
    backtestLabels: [
      "confidence_bucket_label",
      "signal_success_label",
      "model_error_label",
      "prediction_stability_label",
    ],
    interpretationCautionKo:
      "confidenceScore는 종목의 좋고 나쁨이 아니라 현재 분석을 얼마나 믿을 수 있는지를 나타냅니다.",
    marketRegimeAdjustmentKo:
      "고변동성장과 이벤트 시장에서는 같은 신호라도 confidenceScore를 보수적으로 낮추고, 안정적 상승장에서는 신호 일치도를 더 신뢰할 수 있습니다.",
    stockTypeAdjustmentKo:
      "저유동성·테마주는 신호 변동이 크므로 신뢰도 기준을 보수적으로 적용하고, 대형주는 데이터 안정성을 더 높게 평가할 수 있습니다.",
    futureImprovementKo:
      "공급자별 데이터 품질 로그, 백테스트 표본 수, 신호 재현성, 모델 오류 추적을 연결하면 신뢰도 점수의 객관성이 높아집니다.",
  },
  {
    key: "dataQualityScore",
    koreanName: "데이터 품질 점수",
    direction: "POSITIVE",
    timeHorizon: ["INTRADAY", "SHORT_TERM", "MID_TERM", "LONG_TERM"],
    meaningKo:
      "분석 강도보다 먼저 확인해야 하는 데이터 안전성 점수입니다. 가격, 거래량, VWAP, 분봉, 공급자 freshness, 확정 데이터 여부, EOD와 실시간 모드, 백테스트 재현 가능성을 평가합니다.",
    inputData: ["priceDataCompleteness", "volumeDataCompleteness", "vwapAvailability", "intradayDataAvailability", "providerFreshness", "isConfirmedData", "analysisMode", "backtestReproducibility"],
    formulaKo:
      "가격 데이터 완전성, 거래량 데이터 완전성, VWAP 사용 가능성, 장중 데이터 여부, 공급자 최신성, 확정/추정 여부, 백테스트 기준 일치성을 가중 합산합니다.",
    normalizationKo:
      "각 데이터 품질 항목을 0~100으로 정규화한 뒤 분석 가능 수준, 부분 분석 수준, 분석 제한 수준으로 구분합니다.",
    scoreConversionKo: "80~100 정상 분석, 60~79 분석 가능하지만 신뢰도 감점, 35~59 부분 분석, 0~34 분석 제한으로 해석합니다.",
    rangeRules: [
      {
        min: 80,
        max: 100,
        score: 90,
        labelKo: "정상 분석",
        descriptionKo: "핵심 데이터가 충분해 일반 분석이 가능합니다.",
      },
      {
        min: 60,
        max: 79.999,
        score: 70,
        labelKo: "분석 가능",
        descriptionKo: "분석은 가능하지만 일부 신뢰도 감점이 필요합니다.",
      },
      {
        min: 35,
        max: 59.999,
        score: 45,
        labelKo: "부분 분석",
        descriptionKo: "일부 판단은 제한하고 HUMAN_REVIEW 가능성을 높입니다.",
      },
      {
        min: 0,
        max: 34.999,
        score: 20,
        labelKo: "분석 제한",
        descriptionKo: "데이터 품질이 낮아 강한 해석을 제한해야 합니다.",
      },
    ],
    missingDataPolicy: "BLOCK_ANALYSIS",
    missingDataKo: "핵심 가격 데이터가 없거나 공급자 오류가 크면 분석을 제한하고, 대체 데이터 사용 시 그 사실을 명확히 표시합니다.",
    confidencePenaltyKo: "데이터 품질 점수가 낮으면 confidenceScore를 직접 낮추고 행동 코드 강도를 제한합니다.",
    usedIn: ["data safety", "confidence adjustment", "human review routing", "provider diagnostics", "backtest reproducibility"],
    riskGateLevel: "BLOCK",
    riskGateKo:
      "dataQualityScore가 낮으면 좋은 점수보다 데이터 사용 가능 여부를 우선하고 HUMAN_REVIEW 또는 분석 제한 게이트를 적용합니다.",
    conflictLogicKo:
      "데이터 품질이 낮으면 신호 충돌이 실제 구조 문제인지 데이터 오류인지 구분하기 어려우므로 충돌 해석 신뢰도를 낮춥니다.",
    falseSignalLogicKo:
      "VWAP, 분봉, 거래량 데이터가 지연되거나 추정이면 가짜 신호 판단이 과도해질 수 있어 보수적으로 제한합니다.",
    stateTransitionKo:
      "데이터 품질이 낮으면 상태 전환을 확정하지 않고 관찰 또는 HUMAN_REVIEW 상태로 유지합니다.",
    actionCodeConnectionKo:
      "낮은 dataQualityScore는 WAIT_CONFIRMATION, HUMAN_REVIEW, 분석 제한 메시지로 연결되어야 하며 강한 행동 코드를 막아야 합니다.",
    backtestValidationKo:
      "데이터 품질 구간별 신호 성공률, provider 오류, stale data 영향, 백테스트 재현 가능성을 검증합니다.",
    backtestLabels: [
      "data_quality_bucket_label",
      "stale_data_label",
      "missing_vwap_label",
      "estimated_data_label",
      "provider_error_label",
    ],
    interpretationCautionKo:
      "데이터 품질 점수는 분석보다 앞서는 안전장치입니다. 데이터가 부정확하면 좋은 점수도 신뢰할 수 없습니다.",
    marketRegimeAdjustmentKo:
      "이벤트 시장과 고변동성장에서는 데이터 지연의 영향이 커지므로 품질 기준을 더 엄격하게 적용합니다.",
    stockTypeAdjustmentKo:
      "저유동성 종목은 호가 공백과 체결 왜곡이 크므로 데이터 품질 감점을 강화하고, 대형주는 공급자 최신성과 수급 데이터 확정 여부를 중점 확인합니다.",
    futureImprovementKo:
      "공급자별 latency, 분봉 누락률, VWAP 추정 여부, 호가 품질, 백테스트 재현 로그를 저장하면 분석 제한 판단이 정교해집니다.",
  },
];

// TODO: Add full policies for marketRegimeScore, breakoutReliabilityScore, pullbackQualityScore,
// stateMaintenanceScore, stateCollapseRisk, trueBreakoutProbability, and falseBreakoutRisk.

export function getScoreFormulaPolicy(key: string): ScoreFormulaPolicy | undefined {
  return SCORE_FORMULA_POLICIES.find((policy) => policy.key === key);
}

export function normalizeToScore(value: number, ranges: ScoreRangeRule[], direction: ScoreDirection): number {
  void direction;

  if (!Number.isFinite(value)) {
    return 50;
  }

  const matchedRange = ranges.find((range) => {
    const isAboveMin = range.min === undefined || value >= range.min;
    const isBelowMax = range.max === undefined || value <= range.max;
    return isAboveMin && isBelowMax;
  });

  if (!matchedRange) {
    return 50;
  }

  return clampScore(matchedRange.score);
}

export function clampScore(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 50;
  }

  return Math.min(100, Math.max(0, value));
}

export function getScoreDirectionLabelKo(direction: ScoreDirection): string {
  if (direction === "POSITIVE") return "높을수록 긍정";
  if (direction === "RISK") return "높을수록 위험";
  return "높을수록 보조 위험 신호 강함";
}

export function getMissingDataPolicyLabelKo(policy: MissingDataPolicy): string {
  if (policy === "NEUTRAL") return "중립값 처리";
  if (policy === "PENALIZE") return "보수적 감점";
  if (policy === "IGNORE") return "계산 제외";
  return "분석 제한";
}

export function getRiskGateLevelLabelKo(level: RiskGateLevel): string {
  if (level === "NONE") return "게이트 없음";
  if (level === "WATCH") return "관찰";
  if (level === "CAUTION") return "주의";
  if (level === "HIGH_RISK") return "고위험";
  return "분석 제한";
}
