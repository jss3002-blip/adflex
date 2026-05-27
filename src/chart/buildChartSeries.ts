import {
  normalizedCandleToUnixSeconds,
  type NormalizedCandle,
} from "@/src/data/normalizedMarketData";
import type { NormalizedMarketData } from "@/src/data/stockDataProvider.types";

export type ChartCandlestickPoint = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type ChartVolumePoint = {
  time: number;
  value: number;
  color?: string;
};

export type ChartLinePoint = {
  time: number;
  value: number;
};

export type ChartPriceMarker = {
  label: string;
  price: number;
};

export type ChartSeriesBundle = {
  candlestickData: ChartCandlestickPoint[];
  volumeData: ChartVolumePoint[];
  vwapLineData: ChartLinePoint[];
  previousCloseLineData: ChartLinePoint[];
  keyPriceMarkers: ChartPriceMarker[];
};

function toCandlestick(candles: NormalizedCandle[]): ChartCandlestickPoint[] {
  return candles
    .map((candle) => {
      const time = normalizedCandleToUnixSeconds(candle);
      if (!time) return null;
      return {
        time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      };
    })
    .filter((point): point is ChartCandlestickPoint => point !== null)
    .sort((a, b) => a.time - b.time);
}

function toVolume(candles: NormalizedCandle[]): ChartVolumePoint[] {
  const points: ChartVolumePoint[] = [];
  for (const candle of candles) {
    const time = normalizedCandleToUnixSeconds(candle);
    if (!time) continue;
    const isUp = candle.close >= candle.open;
    points.push({
      time,
      value: candle.volume,
      color: isUp ? "rgba(52, 211, 153, 0.45)" : "rgba(244, 63, 94, 0.45)",
    });
  }
  return points.sort((a, b) => a.time - b.time);
}

function toVwapLine(candles: NormalizedCandle[]): ChartLinePoint[] {
  return candles
    .map((candle) => {
      if (!Number.isFinite(candle.vwap)) return null;
      const time = normalizedCandleToUnixSeconds(candle);
      if (!time) return null;
      return { time, value: candle.vwap as number };
    })
    .filter((point): point is ChartLinePoint => point !== null)
    .sort((a, b) => a.time - b.time);
}

function toPreviousCloseLine(
  candles: NormalizedCandle[],
  previousClose: number,
): ChartLinePoint[] {
  if (!Number.isFinite(previousClose) || previousClose <= 0 || candles.length === 0) {
    return [];
  }
  const times = candles
    .map((c) => normalizedCandleToUnixSeconds(c))
    .filter((t) => t > 0)
    .sort((a, b) => a - b);
  if (times.length === 0) return [];
  return [
    { time: times[0], value: previousClose },
    { time: times[times.length - 1], value: previousClose },
  ];
}

function buildKeyPriceMarkers(marketData: NormalizedMarketData): ChartPriceMarker[] {
  const markers: ChartPriceMarker[] = [];
  if (Number.isFinite(marketData.currentPrice)) {
    markers.push({ label: "현재가", price: marketData.currentPrice });
  }
  if (Number.isFinite(marketData.previousClose)) {
    markers.push({ label: "전일 종가", price: marketData.previousClose });
  }
  return markers;
}

export function buildChartSeriesFromMarketData(marketData: NormalizedMarketData): ChartSeriesBundle {
  const candles = marketData.candles ?? [];

  if (candles.length === 0) {
    return {
      candlestickData: [],
      volumeData: [],
      vwapLineData: [],
      previousCloseLineData: [],
      keyPriceMarkers: buildKeyPriceMarkers(marketData),
    };
  }

  return {
    candlestickData: toCandlestick(candles),
    volumeData: toVolume(candles),
    vwapLineData: toVwapLine(candles),
    previousCloseLineData: toPreviousCloseLine(candles, marketData.previousClose),
    keyPriceMarkers: buildKeyPriceMarkers(marketData),
  };
}
