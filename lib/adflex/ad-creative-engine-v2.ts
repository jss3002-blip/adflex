/**
 * ADFLEX v2 — AI Advertising Creative Director Engine (structured JSON only).
 */

import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { AdvertisingPromptRequest, AdCreativeEngineV2, AdCreativeTypographyV2 } from "./structured-advertising-types";
import { AD_FORMAT_OPTIONS, type AdFormatId } from "./types";

export const NEGATIVE_PROMPT_BASE =
  "text distortion, watermark, low quality, blurry, unreadable text, extra limbs, deformed hands, mangled typography, illegible logo, duplicate subjects, cluttered background, amateur snapshot, oversaturated noise, chromatic aberration, generic stock photo, CGI plastic look, warped packaging";

const VERSION = "v2_ad_creative_engine" as const;

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function pickStr(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function unwrapJsonContent(raw: string): string {
  let t = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t);
  if (fence) t = fence[1].trim();
  return t;
}

function normalizePlacement(v: unknown): AdCreativeTypographyV2["placement"] {
  const s = typeof v === "string" ? v.trim().toLowerCase().replace(/\s+/g, "_") : "";
  const map: Record<string, AdCreativeTypographyV2["placement"]> = {
    top: "top",
    center: "center",
    bottom: "bottom",
    safe_area: "safe_area",
    safearea: "safe_area",
    overlay_safe_area: "safe_area",
  };
  return map[s] ?? "safe_area";
}

function parseHierarchy(typo: Record<string, unknown>): [string, string, string] {
  const h = typo.hierarchy;
  if (Array.isArray(h)) {
    const a = h.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean);
    if (a.length >= 3) return [a[0]!, a[1]!, a[2]!];
  }
  const hr = asRecord(h);
  if (hr) {
    const a = pickStr(hr, ["headline", "0"]);
    const b = pickStr(hr, ["subtext", "sub", "1"]);
    const c = pickStr(hr, ["cta", "2"]);
    if (a || b || c) return [a || "—", b || "—", c || "—"];
  }
  return ["—", "—", "—"];
}

function wantsTypography(requirements: string): boolean {
  const r = requirements.toLowerCase();
  return /(글자|텍스트|타이포|문구|카피|로고|슬로건|문장|헤드라인)/.test(requirements) ||
    /(text|typography|headline|logo|copy|cta)/.test(r);
}

export function ratioForFormatId(id: AdFormatId): string {
  return AD_FORMAT_OPTIONS.find((f) => f.id === id)?.ratio ?? "1:1";
}

export function tryParseAdCreativeV2(raw: string): AdCreativeEngineV2 | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(unwrapJsonContent(raw)) as unknown;
  } catch {
    return null;
  }
  const root = asRecord(parsed);
  if (!root) return null;

  const meta = asRecord(root.meta) ?? {};
  const strategy = asRecord(root.strategy) ?? {};
  const scenario = asRecord(root.scenario) ?? {};
  const visual = asRecord(root.visual) ?? {};
  const typo = asRecord(visual.typography) ?? {};

  const typography: AdCreativeTypographyV2 = {
    enabled: Boolean(typo.enabled ?? typo.include_text),
    placement: normalizePlacement(typo.placement ?? typo.placement_priority),
    hierarchy: parseHierarchy(typo),
    adFormatAware: Boolean(typo.adFormatAware ?? typo.ad_format_aware ?? true),
  };

  try {
    return {
      meta: {
        adFormat: pickStr(meta, ["adFormat", "ad_format", "aspectRatio", "aspect_ratio"]),
        generatedAt: pickStr(meta, ["generatedAt", "generated_at"]),
        version: VERSION,
      },
      strategy: {
        positioning: pickStr(strategy, ["positioning", "product_positioning"]),
        psychology: pickStr(strategy, ["psychology", "customer_psychology"]),
        emotional_trigger: pickStr(strategy, ["emotional_trigger", "emotionalTrigger"]),
        campaign_goal_interpretation: pickStr(strategy, [
          "campaign_goal_interpretation",
          "campaignGoalInterpretation",
        ]),
      },
      scenario: {
        real_world_scene: pickStr(scenario, ["real_world_scene", "realWorldScene"]),
        user_moment: pickStr(scenario, ["user_moment", "userMoment"]),
        story_before_purchase: pickStr(scenario, ["story_before_purchase", "storyBeforePurchase"]),
      },
      visual: {
        scene: pickStr(visual, ["scene", "scene_situation"]),
        subject: pickStr(visual, ["subject"]),
        composition: pickStr(visual, ["composition"]),
        lighting: pickStr(visual, ["lighting"]),
        color_tone: pickStr(visual, ["color_tone", "colorTone"]),
        texture: pickStr(visual, ["texture"]),
        contrast: pickStr(visual, ["contrast"]),
        mood: pickStr(visual, ["mood"]),
        camera: pickStr(visual, ["camera"]),
        typography,
      },
      final_prompt: pickStr(root, ["final_prompt", "finalPrompt", "finalImagePromptEn"]),
      negative_prompt: pickStr(root, ["negative_prompt", "negativePrompt"]),
    };
  } catch {
    return null;
  }
}

