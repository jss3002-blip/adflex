import { CompletionBar } from "./CompletionBar";

type HeroPanelProps = {
  completionPercent: number;
};

const STRATEGY_CARDS = [
  {
    title: "고객 심리 분석",
    body: "타깃의 욕구, 불안, 사회적 신호를 정리해 ‘왜 지금 사야 하는지’를 장면 언어로 번역합니다.",
  },
  {
    title: "광고 상황 추천",
    body: "채널·비율·캠페인 목적에 맞는 상황, 조명, 프레이밍을 제안해 설득력 있는 커머스 연출을 만듭니다.",
  },
  {
    title: "이미지 프롬프트 생성",
    body: "프리미엄 광고 사진 문법으로 영어 프롬프트를 구성해 이미지 AI에 바로 전달할 수 있게 합니다.",
  },
] as const;

export function HeroPanel({ completionPercent }: HeroPanelProps) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -inset-y-10 rounded-[40px] bg-[radial-gradient(60%_50%_at_20%_0%,rgba(139,92,246,0.22),transparent),radial-gradient(50%_45%_at_85%_30%,rgba(34,211,238,0.18),transparent)] blur-2xl"
      />
      <div className="relative space-y-10">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium tracking-wide text-white/70 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet-400 to-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.55)]" />
            ADFLEX AI
          </div>
          <h1 className="max-w-xl text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
            이미지를 뽑는 게 아니라, 팔리는 장면을 설계합니다
          </h1>
          <p className="max-w-prose text-pretty text-base leading-relaxed text-white/65 sm:text-lg">
            제품명·업종·핵심 특징·타깃·제품 사진·캠페인 목적·요구사항을 함께 분석해, 이미지 AI에 전달할
            고퀄리티 광고 프롬프트를 설계합니다. 생성은 다음 단계에서 API로 연결할 수 있도록 구조만
            준비되어 있습니다.
          </p>
        </div>

        <CompletionBar percent={completionPercent} />

        <div className="grid gap-3 sm:grid-cols-3">
          {STRATEGY_CARDS.map((card) => (
            <div
              key={card.title}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.10] bg-white/[0.035] p-4 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-white/[0.05] hover:shadow-[0_24px_70px_-42px_rgba(139,92,246,0.35)]"
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute -inset-24 bg-[conic-gradient(from_180deg_at_50%_50%,rgba(139,92,246,0.18),rgba(34,211,238,0.12),transparent_55%)] blur-2xl" />
              </div>
              <div className="relative space-y-2">
                <h2 className="text-sm font-semibold tracking-tight text-white">{card.title}</h2>
                <p className="text-sm leading-relaxed text-white/55">{card.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
