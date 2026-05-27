import { buildChartSeriesFromMarketData } from "@/src/chart/buildChartSeries";
import {
  ensureKisAccessToken,
  getKisEnvDiagnostics,
  getKoreanStockDailyCandles,
  getKoreanStockQuote,
  type KisEnvDiagnostics,
  type KisUnavailableResult,
} from "./kisProvider";
import {
  appendKisProviderDiagnostics,
  assertKisSourceConsistency,
  buildDataLineageBundle,
} from "./kisDataLineage";
import { buildKisAsOfSameDay, buildStockAnalysisInputFromKis } from "./kisStockInputMapper";
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
  KisEnvDiagnosticsView,
  ProviderDiagnostics,
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
    diagnostics: [
      {
        provider: "yahoo-finance",
        status: "success",
        message: "Yahoo Finance EOD 조회 성공",
      },
    ],
  });
}

function toKisEnvView(env: KisEnvDiagnostics): KisEnvDiagnosticsView {
  return {
    hasAppKey: env.hasAppKey,
    hasAppSecret: env.hasAppSecret,
    baseUrlHost: env.baseUrlHost,
    baseUrlConfigured: env.baseUrlConfigured,
    useMock: env.useMock,
    accountNoConfigured: env.accountNoConfigured,
    configured: env.configured,
  };
}

function pushKisStageDiagnostic(
  diagnostics: ProviderDiagnostics,
  entry: {
    stage: string;
    status: "success" | "failed" | "skipped";
    message: string;
    symbol?: string;
    reason?: string;
    candleCount?: number;
    currentPrice?: number;
    volume?: number;
  },
): void {
  diagnostics.push({
    provider: "kis-developers",
    status: entry.status,
    stage: entry.stage,
    message: entry.message,
    symbol: entry.symbol,
    reason: entry.reason,
    candleCount: entry.candleCount,
    currentPrice: entry.currentPrice,
    volume: entry.volume,
  });
}

