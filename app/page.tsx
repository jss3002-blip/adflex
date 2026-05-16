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
  { ticker: "NVDA", name: "엔비디아", score: 92, signal: "강한 매수", change: "+3.8%" },
  { ticker: "TSLA", name: "테슬라", score: 78, signal: "관망 우세", change: "+1.2%" },
  { ticker: "AAPL", name: "애플", score: 84, signal: "매수 유지", change: "+2.1%" },
];

const sentimentItems = [
  { label: "뉴스 감성 분석", value: "긍정 68%", width: "68%" },
  { label: "거래량 분석", value: "평균 대비 142%", width: "82%" },
  { label: "변동성 예측", value: "중간 리스크", width: "54%" },
];

export default function Home() {
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

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="#dashboard-preview"
              className="group inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-semibold text-black shadow-[0_24px_70px_-38px_rgba(255,255,255,0.75)] transition hover:-translate-y-0.5 hover:bg-cyan-100"
            >
              AI 주식 분석하기
              <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </a>
            <a
              href="#engine"
              className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 text-sm font-semibold text-white/80 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/[0.07] hover:text-white"
            >
              분석 엔진 보기
              <Icon name="gauge" className="h-4 w-4" />
            </a>
          </div>
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
            실제 API 연결 전 UI 프로토타입입니다. 추천, 예측, 심리, 거래량, 변동성, 뉴스 감성 영역을 한 화면에서
            확인하는 경험을 설계했습니다.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name="candle" className="h-5 w-5 text-cyan-300" />
                <h3 className="font-semibold">AI 추천 종목</h3>
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
                단순한 차트 요약이 아니라 투자 판단에 필요한 방향성, 위험 구간, 매수·관망 신호를 함께 제공합니다.
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
