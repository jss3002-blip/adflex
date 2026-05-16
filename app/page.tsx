"use client";

import { useState } from "react";

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
  mode?: "real-data" | "sample-fallback" | "sample";
  source?: "yahoo-finance" | "sample";
  warning?: string;
  stock?: {
    name: string;
    code: string;
    yahooSymbol: string;
  };
  data?: StockAnalysisViewResult;
  error?: string;
  detail?: string;
};

type AnalysisMeta = {
  mode: StockAnalysisApiResponse["mode"];
  source: StockAnalysisApiResponse["source"];
  warning: string;
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
    mode: undefined,
    source: undefined,
    warning: "",
  });

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
        mode: payload.mode,
        source: payload.source,
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

      <section className="relative z-10 mx-auto grid w-full max-w-7xl gap-12 px-5 pb-12 pt-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-10 lg:pb-20 lg:pt-24">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1 text-xs font-medium text-cyan-100/80 shadow-[0_0_40px_-28px_rgba(34,211,238,0.9)] backdrop-blur-xl">
            <Icon name="sparkles" className="h-3.5 w-3.5 text-cyan-300" />
            AI 기반 투자 인사이트 플랫폼
          </div>

          <div className="space-y-5">
            <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl">
              실시간 데이터 기반 투자 분석 플랫폼
            </h1>
            <p className="max-w-2xl text-pretty text-lg leading-8 text-white/62">
              뉴스, 수급, 변동성, 기술적 지표를 AI가 종합 분석해 투자 판단에 필요한 핵심 인사이트를
              제공합니다.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-3 shadow-[0_24px_90px_-70px_rgba(34,211,238,0.85)] backdrop-blur-xl">
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
              현재는 샘플 데이터로 분석 흐름을 확인합니다.
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

          {analysisResult ? (
            <AnalysisResultCard
              result={analysisResult}
              targetStockName={analyzedStockName}
              meta={analysisMeta}
            />
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

      <section className="relative z-10 mx-auto grid w-full max-w-7xl gap-4 px-5 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
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

      <section className="relative z-10 mx-auto w-full max-w-7xl px-5 py-8 lg:px-10">
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

      <section id="dashboard-preview" className="relative z-10 mx-auto w-full max-w-7xl px-5 py-16 lg:px-10">
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
  const sourceLabel = meta.source === "yahoo-finance" ? "Yahoo Finance" : "샘플 데이터";
  const modeNotice = getDataModeNotice(meta.mode, meta.warning);
  const dataBasisLabel = getDataBasisLabel(result);
  const dataBasisValue = formatDataBasis(result);
  const displayedWarnings = getDisplayItems(result.warnings, 5);
  const hiddenWarningCount = Math.max(result.warnings.length - displayedWarnings.length, 0);
  const scoreItems = [
    { label: "종합 점수", value: formatScore(result.finalScore), accent: "text-cyan-200" },
    { label: "상태 점수", value: formatScore(result.state.stateScore), accent: "text-violet-200" },
    { label: "신뢰도", value: formatScore(result.state.confidenceScore), accent: "text-emerald-200" },
    { label: "리스크 점수", value: formatScore(result.risk.riskScore), accent: "text-amber-200" },
  ];

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_90px_-64px_rgba(34,211,238,0.9)] backdrop-blur-2xl">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-200/80">분석 결과</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{gradeLabel}</h2>
          <p className="mt-1 break-all text-[10px] text-white/35">{result.finalGrade}</p>
          <p className="mt-2 text-xs leading-6 text-white/50">{getGradeExplanation(result.finalGrade)}</p>
        </div>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100/80">
          {urgencyLabel}
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-sm font-semibold text-white/82">분석 대상: {displayedStockName}</p>
        <p className="mt-2 text-xs leading-6 text-white/55">
          확인 종목: {confirmedStockName}
          {confirmedTicker ? ` (${confirmedTicker})` : ""}
        </p>
        <p className="text-xs leading-6 text-white/55">데이터 출처: {sourceLabel}</p>
        <p className="text-xs leading-6 text-white/55">{dataBasisLabel}: {dataBasisValue}</p>
        <p className="text-xs leading-6 text-white/55">기준 유형: {getDataBasisType(result)}</p>
        <p className="mt-2 text-xs leading-6 text-white/45">
          {modeNotice}
        </p>
        {meta.source === "yahoo-finance" ? (
          <p className="mt-1 text-xs leading-6 text-white/38">
            Yahoo Finance 기준 차트 데이터이며, 거래소 및 데이터 제공 환경에 따라 지연되거나 조정된 값이 포함될 수 있습니다.
          </p>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {scoreItems.map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs text-white/45">{item.label}</p>
            <p className={`mt-2 text-2xl font-semibold ${item.accent}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <InfoPill label="상태 분류" value={stateLabel} rawValue={result.state.primaryState} />
        <InfoPill label="대응 라벨" value={actionLabel} rawValue={result.action.actionCode} />
        <InfoPill label="대응 점수" value={formatScore(result.action.actionScore)} />
        <InfoPill label="확인 필요" value={`${result.warnings.length}건`} />
      </div>

      <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/66">
        {formatSummaryForDisplay(result.summary)}
      </p>

      <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4">
        <p className="text-sm font-semibold text-amber-100">확인 필요</p>
        {result.warnings.length > 0 ? (
          <ul className="mt-3 space-y-2 text-xs leading-6 text-amber-50/75">
            {displayedWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
            {hiddenWarningCount > 0 ? (
              <li className="text-amber-50/55">외 {hiddenWarningCount}개 확인 항목이 더 있습니다.</li>
            ) : null}
          </ul>
        ) : (
          <p className="mt-3 text-xs leading-6 text-amber-50/65">현재 표시된 주요 경고는 없습니다.</p>
        )}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <EvidenceList
          title="긍정 지표"
          items={result.evidence.positive}
          tone="cyan"
          emptyMessage="현재 뚜렷한 긍정 지표는 추가 확인이 필요합니다."
        />
        <EvidenceList
          title="중립 지표"
          items={result.evidence.neutral}
          tone="violet"
          emptyMessage="현재 중립 지표는 별도로 표시되지 않았습니다."
        />
        <EvidenceList
          title="주의 지표"
          items={result.evidence.negative}
          tone="rose"
          emptyMessage="현재 강한 주의 신호는 감지되지 않았습니다."
        />
      </div>

      <DetailedAnalysisSection result={result} targetStockName={targetStockName} sourceLabel={sourceLabel} />
    </div>
  );
}

function DetailedAnalysisSection({
  result,
  targetStockName,
  sourceLabel,
}: {
  result: StockAnalysisViewResult;
  targetStockName: string;
  sourceLabel: string;
}) {
  const confirmedTicker = result.normalized?.ticker || "";
  const confirmedName = result.normalized?.name || "확인 대기";
  const diagnostics = result.normalized?.metadata?.providerDiagnostics;

  return (
    <div className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-2xl">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-200/80">상세 분석 근거</p>
          <p className="mt-1 text-xs text-white/45">점수 산출에 사용된 핵심 참고 지표입니다.</p>
        </div>
        <p className="text-xs text-white/45">{getDataBasisLabel(result)}: {formatDataBasis(result)}</p>
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
            [getDataBasisLabel(result), formatDataBasis(result)],
            ["기준 유형", getDataBasisType(result)],
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

function EvidenceList({
  title,
  items,
  tone,
  emptyMessage,
}: {
  title: string;
  items: string[];
  tone: "cyan" | "violet" | "rose";
  emptyMessage: string;
}) {
  const toneClass =
    tone === "cyan" ? "text-cyan-100 border-cyan-300/15 bg-cyan-300/[0.05]" : tone === "violet" ? "text-violet-100 border-violet-300/15 bg-violet-300/[0.05]" : "text-rose-100 border-rose-300/15 bg-rose-300/[0.05]";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-sm font-semibold">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-xs leading-6 text-white/62">
          {items.slice(0, 3).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs leading-6 text-white/45">{emptyMessage}</p>
      )}
    </div>
  );
}

function getDisplayItems(items: string[] | undefined, limit = 5): string[] {
  if (!items) return [];
  return items.slice(0, limit);
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

function getDataBasisType(result: StockAnalysisViewResult): string {
  return isDailyEodResult(result) ? "일봉 차트 기준" : "차트 기준";
}

function formatDataBasis(result: StockAnalysisViewResult): string {
  if (isDailyEodResult(result)) return formatDateOnly(result.normalized?.asOf);
  return formatDateTime(result.normalized?.asOf);
}

function getDataModeNotice(mode: AnalysisMeta["mode"], warning: string): string {
  if (mode === "real-data") return "실제 시세 데이터 기반 분석 결과입니다.";
  if (mode === "sample-fallback") {
    return warning || "실제 시세 데이터를 가져오지 못해 샘플 데이터로 대체했습니다.";
  }

  return "현재는 샘플 데이터 기반 분석 결과입니다. 실제 종목 데이터 연결은 다음 단계에서 적용됩니다.";
}
