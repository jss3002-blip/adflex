import type { StockAnalysisInput } from "@/src/engine/types";
import type { StockSymbolInfo } from "./stockSymbolMap";

type YahooQuote = {
  open?: Array<number | null>;
  high?: Array<number | null>;
  low?: Array<number | null>;
  close?: Array<number | null>;
  volume?: Array<number | null>;
};

type YahooChartResult = {
  meta?: {
    regularMarketPrice?: number;
    previousClose?: number;
    currency?: string;
    exchangeName?: string;
    instrumentType?: string;
  };
  timestamp?: number[];
  indicators?: {
    quote?: YahooQuote[];
  };
};

export type YahooFinanceChartResponse = {
  chart?: {
    result?: YahooChartResult[];
    error?: {
      code?: string;
      description?: string;
    } | null;
  };
};

type ValidYahooCandle = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  value: number;
  vwap: number;
};

export type YahooProviderDiagnostics = {
  yahooSymbol: string;
  rawCurrency?: string;
  rawExchangeName?: string;
  rawInstrumentType?: string;
  rawRegularMarketPrice?: number;
  rawPreviousClose?: number;
  latestRawOpen?: number;
  latestRawHigh?: number;
  latestRawLow?: number;
  latestRawClose?: number;
  latestRawVolume?: number;
  validCandleCount: number;
  firstCandleDate?: string;
  latestCandleDate?: string;
  note: string;
};

export async function fetchYahooFinanceStockInput(params: {
  stock: StockSymbolInfo;
  range?: string;
  interval?: string;
}): Promise<StockAnalysisInput> {
  const range = params.range || "3mo";
  const interval = params.interval || "1d";
  const symbol = encodeURIComponent(params.stock.yahooSymbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance request failed with status ${response.status}.`);
  }

  const data = (await response.json()) as YahooFinanceChartResponse;
  const result = data.chart?.result?.[0];

  if (!result) {
    throw new Error("Yahoo Finance chart result is empty.");
  }

  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0];

  if (!quote) {
    throw new Error("Yahoo Finance quote data is empty.");
  }

  const candles = buildValidCandles(timestamps, quote);

  if (candles.length < 2) {
    throw new Error("Yahoo Finance returned insufficient valid candles.");
  }

  const latest = candles[candles.length - 1];
  const previous = candles[candles.length - 2];
  const averageVolume20d = average(candles.slice(-20).map((candle) => candle.volume));
  const averageVolume10d = average(candles.slice(-10).map((candle) => candle.volume));
  const week52High = Math.max(...candles.map((candle) => candle.high));
  const week52Low = Math.min(...candles.map((candle) => candle.low));
  const previousClose = finiteOr(result.meta?.previousClose, previous.close);
  const currentPrice = finiteOr(result.meta?.regularMarketPrice, latest.close);
  const diagnostics = buildProviderDiagnostics({
    stock: params.stock,
    result,
    latest,
    candles,
    previousCloseInferred: !isFiniteNumber(result.meta?.previousClose),
  });
  const metadata = {
    currency: result.meta?.currency || "KRW",
    sector: "미분류",
    industry: "미분류",
    isRealtime: false,
    isConfirmedEOD: true,
    dataSource: "yahoo-finance",
    providerDiagnostics: diagnostics,
  } as StockAnalysisInput["metadata"] & {
    providerDiagnostics: YahooProviderDiagnostics;
  };

  return {
    ticker: params.stock.code,
    name: params.stock.name,
    market: params.stock.market,
    analysisMode: "EOD",
    asOf: latest.timestamp,
    marketRegime: "SIDEWAYS",
    stockType: params.stock.market === "KOSDAQ" ? "MID_CAP" : "LARGE_CAP",
    currentPrice,
    previousClose,
    open: latest.open,
    high: latest.high,
    low: latest.low,
    close: latest.close,
    volume: latest.volume,
    averageVolume20d,
    averageVolume10d,
    vwap: latest.vwap,
    week52High,
    week52Low,
    ohlcv: {
      timeframe: "1d",
      source: "confirmed",
      candles,
    },
    metadata,
  };
}

function buildValidCandles(timestamps: number[], quote: YahooQuote): ValidYahooCandle[] {
  const candles: ValidYahooCandle[] = [];

  for (let index = 0; index < timestamps.length; index += 1) {
    const open = quote.open?.[index];
    const high = quote.high?.[index];
    const low = quote.low?.[index];
    const close = quote.close?.[index];
    const volume = quote.volume?.[index];
    const timestamp = timestamps[index];

    if (
      !isFiniteNumber(timestamp) ||
      !isFiniteNumber(open) ||
      !isFiniteNumber(high) ||
      !isFiniteNumber(low) ||
      !isFiniteNumber(close) ||
      !isFiniteNumber(volume) ||
      high < low
    ) {
      continue;
    }

    const typicalPrice = (high + low + close) / 3;

    candles.push({
      timestamp: new Date(timestamp * 1000).toISOString(),
      open,
      high,
      low,
      close,
      volume,
      value: close * volume,
      vwap: isFiniteNumber(typicalPrice) ? typicalPrice : close,
    });
  }

  return candles;
}

function buildProviderDiagnostics(params: {
  stock: StockSymbolInfo;
  result: YahooChartResult;
  latest: ValidYahooCandle;
  candles: ValidYahooCandle[];
  previousCloseInferred: boolean;
}): YahooProviderDiagnostics {
  const notes: string[] = [];
  const first = params.candles[0];
  const latest = params.latest;

  if (params.candles.length < 20) {
    notes.push("Yahoo Finance 유효 캔들 수가 20개 미만입니다.");
  }

  if (params.previousCloseInferred) {
    notes.push("전일 종가는 이전 유효 캔들 종가로 추정했습니다.");
  }

  if (isStaleDailyCandle(latest.timestamp)) {
    notes.push("최신 일봉 기준일이 현재 날짜와 차이가 있어 데이터 지연 가능성을 확인해야 합니다.");
  }

  if (params.stock.market === "KOSPI" || params.stock.market === "KOSDAQ") {
    notes.push("Yahoo Finance 원본 가격 스케일 확인이 필요합니다.");
  }

  if (notes.length === 0) {
    notes.push("Yahoo Finance 원본 일봉 데이터를 변환했습니다.");
  }

  return {
    yahooSymbol: params.stock.yahooSymbol,
    rawCurrency: params.result.meta?.currency,
    rawExchangeName: params.result.meta?.exchangeName,
    rawInstrumentType: params.result.meta?.instrumentType,
    rawRegularMarketPrice: params.result.meta?.regularMarketPrice,
    rawPreviousClose: params.result.meta?.previousClose,
    latestRawOpen: latest.open,
    latestRawHigh: latest.high,
    latestRawLow: latest.low,
    latestRawClose: latest.close,
    latestRawVolume: latest.volume,
    validCandleCount: params.candles.length,
    firstCandleDate: first?.timestamp,
    latestCandleDate: latest.timestamp,
    note: notes.join(" "),
  };
}

function isStaleDailyCandle(value: string): boolean {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return false;

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - timestamp > sevenDaysMs;
}

function average(values: number[]): number {
  const validValues = values.filter(isFiniteNumber);
  if (validValues.length === 0) return 0;

  return validValues.reduce((total, value) => total + value, 0) / validValues.length;
}

function finiteOr(value: unknown, fallback: number): number {
  if (isFiniteNumber(value)) return value;
  return fallback;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
