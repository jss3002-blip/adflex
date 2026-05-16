"use client";

import { useEffect, useRef, useState } from "react";

type IconName =
  | "activity"
  | "arrow"
  | "bar"
  | "brain"
  | "candle"
  | "gauge"
  | "line"
  | "lock"
  | "radio"
  | "shield"
  | "sparkles"
  | "trend"
  | "wallet"
  | "zap";

type IconProps = {
  name: IconName;
  className?: string;
};

function Icon({ name, className = "h-5 w-5" }: IconProps) {
  const paths: Record<IconName, React.ReactNode> = {
    activity: <path d="M3 12h4l2-6 4 12 2-6h6" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    bar: <path d="M4 19V9m8 10V5m8 14v-7" />,
    brain: (
      <path d="M8 6a4 4 0 0 0-4 4v4a4 4 0 0 0 4 4m8-12a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4M8 6a4 4 0 0 1 8 0m-8 12a4 4 0 0 0 8 0M8 10h8M8 14h8" />
    ),
    candle: <path d="M6 5v14m12-14v14M4 8h4v7H4zm12 3h4v5h-4z" />,
    gauge: <path d="M4 14a8 8 0 0 1 16 0M12 14l4-4m-8 8h8" />,
    line: <path d="m4 16 5-5 4 4 7-8M4 20h16" />,
    lock: <path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" />,
    radio: (
      <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-4-8a7 7 0 0 0 0 12m8-12a7 7 0 0 1 0 12M5 3a12 12 0 0 0 0 18m14-18a12 12 0 0 1 0 18" />
    ),
    shield: <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6zM12 8v5m0 4h.01" />,
    sparkles: <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM5 3v4m-2-2h4m12 12v4m-2-2h4" />,
    trend: <path d="m4 16 6-6 4 4 6-8m0 0v6m0-6h-6" />,
    wallet: <path d="M4 7h15v12H4zM4 7l3-3h12v3m11 6h-4" />,
    zap: <path d="m13 2-8 12h6l-1 8 9-13h-6z" />,
  };

  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}

const navItems = ["서비스", "AI 분석", "시그널", "요금제", "고객센터"];

const stats = [
  { label: "백테스트 정확도", value: "87.4%", detail: "최근 3년 기준 모델 검증" },
  { label: "일일 분석 신호", value: "12,800+", detail: "종목·섹터·시장 이벤트" },
  { label: "시장 데이터 포인트", value: "4.2B", detail: "가격·거래량·뉴스·수급" },
  { label: "AI 실시간 모니터링", value: "24/7", detail: "변동성·리스크 상시 감지" },
];

const features = [
  { title: "AI 종목 분석", icon: "brain" },
  { title: "실시간 시장 예측", icon: "trend" },
  { title: "포트폴리오 점검", icon: "wallet" },
  { title: "위험 관리 시스템", icon: "shield" },
  { title: "24/7 모니터링", icon: "radio" },
] as const;

const recommendations = [
  { ticker: "NVDA", name: "엔비디아", score: 92, signal: "강한 흐름", change: "+3.8%" },
  { ticker: "TSLA", name: "테슬라", score: 78, signal: "관망 우세", change: "+1.2%" },
  { ticker: "AAPL", name: "애플", score: 84, signal: "흐름 유지", change: "+2.1%" },
];

const sentimentItems = [
  { label: "뉴스 감성 분석", value: "긍정 68%", width: "68%" },
  { label: "거래량 분석", value: "평균 대비 142%", width: "82%" },
  { label: "변동성 예측", value: "중간 리스크", width: "54%" },
];

type StockAnalysisViewResult = {
  normalized?: {
    ticker?: string;
    name?: string;
    market?: string;
    analysisMode?: string;
    asOf?: string;
    currentPrice?: number;
    close?: number;
    volume?: number;
    ohlcv?: {
      timeframe?: string;
    };
    metadata?: {
      providerDiagnostics?: YahooProviderDiagnostics;
    };
  };
  ohlc: {
    closePositionScore: number;
    week52PositionScore: number;
    previousCloseChangePercent: number;
    intradayRangePercent: number;
    upperWickRatio: number;
    lowerWickRatio: number;
  };
  volume: {
    volumeRatio20d: number;
    volumeRatio10d: number;
    volumeScore: number;
    volumeRiskScore: number;
  };
  vwap: {
    isAboveVwap: boolean;
    isNearVwap: boolean;
    vwapDistancePercent: number;
    vwapScore: number;
    vwapRiskScore: number;
  };
  finalScore: number;
  finalGrade: string;
  state: {
    primaryState: string;
    stateScore: number;
    confidenceScore: number;
  };
  action: {
    actionCode: string;
    urgencyLevel: string;
    actionScore: number;
  };
  risk: {
    overheatingRiskScore: number;
    volatilityRiskScore: number;
    distributionRiskScore: number;
    vwapBreakdownRiskScore: number;
    lowLiquidityOrWeakParticipationRiskScore: number;
    trendCollapseRiskScore: number;
    riskScore: number;
  };
  summary: string;
  warnings: string[];
  evidence: {
    positive: string[];
    neutral: string[];
    negative: string[];
  };
  conflictAnalysis?: ConflictAnalysisViewResult;
  falseSignalAnalysis?: FalseSignalAnalysisViewResult;
  riskGateOverlay?: RiskGateOverlayViewResult;
};

type QualitySignalLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type RiskGateSeverity = "NONE" | "WATCH" | "CAUTION" | "HIGH_RISK" | "BLOCK";

type QualitySignalInsight = {
  severity?: QualitySignalLevel;
  riskLevel?: QualitySignalLevel;
  titleKo: string;
  summaryKo: string;
  evidenceKo: string;
  checkPointKo: string;
};

type ConflictAnalysisViewResult = {
  conflictScore: number;
  severity: QualitySignalLevel;
  conflicts: QualitySignalInsight[];
  summaryKo: string;
};

type FalseSignalAnalysisViewResult = {
  falseSignalScore: number;
  riskLevel: QualitySignalLevel;
  signals: QualitySignalInsight[];
  summaryKo: string;
};

type RiskGateInsightViewResult = {
  severity: RiskGateSeverity;
  titleKo: string;
  summaryKo: string;
  evidenceKo: string;
  actionKo: string;
  scoreImpactNoteKo: string;
};

type RiskGateOverlayViewResult = {
  overlayScore: number;
  severity: RiskGateSeverity;
  gates: RiskGateInsightViewResult[];
  summaryKo: string;
  interpretationKo: string;
  recommendedActionBiasKo: string;
};

