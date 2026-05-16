"use client";

import { useMemo } from "react";
import { FormatSelector } from "./FormatSelector";
import { ImageUploadBox } from "./ImageUploadBox";
import { PromptResultCard } from "./PromptResultCard";
import type { AdflexFormState } from "@/lib/adflex/types";
import type { GeneratedPrompt } from "@/lib/adflex/prompt";

type FieldLabelProps = {
  htmlFor: string;
  children: React.ReactNode;
  hint?: string;
};

function FieldLabel({ htmlFor, children, hint }: FieldLabelProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={htmlFor} className="text-sm font-medium text-white/85">
        {children}
      </label>
      {hint ? <span className="text-xs text-white/45">{hint}</span> : null}
    </div>
  );
}

type TextInputProps = {
  id: string;
  label: React.ReactNode;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  hint?: string;
  rows?: number;
};

function TextField({ id, label, value, placeholder, onChange, hint, rows }: TextInputProps) {
  const common =
    "w-full rounded-xl border border-white/[0.10] bg-black/25 px-3 py-2.5 text-sm text-white/90 outline-none ring-0 transition placeholder:text-white/35 focus:border-violet-400/35 focus:bg-black/35 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.12)]";

  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id} hint={hint}>
        {label}
      </FieldLabel>
      {rows && rows > 1 ? (
        <textarea id={id} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} rows={rows} className={`${common} min-h-[96px] resize-y`} />
      ) : (
        <input id={id} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={common} />
      )}
    </div>
  );
}

type AdflexFormProps = {
  state: AdflexFormState;
  onChange: (next: AdflexFormState) => void;
  completionPercent: number;
  promptDraft: GeneratedPrompt | null;
  onGeneratePrompt: () => void | Promise<void>;
  onResetAll: () => void;
};

export function AdflexForm({
  state,
  onChange,
  completionPercent,
  promptDraft,
  onGeneratePrompt,
  onResetAll,
}: AdflexFormProps) {
  const patch = (partial: Partial<AdflexFormState>) => onChange({ ...state, ...partial });

  const completionLabel = useMemo(() => `${completionPercent}%`, [completionPercent]);

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-[28px] opacity-70 blur-sm"
        style={{
          background:
            "linear-gradient(120deg, rgba(139,92,246,0.55), rgba(34,211,238,0.35), rgba(139,92,246,0.25))",
        }}
      />
      <div className="relative overflow-hidden rounded-[26px] border border-white/[0.12] bg-white/[0.035] p-6 shadow-[0_30px_100px_-60px_rgba(0,0,0,0.95)] backdrop-blur-2xl sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),transparent_38%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.22'/%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/45">캠페인 입력</p>
              <h2 className="text-xl font-semibold tracking-tight text-white">광고 브리프</h2>
              <p className="max-w-prose text-sm leading-relaxed text-white/55">
                브랜드 톤을 해치지 않게, 최소 입력으로도 초안을 만들 수 있습니다. 완성도는 입력 항목 기준(
                {completionLabel})입니다.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet-400 to-cyan-300" />
              입력 완성도 {completionLabel}
            </div>
          </div>

          <div className="grid gap-4">
            <TextField
              id="productName"
              label="제품명"
              placeholder="예: 프로틴 음료"
              value={state.productName}
              onChange={(productName) => patch({ productName })}
            />
            <TextField
              id="industry"
              label="업종"
              placeholder="예: 헬스, 뷰티, 음식, 의류, 카페, 전자제품"
              value={state.industry}
              onChange={(industry) => patch({ industry })}
            />
            <TextField
              id="campaignGoal"
              label="광고 목적"
              placeholder="예: 구매 유도, 브랜드 홍보, 이벤트 홍보, 신제품 출시"
              value={state.campaignGoal}
              onChange={(campaignGoal) => patch({ campaignGoal })}
            />
            <TextField
              id="features"
              label="주요 특징"
              placeholder="예: 단백질 28g, 1500원, 저칼로리, 운동 직후 섭취"
              value={state.features}
              onChange={(features) => patch({ features })}
              rows={3}
            />
            <TextField
              id="targetAudience"
              label="타겟 고객"
              placeholder="예: 운동을 자주 하는 20대, 가성비를 중시하는 대학생"
              value={state.targetAudience}
              onChange={(targetAudience) => patch({ targetAudience })}
              rows={3}
            />

            <ImageUploadBox
              fileName={state.imageFileName}
              onFileSelected={(imageFileName) => patch({ imageFileName })}
            />

            <TextField
              id="requirements"
              label="요구사항"
              placeholder="예: 고급스럽게, 검은 배경, 인스타 릴스용, 구매욕 자극, 글자는 크게"
              value={state.requirements}
              onChange={(requirements) => patch({ requirements })}
              rows={4}
            />

            <FormatSelector value={state.formatId} onChange={(formatId) => patch({ formatId })} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onResetAll}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-white/70 transition hover:border-white/16 hover:bg-white/[0.06] hover:text-white/85"
            >
              입력 초기화
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void Promise.resolve(onGeneratePrompt()).catch((err) => {
                  console.error("[광고 상황 추천받기] onGeneratePrompt 실패", err);
                });
              }}
              className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-2xl px-6 text-sm font-semibold text-white shadow-[0_22px_70px_-40px_rgba(139,92,246,0.75)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_26px_84px_-44px_rgba(34,211,238,0.55)] active:translate-y-0 sm:min-w-[240px]"
            >
              <span
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(120deg,rgba(139,92,246,0.95),rgba(99,102,241,0.75),rgba(34,211,238,0.85))]"
              />
              <span aria-hidden className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.35),transparent_55%)]" />
              <span className="relative">광고 상황 추천받기</span>
            </button>
          </div>

          <PromptResultCard result={promptDraft} />
        </div>
      </div>
    </div>
  );
}
