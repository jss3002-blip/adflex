import type { StockAnalysisInput } from "@/src/engine/types";

export type StockDataProviderName = "yahoo-finance" | "kis-developers" | "sample";

export type StockDataMode = "EOD" | "INTRADAY" | "SAMPLE" | "FALLBACK";

export type StockDataFreshness = {
  provider: StockDataProviderName;
  mode: StockDataMode;
  isRealtime: boolean;
  isSameDayData: boolean;
  isConfirmedEOD: boolean;
  baseDate?: string;
  baseDateTime?: string;
  timezone: string;
  sourceLabel: string;
  cautionMessage: string;
};

export type StockDataProviderResult = {
  input: StockAnalysisInput;
  freshness: StockDataFreshness;
  diagnostics?: unknown;
  warning?: string;
};
