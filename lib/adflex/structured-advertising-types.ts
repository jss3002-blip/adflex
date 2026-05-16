import type { AdFormatId } from "./types";

/** POST /api/openai body */
export type AdvertisingPromptRequest = {
  productName: string;
  industry: string;
  features: string;
  targetAudience: string;
  campaignGoal: string;
  requirements: string;
  adFormatId: AdFormatId;
  imageFileName?: string | null;
};

export type TypographyPlacementV2 = "top" | "center" | "bottom" | "safe_area";

export type AdCreativeTypographyV2 = {
  enabled: boolean;
  placement: TypographyPlacementV2;
  hierarchy: [string, string, string];
  adFormatAware: boolean;
};

export type AdCreativeEngineV2 = {
  meta: {
    adFormat: string;
    generatedAt: string;
    version: "v2_ad_creative_engine";
  };
  strategy: {
    positioning: string;
    psychology: string;
    emotional_trigger: string;
    campaign_goal_interpretation: string;
  };
  scenario: {
    real_world_scene: string;
    user_moment: string;
    story_before_purchase: string;
  };
  visual: {
    scene: string;
    subject: string;
    composition: string;
    lighting: string;
    color_tone: string;
    texture: string;
    contrast: string;
    mood: string;
    camera: string;
    typography: AdCreativeTypographyV2;
  };
  final_prompt: string;
  negative_prompt: string;
};

export type AdvertisingPromptApiSuccess = {
  ok: true;
  data: AdCreativeEngineV2;
  rawModelJson: string;
  /** 모델 JSON 재시도 후에도 실패 시 결정론 폴백 사용 여부 */
  usedFallback?: boolean;
};

export type AdvertisingPromptApiError = {
  ok: false;
  error: string;
  details?: string;
  rawModelJson?: string;
};