async function fetchKoreanStockData(
  stock: StockSymbolInfo,
  originalInput: string,
): Promise<StockDataProviderResult> {
  const providerDiagnostics: ProviderDiagnostics = [];
  const kisEnv = getKisEnvDiagnostics();
  const kisEnvView = toKisEnvView(kisEnv);
  let kisFallbackReason = "KIS_ENV_MISSING";

  pushKisStageDiagnostic(providerDiagnostics, {
    stage: "kis-env-check",
    status: kisEnv.configured ? "success" : "failed",
    message: kisEnv.configured
      ? `KIS 환경 설정 확인 (host: ${kisEnv.baseUrlHost ?? "default"}, mock: ${kisEnv.useMock})`
      : `KIS 환경 미설정 (key: ${kisEnv.hasAppKey}, secret: ${kisEnv.hasAppSecret})`,
    symbol: stock.code,
    reason: kisEnv.configured ? undefined : "KIS_ENV_MISSING",
  });

  if (kisEnv.configured) {
    const tokenResult = await ensureKisAccessToken();
    pushKisStageDiagnostic(providerDiagnostics, {
      stage: "kis-token",
      status: tokenResult.ok ? "success" : "failed",
      message: tokenResult.ok ? "KIS 토큰 발급 성공" : tokenResult.message,
      symbol: stock.code,
      reason: tokenResult.ok ? undefined : tokenResult.reason,
    });

    const [quoteResult, dailyResult] = await Promise.all([
      getKoreanStockQuote(stock.code),
      getKoreanStockDailyCandles(stock.code),
    ]);

    pushKisStageDiagnostic(providerDiagnostics, {
      stage: "kis-quote",
      status: quoteResult.ok ? "success" : "failed",
      message: quoteResult.ok
        ? `KIS 현재가 조회 성공 (${quoteResult.currentPrice.toLocaleString("ko-KR")}원)`
        : quoteResult.message,
      symbol: stock.code,
      reason: quoteResult.ok ? undefined : quoteResult.reason,
      currentPrice: quoteResult.ok ? quoteResult.currentPrice : undefined,
      volume: quoteResult.ok ? quoteResult.volume : undefined,
    });

    pushKisStageDiagnostic(providerDiagnostics, {
      stage: "kis-daily",
      status: dailyResult.ok ? "success" : "failed",
      message: dailyResult.ok
        ? `KIS 일봉 조회 성공 (${dailyResult.candles.length}봉)`
        : dailyResult.message,
      symbol: stock.code,
      reason: dailyResult.ok ? undefined : dailyResult.reason,
      candleCount: dailyResult.ok ? dailyResult.candles.length : undefined,
    });

    console.log("[StockAI KIS]", {
      envConfigured: kisEnv.configured,
      symbol: stock.code,
      tokenOk: tokenResult.ok,
      quoteOk: quoteResult.ok,
      dailyOk: dailyResult.ok,
      candleCount: dailyResult.ok ? dailyResult.candles.length : 0,
      fallbackReason:
        quoteResult.ok && dailyResult.ok
          ? null
          : buildKisFailureReason(quoteResult, dailyResult),
    });

    if (quoteResult.ok && dailyResult.ok) {
      const input = buildStockAnalysisInputFromKis({
        stock,
        quote: quoteResult,
        daily: dailyResult,
      });

      pushKisStageDiagnostic(providerDiagnostics, {
        stage: "kis-map-input",
        status: "success",
        message: "KIS 데이터로 StockAnalysisInput 생성 완료",
        symbol: stock.code,
        candleCount: dailyResult.candles.length,
      });

      pushKisStageDiagnostic(providerDiagnostics, {
        stage: "yahoo-skipped",
        status: "skipped",
        message: "KIS 성공으로 Yahoo 조회 생략",
        symbol: stock.code,
      });

      const assembled = assembleProviderResult({
        stock,
        input,
        provider: "kis-developers",
        providerPriority: "PRIMARY",
        providerStatus: "OK",
        dataMode: "KIS_REST",
        symbol: stock.code,
        warning: undefined,
        limitationMessage: undefined,
        legacyMode: "EOD",
        resolvedInput: originalInput,
        diagnostics: providerDiagnostics,
        sourceLabel: "KIS Developers",
        isSameDay: buildKisAsOfSameDay(quoteResult),
        isRealtime: quoteResult.isRealtime,
        reliabilityOverride: "HIGH",
      });

      const mergedDiagnostics = appendKisProviderDiagnostics(
        providerDiagnostics,
        input,
        assembled.marketData,
        assembled.chartSeries,
      );
      const dataLineage = buildDataLineageBundle({
        input,
        marketData: assembled.marketData,
        chartSeries: assembled.chartSeries,
      });
      const sourceConsistency = assertKisSourceConsistency({
        freshness: assembled.freshness,
        marketData: assembled.marketData,
        input,
        chartSeries: assembled.chartSeries,
        dataLineage,
      });
      const consistencyDiagnostics: ProviderDiagnostics = sourceConsistency.warnings.map(
        (warning) => ({
          provider: "kis-developers",
          status: "failed" as const,
          stage: "source-consistency",
          message: warning,
        }),
      );

      return {
        ...assembled,
        diagnostics: [...mergedDiagnostics, ...consistencyDiagnostics],
        dataLineage,
        sourceConsistency,
        kisEnv: kisEnvView,
      };
    }

    kisFallbackReason = buildKisFailureReason(quoteResult, dailyResult);
    pushKisStageDiagnostic(providerDiagnostics, {
      stage: "yahoo-fallback",
      status: "failed",
      message: `KIS 실패로 Yahoo fallback: ${kisFallbackReason}`,
      symbol: stock.code,
      reason: kisFallbackReason,
    });
  }

  try {
    const input = await fetchYahooFinanceStockInput({
      stock,
      fallbackContext: { isKorean: true, code: stock.code },
    });

    providerDiagnostics.push({
      provider: "yahoo-finance",
      status: "success",
      message: "Yahoo EOD fallback 조회 성공",
    });

    const scaleMessages: string[] = [];
    if (stock.code === "005930") {
      scaleMessages.push(
        "Yahoo Finance 원본 가격 스케일 확인이 필요합니다. KIS/KRX/Naver 교차 검증 전까지는 참고용입니다.",
      );
    }

    return {
      ...assembleProviderResult({
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
        diagnostics: providerDiagnostics,
        yahooDiagnostics: getYahooProviderDiagnostics(input),
      }),
      kisEnv: kisEnvView,
      kisFallbackReason,
    };
  } catch (yahooError) {
    providerDiagnostics.push({
      provider: "yahoo-finance",
      status: "failed",
      message: `Yahoo fallback 조회 실패: ${getSafeErrorMessage(yahooError)}`,
    });

    const sampleResult = buildSampleProviderResult("FALLBACK");
    const mergedDiagnostics: ProviderDiagnostics = [
      ...providerDiagnostics,
      {
        provider: "sample",
        status: "success",
        message: "Yahoo 실패 후 샘플 데이터로 대체",
      },
    ];

    return {
      ...sampleResult,
      diagnostics: mergedDiagnostics,
      warning: "실제 시세 데이터를 가져오지 못해 샘플 데이터로 대체했습니다.",
    };
  }
}

function buildKisFailureReason(
  quote: Awaited<ReturnType<typeof getKoreanStockQuote>>,
  daily: Awaited<ReturnType<typeof getKoreanStockDailyCandles>>,
): string {
  const reasons: string[] = [];
  if (!quote.ok) {
    reasons.push((quote as KisUnavailableResult).reason);
  }
  if (!daily.ok) {
    reasons.push((daily as KisUnavailableResult).reason);
  }
  if (reasons.length === 0) {
    return "KIS_UNKNOWN_FAILURE";
  }
  return [...new Set(reasons)].join("|");
}

function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}