function nonEmpty(s: string, fb: string): string {
  const t = s.trim();
  return t ? t : fb;
}

function mergeNegative(existing: string): string {
  const e = existing.trim();
  const merged = [NEGATIVE_PROMPT_BASE, e].filter(Boolean).join(", ");
  return [...new Set(merged.split(",").map((x) => x.trim()).filter(Boolean))].join(", ");
}

export function ensureAdCreativeEngineV2(
  data: AdCreativeEngineV2,
  payload: AdvertisingPromptRequest,
): AdCreativeEngineV2 {
  const fmt = AD_FORMAT_OPTIONS.find((f) => f.id === payload.adFormatId)!;
  const ratio = fmt.ratio;
  const p = payload.productName.trim() || "flagship product";
  const ind = payload.industry.trim() || "commercial category";
  const aud = payload.targetAudience.trim() || "high-intent shoppers";
  const feat = payload.features.trim() || "key product benefits";
  const goal = payload.campaignGoal.trim() || "conversion";
  const req = payload.requirements.trim() || "premium commercial look";
  const typoOn = wantsTypography(payload.requirements);

  const compositionByRatio =
    ratio === "1:1"
      ? "single hero focal plane, symmetrical catalog hero, breathing room for price lockup"
      : ratio === "9:16"
        ? "vertical eye-path, hero mid-frame, reserved top/bottom bands for CTA overlays, motion-ready tension"
        : ratio === "4:5"
          ? "macro-truth product read, tactile packaging edge, marketplace-safe margins, trust-first hierarchy"
          : "anamorphic-wide negative space, left/right runway for headline, distant readable depth";

  const cameraByRatio =
    ratio === "1:1"
      ? "90mm macro-product feel, f/2.8 shallow dof, slight low hero angle, crisp plane of focus on label"
      : ratio === "9:16"
        ? "28mm vertical environmental, f/2–f/2.8, handheld-cinematic energy, subject 1/3 from top"
        : ratio === "4:5"
          ? "100mm macro, f/4–f/5.6 for edge-to-edge sharpness on SKU, minimal distortion"
          : "35mm cinematic wide, f/2.8, subtle dolly-height, deep background separation";

  const st = data.strategy;
  const sc = data.scenario;
  const vi = data.visual;
  const ty = vi.typography;

  const finalFb = [
    `${p}, hero subject`,
    `${ind} setting`,
    vi.scene ? vi.scene.split(/[,.]/)[0]?.trim().slice(0, 48) : "premium practical environment",
    `${vi.lighting || "large soft key, low fill, crisp rim, controlled speculars"}`,
    `${vi.mood || "confident purchase clarity"}`,
    `${vi.color_tone || "cinematic color grade, clean whites"}`,
    `${vi.camera || cameraByRatio}`,
    `${ratio} ${compositionByRatio}`,
    "commercial advertising photography",
    "ultra realistic, crave-ready product clarity",
  ]
    .map((x) => x.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(", ");

  const fp = nonEmpty(data.final_prompt, finalFb);
  const chunks = fp.split(",").map((x) => x.trim()).filter(Boolean);
  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const c of chunks) {
    const k = c.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(c);
  }
  const fpTuned =
    deduped.length > 10
      ? `${deduped.slice(0, 9).join(", ")}, commercial advertising photography`
      : deduped.join(", ").replace(/\s+/g, " ").trim();

  return {
    meta: {
      adFormat: nonEmpty(data.meta.adFormat, ratio),
      generatedAt: data.meta.generatedAt || new Date().toISOString(),
      version: VERSION,
    },
    strategy: {
      positioning: nonEmpty(
        st.positioning,
        `${p}를 ${ind}에서 ‘기본 대안 대비 한 방에 이기는’ 프레임으로 고정 — 대체재 대비 지연비용·리스크를 시각적으로 낮춤`,
      ),
      psychology: nonEmpty(
        st.psychology,
        `${aud} 세그먼트의 JTBD(상황별 과제)와 지배적 불안(FOMO·시간부족·신뢰·가성비)을 명시하고, 그 긴장이 한 컷에서 어떻게 풀리는지 연결`,
      ),
      emotional_trigger: nonEmpty(
        st.emotional_trigger,
        `${goal}에 직결되는 단일 촉발: 즉시성(한정)·안도(검증)·열망(상승)·소속(동료 선택) 중 브리프에 가장 맞는 하나를 ${req} 톤으로 압축`,
      ),
      campaign_goal_interpretation: nonEmpty(
        st.campaign_goal_interpretation,
        `${goal}을 ‘한 장면에서 증명 가능한 행동 신호’로 번역 — 시선이 머무는 1차 정보와 2차 증거(재질·수치·사회적 증거)의 역할 분담`,
      ),
    },
    scenario: {
      real_world_scene: nonEmpty(
        sc.real_world_scene,
        `${ind} 카테고리에 맞는 시간대·공간·주변 소음/조도까지 포함한 촬영 가능한 현실 씬 — 소품은 ‘증거’만 남기고 잡음은 제거`,
      ),
      user_moment: nonEmpty(
        sc.user_moment,
        `${aud}의 손·시선·자세가 제품과 맞닿는 1–2비트 — ‘멈춤→인지→손이 가는’ 순간만 남김`,
      ),
      story_before_purchase: nonEmpty(
        sc.story_before_purchase,
        `구매 직전 장벽 1개(망설임 원인) → ${p}가 주는 결정적 신호 1개로 붕괴하는 서사`,
      ),
    },
    visual: {
      scene: nonEmpty(vi.scene, `${ind} 광고 씬: 전경(히어로) / 중경(행동 맥락) / 후경(신뢰·브랜드 톤) 레이어를 한 문장으로`),
      subject: nonEmpty(vi.subject, `1차 읽기=${p}, 2차 읽기=${feat}, 3차는 최소화(로고/문구는 브리프 요구 시에만)`),
      composition: nonEmpty(vi.composition, compositionByRatio),
      lighting: nonEmpty(
        vi.lighting,
        "대형 소프트키 + 낮은 필 + 얇은 림, 재질 스펙큘을 ‘과장 없이’ 읽히게 하는 상업 3점 조명",
      ),
      color_tone: nonEmpty(vi.color_tone, "지배색 1 + 액센트 1, 클린 화이트/스킨톤 정합, 과포화 금지"),
      texture: nonEmpty(vi.texture, `${feat}이 촉각·시각으로 증명되도록 재질별 마이크로 디테일`),
      contrast: nonEmpty(vi.contrast, "피사체-배경 톤 분리, 시네마틱 롤오프, 딥 블랙은 크러시 없이"),
      mood: nonEmpty(vi.mood, "구매 에너지: ‘차분한 확신’ 또는 ‘즉시 행동의 긴장’ 중 브리프에 더 가까운 쪽으로 단정"),
      camera: nonEmpty(vi.camera, cameraByRatio),
      typography: {
        enabled: typoOn ? true : ty.enabled,
        placement: typoOn ? ty.placement : "safe_area",
        hierarchy: typoOn
          ? ty.hierarchy
          : [
              "인이미지 카피 없음: 브리프가 명시할 때만 최소 타이포",
              "행동 유도는 장면·시선·제품 증거로 대체",
              "CTA는 오버레이 안전영역 밖(채널 UI)에서 처리 가정",
            ],
        adFormatAware: true,
      },
    },
    final_prompt: nonEmpty(fpTuned, finalFb).replace(/\s+/g, " ").trim(),
    negative_prompt: mergeNegative(data.negative_prompt),
  };
}

