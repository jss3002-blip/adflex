import { sampleStockInput } from "./sampleStockInput";
import { resolveStockSymbol } from "./stockSymbolMap";
import {
  buildYahooFreshness,
  fetchYahooFinanceStockInput,
  getYahooProviderDiagnostics,
} from "./yahooFinanceProvider";
import type {
  StockDataFreshness,
  StockDataProviderName,
  StockDataProviderResult,
} from "./stockDataProvider.types";

export async function getStockDataForAnalysis(params: {
  stockName: string;
  provider?: StockDataProviderName;
}): Promise<StockDataProviderResult> {
  const provider = params.provider || "yahoo-finance";

  if (provider === "sample") {
    return {
      input: sampleStockInput,
      freshness: buildSampleFreshness("SAMPLE"),
    };
  }

  if (provider === "kis-developers") {
    // KIS Developers will be added later for same-day data with mode "INTRADAY".
    throw new Error("KIS_PROVIDER_NOT_CONFIGURED");
  }

  const stock = resolveStockSymbol(params.stockName);
  if (!stock) {
    throw new Error("UNSUPPORTED_STOCK_SYMBOL");
  }

  // Yahoo remains the development EOD fallback until a same-day KIS provider is connected.
  const input = await fetchYahooFinanceStockInput({ stock });

  return {
    input,
    freshness: buildYahooFreshness(input),
    diagnostics: getYahooProviderDiagnostics(input),
  };
}

export function buildSampleFreshness(mode: "SAMPLE" | "FALLBACK"): StockDataFreshness {
  return {
    provider: "sample",
    mode,
    isRealtime: false,
    isSameDayData: false,
    isConfirmedEOD: true,
    baseDate: sampleStockInput.asOf.slice(0, 10),
    baseDateTime: sampleStockInput.asOf,
    timezone: "Asia/Seoul",
    sourceLabel: "샘플 데이터",
    cautionMessage:
      mode === "FALLBACK"
        ? "실제 데이터를 가져오지 못해 샘플 데이터로 대체했습니다."
        : "샘플 데이터 기준 분석 결과입니다.",
  };
}