function assembleProviderResult(params: {
  stock: StockSymbolInfo;
  input: Awaited<ReturnType<typeof fetchYahooFinanceStockInput>>;
  provider: StockDataProviderName;
  providerPriority: ProviderPriority;
  providerStatus: ProviderStatus;
  dataMode: DataMode;
  symbol?: string;
  warning?: string;
  limitationMessage?: string;
  extraValidationMessages?: string[];
  legacyMode: StockDataFreshness["mode"];
  resolvedInput?: string;
  diagnostics?: ProviderDiagnostics;
  yahooDiagnostics?: ReturnType<typeof getYahooProviderDiagnostics>;
  sourceLabel?: string;
  isSameDay?: boolean;
  isRealtime?: boolean;
  reliabilityOverride?: "HIGH" | "MEDIUM" | "LOW" | "LIMITED";
}): StockDataProviderResult {
  const symbol = params.symbol ?? params.stock.yahooSymbol;
  const marketData = buildNormalizedMarketData({
    stock: params.stock,
    input: params.input,
    provider: params.provider,
    providerPriority: params.providerPriority,
    providerStatus: params.providerStatus,
    dataMode: params.dataMode,
    symbol,
    limitationMessage: params.limitationMessage,
    extraValidationMessages: params.extraValidationMessages,
  });

  if (params.isSameDay !== undefined) {
    marketData.isSameDay = params.isSameDay;
  }
  if (params.isRealtime !== undefined) {
    marketData.isRealtime = params.isRealtime;
  }
  if (params.reliabilityOverride) {
    marketData.dataQuality.reliabilityLevel = params.reliabilityOverride;
  }

  const chartSeries = buildChartSeriesFromMarketData(marketData);
  const freshness = buildFreshnessFromMarket({
    input: params.input,
    marketData,
    legacyMode: params.legacyMode,
    resolvedInput: params.resolvedInput,
    sourceLabel: params.sourceLabel,
  });

  const diagnostics =
    params.diagnostics ??
    (params.yahooDiagnostics
      ? [
          {
            provider: "yahoo-finance" as const,
            status: "success" as const,
            message: params.yahooDiagnostics.note || "Yahoo Finance 조회",
          },
        ]
      : undefined);

  return {
    input: params.input,
    freshness,
    marketData,
    chartSeries,
    diagnostics,
    warning: params.warning,
  };
}

function buildFreshnessFromMarket(params: {
  input: Awaited<ReturnType<typeof fetchYahooFinanceStockInput>>;
  marketData: ReturnType<typeof buildNormalizedMarketData>;
  legacyMode: StockDataFreshness["mode"];
  resolvedInput?: string;
  sourceLabel?: string;
}): StockDataFreshness {
  const isKisPrimary = params.marketData.provider === "kis-developers";

  if (isKisPrimary) {
    const baseDate = params.marketData.baseDate;
    const baseDateTime = params.marketData.baseTime
      ? `${baseDate}T${params.marketData.baseTime}`
      : params.input.asOf;

    return {
      provider: "kis-developers",
      providerPriority: params.marketData.providerPriority,
      providerStatus: params.marketData.providerStatus,
      mode: params.legacyMode,
      dataMode: params.marketData.dataMode,
      isRealtime: params.marketData.isRealtime,
      isSameDayData: params.marketData.isSameDay,
      isConfirmedEOD: !params.marketData.isRealtime,
      baseDate,
      baseDateTime,
      timezone: params.marketData.timezone || "Asia/Seoul",
      sourceLabel: params.sourceLabel ?? "KIS Developers",
      cautionMessage:
        "KIS Developers 기준 일봉 차트 데이터입니다. REST 시세/일봉 응답 기준이며, 장중 실시간 체결과 차이가 있을 수 있습니다.",
      reliabilityLevel: params.marketData.dataQuality.reliabilityLevel,
      resolvedStockCode: params.marketData.code,
      resolvedStockName: params.marketData.name,
    };
  }

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
    isConfirmedEOD: yahooFreshness.isConfirmedEOD,
    baseDate: params.marketData.baseDate,
    baseDateTime: params.marketData.baseTime,
    timezone: params.marketData.timezone,
    sourceLabel:
      params.sourceLabel ??
      (params.marketData.providerPriority === "FALLBACK"
        ? "Yahoo Finance (Fallback)"
        : yahooFreshness.sourceLabel),
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
    diagnostics: [
      {
        provider: "sample",
        status: "success",
        message:
          mode === "FALLBACK"
            ? "샘플 fallback 데이터 사용"
            : "샘플 데이터 사용",
      },
    ],
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
        ? "실제 시세 데이터를 가져오지 못해 샘플 데이터로 대체했습니다."
        : "샘플 데이터 기준 분석 결과입니다.",
    reliabilityLevel: "LOW",
    resolvedStockCode: sampleStockInput.ticker,
    resolvedStockName: sampleStockInput.name,
  };
}
