"use client";

import type { GeneratedPrompt } from "@/lib/adflex/prompt";

type PromptResultCardProps = {
  result: GeneratedPrompt | null;
};

export function PromptResultCard({ result }: PromptResultCardProps) {
  if (!result) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.10] bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 shadow-[0_26px_90px_-55px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.35),transparent_65%)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-28 h-60 w-60 rounded-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.22),transparent_65%)] blur-2xl"
      />

      <div className="relative space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h3 className="text-lg font-semibold tracking-tight text-white">생성된 이미지 프롬프트 초안</h3>
          <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-white/55">
            로컬 초안 · API 미연결
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/45">전략 요약</p>
          <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4 text-sm leading-relaxed text-white/70">
            {result.strategySummaryKo.split("\n\n").map((para, idx) => (
              <p key={idx} className="[&:not(:first-child)]:mt-3">
                {para}
              </p>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/45">이미지 생성 프롬프트</p>
          <pre className="whitespace-pre-wrap break-words rounded-xl border border-white/[0.08] bg-black/35 p-4 font-mono text-[13px] leading-relaxed text-white/80">
            {result.imagePromptEn}
          </pre>
        </div>
      </div>
    </div>
  );
}
