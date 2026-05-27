import { buildChartSeriesFromMarketData } from "@/src/chart/buildChartSeries";
import { getKoreanStockDailyCandles, isKisConfigured } from "./kisProvider";
import { buildNormalizedMarketData } from "./normalizedMarketData";
import { sampleStockInput } from "./sampleStockInput";
import {
  isKoreanStockInput,
  koreanMasterToSymbolInfo,
  resolveKoreanStock,
} from "./stockSearch";
import { resolveStockSymbol, type StockSymbolInfo } from "./stockSymbolMap";
import {
  buildYahooFreshness,
  fetchYahooFinanceStockInput,
  getYahooProviderDiagnostics,
} from "./yahooFinanceProvider";
import type {
  DataMode,
  ProviderPriority,
  ProviderStatus,
  StockDataFreshness,
  StockDataProviderName,
  StockDataProviderResult,
} from "./stockDataProvider.types";

const KOREAN_YAHOO_FALLBACK_MESSAGE =
  "국내 주식 정식 데이터가 연결되지 않아 Yahoo fallback 데이터로 표시 중입니다. 정식 분석용 데이터는 KIS/KRX 연동 후 제공됩니다.";

export async function getStockDataForAnalysis(params: {
  stockName: string;
  provider?: StockDataProviderName;
}): Promise<StockDataProviderResult> {
  const requestedProvider = params.provider;

  if (requestedProvider === "sample") {
    return buildSampleProviderResult("SAMPLE");
  }

  const koreanResolved = resolveKoreanStock(params.stockName);
  const legacyResolved = koreanResolved ? null : resolveStockSymbol(params.stockName);
  const stockInfo: StockSymbolInfo | null = koreanResolved
    ? koreanMasterToSymbolInfo(koreanResolved)
    : legacyResolved;

  if (!stockInfo) {
    throw new Error("UNSUPPORTED_STOCK_SYMBOL");
  }

  const isKorean =
    isKoreanStockInput(params.stockName) ||
    stockInfo.market === "KOSPI" ||
    stockInfo.market === "KOSDAQ";

  if (isKorean) {
    return fetchKoreanStockData(stockInfo, params.stockName);
  }

  const input = await fetchYahooFinanceStockInput({ stock: stockInfo });
  return assembleProviderResult({
    stock: stockInfo,
    input,
    provider: "yahoo-finance",
    providerPriority: "FALLBACK",
    providerStatus: "AVAILABLE",
    dataMode: "EOD",
    warning: undefined,
    limitationMessage: undefined,
    legacyMode: "EOD",
  });
}

async function fetchKoreanStockData(
  stock: StockSymbolInfo,
  originalInput: string,
): Promise<StockDataProviderResult> {
  if (isKisConfigured()) {
    const kisDaily = await getKoreanStockDailyCandles(stock.code);
    if (kisDaily.ok) {
      // Future: map KIS candles → StockAnalysisInput without inventing prices.
      // Phase 1: KIS returns NOT_IMPLEMENTED; continue to Yahoo fallback.
    }
  }

  const input = await fetchYahooFinanceStockInput({
    stock,
    fallbackContext: { isKorean: true, code: stock.code },
  });

  const scaleMessages: string[] = [];
  if (stock.code === "005930") {
    scaleMessages.push(
      "Yahoo Finance 원본 가격 스케일 확인이 필요합니다. KIS/KRX/Naver 교차 검증 전까지는 참고용입니다.",
    );
  }

  return assembleProviderResult({
    stock,
    input,
    provider: "yahoo-finance",
    providerPriority: "FALLBACK",
    providerStatus: "FALLBACK_USED",
    dataMode: "EOD_FALLBACK",
    warning: KOREAN_YAHOO_FALLBACK_MESSAGE,
    limitationMessage: KOREAN_YAHOO_FALLBACK_MESSAGE,
    extraValidationMessages: scaleMessages,
    legacyMode: "FALLBACK",
    resolvedInput: originalInput,
  });
}

