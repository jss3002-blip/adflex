import type { AdflexFormState } from "./types";
import { AD_FORMAT_OPTIONS } from "./types";

function truncateSmart(text: string, maxLen: number): string {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
}

function wantsEmbeddedText(requirements: string): boolean {
  const r = requirements.toLowerCase();
  return /(글자|텍스트|타이포|문구|카피|로고|슬로건|문장)/.test(requirements) ||
    /(text|typography|headline|logo|copy)/.test(r);
}

export type GeneratedPrompt = {
  strategySummaryKo: string;
  imagePromptEn: string;
};

export function generatePromptDraft(state: AdflexFormState): GeneratedPrompt {
  const format = AD_FORMAT_OPTIONS.find((f) => f.id === state.formatId)!;
  const productRaw = state.productName.trim();
  const industryRaw = state.industry.trim();
  const goalRaw = state.campaignGoal.trim();
  const featuresRaw = state.features.trim();
  const audienceRaw = state.targetAudience.trim();

  const productKo = productRaw || "핵심 제품";
  const industryKo = industryRaw || "브리프 기준 업종";
  const goalKo = goalRaw || "캠페인 목표(미입력 시 일반 설득)";
  const featuresKo = featuresRaw || "핵심 특징(브리프 보강 필요)";
  const audienceKo = audienceRaw || "타깃 고객(브리프 보강 필요)";

  const productEn = productRaw || "a premium flagship product";
  const industryEn = industryRaw || "its commercial category";
  const goalEn = goalRaw || "the core campaign objective";
  const featuresEn = featuresRaw || "its most compelling product claims and proof points";
  const audienceEn = audienceRaw || "the intended high-intent audience segment";

  const requirements = state.requirements.trim();
  const refNote = state.imageFileName
    ? "첨부된 제품 사진의 실물 비율·재질·브랜드 톤을 시각적으로 일치시키는 방향"
    : "제품이 명확히 읽히는 영웅 샷과 재질감(텍스처) 강화";

  const mood = requirements
    ? `요구사항(${truncateSmart(requirements, 80)})을 반영한 무드·조명·색채 대비`
    : "럭셔리 광고 사진 특유의 절제된 하이라이트와 깊은 톤 대비";

  const strategySummaryKo = [
    `타깃(${truncateSmart(audienceKo, 64)})의 구매/관심 동기를 기준으로 ${industryKo} 카테고리 맥락에서 ${productKo}의 가치를 한 장에 압축합니다.`,
    `캠페인 목표는 ${truncateSmart(goalKo, 72)}에 맞추고, 핵심 메시지는 ${truncateSmart(featuresKo, 72)}로 정리해 시인성과 설득력을 동시에 확보합니다.`,
    `${format.label}(${format.ratio}) 비율에 맞춰 ${format.summaryKo}를 우선합니다.`,
    `${refNote}에 초점을 두고, ${mood}로 브랜드 프리미엄 무드를 완성합니다.`,
  ].join("\n\n");

  const includeText = wantsEmbeddedText(requirements);
  const noTextClause = includeText
    ? "If any typography appears, keep it minimal, perfectly kerned, and subordinate to the product hero—only if it elevates the campaign goal."
    : "Absolutely no embedded text, captions, watermarks, logos, or typography in the image unless the creative brief explicitly requires it; prioritize pure photographic storytelling and premium composition instead.";

  const imagePromptEn = [
    "Ultra-premium commercial advertising photograph, editorial campaign quality, meticulously art-directed.",
    `Hero subject: ${productEn} as the unmistakable focal point in ${industryEn}, crafted for ${audienceEn}.`,
    `Campaign intent: communicate ${goalEn} with sharp storytelling clarity.`,
    `Highlight the product’s value through ${featuresEn} using tangible material realism (surface texture, reflections, micro-detail) and confident studio-grade lighting.`,
    `Composition & format: ${format.englishScene}.`,
    requirements
      ? `Visual direction: interpret the brief as ${truncateSmart(requirements, 220)}—translate into lighting palette, set design restraint, and selective color accents without clutter.`
      : "Visual direction: luxury restraint—controlled gradients, cinematic depth, crisp shadows, and a believable premium environment that feels intentional, not generic.",
    `Brand-ready polish: golden-hour edge highlights OR high-end studio softboxes (choose what best matches the brief), perfect white balance, natural skin tones if people appear, and magazine-cover finishing.`,
    noTextClause,
  ].join(" ");

  return { strategySummaryKo, imagePromptEn };
}
