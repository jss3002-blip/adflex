import type { GeneratedPrompt } from "./prompt";
import type { AdCreativeEngineV2 } from "./structured-advertising-types";

/** v2 구조화 응답 → 기존 결과 카드 (마크업 변경 없음) */
export function structuredPromptToGenerated(data: AdCreativeEngineV2): GeneratedPrompt {
  const st = data.strategy;
  const sc = data.scenario;
  const vi = data.visual;
  const ty = vi.typography;

  const strategySummaryKo = [
    `【메타】 규격 ${data.meta.adFormat} · ${data.meta.version}`,
    "",
    "【전략】",
    `포지셔닝: ${st.positioning}`,
    `심리: ${st.psychology}`,
    `감정 트리거: ${st.emotional_trigger}`,
    `캠페인 목표 해석: ${st.campaign_goal_interpretation}`,
    "",
    "【시나리오】",
    `현실 장면: ${sc.real_world_scene}`,
    `유저 모먼트: ${sc.user_moment}`,
    `구매 전 서사: ${sc.story_before_purchase}`,
    "",
    "【시각 스펙】",
    `장면: ${vi.scene}`,
    `피사체: ${vi.subject}`,
    `구도: ${vi.composition}`,
    `조명: ${vi.lighting}`,
    `색조: ${vi.color_tone}`,
    `질감: ${vi.texture}`,
    `대비: ${vi.contrast}`,
    `무드: ${vi.mood}`,
    `카메라: ${vi.camera}`,
    "",
    "【타이포】",
    `활성: ${ty.enabled ? "예" : "아니오"}`,
    `배치: ${ty.placement}`,
    `계층: ${ty.hierarchy.join(" → ")}`,
    `포맷 인지: ${ty.adFormatAware ? "예" : "아니오"}`,
    "",
    "【네거티브 프롬프트】",
    data.negative_prompt,
  ].join("\n");

  return {
    strategySummaryKo,
    imagePromptEn: `${data.final_prompt}\n\n--- Negative prompt ---\n${data.negative_prompt}`,
  };
}
