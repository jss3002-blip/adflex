import type { StockAnalysisInput } from "@/src/engine/types";
import type { StockSymbolInfo } from "./stockSymbolMap";
import { MIN_TRADING_DAYS_FOR_FULL_52W } from "./kisDataLineage";
import type { KisCandlesResult, KisQuoteResult } from "./kisProvider";

function average(values: number[]): number {
  const valid = values.filter((v) => Number.isFinite(v) && v > 0);
  if (valid.length === 0) return 0;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}

function toEngineCandles(daily: KisCandlesResult) {
  return daily.candles.map((candle) => {
    const typical = (candle.open + candle.high + candle.low + candle.close) / 4;
    return {
      timestamp: `${candle.date}T15:30:00+09:00`,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
      value: candle.close * candle.volume,
      vwap: typical,
    };
  });
}

function isSameSeoulDate(dateYmd: string): boolean {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date()) === dateYmd;
}

export function buildStockAnalysisInputFromKis(params: {
  stock: StockSymbolInfo;
  quote: KisQuoteResult;
  daily: KisCandlesResult;
}): StockAnalysisInput {
  const { stock, quote, daily } = params;
  const engineCandles = toEngineCandles(daily);
  const latestCandle = engineCandles[engineCandles.length - 1];
  const previousCandle = engineCandles[engineCandles.length - 2];

  const currentPrice =
    quote.currentPrice > 0 ? quote.currentPrice : latestCandle.close;
  const previousClose =
    quote.previousClose > 0
      ? quote.previousClose
      : previousCandle?.close ?? latestCandle.close;
  const open = quote.open > 0 ? quote.open : latestCandle.open;
  const high = quote.high > 0 ? quote.high : latestCandle.high;
  const low = quote.low > 0 ? quote.low : latestCandle.low;
  const close = currentPrice;
  const volume = quote.volume > 0 ? quote.volume : latestCandle.volume;

  const last20 = engineCandles.slice(-20).map((c) => c.volume);
  const last10 = engineCandles.slice(-10).map((c) => c.volume);
  const highs = engineCandles.map((c) => c.high);
  const lows = engineCandles.map((c) => c.low);
  const kisCandleCount = engineCandles.length;
  const week52IsLimitedHistory = kisCandleCount < MIN_TRADING_DAYS_FOR_FULL_52W;
  const periodHighLowDays = kisCandleCount;
  const firstCandleDate = engineCandles[0]?.timestamp.slice(0, 10) ?? "";
  const latestCandleDate =
    quote.baseDate || latestCandle.timestamp.slice(0, 10);

  const asOf = quote.baseTime
    ? `${quote.baseDate}T${quote.baseTime}+09:00`
    : `${quote.baseDate || latestCandle.timestamp.slice(0, 10)}T15:30:00+09:00`;

  return {
    ticker: stock.code,
    name: stock.name,
    market: stock.market,
    analysisMode: "EOD",
    asOf,
    marketRegime: "SIDEWAYS",
    stockType: stock.market === "KOSDAQ" ? "MID_CAP" : "LARGE_CAP",
    currentPrice,
    previousClose,
    open,
    high,
    low,
    close,
    volume,
    averageVolume20d: average(last20),
    averageVolume10d: average(last10),
    vwap: latestCandle.vwap,
    week52High: highs.length > 0 ? Math.max(...highs) : high,
    week52Low: lows.length > 0 ? Math.min(...lows) : low,
    ohlcv: {
      timeframe: "1d",
      source: "confirmed",
      candles: engineCandles,
    },
    metadata: {
      currency: "KRW",
      sector: "미분류",
      industry: "미분류",
      isRealtime: quote.isRealtime,
      isConfirmedEOD: !quote.isRealtime,
      dataSource: "kis-developers",
      analysisInputSource: "kis-developers",
      kisCandleCount,
      periodHighLowDays,
      week52IsLimitedHistory,
      week52HistoryLabel: week52IsLimitedHistory
        ? `KIS 일봉 ${periodHighLowDays}일 구간 고저`
        : "52주 고저",
      vwapIsDailyEstimate: true,
      vwapBasisLabel: "일봉 OHLCV 기준 추정 VWAP",
      latestCandleDate,
      firstCandleDate,
    },
  };
}

export function buildKisAsOfSameDay(quote: KisQuoteResult): boolean {
  return Boolean(quote.baseDate && isSameSeoulDate(quote.baseDate));
}