function assembleProviderResult(params: {
  stock: StockSymbolInfo;
  input: Awaited<ReturnType<typeof fetchYahooFinanceStockInput>>;
  provider: StockDataProviderName;
  providerPriority: ProviderPriority;
  providerStatus: ProviderStatus;
  dataMode: DataMode;
  warning?: string;
  limitationMessage?: string;
  extraValidationMessages?: string[];
  legacyMode: StockDataFreshness["mode"];
  resolvedInput?: string;
}): StockDataProviderResult {
  const marketData = buildNormalizedMarketData({
    stock: params.stock,
    input: params.input,
    provider: params.provider,
    providerPriority: params.providerPriority,
    providerStatus: params.providerStatus,
    dataMode: params.dataMode,
    symbol: params.stock.yahooSymbol,
    limitationMessage: params.limitationMessage,
    extraValidationMessages: params.extraValidationMessages,
  });

  const chartSeries = buildChartSeriesFromMarketData(marketData);
  const freshness = buildFreshnessFromMarket({
    input: params.input,
    marketData,
    legacyMode: params.legacyMode,
    resolvedInput: params.resolvedInput,
  });

  return {
    input: params.input,
    freshness,
    marketData,
    chartSeries,
    diagnostics: getYahooProviderDiagnostics(params.input),
    warning: params.warning,
  };
}

function buildFreshnessFromMarket(params: {
  input: Awaited<ReturnType<typeof fetchYahooFinanceStockInput>>;
  marketData: ReturnType<typeof buildNormalizedMarketData>;
  legacyMode: StockDataFreshness["mode"];
  resolvedInput?: string;
}): StockDataFreshness {
  const yahooFreshness = buildYahooFreshness(params.input);

  return {
    ...yahooFreshness,
    provider: params.marketData.provider,
    providerPriority: params.marketData.providerPriority,
    providerStatus: params.marketData.providerStatus,
    mode: params.legacyMode,
    dataMode: params.marketData.dataMode,
    isRealtime: params.marketData.isRealtime,
    isSameDayData: params.marketData.isSameDay,
    baseDate: params.marketData.baseDate,
    baseDateTime: params.marketData.baseTime,
    timezone: params.marketData.timezone,
    sourceLabel:
      params.marketData.providerPriority === "FALLBACK"
        ? "Yahoo Finance (Fallback)"
        : yahooFreshness.sourceLabel,
    cautionMessage:
      params.marketData.dataQuality.limitationMessage ?? yahooFreshness.cautionMessage,
    reliabilityLevel: params.marketData.dataQuality.reliabilityLevel,
    resolvedStockCode: params.marketData.code,
    resolvedStockName: params.marketData.name,
  };
}

function buildSampleProviderResult(mode: "SAMPLE" | "FALLBACK"): StockDataProviderResult {
  const freshness = buildSampleFreshness(mode);
  const marketData = buildNormalizedMarketData({
    stock: {
      name: sampleStockInput.name,
      code: sampleStockInput.ticker,
      market: "KOSPI",
      yahooSymbol: `${sampleStockInput.ticker}.KS`,
      aliases: [],
    },
    input: sampleStockInput,
    provider: "sample",
    providerPriority: "FALLBACK",
    providerStatus: mode === "FALLBACK" ? "FALLBACK_USED" : "AVAILABLE",
    dataMode: "SAMPLE",
    symbol: `${sampleStockInput.ticker}.KS`,
    limitationMessage:
      mode === "FALLBACK"
        ? "실제 시세 데이터를 가져오지 못해 샘플 데이터로 대체했습니다."
        : "샘플 데이터 기준 분석 결과입니다.",
  });

  return {
    input: sampleStockInput,
    freshness,
    marketData,
    chartSeries: buildChartSeriesFromMarketData(marketData),
  };
}

export function buildSampleFreshness(mode: "SAMPLE" | "FALLBACK"): StockDataFreshness {
  return {
    provider: "sample",
    providerPriority: "FALLBACK",
    providerStatus: mode === "FALLBACK" ? "FALLBACK_USED" : "AVAILABLE",
    mode,
    dataMode: "SAMPLE",
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
    reliabilityLevel: "LOW",
    resolvedStockCode: sampleStockInput.ticker,
    resolvedStockName: sampleStockInput.name,
  };
}
