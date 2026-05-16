import type { StockAnalysisInput } from "./types";
import {
  calculate52WeekPositionScore,
  calculateClosePositionScore,
  calculateLowerWickRatio,
  calculateUpperWickRatio,
  clampScore,
  isFiniteNumber,
  percentChange,
  safeDivide,
} from "./normalize";

export type OHLCScoreResult = {
  closePositionScore: number;
  upperWickRatio: number;
  lowerWickRatio: number;
  intradayRangePercent: number;
  openToCloseChangePercent: number;
  previousCloseChangePercent: number;
  week52PositionScore: number;
  priceLocationScore: number;
  warnings: string[];
  evidence: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
};

export function calculateIntradayRangePercent(
  high: number,
  low: number,
  basePrice: number,
): number {
  if (!isFiniteNumber(high) || !isFiniteNumber(low) || !isFiniteNumber(basePrice)) {
    return 0;
  }

  return safeDivide(high - low, basePrice, 0) * 100;
}

export function scorePriceLocation(params: {
  closePositionScore: number;
  week52PositionScore: number;
  previousCloseChangePercent: number;
  upperWickRatio: number;
  lowerWickRatio: number;
}): number {
  const {
    closePositionScore,
    week52PositionScore,
    previousCloseChangePercent,
    upperWickRatio,
    lowerWickRatio,
  } = params;

  let score = 50;

  if (closePositionScore >= 80) score += 18;
  else if (closePositionScore >= 60) score += 10;
  else if (closePositionScore <= 20) score -= 18;
  else if (closePositionScore <= 40) score -= 8;

  if (week52PositionScore >= 35 && week52PositionScore <= 85) score += 8;
  else if (week52PositionScore >= 90) score += 5;
  else if (week52PositionScore <= 15) score -= 10;

  if (week52PositionScore >= 90 && upperWickRatio >= 35) score -= 15;
  else if (upperWickRatio >= 35) score -= 10;

  if (lowerWickRatio >= 35 && closePositionScore >= 45) score += 7;

  if (previousCloseChangePercent <= -5) score -= 15;
  else if (previousCloseChangePercent <= -3) score -= 8;
  else if (previousCloseChangePercent >= 3 && upperWickRatio < 35) score += 6;

  return clampScore(score);
}

export function scoreOHLC(input: StockAnalysisInput): OHLCScoreResult {
  const warnings: string[] = [];
  const evidence: OHLCScoreResult["evidence"] = {
    positive: [],
    negative: [],
    neutral: [],
  };

  if (!isFiniteNumber(input.high) || !isFiniteNumber(input.low) || input.high <= input.low) {
    warnings.push("고가와 저가 범위가 유효하지 않아 일부 캔들 지표를 중립값으로 처리했습니다.");
  }

  if (!isFiniteNumber(input.previousClose) || input.previousClose === 0) {
    warnings.push("전일 종가가 유효하지 않아 전일 대비 변화율을 0으로 처리했습니다.");
  }

  if (!isFiniteNumber(input.week52High) || !isFiniteNumber(input.week52Low)) {
    warnings.push("52주 고가/저가 데이터가 부족해 52주 위치 점수를 중립값으로 처리했습니다.");
  }

  const closePositionScore = calculateClosePositionScore(input.high, input.low, input.close);
  const upperWickRatio = calculateUpperWickRatio(
    input.open,
    input.high,
    input.low,
    input.close,
  );
  const lowerWickRatio = calculateLowerWickRatio(
    input.open,
    input.high,
    input.low,
    input.close,
  );
  const intradayRangePercent = calculateIntradayRangePercent(
    input.high,
    input.low,
    input.previousClose,
  );
  const openToCloseChangePercent = percentChange(input.close, input.open);
  const previousCloseChangePercent = percentChange(input.close, input.previousClose);
  const week52PositionScore = calculate52WeekPositionScore(
    input.currentPrice,
    input.week52High,
    input.week52Low,
  );

  const priceLocationScore = scorePriceLocation({
    closePositionScore,
    week52PositionScore,
    previousCloseChangePercent,
    upperWickRatio,
    lowerWickRatio,
  });

  if (closePositionScore >= 80) {
    evidence.positive.push("종가가 당일 가격 범위 상단에서 마감해 매수세 유지력이 양호합니다.");
  } else if (closePositionScore <= 20) {
    evidence.negative.push("종가가 당일 저가권에 가까워 장 마감 기준 매도 압력이 우세할 수 있습니다.");
  } else {
    evidence.neutral.push("종가 위치는 중립 구간으로, 추가 확인 신호가 필요합니다.");
  }

  if (upperWickRatio >= 35) {
    evidence.negative.push("윗꼬리 비율이 높아 고점 매도 압력 또는 가짜 돌파 가능성을 점검해야 합니다.");
  }

  if (lowerWickRatio >= 35) {
    evidence.positive.push("아래꼬리 비율이 높아 저가 구간에서의 흡수 또는 저가 매수세 가능성이 있습니다.");
  }

  if (week52PositionScore >= 90) {
    evidence.neutral.push("52주 고점에 근접해 추세 강도와 단기 과열 위험을 함께 확인해야 합니다.");
  } else if (week52PositionScore <= 15) {
    evidence.negative.push("52주 저점에 가까워 저평가처럼 보일 수 있지만 추세 붕괴 위험을 점검해야 합니다.");
  } else {
    evidence.neutral.push("52주 가격 위치는 극단 구간이 아니어서 단독 판단보다는 다른 신호와 함께 봐야 합니다.");
  }

  if (previousCloseChangePercent >= 3) {
    evidence.positive.push("전일 대비 상승폭이 커 단기 가격 모멘텀이 확인됩니다.");
  } else if (previousCloseChangePercent <= -3) {
    evidence.negative.push("전일 대비 하락폭이 커 단기 가격 약화 가능성이 있습니다.");
  }

  if (intradayRangePercent >= 8) {
    warnings.push("장중 변동폭이 8% 이상으로 커서 변동성 리스크를 별도로 확인해야 합니다.");
  }

  return {
    closePositionScore,
    upperWickRatio,
    lowerWickRatio,
    intradayRangePercent,
    openToCloseChangePercent,
    previousCloseChangePercent,
    week52PositionScore,
    priceLocationScore,
    warnings,
    evidence,
  };
}
