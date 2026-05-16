import type { AdflexFormState } from "./types";

const FIELD_WEIGHTS = [
  { key: "productName", weight: 1 },
  { key: "industry", weight: 1 },
  { key: "campaignGoal", weight: 1 },
  { key: "features", weight: 1 },
  { key: "targetAudience", weight: 1 },
  { key: "requirements", weight: 1 },
  { key: "imageFileName", weight: 1 },
  { key: "formatId", weight: 1 },
] as const;

function isFieldFilled(
  state: AdflexFormState,
  key: (typeof FIELD_WEIGHTS)[number]["key"],
): boolean {
  if (key === "imageFileName") return Boolean(state.imageFileName?.trim());
  if (key === "formatId") return Boolean(state.formatId);
  const v = state[key]?.trim();
  return Boolean(v);
}

/** 실제 입력 필드를 기준으로 한 완성도(0–100). 생성/로딩 진행과 무관합니다. */
export function computeInputCompletion(state: AdflexFormState): number {
  const totalWeight = FIELD_WEIGHTS.reduce((s, f) => s + f.weight, 0);
  const filledWeight = FIELD_WEIGHTS.reduce((s, f) => {
    return s + (isFieldFilled(state, f.key) ? f.weight : 0);
  }, 0);
  return Math.round((filledWeight / totalWeight) * 100);
}
