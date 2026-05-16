"use client";

type CompletionBarProps = {
  percent: number;
};

export function CompletionBar({ percent }: CompletionBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <p className="text-sm font-medium tracking-tight text-white/90">입력 완성도</p>
        <p className="text-xs tabular-nums text-white/50">{clamped}%</p>
      </div>
      <div
        className="relative h-2 overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-white/[0.08]"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="입력 완성도"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300 shadow-[0_0_24px_rgba(139,92,246,0.35)] transition-[width] duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="text-xs leading-relaxed text-white/45">
        입력 항목이 채워질수록 프롬프트 정확도가 올라갑니다. (서버 생성 진행률이 아닙니다)
      </p>
    </div>
  );
}
