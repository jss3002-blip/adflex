"use client";

import { useId, useRef } from "react";

type ImageUploadBoxProps = {
  fileName: string | null;
  onFileSelected: (name: string | null, file: File | null) => void;
};

export function ImageUploadBox({ fileName, onFileSelected }: ImageUploadBoxProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="text-sm font-medium text-white/85">
          제품 사진 직접 첨부
        </label>
        <span className="text-xs text-white/45">로컬 선택만 (업로드 미연동)</span>
      </div>
      <div
        className={[
          "group relative overflow-hidden rounded-2xl border bg-white/[0.03] p-5 backdrop-blur-xl transition duration-300",
          fileName
            ? "border-cyan-400/25 shadow-[0_0_0_1px_rgba(34,211,238,0.12)_inset,0_20px_60px_-45px_rgba(34,211,238,0.35)]"
            : "border-white/[0.10] hover:border-white/[0.16] hover:bg-white/[0.045] hover:shadow-[0_20px_60px_-50px_rgba(139,92,246,0.25)]",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            onFileSelected(file ? file.name : null, file);
          }}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-white/90">이미지를 선택하세요</p>
            <p className="text-xs leading-relaxed text-white/45">
              JPG · PNG · WebP 등 (미리보기/저장은 추후 연결)
            </p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-r from-violet-500/15 to-cyan-400/10 px-4 text-sm font-semibold text-white/90 shadow-[0_10px_30px_-18px_rgba(139,92,246,0.8)] transition hover:-translate-y-0.5 hover:border-white/20 hover:from-violet-500/25 hover:to-cyan-400/18 active:translate-y-0"
          >
            파일 찾기
          </button>
        </div>
        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div className="mt-4 flex items-start justify-between gap-3">
          <p className="min-h-5 text-xs text-white/55">
            {fileName ? (
              <>
                선택됨: <span className="font-medium text-white/80">{fileName}</span>
              </>
            ) : (
              "선택된 파일 없음"
            )}
          </p>
          {fileName ? (
            <button
              type="button"
              onClick={() => {
                if (inputRef.current) inputRef.current.value = "";
                onFileSelected(null, null);
              }}
              className="text-xs font-semibold text-white/45 underline-offset-4 transition hover:text-white/75 hover:underline"
            >
              초기화
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
