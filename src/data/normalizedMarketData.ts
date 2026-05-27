import type { StockAnalysisInput } from "@/src/engine/types";
import type { StockSymbolInfo } from "./stockSymbolMap";
import type { KoreanStockMasterItem } from "./koreanStockMaster";
import type {
  DataMode,
  MarketDataQuality,
  NormalizedCandle,
  NormalizedMarketData,
  ProviderPriority,
  ProviderStatus,
  ReliabilityLevel,
  StockDataProviderName,
} from "./stockDataProvider.types";

export type { NormalizedCandle, NormalizedMarketData };

/** Samsung (005930) extreme-only guard — catches obvious unit/scale errors, not normal spot prices. */
const SAMSUNG_PRICE_SANITY_MIN = 10_000;
const SAMSUNG_PRICE_SANITY_MAX = 1_000_000;

// TODO: Replace single-source range guard with KRX/KIS/Naver cross-source validation.

function isObviousPriceScaleError(price: number): boolean {
  if (!Number.isFinite(price) || price <= 0) return true;
  if (price < SAMSUNG_PRICE_SANITY_MIN || price > SAMSUNG_PRICE_SANITY_MAX) return true;
  return false;
}

export function assessKoreanPriceScale(
  code: string,
  currentPrice: number,
): Pick<MarketDataQuality, "priceScaleSuspicious" | "reliabilityLevel" | "validationMessages"> {
  const messages: string[] = [];
  let priceScaleSuspicious = false;
  let reliabilityLevel: ReliabilityLevel = "MEDIUM";

  if (code === "005930" && isObviousPriceScaleError(currentPrice)) {
    priceScaleSuspicious = true;
    reliabilityLevel = "LIMITED";
    messages.push(
      `삼성전자(005930) 현재가 ${currentPrice.toLocaleString("ko-KR")}원은 비정상적으로 보이는 스케일일 수 있습니다. (정상 범위 참고: ${SAMSUNG_PRICE_SANITY_MIN.toLocaleString("ko-KR")}~${SAMSUNG_PRICE_SANITY_MAX.toLocaleString("ko-KR")}원)`,
    );
  }

  return { priceScaleSuspicious, reliabilityLevel, validationMessages: messages };
}

function parseCandleTime(timestamp: string): number {
  const ms = new Date(timestamp).getTime();
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : 0;
}

function candlesFromInput(input: StockAnalysisInput): NormalizedCandle[] {
  const raw = input.ohlcv?.candles ?? [];
  const candles: NormalizedCandle[] = [];
  for (const candle of raw) {
    const { open, high, low, close, volume } = candle;
    if (![open, high, low, close, volume].every((v) => Number.isFinite(v))) continue;
    candles.push({
      time: candle.timestamp,
      open,
      high,
      low,
      close,
      volume,
      vwap: Number.isFinite(candle.vwap) ? candle.vwap : undefined,
    });
  }
  return candles;
}

function detectInvalidOhlc(candles: NormalizedCandle[]): boolean {
  return candles.some(
    (c) => c.high < c.low || c.open <= 0 || c.close <= 0 || c.high < Math.max(c.open, c.close),
  );
}

export function buildNormalizedMarketData(params: {
  stock: StockSymbolInfo | KoreanStockMasterItem;
  input: StockAnalysisInput;
  provider: StockDataProviderName;
  providerPriority: ProviderPriority;
  providerStatus: ProviderStatus;
  dataMode: DataMode;
  symbol: string;
  limitationMessage?: string;
  extraValidationMessages?: string[];
}): NormalizedMarketData {
  const candles = candlesFromInput(params.input);
  const code = params.stock.code;
  const name = params.stock.name;
  const market = params.stock.market;
  const missingPreviousClose = !Number.isFinite(params.input.previousClose) || params.input.previousClose <= 0;
  const insufficientCandles = candles.length < 20;
  const invalidOhlc = detectInvalidOhlc(candles);

  const scaleCheck = assessKoreanPriceScale(code, params.input.currentPrice);

  let reliabilityLevel: ReliabilityLevel = scaleCheck.reliabilityLevel;
  if (params.provider === "kis-developers" && params.providerPriority === "PRIMARY") {
    reliabilityLevel = scaleCheck.priceScaleSuspicious ? "MEDIUM" : "HIGH";
  } else if (params.providerPriority === "FALLBACK") {
    reliabilityLevel =
      scaleCheck.priceScaleSuspicious ? "LIMITED" : reliabilityLevel === "HIGH" ? "LOW" : reliabilityLevel;
  }

  const validationMessages = [
    ...scaleCheck.validationMessages,
    ...(params.extraValidationMessages ?? []),
  ];

  if (missingPreviousClose) {
    validationMessages.push("전일 종가가 누락되었거나 추정값입니다.");
  }
  if (insufficientCandles) {
    validationMessages.push("유효 캔들 수가 분석에 충분하지 않을 수 있습니다.");
  }
  if (invalidOhlc) {
    validationMessages.push("일부 OHLC 값이 비정상입니다.");
  }

  const dataQuality: MarketDataQuality = {
    reliabilityLevel,
    priceScaleSuspicious: scaleCheck.priceScaleSuspicious,
    missingPreviousClose,
    insufficientCandles,
    invalidOhlc,
    sourceMismatch: params.providerPriority === "FALLBACK",
    validationMessages,
    limitationMessage: params.limitationMessage,
  };

  const baseDateTime = params.input.asOf;
  const baseDate = baseDateTime.slice(0, 10);

  return {
    code,
    name,
    market,
    provider: params.provider,
    providerPriority: params.providerPriority,
    providerStatus: params.providerStatus,
    symbol: params.symbol,
    currency: params.input.metadata?.currency ?? "KRW",
    exchange: market === "KOSDAQ" ? "KOSDAQ" : market === "KOSPI" ? "KRX" : market,
    currentPrice: params.input.currentPrice,
    previousClose: params.input.previousClose,
    open: params.input.open,
    high: params.input.high,
    low: params.input.low,
    close: params.input.close,
    volume: params.input.volume,
    candles,
    dataMode: params.dataMode,
    isRealtime: Boolean(params.input.metadata?.isRealtime),
    isSameDay: false,
    baseDate,
    baseTime: baseDateTime,
    timezone: "Asia/Seoul",
    dataQuality,
  };
}

export function normalizedCandleToUnixSeconds(candle: NormalizedCandle): number {
  return parseCandleTime(candle.time);
}
