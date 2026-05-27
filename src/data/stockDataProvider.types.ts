import type { StockAnalysisInput } from "@/src/engine/types";
import type { ChartSeriesBundle } from "@/src/chart/buildChartSeries";

export type StockDataProviderName = "yahoo-finance" | "kis" | "kis-developers" | "sample";

export type ProviderPriority = "PRIMARY" | "SECONDARY" | "FALLBACK";

export type ProviderStatus =
  | "OK"
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "FALLBACK_USED"
  | "ERROR";

export type DataMode =
  | "REALTIME"
  | "DELAYED"
  | "EOD"
  | "EOD_FALLBACK"
  | "FALLBACK"
  | "SAMPLE"
  | "KIS_REST";

export type ProviderDiagnosticEntry = {
  provider: StockDataProviderName | "yahoo-finance" | "kis-developers";
  status: "success" | "failed" | "skipped";
  stage?: string;
  message: string;
  symbol?: string;
  reason?: string;
  candleCount?: number;
  latestCandleDate?: string;
  latestClose?: number;
  currentPrice?: number;
  volume?: number;
};

export type KisEnvDiagnosticsView = {
  hasAppKey: boolean;
  hasAppSecret: boolean;
  baseUrlHost: string | null;
  baseUrlConfigured: boolean;
  useMock: boolean;
  accountNoConfigured: boolean;
  configured: boolean;
};

export type DataLineageBundle = {
  analysisInputSource: "KIS" | "YAHOO" | "SAMPLE";
  chartSeriesSource: "KIS" | "YAHOO" | "SAMPLE";
  marketDataSource: "KIS" | "YAHOO" | "SAMPLE";
  aiSummaryInputSource: "KIS" | "YAHOO" | "SAMPLE";
  vwapBasis: string;
  periodHighLowDays: number;
  week52IsLimitedHistory: boolean;
  week52HistoryLabel: string;
  candleCount: number;
  latestCandleDate: string;
  provider: StockDataProviderName;
  dataMode: DataMode;
};

export type ProviderDiagnostics = ProviderDiagnosticEntry[];

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
  diagnostics?: ProviderDiagnostics | unknown;
  dataLineage?: DataLineageBundle;
  sourceConsistency?: { ok: boolean; warnings: string[] };
  kisEnv?: KisEnvDiagnosticsView;
  kisFallbackReason?: string;
  warning?: string;
};