export function validateAdCreativeV2(data: AdCreativeEngineV2): string | null {
  if (!data.final_prompt.trim()) return "final_prompt empty";
  if (!data.negative_prompt.trim()) return "negative_prompt empty";
  if (!data.strategy.positioning.trim()) return "strategy.positioning empty";
  if (!data.visual.scene.trim()) return "visual.scene empty";
  return null;
}

export function buildDeterministicAdCreativeV2(payload: AdvertisingPromptRequest): AdCreativeEngineV2 {
  const empty: AdCreativeEngineV2 = {
    meta: { adFormat: "", generatedAt: "", version: VERSION },
    strategy: { positioning: "", psychology: "", emotional_trigger: "", campaign_goal_interpretation: "" },
    scenario: { real_world_scene: "", user_moment: "", story_before_purchase: "" },
    visual: {
      scene: "",
      subject: "",
      composition: "",
      lighting: "",
      color_tone: "",
      texture: "",
      contrast: "",
      mood: "",
      camera: "",
      typography: {
        enabled: false,
        placement: "safe_area",
        hierarchy: ["—", "—", "—"],
        adFormatAware: true,
      },
    },
    final_prompt: "",
    negative_prompt: "",
  };
  return ensureAdCreativeEngineV2(empty, payload);
}

export async function runAdCreativeEngineWithRetries(
  client: OpenAI,
  model: string,
  payload: AdvertisingPromptRequest,
  buildMessages: (p: AdvertisingPromptRequest) => ChatCompletionMessageParam[],
  maxAttempts = 3,
): Promise<{ raw: string; data: AdCreativeEngineV2; usedFallback: boolean }> {
  let messages = buildMessages(payload);
  let lastRaw = "";

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let completion;
    try {
      completion = await client.chat.completions.create({
        model,
        messages,
        response_format: { type: "json_object" },
        temperature: attempt === 0 ? 0.42 : 0.15,
        max_completion_tokens: 4096,
      });
    } catch {
      try {
        completion = await client.chat.completions.create({
          model,
          messages,
          temperature: 0.15,
          max_completion_tokens: 4096,
        });
      } catch {
        break;
      }
    }

    lastRaw = completion.choices[0]?.message?.content ?? "";
    const parsed = tryParseAdCreativeV2(lastRaw);
    if (parsed) {
      const data = ensureAdCreativeEngineV2(parsed, payload);
      data.meta.generatedAt = new Date().toISOString();
      if (validateAdCreativeV2(data) === null) {
        return { raw: lastRaw, data, usedFallback: false };
      }
    }

    messages = [
      ...buildMessages(payload),
      {
        role: "user" as const,
        content:
          "CRITICAL: Your previous reply was not valid JSON or failed validation. Output ONLY one JSON object with keys: meta, strategy, scenario, visual, final_prompt, negative_prompt. No markdown, no code fences, no commentary. All string fields must be non-empty. meta.version must be \"v2_ad_creative_engine\".",
      },
    ];
  }

  const data = buildDeterministicAdCreativeV2(payload);
  data.meta.generatedAt = new Date().toISOString();
  return { raw: JSON.stringify(data), data, usedFallback: true };
}
