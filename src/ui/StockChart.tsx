"use client";

import { useEffect, useRef } from "react";
import type { ChartSeriesBundle } from "@/src/chart/buildChartSeries";
import type { DataMode, ProviderPriority, ReliabilityLevel } from "@/src/data/stockDataProvider.types";

type StockChartProps = {
  series: ChartSeriesBundle;
  providerPriority?: ProviderPriority;
  providerName?: string;
  dataMode?: DataMode;
  reliabilityLevel?: ReliabilityLevel;
  priceScaleSuspicious?: boolean;
  chartNotice?: string;
  fallbackMessage?: string;
  vwapLineTitle?: string;
  height?: number;
};

export function StockChart({
  series,
  providerPriority,
  providerName,
  dataMode,
  reliabilityLevel,
  priceScaleSuspicious,
  chartNotice,
  fallbackMessage,
  vwapLineTitle,
  height = 320,
}: StockChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isKisChart = providerName === "kis-developers" || dataMode === "KIS_REST";
  const resolvedVwapTitle =
    vwapLineTitle ?? (isKisChart ? "일봉 VWAP(추정)" : "VWAP");

  const showFallbackWarning =
    !isKisChart &&
    (providerPriority === "FALLBACK" ||
      reliabilityLevel === "LOW" ||
      (reliabilityLevel === "LIMITED" && priceScaleSuspicious));

  const isEmpty = series.candlestickData.length === 0;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isEmpty) return;

    let disposed = false;
    let resizeObserver: ResizeObserver | undefined;

    async function mountChart() {
      const {
        createChart,
        ColorType,
        CrosshairMode,
        CandlestickSeries,
        HistogramSeries,
        LineSeries,
      } = await import("lightweight-charts");

      if (disposed || !containerRef.current) return;

      const chart = createChart(containerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "rgba(255,255,255,0.65)",
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.06)" },
          horzLines: { color: "rgba(255,255,255,0.06)" },
        },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: "rgba(255,255,255,0.12)" },
        timeScale: { borderColor: "rgba(255,255,255,0.12)" },
        width: containerRef.current.clientWidth,
        height,
      });

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#34d399",
        downColor: "#f43f5e",
        borderUpColor: "#34d399",
        borderDownColor: "#f43f5e",
        wickUpColor: "#34d399",
        wickDownColor: "#f43f5e",
      });
      candleSeries.setData(
        series.candlestickData as Parameters<typeof candleSeries.setData>[0],
      );

      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "",
      });
      chart.priceScale("").applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
      });
      volumeSeries.setData(series.volumeData as Parameters<typeof volumeSeries.setData>[0]);

      if (series.vwapLineData.length > 0) {
        const vwapSeries = chart.addSeries(LineSeries, {
          color: "#22d3ee",
          lineWidth: 2,
          title: resolvedVwapTitle,
        });
        vwapSeries.setData(series.vwapLineData as Parameters<typeof vwapSeries.setData>[0]);
      }

      if (series.previousCloseLineData.length > 0) {
        const prevSeries = chart.addSeries(LineSeries, {
          color: "rgba(250, 204, 21, 0.85)",
          lineWidth: 1,
          lineStyle: 2,
          title: "전일 종가",
        });
        prevSeries.setData(
          series.previousCloseLineData as Parameters<typeof prevSeries.setData>[0],
        );
      }

      chart.timeScale().fitContent();

      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        chart.applyOptions({ width: entry.contentRect.width });
      });
      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver?.disconnect();
        chart.remove();
      };
    }

    let teardown: (() => void) | undefined;
    void mountChart().then((cleanup) => {
      teardown = cleanup;
    });

    return () => {
      disposed = true;
      teardown?.();
    };
  }, [series, height, isEmpty, resolvedVwapTitle]);

  if (isEmpty) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-white/10 bg-black/25 text-sm text-white/50"
        style={{ height }}
      >
        차트에 표시할 캔들 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {chartNotice ? (
        <p
          className={
            isKisChart
              ? "rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-2 text-[11px] leading-5 text-cyan-50/85"
              : "rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2 text-[11px] leading-5 text-amber-50/80"
          }
        >
          {chartNotice}
        </p>
      ) : null}
      {showFallbackWarning && fallbackMessage ? (
        <p className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2 text-[11px] leading-5 text-amber-50/80">
          {fallbackMessage}
        </p>
      ) : null}
      {priceScaleSuspicious ? (
        <p className="rounded-2xl border border-rose-300/20 bg-rose-400/[0.06] px-3 py-2 text-[11px] leading-5 text-rose-100/80">
          가격 데이터 스케일 확인이 필요합니다. 국내 주식 분석에는 KIS/KRX/Naver 기준 데이터 교차 검증이
          필요합니다.
        </p>
      ) : null}
      <div
        ref={containerRef}
        className="w-full overflow-hidden rounded-2xl border border-white/10 bg-black/25"
        style={{ height }}
      />
    </div>
  );
}
