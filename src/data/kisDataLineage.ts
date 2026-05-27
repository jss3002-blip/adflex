import type { ChartSeriesBundle } from "@/src/chart/buildChartSeries";
import type { StockAnalysisInput } from "@/src/engine/types";
import type {
  DataLineageBundle,
  NormalizedMarketData,
  ProviderDiagnostics,
  StockDataFreshness,
} from "./stockDataProvider.types";

/** Approximate trading days in one calendar year (not calendar 52 weeks). */
export const MIN_TRADING_DAYS_FOR_FULL_52W = 252;

export type KisAnalysisInputDiagnostics = {
  provider: "kis-developers";
  status: "success";
  stage: "analysis-input";
  message: string;
  symbol: string;
  candleCount: number;
  latestCandleDate: string;
  latestClose: number;
  currentPrice: number;
  volume: number;
};

export type SourceConsistencyReport = {
  ok: boolean;
  warnings: string[];
};

function latestCandleFromInput(input: StockAnalysisInput) {
  const candles = input.ohlcv?.candles ?? [];
  return candles[candles.length - 1];
}

export function buildKisAnalysisInputDiagnostics(
  input: StockAnalysisInput,
): KisAnalysisInputDiagnostics | null {
  if (input.metadata?.dataSource !== "kis-developers") return null;

  const latest = latestCandleFromInput(input);
  const latestCandleDate =
    input.metadata?.latestCandleDate ??
    (latest?.timestamp ? latest.timestamp.slice(0, 10) : input.asOf.slice(0, 10));

  return {
    provider: "kis-developers",
    status: "success",
    stage: "analysis-input",
    message: "KIS 데이터로 StockAnalysisInput 생성 완료",
    symbol: input.ticker,
    candleCount: input.metadata?.kisCandleCount ?? input.ohlcv?.candles?.length ?? 0,
    latestCandleDate,
    latestClose: latest?.close ?? input.close,
    currentPrice: input.currentPrice,
    volume: input.volume,
  };
}

export function buildDataLineageBundle(params: {
  input: StockAnalysisInput;
  marketData: NormalizedMarketData;
  chartSeries: ChartSeriesBundle;
}): DataLineageBundle {
  const candleCount = params.marketData.candles.length;
  const week52IsLimitedHistory = Boolean(params.input.metadata?.week52IsLimitedHistory);
  const periodDays =
    params.input.metadata?.periodHighLowDays ?? params.input.metadata?.kisCandleCount ?? candleCount;

  return {
    analysisInputSource: "KIS",
    chartSeriesSource: "KIS",
    marketDataSource: "KIS",
    aiSummaryInputSource: "KIS",
    vwapBasis: params.input.metadata?.vwapBasisLabel ?? "일봉 OHLCV 기준 추정 VWAP",
    periodHighLowDays: periodDays,
    week52IsLimitedHistory,
    week52HistoryLabel: week52IsLimitedHistory
      ? `KIS 일봉 ${periodDays}일 구간 고저 기준`
      : "52주 고저 기준",
    candleCount,
    latestCandleDate: params.marketData.baseDate,
    provider: "kis-developers",
    dataMode: params.marketData.dataMode,
  };
}

export function appendKisProviderDiagnostics(
  existing: ProviderDiagnostics,
  input: StockAnalysisInput,
  marketData: NormalizedMarketData,
  chartSeries: ChartSeriesBundle,
): ProviderDiagnostics {
  const analysisDiag = buildKisAnalysisInputDiagnostics(input);
  const next: ProviderDiagnostics = [...existing];

  if (analysisDiag) {
    next.push({
      provider: "kis-developers",
      status: "success",
      stage: analysisDiag.stage,
      message: analysisDiag.message,
      symbol: analysisDiag.symbol,
      candleCount: analysisDiag.candleCount,
      latestCandleDate: analysisDiag.latestCandleDate,
      latestClose: analysisDiag.latestClose,
      currentPrice: analysisDiag.currentPrice,
      volume: analysisDiag.volume,
    });
  }

  next.push({
    provider: "kis-developers",
    status: "success",
    stage: "chart-series",
    message: `KIS 일봉 캔들로 chartSeries 생성 (${chartSeries.candlestickData.length}봉)`,
    symbol: marketData.code,
    candleCount: chartSeries.candlestickData.length,
  });

  next.push({
    provider: "kis-developers",
    status: "success",
    stage: "market-data",
    message: "KIS 기반 NormalizedMarketData 생성",
    symbol: marketData.code,
    currentPrice: marketData.currentPrice,
    volume: marketData.volume,
  });

  return next;
}

export function assertKisSourceConsistency(params: {
  freshness: StockDataFreshness;
  marketData: NormalizedMarketData;
  input: StockAnalysisInput;
  chartSeries: ChartSeriesBundle;
  dataLineage?: DataLineageBundle;
}): SourceConsistencyReport {
  const warnings: string[] = [];
  const isKisRest =
    params.freshness.provider === "kis-developers" && params.freshness.dataMode === "KIS_REST";

  if (!isKisRest) {
    return { ok: true, warnings };
  }

  if (params.marketData.provider !== "kis-developers") {
    warnings.push("provider 불일치: freshness는 KIS이나 marketData.provider가 다릅니다.");
  }

  if (params.freshness.sourceLabel !== "KIS Developers") {
    warnings.push("sourceLabel이 KIS Developers가 아닙니다.");
  }

  if (params.input.metadata?.dataSource !== "kis-developers") {
    warnings.push("분석 입력 metadata.dataSource가 kis-developers가 아닙니다.");
  }

  if (params.chartSeries.candlestickData.length === 0) {
    warnings.push("chartSeries 캔들이 비어 있습니다.");
  }

  if (params.marketData.candles.length === 0) {
    warnings.push("marketData.candles가 비어 있습니다.");
  }

  const chartLen = params.chartSeries.candlestickData.length;
  const marketLen = params.marketData.candles.length;
  if (chartLen > 0 && marketLen > 0 && chartLen !== marketLen) {
    warnings.push(`chartSeries(${chartLen})와 marketData.candles(${marketLen}) 길이가 다릅니다.`);
  }

  if (params.dataLineage) {
    if (params.dataLineage.chartSeriesSource !== "KIS") {
      warnings.push("dataLineage.chartSeriesSource가 KIS가 아닙니다.");
    }
    if (params.dataLineage.analysisInputSource !== "KIS") {
      warnings.push("dataLineage.analysisInputSource가 KIS가 아닙니다.");
    }
  }

  return { ok: warnings.length === 0, warnings };
}
