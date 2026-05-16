"use client";

import type { AdFormatId } from "@/lib/adflex/types";
import { AD_FORMAT_OPTIONS } from "@/lib/adflex/types";

type FormatSelectorProps = {
  value: AdFormatId;
  onChange: (id: AdFormatId) => void;
};

export function FormatSelector({ value, onChange }: FormatSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-white/85">광고 규격 선택</p>
        <span className="text-xs text-white/45">채널 최적 비율</span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {AD_FORMAT_OPTIONS.map((opt) => {
          const active = opt.id === value;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={[
                "group relative overflow-hidden rounded-2xl border px-4 py-3 text-left transition duration-300",
                active
                  ? "border-white/18 bg-gradient-to-br from-violet-500/20 via-white/[0.06] to-cyan-400/15 shadow-[0_18px_60px_-45px_rgba(139,92,246,0.65)]"
                  : "border-white/[0.10] bg-white/[0.03] hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-white/[0.05] hover:shadow-[0_18px_60px_-50px_rgba(34,211,238,0.22)]",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                  active ? "opacity-100" : "",
                ].join(" ")}
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(139,92,246,0.55), rgba(34,211,238,0.45), transparent)",
                }}
              />
              <div className="relative flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold tracking-tight text-white/90">{opt.label}</p>
                  <p className="text-xs text-white/45">{opt.ratio} 비율</p>
                </div>
                <span
                  className={[
                    "mt-0.5 inline-flex h-6 items-center rounded-full px-2 text-[11px] font-semibold",
                    active
                      ? "bg-white/10 text-white ring-1 ring-white/15"
                      : "bg-white/[0.04] text-white/45 ring-1 ring-white/[0.06]",
                  ].join(" ")}
                >
                  {active ? "선택됨" : "선택"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
