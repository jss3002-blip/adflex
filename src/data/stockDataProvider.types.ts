import type { StockAnalysisInput } from "@/src/engine/types";
import type { ChartSeriesBundle } from "@/src/chart/buildChartSeries";

export type StockDataProviderName = "yahoo-finance" | "kis" | "kis-developers" | "sample";

export type ProviderPriority = "PRIMARY" | "SECONDARY" | "FALLBACK";

export type ProviderStatus = "AVAILABLE" | "UNAVAILABLE" | "FALLBACK_USED" | "ERROR";

export type DataMode =
  | "REALTIME"
  | "DELAYED"
  | "EOD"
  | "EOD_FALLBACK"
  | "FALLBACK"
  | "SAMPLE";

export type ReliabilityLevel = "HIGH" | "MEDIUM" | "LOW" | "LIMITED";

/** @deprecated Use DataMode — kept for UI backward compatibility */
export type StockDataMode = "EOD" | "INTRADAY" | "SAMPLE" | "FALLBACK";

export type MarketDataQuality = {
  reliabilityLevel: ReliabilityLevel;
  priceScaleSuspicious: boolean;
  missingPreviousClose: boolean;
  insufficientCandles: boolean;
  invalidOhlc: boolean;
  sourceMismatch: boolean;
  validationMessages: string[];
  limitationMessage?: string;
};

export type NormalizedCandle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
};

export type NormalizedMarketData = {
  code: string;
  name: string;
  market: string;
  provider: StockDataProviderName;
  providerPriority: ProviderPriority;
  providerStatus: ProviderStatus;
  symbol: string;
  currency: string;
  exchange: string;
  currentPrice: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  candles: NormalizedCandle[];
  dataMode: DataMode;
  isRealtime: boolean;
  isSameDay: boolean;
  baseDate: string;
  baseTime?: string;
  timezone: string;
  dataQuality: MarketDataQuality;
};

export type StockDataFreshness = {
  provider: StockDataProviderName;
  providerPriority: ProviderPriority;
  providerStatus: ProviderStatus;
  mode: StockDataMode;
  dataMode: DataMode;
  isRealtime: boolean;
  isSameDayData: boolean;
  isConfirmedEOD: boolean;
  baseDate?: string;
  baseDateTime?: string;
  timezone: string;
  sourceLabel: string;
  cautionMessage: string;
  reliabilityLevel?: ReliabilityLevel;
  resolvedStockCode?: string;
  resolvedStockName?: string;
};

export type StockDataProviderResult = {
  input: StockAnalysisInput;
  freshness: StockDataFreshness;
  marketData: NormalizedMarketData;
  chartSeries: ChartSeriesBundle;
  diagnostics?: unknown;
  warning?: string;
};