type YahooProviderDiagnostics = {
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

type StockAnalysisApiResponse = {
  success: boolean;
  mode?: StockDataFreshness["mode"];
  source?: StockDataFreshness["provider"];
  freshness?: StockDataFreshness;
  diagnostics?: unknown;
  warning?: string;
  data?: StockAnalysisViewResult;
  error?: string;
  detail?: string;
};

type AnalysisMeta = {
  freshness?: StockDataFreshness;
  warning: string;
};

type StockDataFreshness = {
  provider: "yahoo-finance" | "kis-developers" | "sample";
  mode: "EOD" | "INTRADAY" | "SAMPLE" | "FALLBACK";
  isRealtime: boolean;
  isSameDayData: boolean;
  isConfirmedEOD: boolean;
  baseDate?: string;
  baseDateTime?: string;
  timezone: string;
  sourceLabel: string;
  cautionMessage: string;
};

const gradeLabels: Record<string, string> = {
  EXCELLENT_STRUCTURE: "매우 양호한 구조",
  GOOD_STRUCTURE: "양호한 구조",
  NEUTRAL_STRUCTURE: "중립 구조",
  CAUTION_STRUCTURE: "주의 필요 구조",
  HIGH_RISK_STRUCTURE: "고위험 구조",
  UNCLEAR_STRUCTURE: "추가 확인 필요 구조",
};

const stateLabels: Record<string, string> = {
  STRONG_UPTREND: "강한 상승 흐름",
  BREAKOUT_ATTEMPT: "돌파 시도 구간",
  TRUE_BREAKOUT_CANDIDATE: "진성 돌파 후보",
  FALSE_BREAKOUT_RISK: "가짜 돌파 위험",
  SHORT_TERM_OVERHEATED: "단기 과열 구간",
  VWAP_SUPPORT_HOLDING: "VWAP 지지 확인 구간",
  VWAP_BREAKDOWN_WARNING: "VWAP 이탈 주의 구간",
  PULLBACK_SETUP: "건전한 조정 후보",
  BOTTOM_REBOUND_ATTEMPT: "저점 반등 시도",
  TREND_COLLAPSE_RISK: "추세 붕괴 위험",
  WEAK_PARTICIPATION: "거래 참여 약화",
  SIDEWAYS_NEUTRAL: "횡보 중립 구간",
  HIGH_RISK_MOMENTUM: "고위험 모멘텀",
  WATCHLIST: "관심 관찰 구간",
};

const actionLabels: Record<string, string> = {
  WATCH_ONLY: "관찰 전용",
  WAIT_CONFIRMATION: "추가 확인 필요",
  BREAKOUT_MONITOR: "돌파 흐름 관찰",
  TRUE_BREAKOUT_MONITOR: "진성 돌파 후보 관찰",
  PULLBACK_MONITOR: "조정 구간 관찰",
  VWAP_SUPPORT_MONITOR: "VWAP 지지 여부 관찰",
  VWAP_BREAKDOWN_CHECK: "VWAP 이탈 점검",
  OVERHEAT_CAUTION: "단기 과열 주의",
  FALSE_BREAKOUT_CAUTION: "가짜 돌파 주의",
  HIGH_RISK_MOMENTUM_CAUTION: "고위험 모멘텀 주의",
  TREND_COLLAPSE_CHECK: "추세 훼손 점검",
  WEAK_PARTICIPATION_CHECK: "거래 참여 약화 점검",
  RISK_CHECK_REQUIRED: "리스크 우선 점검",
  NO_CLEAR_EDGE: "명확한 우위 없음",
};

const urgencyLabels: Record<string, string> = {
  LOW: "낮음",
  NORMAL: "보통",
  ELEVATED: "주의",
  HIGH: "높음",
};

function getGradeLabel(grade: string | undefined): string {
  if (!grade) return "분석 등급 확인 필요";
  return gradeLabels[grade] || grade;
}

function getStateLabel(state: string | undefined): string {
  if (!state) return "상태 확인 필요";
  return stateLabels[state] || state;
}

function getActionLabel(action: string | undefined): string {
  if (!action) return "대응 라벨 확인 필요";
  return actionLabels[action] || action;
}

function getUrgencyLabel(urgency: string | undefined): string {
  if (!urgency) return "확인 필요";
  return urgencyLabels[urgency] || urgency;
}

function getGradeExplanation(grade: string | undefined): string {
  if (grade === "CAUTION_STRUCTURE") {
    return "구체적인 주의 신호가 감지되어 우선 점검이 필요한 상태입니다.";
  }

  if (grade === "UNCLEAR_STRUCTURE") {
    return "명확한 우위나 위험 방향이 충분히 확인되지 않은 상태입니다.";
  }

  return "현재 점수와 상태 분류를 함께 해석한 종합 구조입니다.";
}

function formatSummaryForDisplay(summary: string | undefined): string {
  if (!summary) return "";

  const replacements = {
    ...gradeLabels,
    ...stateLabels,
    ...actionLabels,
    ...urgencyLabels,
  };

  return Object.entries(replacements).reduce((formatted, [code, label]) => {
    return formatted.split(code).join(label);
  }, summary);
}

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState<StockAnalysisViewResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [stockNameInput, setStockNameInput] = useState("삼성전자");
  const [analyzedStockName, setAnalyzedStockName] = useState("");
  const [analysisMeta, setAnalysisMeta] = useState<AnalysisMeta>({
    freshness: undefined,
    warning: "",
  });
  const resultSectionRef = useRef<HTMLDivElement | null>(null);
  const hasResult = Boolean(analysisResult);

  useEffect(() => {
    if (analysisResult && resultSectionRef.current) {
      resultSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [analysisResult]);

  async function handleAnalyzeStock() {
    const selectedStockName = stockNameInput.trim() || "삼성전자";
    setIsAnalyzing(true);
    setAnalysisError("");

    try {
      const response = await fetch("/api/analyze-stock", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stockName: selectedStockName,
        }),
      });
      const payload = (await response.json()) as StockAnalysisApiResponse;

      if (!response.ok || !payload.success || !payload.data) {
        setAnalysisError(payload.detail || payload.error || "분석 결과를 불러오지 못했습니다.");
        return;
      }

      setAnalysisResult(payload.data);
      setAnalyzedStockName(selectedStockName);
      setAnalysisMeta({
        freshness: payload.freshness,
        warning: payload.warning || "",
      });
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <main className="relative min-h-full overflow-hidden bg-[#050508] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_55%_at_50%_-10%,rgba(34,211,238,0.18),transparent),radial-gradient(65%_45%_at_100%_0%,rgba(139,92,246,0.18),transparent),radial-gradient(60%_40%_at_0%_100%,rgba(16,185,129,0.11),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-80 w-[44rem] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl"
      />

      <nav className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 lg:px-10">
        <a href="#" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-[0_0_40px_-20px_rgba(34,211,238,0.9)] backdrop-blur-xl">
            <Icon name="line" className="h-5 w-5 text-cyan-300" />
          </span>
          <span className="text-lg font-semibold tracking-tight">StockAI</span>
        </a>

        <div className="hidden items-center gap-7 rounded-full border border-white/10 bg-white/[0.035] px-6 py-3 text-sm text-white/60 backdrop-blur-xl lg:flex">
          {navItems.map((item) => (
            <a key={item} href="#" className="transition hover:text-white">
              {item}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <a
            href="#"
            className="rounded-full px-4 py-2 text-sm font-medium text-white/65 transition hover:bg-white/[0.06] hover:text-white"
          >
            로그인
          </a>
          <a
            href="#"
            className="rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 px-5 py-2.5 text-sm font-semibold text-black shadow-[0_20px_50px_-28px_rgba(34,211,238,0.85)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_-32px_rgba(139,92,246,0.75)]"
          >
            무료로 시작하기
          </a>
        </div>
      </nav>

      <section
        className={`relative z-10 mx-auto grid w-full max-w-7xl px-5 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-10 ${
          hasResult ? "gap-8 pb-6 pt-8 lg:pb-8 lg:pt-12" : "gap-12 pb-12 pt-14 lg:pb-20 lg:pt-24"
        }`}
      >
        <div className={hasResult ? "space-y-5" : "space-y-8"}>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1 text-xs font-medium text-cyan-100/80 shadow-[0_0_40px_-28px_rgba(34,211,238,0.9)] backdrop-blur-xl">
            <Icon name="sparkles" className="h-3.5 w-3.5 text-cyan-300" />
            AI 기반 투자 인사이트 플랫폼
          </div>

          <div className={hasResult ? "space-y-3" : "space-y-5"}>
            <h1
              className={`max-w-4xl text-balance font-semibold leading-[1.04] tracking-tight text-white ${
                hasResult ? "text-4xl sm:text-5xl lg:text-6xl" : "text-5xl sm:text-6xl lg:text-7xl"
              }`}
            >
              실시간 데이터 기반 투자 분석 플랫폼
            </h1>
            <p className={`max-w-2xl text-pretty leading-8 text-white/62 ${hasResult ? "text-base" : "text-lg"}`}>
              뉴스, 수급, 변동성, 기술적 지표를 AI가 종합 분석해 투자 판단에 필요한 핵심 인사이트를
              제공합니다.
            </p>
          </div>

          <div
            className={`rounded-[1.5rem] border border-white/10 bg-white/[0.04] shadow-[0_24px_90px_-70px_rgba(34,211,238,0.85)] backdrop-blur-xl ${
              hasResult ? "p-3" : "p-3"
            }`}
          >
            <label htmlFor="stock-name" className="px-1 text-xs font-semibold text-cyan-100/75">
              분석할 종목명
            </label>
            <input
              id="stock-name"
              value={stockNameInput}
              onChange={(event) => setStockNameInput(event.target.value)}
              placeholder="예: 삼성전자, SK하이닉스, 현대차"
              className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm font-medium text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300/45 focus:bg-black/30"
            />
            <p className="mt-2 px-1 text-xs leading-5 text-white/42">
              {hasResult ? "다른 종목명을 입력해 바로 다시 분석할 수 있습니다." : "종목명을 입력하면 현재 연결된 데이터 기준으로 분석합니다."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleAnalyzeStock}
              disabled={isAnalyzing}
              className="group inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-semibold text-black shadow-[0_24px_70px_-38px_rgba(255,255,255,0.75)] transition hover:-translate-y-0.5 hover:bg-cyan-100"
            >
              {isAnalyzing ? "분석 중..." : "AI 주식 분석하기"}
              <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
            <a
              href="#engine"
              className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 text-sm font-semibold text-white/80 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.07] hover:text-white"
            >
              분석 엔진 보기
              <Icon name="gauge" className="h-4 w-4" />
            </a>
          </div>

          {analysisError ? (
            <div className="rounded-3xl border border-rose-300/20 bg-rose-400/[0.08] p-5 text-sm text-rose-100 shadow-[0_24px_80px_-58px_rgba(244,63,94,0.85)] backdrop-blur-xl">
              <p className="font-semibold">분석 중 오류가 발생했습니다.</p>
              <p className="mt-2 text-rose-100/70">{analysisError}</p>
            </div>
          ) : null}

        </div>

        <div className="relative">
          <div
            aria-hidden
            className="absolute -inset-4 rounded-[2rem] bg-[radial-gradient(70%_80%_at_50%_0%,rgba(34,211,238,0.25),transparent),radial-gradient(70%_70%_at_100%_70%,rgba(139,92,246,0.20),transparent)] blur-2xl"
          />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.045] p-5 shadow-[0_35px_120px_-70px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs text-white/45">AI 시장 예측 지수</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">82.6</p>
              </div>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                상승 모멘텀
              </span>
            </div>

            <div className="mt-5 h-56 rounded-3xl border border-white/10 bg-black/25 p-4">
              <div className="flex h-full items-end gap-2">
                {[36, 52, 44, 63, 59, 74, 68, 82, 76, 91, 88, 96].map((height, idx) => (
                  <div key={idx} className="flex flex-1 flex-col items-center justify-end gap-2">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-cyan-400/25 via-cyan-300/60 to-white shadow-[0_0_25px_-12px_rgba(34,211,238,0.9)]"
                      style={{ height: `${height}%` }}
                    />
                    <span className="h-1 w-1 rounded-full bg-white/25" />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {recommendations.map((stock) => (
                <div key={stock.ticker} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{stock.ticker}</p>
                    <span className="text-xs font-semibold text-emerald-300">{stock.change}</span>
                  </div>
                  <p className="mt-1 text-xs text-white/45">{stock.name}</p>
                  <div className="mt-4 flex items-end justify-between">
                    <p className="text-xs text-white/45">{stock.signal}</p>
                    <p className="text-xl font-semibold">{stock.score}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {analysisResult ? (
        <section
          ref={resultSectionRef}
          className="relative z-10 mx-auto w-full max-w-[92rem] scroll-mt-24 px-5 pb-8 pt-3 lg:px-10"
        >
          <AnalysisResultCard
            result={analysisResult}
            targetStockName={analyzedStockName}
            meta={analysisMeta}
          />
        </section>
      ) : null}

      <section className={`relative z-10 mx-auto w-full max-w-7xl px-5 py-6 lg:px-10 ${hasResult ? "" : "hidden"}`}>
        <details className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl">
          <summary className="cursor-pointer text-sm font-semibold text-white/72">서비스 기능 미리보기</summary>
          <p className="mt-2 text-xs leading-6 text-white/45">
            분석 결과를 확인한 뒤 필요한 경우 서비스 기능과 대시보드 예시를 펼쳐볼 수 있습니다.
          </p>
        </details>
      </section>

      <section className={`relative z-10 mx-auto grid w-full max-w-7xl gap-4 px-5 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-10 ${hasResult ? "hidden" : ""}`}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_24px_80px_-58px_rgba(0,0,0,0.9)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-cyan-300/20 hover:bg-white/[0.055]"
          >
            <p className="text-sm text-white/48">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{stat.value}</p>
            <p className="mt-2 text-xs leading-relaxed text-white/38">{stat.detail}</p>
          </div>
        ))}
      </section>

      <section className={`relative z-10 mx-auto w-full max-w-7xl px-5 py-8 lg:px-10 ${hasResult ? "hidden" : ""}`}>
        <div className="grid gap-3 rounded-[2rem] border border-white/10 bg-white/[0.035] p-3 backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-5">
          {features.map(({ title, icon }) => (
            <div
              key={title}
              className="group flex items-center gap-3 rounded-3xl px-4 py-4 text-sm font-semibold text-white/72 transition hover:bg-white/[0.06] hover:text-white"
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-black/25 transition group-hover:border-cyan-300/25 group-hover:bg-cyan-300/10">
                <Icon name={icon} className="h-5 w-5 text-cyan-300" />
              </span>
              {title}
            </div>
          ))}
        </div>
      </section>

      <section id="dashboard-preview" className={`relative z-10 mx-auto w-full max-w-7xl px-5 py-16 lg:px-10 ${hasResult ? "hidden" : ""}`}>
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-cyan-200/80">실시간 대시보드 프리뷰</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">AI가 시장의 흐름을 요약합니다</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-white/52">
            실제 API 연결 전 UI 프로토타입입니다. 관심 종목, 예측, 심리, 거래량, 변동성, 뉴스 감성 영역을 한 화면에서
            확인하는 경험을 설계했습니다.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name="candle" className="h-5 w-5 text-cyan-300" />
                <h3 className="font-semibold">AI 관심 종목</h3>
              </div>
              <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100/70">업데이트 대기</span>
            </div>

            <div className="space-y-3">
              {recommendations.map((stock) => (
                <div
                  key={stock.ticker}
                  className="grid gap-4 rounded-3xl border border-white/10 bg-black/24 p-4 sm:grid-cols-[1fr_auto]"
                >
                  <div className="flex items-center gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300/18 to-violet-400/18 text-sm font-bold">
                      {stock.ticker.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold">
                        {stock.name} <span className="text-white/38">{stock.ticker}</span>
                      </p>
                      <p className="mt-1 text-xs text-white/45">뉴스·수급·기술 지표 통합 점수</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:justify-end">
                    <div className="text-right">
                      <p className="text-xs text-white/45">AI 점수</p>
                      <p className="text-xl font-semibold">{stock.score}</p>
                    </div>
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                      {stock.signal}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <Icon name="activity" className="h-5 w-5 text-violet-300" />
                <h3 className="font-semibold">포트폴리오 상태</h3>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  ["수익률", "+14.2%"],
                  ["리스크", "중간"],
                  ["분산도", "높음"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <p className="text-xs text-white/42">{label}</p>
                    <p className="mt-2 text-lg font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl">
              <div className="flex items-center gap-3">
                <Icon name="bar" className="h-5 w-5 text-cyan-300" />
                <h3 className="font-semibold">시장 심리 분석</h3>
              </div>
              <div className="mt-5 space-y-4">
                {sentimentItems.map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-white/50">{item.label}</span>
                      <span className="text-white/76">{item.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400"
                        style={{ width: item.width }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl">
                <Icon name="zap" className="h-5 w-5 text-amber-200" />
                <p className="mt-4 text-sm font-semibold">거래량 분석</p>
                <p className="mt-2 text-xs leading-6 text-white/48">이상 거래량과 가격 압축 구간을 감지합니다.</p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl">
                <Icon name="lock" className="h-5 w-5 text-emerald-200" />
                <p className="mt-4 text-sm font-semibold">변동성 예측</p>
                <p className="mt-2 text-xs leading-6 text-white/48">급등락 가능성과 손실 방어 구간을 추정합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="engine" className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-24 pt-8 lg:px-10">
        <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-gradient-to-br from-white/[0.075] to-white/[0.025] p-8 shadow-[0_35px_120px_-80px_rgba(0,0,0,0.95)] backdrop-blur-2xl lg:p-12">
          <div
            aria-hidden
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/14 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-violet-400/14 blur-3xl"
          />

          <div className="relative grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-cyan-200/80">AI 분석 엔진</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                데이터가 아닌 인사이트를 제공합니다
              </h2>
              <p className="mt-5 text-base leading-8 text-white/58">
                StockAI 엔진은 가격, 거래량, 변동성, 뉴스, 수급 흐름, 리스크 신호를 하나의 AI 점수로 통합합니다.
                단순한 차트 요약이 아니라 투자 판단에 필요한 방향성, 위험 구간, 관찰 지표를 함께 제공합니다.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "가격 추세와 지지·저항 구간",
                "거래량 이상 징후와 수급 변화",
                "뉴스 감성 및 이벤트 리스크",
                "변동성 확장 가능성과 방어 신호",
              ].map((item) => (
                <div key={item} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <div className="mb-4 grid h-10 w-10 place-items-center rounded-2xl bg-cyan-300/10">
                    <Icon name="arrow" className="h-4 w-4 text-cyan-200" />
                  </div>
                  <p className="text-sm font-medium leading-6 text-white/78">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function AnalysisResultCard({
  result,
  targetStockName,
  meta,
}: {
  result: StockAnalysisViewResult;
  targetStockName: string;
  meta: AnalysisMeta;
}) {
  const gradeLabel = getGradeLabel(result.finalGrade);
  const stateLabel = getStateLabel(result.state.primaryState);
  const actionLabel = getActionLabel(result.action.actionCode);
  const urgencyLabel = getUrgencyLabel(result.action.urgencyLevel);
  const displayedStockName = targetStockName || result.normalized?.name || "샘플 종목";
  const confirmedStockName = result.normalized?.name || "확인 대기";
  const confirmedTicker = result.normalized?.ticker || "";
  const sourceLabel = meta.freshness?.sourceLabel || "샘플 데이터";
  const modeNotice = getDataModeNotice(meta.freshness, meta.warning);
  const dataBasisLabel = getDataBasisLabel(result);
  const dataBasisValue = formatDataBasis(result);
  const topConfirmationCards = getTopConfirmationCards(result.warnings, result, 3);
  const scoreItems = [
    { key: "finalScore", title: "종합 점수", score: result.finalScore, type: "normal" as const },
    { key: "stateScore", title: "상태 분류 신뢰도", score: result.state.stateScore, type: "normal" as const },
    { key: "confidenceScore", title: "신뢰도", score: result.state.confidenceScore, type: "normal" as const },
    { key: "riskScore", title: "리스크 점수", score: result.risk.riskScore, type: "risk" as const },
  ];

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_90px_-64px_rgba(34,211,238,0.9)] backdrop-blur-2xl">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-sm font-semibold text-white/82">분석 대상: {displayedStockName}</p>
        <p className="mt-2 text-xs leading-6 text-white/55">
          확인 종목: {confirmedStockName}
          {confirmedTicker ? ` (${confirmedTicker})` : ""}
        </p>
        <p className="text-xs leading-6 text-white/55">데이터 출처: {sourceLabel}</p>
        <p className="text-xs leading-6 text-white/55">데이터 모드: {getDataModeLabel(meta.freshness?.mode)}</p>
        <p className="text-xs leading-6 text-white/55">
          당일 데이터 여부: {meta.freshness?.isSameDayData ? "당일 데이터 반영" : "당일 데이터가 아닐 수 있음"}
        </p>
        <p className="text-xs leading-6 text-white/55">
          실시간 여부: {meta.freshness?.isRealtime ? "실시간 또는 준실시간" : "실시간 데이터 아님"}
        </p>
        <p className="text-xs leading-6 text-white/55">{dataBasisLabel}: {dataBasisValue}</p>
        {meta.freshness?.mode === "INTRADAY" ? (
          <p className="text-xs leading-6 text-white/55">
            기준 시각: {formatDateTime(meta.freshness.baseDateTime)}
          </p>
        ) : null}
        <p className="text-xs leading-6 text-white/55">기준 유형: {getDataBasisType(result, meta.freshness)}</p>
        <p className="mt-2 text-xs leading-6 text-white/45">
          {modeNotice}
        </p>
        {meta.freshness?.provider === "yahoo-finance" ? (
          <p className="mt-1 text-xs leading-6 text-white/38">
            {meta.freshness.cautionMessage}
          </p>
        ) : null}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-200/80">현재 상태 요약</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{gradeLabel}</h2>
            <p className="mt-2 text-xs leading-6 text-white/50">{getGradeExplanation(result.finalGrade)}</p>
          </div>
          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100/80">
            {urgencyLabel}
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <InfoPill label="상태 분류" value={stateLabel} />
          <InfoPill label="대응 라벨" value={actionLabel} />
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
          <ActionPriorityCard score={result.action.actionScore} />
          <ConfirmationItemsCard cards={topConfirmationCards} compact />
        </div>
      </div>

      <ReasoningSection result={result} />

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs font-semibold text-cyan-200/80">현재 이 종목을 한 문장으로 해석하면</p>
        <p className="mt-2 text-sm leading-7 text-white/72">{buildOneLineInterpretation(result)}</p>
      </div>

      <CustomerTakeawaySection result={result} />

      <QualitySignalsSection result={result} />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.055] p-4 text-sm leading-7 text-cyan-50/78 sm:col-span-2">
          일반 점수는 높을수록 긍정적이며, 리스크 점수는 높을수록 위험합니다. 색상 막대는 현재 점수의
          강도와 위험 수준을 한눈에 보여줍니다. 점수는 단독 판단이 아니라 가격 위치, 거래량, VWAP,
          변동성, 추세 조건을 함께 본 결과입니다.
        </div>
        {scoreItems.map((item) => (
          <ScoreCard
            key={item.key}
            scoreKey={item.key}
            title={item.title}
            score={item.score}
            type={item.type}
          />
        ))}
      </div>

      <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/66">
        {formatSummaryForDisplay(result.summary)}
      </p>

      <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4">
        <p className="text-sm font-semibold text-amber-100">핵심 확인 요약</p>
        {result.warnings.length > 0 ? (
          <p className="mt-3 text-xs leading-6 text-amber-50/75">
            {topConfirmationCards.map((card) => card.title).join(" · ")} 조건을 우선 확인하세요.
          </p>
        ) : (
          <p className="mt-3 text-xs leading-6 text-amber-50/65">현재 표시된 주요 경고는 없습니다.</p>
        )}
      </div>

      <IndicatorSections result={result} hiddenConfirmationTitles={topConfirmationCards.map((card) => card.title)} />

      <DetailedAnalysisSection
        result={result}
        targetStockName={targetStockName}
        sourceLabel={sourceLabel}
        freshness={meta.freshness}
      />
    </div>
  );
}

function DetailedAnalysisSection({
  result,
  targetStockName,
  sourceLabel,
  freshness,
}: {
  result: StockAnalysisViewResult;
  targetStockName: string;
  sourceLabel: string;
  freshness?: StockDataFreshness;
}) {
  const confirmedTicker = result.normalized?.ticker || "";
  const confirmedName = result.normalized?.name || "확인 대기";
  const diagnostics = result.normalized?.metadata?.providerDiagnostics;
  const detailedScores = [
    { key: "closePositionScore", title: "종가 위치 점수", score: result.ohlc.closePositionScore, type: "normal" as const },
    { key: "week52PositionScore", title: "52주 위치 점수", score: result.ohlc.week52PositionScore, type: "normal" as const },
    { key: "volumeScore", title: "거래량 점수", score: result.volume.volumeScore, type: "normal" as const },
    { key: "vwapScore", title: "VWAP 점수", score: result.vwap.vwapScore, type: "normal" as const },
    { key: "volumeRiskScore", title: "거래량 리스크 점수", score: result.volume.volumeRiskScore, type: "risk" as const },
    { key: "vwapRiskScore", title: "VWAP 리스크 점수", score: result.vwap.vwapRiskScore, type: "risk" as const },
    { key: "overheatingRiskScore", title: "과열 위험", score: result.risk.overheatingRiskScore, type: "risk" as const },
    { key: "volatilityRiskScore", title: "변동성 위험", score: result.risk.volatilityRiskScore, type: "risk" as const },
    {
      key: "distributionRiskScore",
      title: "분배/가짜 돌파 위험",
      score: result.risk.distributionRiskScore,
      type: "risk" as const,
    },
    {
      key: "vwapBreakdownRiskScore",
      title: "VWAP 이탈 위험",
      score: result.risk.vwapBreakdownRiskScore,
      type: "risk" as const,
    },
    {
      key: "lowLiquidityOrWeakParticipationRiskScore",
      title: "거래 참여 약화 위험",
      score: result.risk.lowLiquidityOrWeakParticipationRiskScore,
      type: "risk" as const,
    },
    {
      key: "trendCollapseRiskScore",
      title: "추세 붕괴 위험",
      score: result.risk.trendCollapseRiskScore,
      type: "risk" as const,
    },
    { key: "riskScore", title: "종합 리스크 점수", score: result.risk.riskScore, type: "risk" as const },
  ];

  return (
    <div className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-2xl">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-200/80">상세 분석 근거</p>
          <p className="mt-1 text-xs text-white/45">점수 산출에 사용된 핵심 참고 지표입니다.</p>
        </div>
        <p className="text-xs text-white/45">{getDataBasisLabel(result)}: {formatDataBasis(result, freshness)}</p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {detailedScores.map((item) => (
          <ScoreCard
            key={item.key}
            scoreKey={item.key}
            title={item.title}
            score={item.score}
            type={item.type}
          />
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <DetailCard
          title="가격 구조"
          items={[
            ["종가 위치 점수", formatScore(result.ohlc.closePositionScore)],
            ["52주 위치 점수", formatScore(result.ohlc.week52PositionScore)],
            ["전일 대비 등락률", formatPercent(result.ohlc.previousCloseChangePercent)],
            ["장중 변동폭", formatPercent(result.ohlc.intradayRangePercent)],
            ["윗꼬리 비율", formatPercent(result.ohlc.upperWickRatio)],
            ["아랫꼬리 비율", formatPercent(result.ohlc.lowerWickRatio)],
          ]}
        />
        <DetailCard
          title="거래량 구조"
          items={[
            ["20일 평균 대비 거래량", formatPercent(result.volume.volumeRatio20d)],
            ["10일 평균 대비 거래량", formatPercent(result.volume.volumeRatio10d)],
            ["거래량 점수", formatScore(result.volume.volumeScore)],
            ["거래량 리스크 점수", formatScore(result.volume.volumeRiskScore)],
          ]}
        />
        <DetailCard
          title="VWAP 구조"
          items={[
            ["VWAP 위치", result.vwap.isAboveVwap ? "VWAP 위" : "VWAP 아래"],
            ["VWAP 근접 여부", result.vwap.isNearVwap ? "근접" : "이격"],
            ["VWAP 이격률", formatPercent(result.vwap.vwapDistancePercent)],
            ["VWAP 점수", formatScore(result.vwap.vwapScore)],
            ["VWAP 리스크 점수", formatScore(result.vwap.vwapRiskScore)],
          ]}
        />
        <DetailCard
          title="리스크 구조"
          items={[
            ["과열 위험", formatScore(result.risk.overheatingRiskScore)],
            ["변동성 위험", formatScore(result.risk.volatilityRiskScore)],
            ["분배/가짜 돌파 위험", formatScore(result.risk.distributionRiskScore)],
            ["VWAP 이탈 위험", formatScore(result.risk.vwapBreakdownRiskScore)],
            ["거래 참여 약화 위험", formatScore(result.risk.lowLiquidityOrWeakParticipationRiskScore)],
            ["추세 붕괴 위험", formatScore(result.risk.trendCollapseRiskScore)],
            ["종합 리스크 점수", formatScore(result.risk.riskScore)],
          ]}
        />
        <DetailCard
          title="데이터 기준"
          items={[
            ["분석 대상", targetStockName || "샘플 종목"],
            ["확인 종목", `${confirmedName}${confirmedTicker ? ` (${confirmedTicker})` : ""}`],
            ["시장", result.normalized?.market || "-"],
            ["데이터 출처", sourceLabel],
            ["데이터 모드", getDataModeLabel(freshness?.mode)],
            ["당일 데이터 여부", freshness?.isSameDayData ? "당일 데이터 반영" : "당일 데이터가 아닐 수 있음"],
            ["실시간 여부", freshness?.isRealtime ? "실시간 또는 준실시간" : "실시간 데이터 아님"],
            [getDataBasisLabel(result), formatDataBasis(result, freshness)],
            ["기준 유형", getDataBasisType(result, freshness)],
            ["분석 모드", result.normalized?.analysisMode || "-"],
            ["현재가/종가", formatNumber(result.normalized?.currentPrice || result.normalized?.close)],
            ["거래량", formatNumber(result.normalized?.volume)],
          ]}
        />
        {diagnostics ? (
          <DetailCard
            title="데이터 원본 확인"
            muted
            items={[
              ["Yahoo 심볼", diagnostics.yahooSymbol],
              ["원본 통화", diagnostics.rawCurrency || "-"],
              ["원본 거래소", diagnostics.rawExchangeName || "-"],
              ["원본 상품 유형", diagnostics.rawInstrumentType || "-"],
              ["원본 현재가", formatNumber(diagnostics.rawRegularMarketPrice)],
              ["원본 전일 종가", formatNumber(diagnostics.rawPreviousClose)],
              ["원본 최신 시가", formatNumber(diagnostics.latestRawOpen)],
              ["원본 최신 고가", formatNumber(diagnostics.latestRawHigh)],
              ["원본 최신 저가", formatNumber(diagnostics.latestRawLow)],
              ["원본 최신 종가", formatNumber(diagnostics.latestRawClose)],
              ["원본 최신 거래량", formatNumber(diagnostics.latestRawVolume)],
              ["유효 캔들 수", formatNumber(diagnostics.validCandleCount)],
              ["첫 캔들 기준일", formatDateOnly(diagnostics.firstCandleDate)],
              ["최신 캔들 기준일", formatDateOnly(diagnostics.latestCandleDate)],
              ["진단 메모", diagnostics.note],
            ]}
          />
        ) : null}
      </div>
    </div>
  );
}

function ReasoningSection({ result }: { result: StockAnalysisViewResult }) {
  const reasons = buildStateReasoning(result);

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-semibold text-cyan-200/80">왜 이 상태로 분류됐나요?</p>
      <ul className="mt-3 space-y-2 text-xs leading-6 text-white/68">
        {reasons.map((reason) => (
          <li key={reason} className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2">
            {reason}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-6 text-white/50">{buildCrossScoreInterpretation(result)}</p>
    </div>
  );
}

function CustomerTakeawaySection({ result }: { result: StockAnalysisViewResult }) {
  const points = buildCustomerTakeaways(result);

  return (
    <div className="mt-4 rounded-2xl border border-violet-300/15 bg-violet-300/[0.045] p-4">
      <p className="text-sm font-semibold text-violet-100">고객이 먼저 봐야 할 핵심 포인트</p>
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        {points.map((point) => (
          <div key={point.label} className="rounded-2xl border border-white/10 bg-black/18 p-3">
            <p className="text-[11px] font-semibold text-violet-100/80">{point.label}</p>
            <p className="mt-2 text-xs leading-6 text-white/68">{point.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function QualitySignalsSection({ result }: { result: StockAnalysisViewResult }) {
  if (!result.conflictAnalysis && !result.falseSignalAnalysis && !result.riskGateOverlay) return null;

  return (
    <div className="mt-4 rounded-2xl border border-orange-300/15 bg-orange-300/[0.04] p-4">
      <div className="mb-4">
        <p className="text-sm font-semibold text-orange-100">분석 품질 보강 신호</p>
        <p className="mt-1 text-xs leading-5 text-white/50">
          이 점수는 종목 전체 위험도가 아니라, 개별 점수만으로는 놓치기 쉬운 신호 충돌과 가짜 강세 가능성을
          따로 평가한 보조 분석 점수입니다. 리스크 게이트 해석은 원점수가 괜찮아 보여도 핵심 구조 위험 때문에
          더 신중한 해석이 필요한지 점검하는 진단 계층입니다.
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <QualitySignalPanel
          title="신호 충돌 분석"
          score={result.conflictAnalysis?.conflictScore}
          level={result.conflictAnalysis?.severity}
          summary={result.conflictAnalysis?.summaryKo}
          items={result.conflictAnalysis?.conflicts}
          emptyMessage="현재 추가적인 신호 충돌은 크게 감지되지 않았습니다."
        />
        <QualitySignalPanel
          title="가짜 신호 위험"
          score={result.falseSignalAnalysis?.falseSignalScore}
          level={result.falseSignalAnalysis?.riskLevel}
          summary={result.falseSignalAnalysis?.summaryKo}
          items={result.falseSignalAnalysis?.signals}
          emptyMessage="현재 뚜렷한 가짜 강세 위험은 제한적입니다."
        />
        <RiskGateOverlayPanel overlay={result.riskGateOverlay} />
      </div>
    </div>
  );
}

function RiskGateOverlayPanel({ overlay }: { overlay: RiskGateOverlayViewResult | undefined }) {
  if (!overlay) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-sm font-semibold text-white/86">리스크 게이트 해석</p>
        <p className="mt-3 text-xs leading-6 text-white/50">현재 활성화된 리스크 게이트 정보는 없습니다.</p>
      </div>
    );
  }

  const safeScore = clampUiScore(overlay.overlayScore);
  const colorClass = getRiskGateOverlayColor(safeScore, overlay.severity);
  const activeGates = (overlay.gates || []).slice(0, 3);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white/86">리스크 게이트 해석</p>
          <p className="mt-2 text-2xl font-semibold text-white">{formatScore(safeScore)}점 / 100점</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${colorClass.badge}`}>
          {getRiskGateSeverityLabel(overlay.severity)}
        </span>
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass.bar}`}
          style={{ width: `${safeScore}%` }}
        />
      </div>
      <p className="mt-3 text-xs leading-6 text-white/58">{overlay.summaryKo}</p>
      <p className="mt-2 text-[11px] leading-5 text-white/48">{overlay.interpretationKo}</p>
      <p className="mt-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-[11px] leading-5 text-orange-100/72">
        {overlay.recommendedActionBiasKo}
      </p>
      <p className="mt-2 text-[11px] leading-5 text-white/42">
        이 항목은 현재 finalScore를 변경하지 않습니다. 원점수 해석을 더 신중하게 볼 필요가 있는지 확인하는 구조
        해석 계층입니다.
      </p>
      {activeGates.length > 0 ? (
        <div className="mt-4 space-y-3">
          {activeGates.map((gate) => (
            <div key={gate.titleKo} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-white/82">{gate.titleKo}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getRiskGateOverlayColor(0, gate.severity).badge}`}>
                  {getRiskGateSeverityLabel(gate.severity)}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-white/58">{gate.summaryKo}</p>
              <p className="mt-2 text-[11px] leading-5 text-white/45">{gate.evidenceKo}</p>
              <p className="mt-2 text-[11px] leading-5 text-orange-100/70">{gate.actionKo}</p>
              <p className="mt-2 text-[11px] leading-5 text-white/42">{gate.scoreImpactNoteKo}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-semibold text-white/72">현재 활성화된 리스크 게이트는 없습니다.</p>
          <p className="mt-2 text-xs leading-6 text-white/50">
            현재 원점수 해석을 제한할 만한 핵심 게이트는 감지되지 않았습니다.
          </p>
        </div>
      )}
    </div>
  );
}

function QualitySignalPanel({
  title,
  score,
  level,
  summary,
  items,
  emptyMessage,
}: {
  title: string;
  score: number | undefined;
  level: QualitySignalLevel | undefined;
  summary: string | undefined;
  items: QualitySignalInsight[] | undefined;
  emptyMessage: string;
}) {
  const safeScore = clampUiScore(score || 0);
  const levelLabel = getQualitySignalLevelLabel(level);
  const colorClass = getActionPriorityColor(safeScore);
  const displayItems = (items || []).slice(0, 3);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white/86">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{formatScore(safeScore)}점 / 100점</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${colorClass.badge}`}>
          {levelLabel}
        </span>
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass.bar}`}
          style={{ width: `${safeScore}%` }}
        />
      </div>
      <p className="mt-3 text-xs leading-6 text-white/58">
        {summary || emptyMessage}
      </p>
      {safeScore >= 85 ? (
        <p className="mt-2 text-[11px] leading-5 text-orange-100/70">
          보조 분석 기준 매우 높음 상태입니다. 직접적인 매수/매도 판단이 아니라 구조 점검 신호이며, 단기 확인
          우선순위가 높다는 뜻으로 해석하세요.
        </p>
      ) : (
        <p className="mt-2 text-[11px] leading-5 text-white/42">
          직접적인 매수/매도 판단이 아니라 구조 점검을 돕는 보조 위험 신호입니다.
        </p>
      )}
      {displayItems.length > 0 ? (
        <div className="mt-4 space-y-3">
          {displayItems.map((item) => (
            <div key={item.titleKo} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-white/82">{item.titleKo}</p>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/60">
                  {getQualitySignalLevelLabel(item.severity || item.riskLevel)}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-white/58">{item.summaryKo}</p>
              <p className="mt-2 text-[11px] leading-5 text-white/45">{item.evidenceKo}</p>
              <p className="mt-2 text-[11px] leading-5 text-orange-100/70">{item.checkPointKo}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-6 text-white/50">
          {emptyMessage}
        </p>
      )}
    </div>
  );
}

function ActionPriorityCard({ score }: { score: number }) {
  const safeScore = clampUiScore(score);
  const label = getActionPriorityLabel(safeScore);
  const colorClass = getActionPriorityColor(safeScore);

  return (
    <div className="rounded-2xl border border-orange-300/15 bg-orange-300/[0.055] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-white/50">대응 우선순위 점수</p>
          <p className="mt-2 text-2xl font-semibold text-white">{formatScore(safeScore)}점 / 100점</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${colorClass.badge}`}>
          {label}
        </span>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass.bar}`}
          style={{ width: `${safeScore}%` }}
        />
      </div>
      <p className="mt-3 text-xs leading-6 text-white/62">{getActionPriorityDescription(safeScore)}</p>
    </div>
  );
}

function ConfirmationItemsCard({ cards, compact = false }: { cards: IndicatorInsight[]; compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-rose-300/15 bg-rose-300/[0.055] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-rose-50">확인 필요 항목</p>
          <p className="mt-1 text-xs text-rose-50/55">우선 확인 {cards.length}개</p>
        </div>
        <span className="rounded-full bg-rose-300/15 px-2.5 py-1 text-[11px] font-semibold text-rose-100">
          점검
        </span>
      </div>
      {cards.length > 0 ? (
        <ol className={`mt-4 grid gap-3 text-xs leading-6 text-white/72 ${compact ? "max-h-96 overflow-y-auto pr-1" : ""}`}>
          {cards.map((insight, index) => (
            <InsightCard
              key={`${insight.badge}-${insight.title}`}
              insight={insight}
              index={index}
            />
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-xs leading-6 text-white/50">현재 표시된 주요 확인 항목은 없습니다.</p>
      )}
    </div>
  );
}

function ScoreCard({
  scoreKey,
  title,
  score,
  type,
}: {
  scoreKey: string;
  title: string;
  score: number;
  type: "normal" | "risk";
}) {
  const safeScore = clampUiScore(score);
  const label = type === "risk" ? getRiskScoreLabel(safeScore) : getNormalScoreLabel(safeScore);
  const colorClass = type === "risk" ? getRiskScoreColor(safeScore) : getNormalScoreColor(safeScore);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-white/45">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{formatScore(safeScore)}점 / 100점</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${colorClass.badge}`}>
          {label}
        </span>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass.bar}`}
          style={{ width: `${safeScore}%` }}
        />
      </div>
      <p className="mt-3 text-xs leading-6 text-white/58">{getScoreDescription(scoreKey, safeScore, type)}</p>
    </div>
  );
}

function IndicatorSections({
  result,
  hiddenConfirmationTitles = [],
}: {
  result: StockAnalysisViewResult;
  hiddenConfirmationTitles?: string[];
}) {
  return (
    <div className="mt-4 grid gap-3 lg:grid-cols-2">
      <IndicatorList
        title="긍정 지표"
        badge="긍정"
        items={result.evidence.positive}
        result={result}
        tone="green"
        emptyMessage="현재 뚜렷한 긍정 지표는 추가 확인이 필요합니다."
      />
      <IndicatorList
        title="중립 지표"
        badge="중립"
        items={result.evidence.neutral}
        result={result}
        tone="yellow"
        emptyMessage="현재 중립 지표는 별도로 표시되지 않았습니다."
      />
      <IndicatorList
        title="주의 지표"
        badge="주의"
        items={result.evidence.negative}
        result={result}
        tone="orange"
        emptyMessage="현재 강한 주의 신호는 감지되지 않았습니다."
      />
      <IndicatorList
        title="확인 필요 지표"
        badge="확인"
        items={result.warnings}
        result={result}
        tone="red"
        hiddenTitles={hiddenConfirmationTitles}
        emptyMessage="현재 표시된 주요 확인 항목은 없습니다."
      />
    </div>
  );
}

function IndicatorList({
  title,
  badge,
  items,
  result,
  tone,
  hiddenTitles = [],
  emptyMessage,
}: {
  title: string;
  badge: string;
  items: string[];
  result: StockAnalysisViewResult;
  tone: "green" | "yellow" | "orange" | "red";
  hiddenTitles?: string[];
  emptyMessage: string;
}) {
  const toneClass = getIndicatorToneClass(tone);
  const sectionBadge = getIndicatorSectionBadge(tone, badge);
  const insightCards = buildIndicatorCards(items, result, sectionBadge, tone).filter(
    (card) => !hiddenTitles.includes(card.title),
  );

  if (tone === "red" && insightCards.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-2xl border p-4 ${toneClass.box}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{title} {insightCards.length}개</p>
          <p className="mt-1 text-xs leading-5 text-white/52">{getIndicatorSectionSummary(tone)}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClass.badge}`}>
          {sectionBadge}
        </span>
      </div>
      {insightCards.length > 0 ? (
        <ul className="mt-4 grid gap-3 text-xs leading-6 text-white/70 xl:grid-cols-2">
          {insightCards.map((insight, index) => (
            <InsightCard
              key={`${insight.badge}-${insight.title}`}
              insight={insight}
              index={index}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs leading-6 text-white/45">{emptyMessage}</p>
      )}
    </div>
  );
}

function InsightCard({
  insight,
  index,
}: {
  insight: IndicatorInsight;
  index: number;
}) {
  return (
    <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-white/88">
          {index + 1}. {insight.title}
        </p>
        <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/75">
          {insight.badge}
        </span>
      </div>
      {insight.priority ? (
        <p className="mt-2 inline-flex rounded-full bg-rose-300/12 px-2.5 py-1 text-[10px] font-semibold text-rose-100">
          {insight.priority}
        </p>
      ) : null}
      <div className="mt-3 space-y-2">
        <InsightRow label="무슨 의미인가요?" value={insight.meaning} />
        <InsightRow label="왜 나왔나요?" value={insight.evidence} />
        <InsightRow label="무엇을 확인해야 하나요?" value={insight.nextCheck} />
      </div>
    </li>
  );
}

function InsightRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-white/45">{label}</p>
      <p className="mt-1 text-xs leading-5 text-white/68">{value}</p>
    </div>
  );
}

function DetailCard({
  title,
  items,
  muted = false,
}: {
  title: string;
  items: Array<[string, string]>;
  muted?: boolean;
}) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-black/20 p-4 ${muted ? "text-white/70" : ""}`}>
      <p className="text-sm font-semibold text-white/82">{title}</p>
      <div className="mt-4 grid gap-2">
        {items.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 text-xs">
            <span className="text-white/45">{label}</span>
            <span className="text-right font-semibold text-white/75">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoPill({ label, value, rawValue }: { label: string; value: string; rawValue?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs text-white/42">{label}</p>
      <p className="mt-2 break-all text-sm font-semibold text-white/82">{value}</p>
      {rawValue ? <p className="mt-1 break-all text-[10px] text-white/35">{rawValue}</p> : null}
    </div>
  );
}

function clampUiScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.min(Math.max(score, 0), 100);
}

function getNormalScoreLabel(score: number): string {
  if (score >= 80) return "매우 좋음";
  if (score >= 60) return "양호";
  if (score >= 40) return "중립";
  if (score >= 20) return "약함";
  return "매우 약함";
}

function getRiskScoreLabel(score: number): string {
  if (score >= 80) return "매우 높음";
  if (score >= 60) return "위험 높음";
  if (score >= 40) return "보통";
  if (score >= 20) return "관리 가능";
  return "낮음";
}

function getNormalScoreColor(score: number) {
  if (score >= 80) return { bar: "bg-emerald-400", badge: "bg-emerald-300/15 text-emerald-100" };
  if (score >= 60) return { bar: "bg-teal-400", badge: "bg-teal-300/15 text-teal-100" };
  if (score >= 40) return { bar: "bg-yellow-300", badge: "bg-yellow-300/15 text-yellow-100" };
  if (score >= 20) return { bar: "bg-orange-400", badge: "bg-orange-300/15 text-orange-100" };
  return { bar: "bg-red-500", badge: "bg-red-400/15 text-red-100" };
}

function getRiskScoreColor(score: number) {
  if (score >= 80) return { bar: "bg-red-800", badge: "bg-red-500/20 text-red-100" };
  if (score >= 60) return { bar: "bg-red-500", badge: "bg-red-400/15 text-red-100" };
  if (score >= 40) return { bar: "bg-yellow-300", badge: "bg-yellow-300/15 text-yellow-100" };
  if (score >= 20) return { bar: "bg-emerald-400", badge: "bg-emerald-300/15 text-emerald-100" };
  return { bar: "bg-green-400", badge: "bg-green-300/15 text-green-100" };
}

function getActionPriorityLabel(score: number): string {
  if (score >= 80) return "매우 높음";
  if (score >= 60) return "높음";
  if (score >= 40) return "보통";
  if (score >= 20) return "관리 가능";
  return "낮음";
}

function getActionPriorityColor(score: number) {
  if (score >= 80) return { bar: "bg-red-800", badge: "bg-red-500/20 text-red-100" };
  if (score >= 60) return { bar: "bg-red-500", badge: "bg-red-400/15 text-red-100" };
  if (score >= 40) return { bar: "bg-yellow-300", badge: "bg-yellow-300/15 text-yellow-100" };
  if (score >= 20) return { bar: "bg-orange-400", badge: "bg-orange-300/15 text-orange-100" };
  return { bar: "bg-emerald-400", badge: "bg-emerald-300/15 text-emerald-100" };
}

function getQualitySignalLevelLabel(level: QualitySignalLevel | undefined): string {
  if (level === "CRITICAL") return "보조 분석 기준 매우 높음";
  if (level === "HIGH") return "단기 확인 우선순위 높음";
  if (level === "MEDIUM") return "보조 위험 신호 보통";
  if (level === "LOW") return "보조 위험 신호 낮음";
  return "보조 분석 확인";
}

function getRiskGateSeverityLabel(severity: RiskGateSeverity | undefined): string {
  if (severity === "NONE") return "게이트 없음";
  if (severity === "WATCH") return "관찰";
  if (severity === "CAUTION") return "주의";
  if (severity === "HIGH_RISK") return "고위험";
  if (severity === "BLOCK") return "분석 제한";
  return "게이트 확인";
}

function getRiskGateOverlayColor(score: number, severity: RiskGateSeverity | undefined) {
  if (severity === "BLOCK") return { bar: "bg-red-800", badge: "bg-red-500/20 text-red-100" };
  if (severity === "HIGH_RISK" || score >= 80) return { bar: "bg-red-700", badge: "bg-red-500/20 text-red-100" };
  if (severity === "CAUTION" || score >= 55) return { bar: "bg-orange-500", badge: "bg-orange-300/15 text-orange-100" };
  if (severity === "WATCH" || score >= 30) return { bar: "bg-yellow-300", badge: "bg-yellow-300/15 text-yellow-100" };
  return { bar: "bg-slate-400", badge: "bg-slate-300/15 text-slate-100" };
}

function getActionPriorityDescription(score: number): string {
  if (score >= 80) {
    return "대응 우선순위 점수는 현재 종목을 얼마나 우선적으로 점검해야 하는지를 나타내는 점수입니다. 점수가 높을수록 매수 신호가 강하다는 뜻이 아니라, VWAP 이탈, 추세 훼손, 변동성 확대, 약한 종가 위치 같은 조건을 더 신중하게 확인해야 한다는 의미입니다.";
  }

  if (score >= 60) {
    return "현재 종목에는 우선 확인할 조건이 일부 존재합니다. VWAP 위치, 종가 회복 여부, 변동성 확대 여부를 먼저 점검해야 합니다.";
  }

  return "현재 대응 우선순위는 과도하게 높은 구간은 아닙니다. 다만 가격 위치와 리스크 신호가 바뀌는지 계속 확인해야 합니다.";
}

function getScoreDescription(scoreKey: string, score: number, type: "normal" | "risk"): string {
  if (type === "risk") {
    const riskText =
      score >= 60
        ? "위험 신호가 강해진 상태입니다. 가격 위치, VWAP 회복 여부, 변동성 확대 여부를 함께 확인해야 합니다."
        : "위험 수준은 과도한 구간은 아니지만, 세부 약세 신호가 동시에 나타나는지 계속 점검해야 합니다.";

    const riskDescriptions: Record<string, string> = {
      riskScore: `전체 리스크를 종합한 점수입니다. ${riskText}`,
      volumeRiskScore:
        "거래량 증가가 가격 회복을 동반하지 못하면 분배성 물량일 수 있습니다. 거래량과 종가 위치가 같은 방향인지 확인해야 합니다.",
      vwapRiskScore:
        "VWAP를 안정적으로 지지하지 못하면 단기 반등 신뢰도가 낮아질 수 있습니다. VWAP 재회복과 유지 여부가 중요합니다.",
      overheatingRiskScore:
        "단기 과열 위험은 가격이 빠르게 오른 뒤 변동성이 커질 가능성을 뜻합니다. 상승폭과 VWAP 이격률을 함께 확인해야 합니다.",
      volatilityRiskScore:
        "변동성 위험은 장중 가격 흔들림이 큰 상태를 뜻합니다. 고점 돌파보다 종가가 어느 위치에 남았는지가 중요합니다.",
      distributionRiskScore:
        "윗꼬리와 거래량이 함께 커지면 상단 매물 부담이 커질 수 있습니다. 가격이 고점권을 유지하는지 확인해야 합니다.",
      vwapBreakdownRiskScore:
        "VWAP 이탈 위험은 평균 거래 단가 아래에서 가격이 머무는지를 봅니다. 회복 실패가 반복되면 단기 신뢰도가 낮아질 수 있습니다.",
      lowLiquidityOrWeakParticipationRiskScore:
        "거래 참여 약화 위험은 가격 움직임을 뒷받침하는 참여가 충분한지 봅니다. 거래량 회복 여부를 확인해야 합니다.",
      trendCollapseRiskScore:
        "추세 붕괴 위험은 주요 가격선과 종가 위치가 약해졌는지 봅니다. VWAP와 종가 회복 여부를 함께 점검해야 합니다.",
    };

    return riskDescriptions[scoreKey] || riskText;
  }

  const normalDescriptions: Record<string, string> = {
    finalScore:
      "가격, 거래량, VWAP, 상태 분류, 대응 라벨을 함께 반영한 종합 구조 점수입니다. 높을수록 구조가 안정적으로 정렬된 상태입니다.",
    stateScore:
      "현재 상태가 좋다는 의미가 아니라, AI가 현재 종목을 특정 상태로 얼마나 뚜렷하게 분류했는지를 나타냅니다. 점수가 높을수록 현재 분류 결과의 근거가 강하다는 뜻입니다.",
    confidenceScore:
      "가장 높은 상태 분류와 다른 후보 상태의 차이를 반영합니다. 높을수록 현재 해석의 일관성이 좋습니다.",
    closePositionScore:
      "종가가 당일 고가와 저가 사이에서 어디에 마감했는지 보여줍니다. 높을수록 마감 위치가 강합니다.",
    week52PositionScore:
      "현재 가격이 52주 범위에서 어느 위치인지 보여줍니다. 극단값이 아니라면 다른 지표와 함께 해석해야 합니다.",
    volumeScore:
      "거래량이 평균 대비 얼마나 의미 있게 유지되는지 보여줍니다. 가격 회복과 함께 나타날 때 신뢰도가 높아집니다.",
    vwapScore:
      "가격이 평균 거래 단가인 VWAP 기준으로 얼마나 안정적인 위치에 있는지 보여줍니다. 낮으면 VWAP 회복 여부가 중요합니다.",
  };

  return normalDescriptions[scoreKey] || "현재 점수가 높을수록 해당 조건이 긍정적으로 정렬되어 있음을 의미합니다.";
}

function getIndicatorToneClass(tone: "green" | "yellow" | "orange" | "red") {
  if (tone === "green") {
    return { box: "border-emerald-300/15 bg-emerald-300/[0.05] text-emerald-50", badge: "bg-emerald-300/15 text-emerald-100" };
  }
  if (tone === "yellow") {
    return { box: "border-yellow-300/15 bg-yellow-300/[0.05] text-yellow-50", badge: "bg-yellow-300/15 text-yellow-100" };
  }
  if (tone === "orange") {
    return { box: "border-orange-300/15 bg-orange-300/[0.05] text-orange-50", badge: "bg-orange-300/15 text-orange-100" };
  }
  return { box: "border-rose-300/15 bg-rose-300/[0.05] text-rose-50", badge: "bg-rose-300/15 text-rose-100" };
}

type IndicatorInsight = {
  title: string;
  badge: string;
  categoryKey: SignalType;
  priority?: string;
  meaning: string;
  evidence: string;
  nextCheck: string;
};

type IndicatorCategory = "green" | "yellow" | "orange" | "red" | "confirmation";

type SignalType =
  | "vwap"
  | "vwapFake"
  | "trend"
  | "volatility"
  | "close"
  | "volume"
  | "week52"
  | "positive"
  | "neutral"
  | "generic";

function buildIndicatorCards(
  items: string[],
  result: StockAnalysisViewResult,
  badge: string,
  category: IndicatorCategory,
): IndicatorInsight[] {
  const cards = items
    .filter(Boolean)
    .map((item, index) => getIndicatorInsight(item, result, index, badge, category));
  const cardMap = new Map<string, IndicatorInsight>();

  for (const card of cards) {
    const key = `${category}-${card.title}`;
    const existing = cardMap.get(key);

    if (!existing || getPriorityRank(card.priority) > getPriorityRank(existing.priority)) {
      cardMap.set(key, card);
    }
  }

  return Array.from(cardMap.values());
}

function getTopConfirmationCards(
  items: string[],
  result: StockAnalysisViewResult,
  limit: number,
): IndicatorInsight[] {
  const cards = buildIndicatorCards(items, result, "확인 필요", "confirmation");
  const bestByGroup = new Map<string, IndicatorInsight>();

  for (const card of buildScoreBasedConfirmationCandidates(result)) {
    bestByGroup.set(getConfirmationGroup(card.categoryKey), card);
  }

  for (const card of cards) {
    const group = getConfirmationGroup(card.categoryKey);
    const current = bestByGroup.get(group);
    if (!current || shouldReplaceConfirmationCard(current, card, result)) {
      bestByGroup.set(group, card);
    }
  }

  const uniqueCards = Array.from(bestByGroup.values()).sort(
    (a, b) => getConfirmationSortScore(b, result) - getConfirmationSortScore(a, result),
  );
  if (uniqueCards.length >= limit) return uniqueCards.slice(0, limit);

  const selected = [...uniqueCards];
  for (const card of cards) {
    if (selected.includes(card)) continue;
    selected.push(card);
    if (selected.length >= limit) return selected;
  }

  return selected;
}

function buildScoreBasedConfirmationCandidates(result: StockAnalysisViewResult): IndicatorInsight[] {
  const candidates: IndicatorInsight[] = [];

  if (result.risk.trendCollapseRiskScore >= 80) {
    candidates.push(createConfirmationInsight("trend", result));
  }
  if (
    result.vwap.vwapScore <= 40 ||
    result.vwap.vwapRiskScore >= 70 ||
    result.risk.vwapBreakdownRiskScore >= 70
  ) {
    candidates.push(createConfirmationInsight("vwap", result));
  }
  if (result.ohlc.closePositionScore <= 30) {
    candidates.push(createConfirmationInsight("close", result));
  }
  if (result.risk.volatilityRiskScore >= 70) {
    candidates.push(createConfirmationInsight("volatility", result));
  }
  if (
    result.volume.volumeScore >= 50 &&
    (result.ohlc.closePositionScore <= 30 || result.vwap.vwapScore <= 40)
  ) {
    candidates.push(createConfirmationInsight("volume", result));
  }

  return candidates;
}

function createConfirmationInsight(signalType: SignalType, result: StockAnalysisViewResult): IndicatorInsight {
  const title = getIndicatorTitle(signalType, "confirmation", result);

  if (signalType === "trend") {
    return {
      title,
      badge: "확인 필요",
      categoryKey: signalType,
      priority: getConfirmationPriority(signalType, title, result),
      meaning: "추세 약화가 일회성인지 반복되는 흐름인지 확인해야 하는 상태입니다.",
      evidence: `추세 붕괴 위험 ${formatScore(result.risk.trendCollapseRiskScore)}점, 종가 위치 점수 ${formatScore(result.ohlc.closePositionScore)}점 기준으로 주요 기준선 회복 여부가 중요합니다.`,
      nextCheck: "다음 거래일 VWAP와 주요 가격선을 회복하는지, 약한 종가가 반복되는지 확인해야 합니다.",
    };
  }

  if (signalType === "vwap") {
    return {
      title,
      badge: "확인 필요",
      categoryKey: signalType,
      priority: getConfirmationPriority(signalType, title, result),
      meaning: `가격이 평균 거래 단가 아래에 있어 단기 신뢰도 확인이 필요합니다. 현재 VWAP 이격률은 ${formatPercent(result.vwap.vwapDistancePercent)}입니다.`,
      evidence: `VWAP 점수 ${formatScore(result.vwap.vwapScore)}점, VWAP 리스크 점수 ${formatScore(result.vwap.vwapRiskScore)}점, VWAP 이탈 위험 ${formatScore(result.risk.vwapBreakdownRiskScore)}점 기준입니다.`,
      nextCheck: "다음 거래일 가격이 VWAP 위로 회복한 뒤 종가까지 유지되는지 확인해야 합니다.",
    };
  }

  if (signalType === "close") {
    return {
      title,
      badge: "확인 필요",
      categoryKey: signalType,
      priority: getConfirmationPriority(signalType, title, result),
      meaning: "장 마감 기준 가격 방어력이 약했는지 확인해야 하는 상태입니다.",
      evidence: `종가 위치 점수 ${formatScore(result.ohlc.closePositionScore)}점, 장중 변동폭 ${formatPercent(result.ohlc.intradayRangePercent)} 기준으로 마감 위치를 점검합니다.`,
      nextCheck: "다음 거래일 종가가 저가권을 벗어나 중상단 이상에서 마감되는지 확인해야 합니다.",
    };
  }

  if (signalType === "volatility") {
    return {
      title,
      badge: "확인 필요",
      categoryKey: signalType,
      priority: getConfirmationPriority(signalType, title, result),
      meaning: "장중 흔들림이 커진 뒤 마감 위치까지 약해지는지 확인해야 하는 상태입니다.",
      evidence: `변동성 위험 ${formatScore(result.risk.volatilityRiskScore)}점, 장중 변동폭 ${formatPercent(result.ohlc.intradayRangePercent)}, 종가 위치 점수 ${formatScore(result.ohlc.closePositionScore)}점 기준입니다.`,
      nextCheck: "다음 거래일 변동폭이 줄어들고 종가 위치가 개선되는지 확인해야 합니다.",
    };
  }

  return {
    title,
    badge: "확인 필요",
    categoryKey: signalType,
    priority: getConfirmationPriority(signalType, title, result),
    meaning: "거래 참여가 가격 회복으로 연결되는지 확인해야 하는 상태입니다.",
    evidence: `거래량 점수 ${formatScore(result.volume.volumeScore)}점, 20일 평균 대비 거래량 ${formatPercent(result.volume.volumeRatio20d)}, VWAP 점수 ${formatScore(result.vwap.vwapScore)}점 기준입니다.`,
    nextCheck: "거래량 증가가 종가 회복과 VWAP 회복을 함께 동반하는지 확인해야 합니다.",
  };
}

function getConfirmationGroup(signalType: SignalType): string {
  if (signalType === "vwap" || signalType === "vwapFake") return "vwap";
  return signalType;
}

function shouldReplaceConfirmationCard(
  current: IndicatorInsight,
  candidate: IndicatorInsight,
  result: StockAnalysisViewResult,
): boolean {
  const currentGroup = getConfirmationGroup(current.categoryKey);
  const candidateGroup = getConfirmationGroup(candidate.categoryKey);

  if (currentGroup === "vwap" && candidateGroup === "vwap") {
    if (candidate.categoryKey === "vwap" && current.categoryKey !== "vwap") return true;
    if (current.categoryKey === "vwap" && candidate.categoryKey !== "vwap") return false;
  }

  return getConfirmationSortScore(candidate, result) > getConfirmationSortScore(current, result);
}

function getConfirmationSortScore(card: IndicatorInsight, result: StockAnalysisViewResult): number {
  let score = getPriorityRank(card.priority) * 100 + getConfirmationOrderWeight(card.categoryKey);

  if (card.categoryKey === "trend") score += result.risk.trendCollapseRiskScore + 30;
  else if (card.categoryKey === "vwap" || card.categoryKey === "vwapFake") {
    score += Math.max(result.vwap.vwapRiskScore, result.risk.vwapBreakdownRiskScore) + 20;
  } else if (card.categoryKey === "close") score += 100 - result.ohlc.closePositionScore + 15;
  else if (card.categoryKey === "volatility") score += result.risk.volatilityRiskScore + 10;
  else if (card.categoryKey === "volume") score += result.volume.volumeScore;
  else score += 10;

  return score;
}

function getConfirmationOrderWeight(signalType: SignalType): number {
  const group = getConfirmationGroup(signalType);
  if (group === "trend") return 50;
  if (group === "vwap") return 40;
  if (group === "close") return 30;
  if (group === "volatility") return 20;
  if (group === "volume") return 10;
  return 0;
}

function getPriorityRank(priority: string | undefined): number {
  if (priority === "최우선 확인") return 3;
  if (priority === "중요 확인") return 2;
  if (priority === "보조 확인") return 1;
  return 0;
}

function getIndicatorSectionSummary(tone: "green" | "yellow" | "orange" | "red"): string {
  if (tone === "green") {
    return "현재 완전한 강세 신호는 아니지만, 일부 방어 또는 회복 가능성 신호가 남아 있습니다.";
  }
  if (tone === "yellow") {
    return "현재 지표들이 한 방향으로 완전히 정렬되지 않아 단독 판단보다 추가 확인이 필요한 구간입니다.";
  }
  if (tone === "orange") {
    return "단기 가격 약화, 약한 종가 위치, VWAP 하회 등 주의해야 할 신호가 감지되었습니다.";
  }
  return "우선 확인해야 할 조건들입니다. 다음 거래일 가격 회복, VWAP 유지, 종가 위치 개선 여부를 중심으로 확인해야 합니다.";
}

function getIndicatorSectionBadge(tone: "green" | "yellow" | "orange" | "red", fallback: string): string {
  if (tone === "green") return "제한적 긍정";
  if (tone === "yellow") return "판단 보류";
  if (tone === "orange") return "주의";
  if (tone === "red") return "확인 필요";
  return fallback;
}

function getIndicatorInsight(
  message: string,
  result: StockAnalysisViewResult,
  index: number,
  badge: string,
  category: IndicatorCategory,
): IndicatorInsight {
  const detail = getIndicatorDetailMessage(message);
  const signalType = getSignalType(message, detail, category);
  const title = getIndicatorTitle(signalType, category, result);
  const priority = category === "confirmation" || category === "red" ? getConfirmationPriority(signalType, detail, result) : undefined;

  if (signalType === "vwap" || signalType === "vwapFake") {
    return {
      title,
      badge,
      categoryKey: signalType,
      priority,
      meaning: `가격이 평균 거래 단가 아래에 있어 단기 반등 신뢰도가 낮아질 수 있는 상태입니다. 현재 VWAP 이격률은 ${formatPercent(result.vwap.vwapDistancePercent)}입니다.`,
      evidence: `VWAP 점수 ${formatScore(result.vwap.vwapScore)}점, VWAP 리스크 점수 ${formatScore(result.vwap.vwapRiskScore)}점 기준으로 평균 단가 회복 여부가 핵심 확인 기준입니다.`,
      nextCheck: "다음 거래일 가격이 VWAP 위로 회복한 뒤 종가까지 유지되는지 확인해야 합니다.",
    };
  }

  if (signalType === "trend") {
    return {
      title,
      badge,
      categoryKey: signalType,
      priority,
      meaning: "현재 흐름이 단순 조정이 아니라 추세 약화로 이어질 가능성을 점검해야 합니다.",
      evidence: `추세 붕괴 위험 ${formatScore(result.risk.trendCollapseRiskScore)}점이며, 종가 위치 점수 ${formatScore(result.ohlc.closePositionScore)}점이 함께 약하면 주요 기준선 회복 실패 가능성이 커집니다.`,
      nextCheck: "VWAP와 주요 가격선을 회복하는지, 약한 종가가 반복되는지 확인해야 합니다.",
    };
  }

  if (signalType === "volatility") {
    return {
      title,
      badge,
      categoryKey: signalType,
      priority,
      meaning: "장중 흔들림이 커져 가격 신호의 안정성이 낮아진 상태입니다.",
      evidence: `변동성 위험 ${formatScore(result.risk.volatilityRiskScore)}점, 장중 변동폭 ${formatPercent(result.ohlc.intradayRangePercent)} 기준으로 가격 신호가 흔들릴 수 있습니다.`,
      nextCheck: "다음 거래일 변동폭이 줄어들고 종가가 중상단 이상에 남는지 확인해야 합니다.",
    };
  }

  if (signalType === "close") {
    return {
      title,
      badge,
      categoryKey: signalType,
      priority,
      meaning: "장 마감으로 갈수록 매도 압력이 우세했을 가능성을 확인해야 하는 상태입니다.",
      evidence: `종가 위치 점수 ${formatScore(result.ohlc.closePositionScore)}점 기준으로 마감 기준 가격 방어력이 낮았는지 확인합니다.`,
      nextCheck: "다음 거래일 시초가와 초반 회복 여부, 그리고 종가가 저가권을 벗어나는지 확인해야 합니다.",
    };
  }

  if (signalType === "volume") {
    return {
      title,
      badge,
      categoryKey: signalType,
      priority,
      meaning: "거래량은 유지되고 있지만 가격 회복이 약하면 우위 흐름으로 보기 어렵습니다.",
      evidence: `거래량 점수 ${formatScore(result.volume.volumeScore)}점, 20일 평균 대비 거래량 ${formatPercent(result.volume.volumeRatio20d)} 기준으로 관심은 유지되지만, 가격 회복과 VWAP 회복이 함께 확인되어야 합니다.`,
      nextCheck: "거래량 증가가 종가 회복과 VWAP 회복을 함께 동반하는지 확인해야 합니다.",
    };
  }

  if (signalType === "week52") {
    return {
      title,
      badge,
      categoryKey: signalType,
      priority,
      meaning: "장기 위치가 양호해도 단기 흐름이 약하면 고점 부담이 생길 수 있습니다.",
      evidence: `52주 위치 점수 ${formatScore(result.ohlc.week52PositionScore)}점, VWAP 점수 ${formatScore(result.vwap.vwapScore)}점, 종가 위치 점수 ${formatScore(result.ohlc.closePositionScore)}점 기준으로 장기 위치와 단기 흐름이 충돌하는지 확인합니다.`,
      nextCheck: "고점권에서 가격이 버티는지, 아니면 저가권으로 밀리는지 확인해야 합니다.",
    };
  }

  if (signalType === "positive") {
    return {
      title,
      badge,
      categoryKey: signalType,
      priority,
      meaning: "이 항목은 직접적인 강세 신호가 아니라, 현재 구조가 즉시 붕괴된 상태는 아니라는 제한적 긍정 신호입니다.",
      evidence: `종합 리스크 점수 ${formatScore(result.risk.riskScore)}점과 현재 상태 분류를 함께 보면 방어 가능성은 남아 있습니다.`,
      nextCheck: "VWAP 회복 여부와 종가 위치 개선 여부가 함께 나타나는지 확인해야 합니다.",
    };
  }

  return {
    title,
    badge,
    categoryKey: signalType,
    priority,
    meaning: category === "yellow" ? "현재 지표가 한 방향으로 완전히 정렬되지 않아 판단을 보류해야 하는 상태입니다." : "현재 리스크 조건을 추가로 확인해야 하는 상태입니다.",
    evidence: detail,
    nextCheck: "가장 약한 지표가 먼저 개선되는지 확인하고, 다음 종가 흐름이 현재 해석을 강화하는지 점검해야 합니다.",
  };
}

function isVwapMessage(message: string): boolean {
  return message.includes("VWAP") || message.includes("평균 거래 단가") || message.includes("평균 단가");
}

function getSignalType(message: string, detail: string, category: IndicatorCategory): SignalType {
  const text = `${message} ${detail}`;

  if (category === "green") return "positive";
  if (isVwapMessage(text) && text.includes("가짜 강세")) return "vwapFake";
  if (isVwapMessage(text)) return "vwap";
  if (text.includes("추세 붕괴") || text.includes("추세 훼손") || text.includes("추세 약화")) return "trend";
  if (text.includes("변동성") || text.includes("장중 변동") || text.includes("변동폭")) return "volatility";
  if (text.includes("종가") || text.includes("저가권")) return "close";
  if (text.includes("전일 대비") || text.includes("하락폭")) return "close";
  if (text.includes("거래량")) return "volume";
  if (text.includes("52주")) return "week52";
  if (category === "yellow") return "neutral";
  return "generic";
}

function getIndicatorTitle(
  signalType: SignalType,
  category: IndicatorCategory,
  result: StockAnalysisViewResult,
): string {
  if (category === "green") {
    if (result.risk.riskScore < 60) return "종합 리스크 과도 구간 아님";
    if (result.volume.volumeScore >= 45) return "거래 참여 완전 약화 아님";
    return "회복 가능성 일부 존재";
  }

  if (signalType === "vwapFake") return "VWAP 약세 / 가짜 강세 확인";
  if (signalType === "vwap") return "VWAP 회복 여부 확인";
  if (signalType === "trend") return "추세 훼손 반복 여부 확인";
  if (signalType === "volatility") return "장중 변동성 확대 후 종가 위치 확인";
  if (signalType === "close") return "종가 저가권 마감 확인";
  if (signalType === "volume") return "거래량과 가격 회복 동반 여부 확인";
  if (signalType === "week52") return "52주 위치와 단기 흐름 충돌 확인";
  if (signalType === "neutral") return "혼재 신호 추가 확인";
  return "리스크 조건 추가 확인";
}

function getConfirmationPriority(signalType: SignalType, message: string, result: StockAnalysisViewResult): string {
  if (
    ((signalType === "vwap" || signalType === "vwapFake") && result.vwap.vwapRiskScore >= 70) ||
    (signalType === "trend" && result.risk.trendCollapseRiskScore >= 80)
  ) {
    return "최우선 확인";
  }

  if (
    signalType === "volatility" ||
    signalType === "close" ||
    result.risk.volatilityRiskScore >= 70 ||
    result.ohlc.closePositionScore <= 20
  ) {
    return "중요 확인";
  }

  return "보조 확인";
}

function buildOneLineInterpretation(result: StockAnalysisViewResult): string {
  const positive = getStrongestPositiveFactor(result);
  const negative = getStrongestRiskFactor(result);

  if (result.risk.vwapBreakdownRiskScore >= 70 && result.risk.trendCollapseRiskScore >= 80) {
    return `현재 종목은 ${positive}은 일부 유지되고 있으나, ${negative}이 동시에 강해 단기 신뢰도는 낮은 상태입니다.`;
  }
  if (result.ohlc.closePositionScore <= 20) {
    return `현재 종목은 ${positive}은 남아 있지만, 종가 위치 점수 ${formatScore(result.ohlc.closePositionScore)}점으로 장 마감 기준 매도 압력이 우세했을 가능성이 있습니다.`;
  }
  if (result.volume.volumeScore >= 50 && result.risk.riskScore < 60) {
    return `거래량 점수 ${formatScore(result.volume.volumeScore)}점으로 관심은 유지되고 있으며, 종합 리스크 점수 ${formatScore(result.risk.riskScore)}점 기준으로 전체 위험은 아직 극단 구간은 아닙니다.`;
  }
  if (result.vwap.vwapRiskScore >= 70 || result.risk.trendCollapseRiskScore >= 70) {
    return `현재 종목은 ${positive}은 있으나, ${negative} 때문에 단기적으로는 회복 여부를 신중하게 확인해야 하는 상태입니다.`;
  }
  return "현재 종목은 가격 위치, 거래량, VWAP, 리스크 신호가 혼재되어 다음 흐름 확인이 필요한 상태입니다.";
}

function buildStateReasoning(result: StockAnalysisViewResult): string[] {
  const reasons: string[] = [];

  if (result.vwap.vwapScore < 50) {
    reasons.push(`VWAP 점수 ${formatScore(result.vwap.vwapScore)}점으로 평균 거래 단가 기준 약세입니다.`);
  }
  if (result.vwap.vwapRiskScore >= 60) {
    reasons.push(`VWAP 이탈 위험 ${formatScore(result.vwap.vwapRiskScore)}점으로 평균 단가 회복 실패 위험이 높습니다.`);
  }
  if (result.ohlc.closePositionScore <= 40) {
    reasons.push(`종가 위치 점수 ${formatScore(result.ohlc.closePositionScore)}점으로 장 마감 기준 매도 압력이 우세했을 가능성이 있습니다.`);
  }
  if (result.risk.trendCollapseRiskScore >= 60) {
    reasons.push(`추세 붕괴 위험 ${formatScore(result.risk.trendCollapseRiskScore)}점으로 주요 가격선 회복 여부를 우선 확인해야 합니다.`);
  }
  if (result.risk.volatilityRiskScore >= 60) {
    reasons.push(`변동성 위험 ${formatScore(result.risk.volatilityRiskScore)}점과 장중 변동폭 ${formatPercent(result.ohlc.intradayRangePercent)} 기준으로 가격 신호의 안정성을 추가 확인해야 합니다.`);
  }

  if (reasons.length === 0) {
    reasons.push(`종합 점수 ${formatScore(result.finalScore)}점, 리스크 점수 ${formatScore(result.risk.riskScore)}점 기준으로 여러 조건이 혼재되어 추가 확인이 필요합니다.`);
  }

  return reasons;
}

function buildCrossScoreInterpretation(result: StockAnalysisViewResult): string {
  return `52주 위치 점수는 ${formatScore(result.ohlc.week52PositionScore)}점으로 장기 가격 위치를 참고할 수 있습니다. 하지만 VWAP 점수 ${formatScore(result.vwap.vwapScore)}점, 종가 위치 점수 ${formatScore(result.ohlc.closePositionScore)}점, 추세 붕괴 위험 ${formatScore(result.risk.trendCollapseRiskScore)}점이 함께 약하게 나타나면 단기적으로는 주의 신호가 더 강하게 해석됩니다.`;
}

function buildCustomerTakeaways(result: StockAnalysisViewResult): Array<{ label: string; value: string }> {
  return [
    {
      label: "가장 강한 위험 신호",
      value: `${getStrongestRiskFactor(result)}입니다.`,
    },
    {
      label: "아직 남아 있는 긍정 신호",
      value: `${getStrongestPositiveFactor(result)}으로 관심이 완전히 꺼진 상태는 아닙니다.`,
    },
    {
      label: "다음 거래일 핵심 확인 조건",
      value: getNextSessionCheck(result),
    },
  ];
}

function getStrongestRiskFactor(result: StockAnalysisViewResult): string {
  const risks = [
    { label: `추세 붕괴 위험 ${formatScore(result.risk.trendCollapseRiskScore)}점`, score: result.risk.trendCollapseRiskScore },
    { label: `VWAP 이탈 위험 ${formatScore(result.risk.vwapBreakdownRiskScore)}점`, score: result.risk.vwapBreakdownRiskScore },
    { label: `변동성 위험 ${formatScore(result.risk.volatilityRiskScore)}점`, score: result.risk.volatilityRiskScore },
    { label: `분배/가짜 돌파 위험 ${formatScore(result.risk.distributionRiskScore)}점`, score: result.risk.distributionRiskScore },
  ];

  return risks.sort((a, b) => b.score - a.score)[0].label;
}

function getStrongestPositiveFactor(result: StockAnalysisViewResult): string {
  const positives = [
    { label: `52주 위치 점수 ${formatScore(result.ohlc.week52PositionScore)}점`, score: result.ohlc.week52PositionScore },
    { label: `거래량 점수 ${formatScore(result.volume.volumeScore)}점`, score: result.volume.volumeScore },
    { label: `종합 리스크 점수 ${formatScore(result.risk.riskScore)}점으로 극단 위험은 아님`, score: 100 - result.risk.riskScore },
  ];

  return positives.sort((a, b) => b.score - a.score)[0].label;
}

function getNextSessionCheck(result: StockAnalysisViewResult): string {
  if (result.vwap.vwapRiskScore >= 60 || result.vwap.vwapScore < 50) {
    return "VWAP 회복 여부와 종가가 VWAP 위에서 유지되는지 확인해야 합니다.";
  }
  if (result.ohlc.closePositionScore <= 40) {
    return "종가가 저가권을 벗어나 중상단 이상으로 회복되는지 확인해야 합니다.";
  }
  return "거래량이 유지되는 상태에서 종가와 VWAP 위치가 함께 개선되는지 확인해야 합니다.";
}

function getIndicatorDetailMessage(message: string): string {
  const detailMap: Record<string, string> = {
    "VWAP 관련 약세 또는 가짜 강세 위험이 높습니다.":
      "현재 가격이 평균 거래 단가인 VWAP 아래에 위치해 있어, 장중 반등이 나오더라도 실제 매수세가 강하게 유입된 상승인지 확인이 필요합니다. 특히 VWAP를 회복하지 못한 상태에서 일시적으로 가격만 반등했다면, 단기 매수세가 약한 가짜 강세일 가능성이 있습니다.",
    "장중 변동성이 높아 신호 안정성이 낮아질 수 있습니다.":
      "오늘 장중 고가와 저가의 차이가 크게 벌어진 상태라면, 가격 신호가 안정적으로 유지되기보다 단기 수급과 심리에 따라 흔들렸을 가능성이 큽니다. 이런 구간에서는 단순 상승 또는 하락만 보기보다, 변동폭이 확대된 이후 종가가 어느 위치에 마감했는지 함께 확인해야 합니다.",
    "추세 붕괴 위험이 높아 상태 유지 조건 확인이 필요합니다.":
      "현재 가격 흐름이 기존 상승 또는 반등 구조를 유지하지 못하고 주요 기준선 아래로 밀렸을 가능성이 있습니다. 특히 종가가 약하고 VWAP 회복도 실패했다면, 단기 추세가 단순 조정이 아니라 약세 전환으로 바뀌는 구간인지 확인해야 합니다.",
    "VWAP 이탈 또는 평균 단가 하회 위험을 점검해야 합니다.":
      "현재 가격이 장중 평균 거래 단가인 VWAP를 하회하고 있다면, 당일 매수한 투자자들의 평균 단가보다 낮은 위치에서 거래되고 있다는 의미입니다. 이 상태가 지속되면 단기 매수세보다 매도 압력이 우세할 수 있으므로, VWAP 재돌파 여부와 재이탈 여부를 함께 확인해야 합니다.",
    "VWAP 약세 위험 점수가 높습니다.":
      "VWAP 관련 위험 점수가 높다는 것은 가격이 평균 거래 단가를 안정적으로 지지하지 못하고 있다는 뜻입니다. 단기 반등이 나오더라도 VWAP 위에서 유지되지 못하면 상승 신뢰도는 낮아지고, 다시 매도 압력이 커질 수 있습니다.",
    "현재 종합 리스크는 통제 가능한 범위로 평가됩니다.":
      "현재 전체 리스크 점수는 극단적인 위험 구간까지 올라간 상태는 아닙니다. 즉, 일부 약세 신호가 있더라도 종목 구조가 즉시 붕괴된 상태로 보기는 어렵고, VWAP 회복 여부와 종가 위치 개선 여부에 따라 단기 흐름이 다시 안정될 가능성은 남아 있습니다.",
    "리스크 점수가 과도하게 높지 않아 현재 구조가 급격히 훼손된 상태는 아닙니다.":
      "종합 리스크가 과도하게 높지 않다는 것은 현재 가격 구조가 완전히 무너진 상태는 아니라는 의미입니다. 다만 세부 리스크 중 VWAP 이탈 위험이나 추세 붕괴 위험이 높다면, 전체 리스크가 보통이어도 단기 대응은 신중하게 해야 합니다.",
    "리스크 점수가 과도하지 않아 단기 구조가 완전히 훼손된 상태는 아닙니다.":
      "종합 리스크가 과도하게 높지 않다는 것은 현재 가격 구조가 완전히 무너진 상태는 아니라는 의미입니다. 다만 세부 리스크 중 VWAP 이탈 위험이나 추세 붕괴 위험이 높다면, 전체 리스크가 보통이어도 단기 대응은 신중하게 해야 합니다.",
    "거래량 점수가 일정 수준 이상으로 확인되어 관심 구간으로 볼 수 있습니다.":
      "거래량 점수가 일정 수준 이상이라는 것은 시장 참여가 완전히 식은 상태는 아니라는 의미입니다. 가격이 약하더라도 거래가 유지되고 있다면, 향후 VWAP 회복이나 종가 반등이 나올 때 관심 구간으로 전환될 수 있습니다.",
    "52주 가격 위치는 극단 구간이 아니어서 단독 판단보다는 다른 신호와 함께 봐야 합니다.":
      "현재 가격의 52주 위치는 지나치게 낮거나 지나치게 높은 극단 구간으로만 해석하기 어렵습니다. 따라서 이 지표 하나만으로 저평가 또는 고평가를 판단하기보다는, 최근 거래량 변화, VWAP 위치, 종가 마감 위치, 추세 유지 여부를 함께 확인해야 합니다.",
    "장중 변동폭 확대 구간에서는 가격 신호의 지속성을 추가로 확인해야 합니다.":
      "장중 변동폭이 확대된 날에는 가격이 한 방향으로 안정적으로 움직였다기보다 매수세와 매도세가 강하게 충돌했을 가능성이 큽니다. 이런 경우 장중 고점 돌파보다 종가가 고점권에 남았는지, 또는 저가권으로 밀렸는지가 더 중요한 판단 기준이 됩니다.",
    "일부 점수는 양호하지만 상태 분류를 확정하기에는 추가 확인이 필요합니다.":
      "일부 지표가 긍정적으로 나오더라도 VWAP, 종가 위치, 변동성, 추세 위험이 서로 엇갈리면 현재 상태를 강세 또는 약세로 단정하기 어렵습니다. 이 경우 다음 거래일에 가격이 VWAP 위에서 유지되는지, 거래량이 동반되는지, 종가가 회복되는지를 추가로 확인해야 합니다.",
    "일부 조건은 양호하지만 방향성 판단에는 추가 확인이 필요합니다.":
      "일부 조건은 양호하지만 가격 위치, 거래량, VWAP, 변동성 조건이 완전히 같은 방향으로 정렬된 상태는 아닙니다. 다음 흐름에서 VWAP 유지 여부와 종가 회복 여부를 함께 확인해야 합니다.",
    "종가가 당일 저가권에 가까워 장 마감 기준 매도 압력이 우세할 수 있습니다.":
      "종가가 당일 저가권에 가깝다는 것은 장 초반이나 장중에 반등이 있었더라도 마감으로 갈수록 매도세가 우세했을 가능성이 크다는 의미입니다. 특히 저가 부근에서 마감한 날은 다음 거래일 초반에도 투자 심리가 약하게 이어질 수 있어 시초가와 초반 회복 여부를 확인해야 합니다.",
    "전일 대비 하락폭이 커 단기 가격 약화 가능성이 있습니다.":
      "전일 대비 가격 하락폭이 크다는 것은 단기적으로 매도 압력이 강하게 발생했을 가능성을 의미합니다. 단순한 하루 조정인지, 기존 추세가 약해지는 신호인지는 하락 당시 거래량, VWAP 이탈 여부, 종가 위치를 함께 봐야 판단할 수 있습니다.",
    "가격이 VWAP 아래에 있어 매도 압력 또는 평균 단가 하회 상태를 점검해야 합니다.":
      "가격이 VWAP 아래에 있다는 것은 현재 가격이 당일 평균 거래 단가보다 낮은 위치에 있다는 뜻입니다. 이는 당일 매수자들의 평균 수익 구간이 약해졌다는 의미일 수 있으며, VWAP를 회복하지 못하면 단기 매도 압력이 계속 남아 있을 가능성이 있습니다.",
  };

  if (detailMap[message]) return detailMap[message];
  if (message.includes("종가")) {
    return `종가 관련 신호입니다. 무엇이 발생했는지 보면 ${message} 다음 흐름에서는 종가가 고가권으로 회복되는지, 또는 저가권 흐름이 이어지는지를 함께 확인해야 합니다.`;
  }
  if (message.includes("VWAP")) {
    return `VWAP 관련 신호입니다. ${message} 가격이 평균 거래 단가 위에서 유지되는지, 회복 후 다시 이탈하지 않는지를 확인해야 단기 신뢰도를 판단할 수 있습니다.`;
  }
  if (message.includes("거래량")) {
    return `거래량 관련 신호입니다. ${message} 거래량 증가가 가격 회복과 함께 나타나는지, 아니면 약한 종가와 함께 나타나는지를 구분해 확인해야 합니다.`;
  }
  if (message.includes("변동")) {
    return `변동성 관련 신호입니다. ${message} 장중 흔들림 이후 종가가 어디에 남았는지와 다음 거래일 변동폭이 줄어드는지를 확인해야 합니다.`;
  }
  if (message.includes("추세")) {
    return `추세 관련 신호입니다. ${message} 주요 가격선과 VWAP를 회복하는지, 약한 종가가 반복되는지를 확인해야 합니다.`;
  }

  return `${message} 이 신호는 단독으로 판단하기보다 가격 위치, 거래량 변화, VWAP 회복 여부, 다음 종가 흐름을 함께 확인해야 합니다.`;
}

function formatNumber(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return value.toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
  });
}

function formatPercent(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `${value.toFixed(1)}%`;
}

function formatScore(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return value.toFixed(0);
}

function formatDateTime(value: string | undefined): string {
  if (!value) return "-";

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(value: string | undefined): string {
  if (!value) return "-";

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function isDailyEodResult(result: StockAnalysisViewResult): boolean {
  return result.normalized?.analysisMode === "EOD" || result.normalized?.ohlcv?.timeframe === "1d";
}

function getDataBasisLabel(result: StockAnalysisViewResult): string {
  return isDailyEodResult(result) ? "데이터 기준일" : "데이터 기준";
}

function getDataBasisType(result: StockAnalysisViewResult, freshness?: StockDataFreshness): string {
  if (freshness?.mode === "INTRADAY") return "장중 현재가 기준";
  if (freshness?.mode === "SAMPLE") return "샘플 데이터 기준";
  if (freshness?.mode === "FALLBACK") return "대체 데이터 기준";
  return isDailyEodResult(result) ? "일봉 차트 기준" : "차트 기준";
}

function formatDataBasis(result: StockAnalysisViewResult, freshness?: StockDataFreshness): string {
  if (freshness?.baseDate && freshness.mode !== "INTRADAY") return formatDateOnly(freshness.baseDate);
  if (freshness?.baseDateTime && freshness.mode === "INTRADAY") return formatDateTime(freshness.baseDateTime);
  if (isDailyEodResult(result)) return formatDateOnly(result.normalized?.asOf);
  return formatDateTime(result.normalized?.asOf);
}

function getDataModeNotice(freshness: StockDataFreshness | undefined, warning: string): string {
  if (warning) return warning;
  if (freshness?.mode === "EOD") return "일봉 차트 데이터 기반 분석 결과입니다.";
  if (freshness?.mode === "INTRADAY") return "장중 현재가 기준 분석 결과입니다.";
  if (freshness?.mode === "FALLBACK") return "대체 데이터 기준 분석 결과입니다.";

  return "현재는 샘플 데이터 기반 분석 결과입니다. 실제 종목 데이터 연결은 다음 단계에서 적용됩니다.";
}

function getDataModeLabel(mode: StockDataFreshness["mode"] | undefined): string {
  if (mode === "EOD") return "일봉 기준";
  if (mode === "INTRADAY") return "장중 현재가 기준";
  if (mode === "SAMPLE") return "샘플 데이터 기준";
  if (mode === "FALLBACK") return "대체 데이터 기준";
  return "확인 필요";
}
