export type AdFormatId =
  | "instagram-feed-1-1"
  | "story-reels-9-16"
  | "youtube-16-9"
  | "smartstore-4-5"
  | "banner-16-9";

export type AdFormatOption = {
  id: AdFormatId;
  label: string;
  ratio: string;
  /** 전략 요약(한국어)용 짧은 설명 */
  summaryKo: string;
  englishScene: string;
};

export const AD_FORMAT_OPTIONS: AdFormatOption[] = [
  {
    id: "instagram-feed-1-1",
    label: "인스타 피드 1:1",
    ratio: "1:1",
    summaryKo: "정사각 1:1 피드에 맞는 중앙 영웅 구도와 여백 균형",
    englishScene:
      "1:1 square framing for Instagram Feed, decisive central subject, generous negative space for premium catalog readability",
  },
  {
    id: "story-reels-9-16",
    label: "스토리/릴스 9:16",
    ratio: "9:16",
    summaryKo: "세로 9:16에 최적화된 시네마틱 시선 흐름과 몰입감",
    englishScene:
      "9:16 vertical cinematic composition optimized for Instagram Stories and Reels, thumb-stopping focal hierarchy, motion-ready energy",
  },
  {
    id: "youtube-16-9",
    label: "유튜브 썸네일 16:9",
    ratio: "16:9",
    summaryKo: "16:9 썸네일의 강한 대비와 즉시 읽히는 초점",
    englishScene:
      "16:9 YouTube thumbnail geometry with bold focal contrast and instant readability at small sizes",
  },
  {
    id: "smartstore-4-5",
    label: "스마트스토어 4:5",
    ratio: "4:5",
    summaryKo: "커머스 4:5 세로 비율의 디테일 신뢰감과 상품 정확도",
    englishScene:
      "4:5 e-commerce vertical ratio for Korean marketplace listings, product-true macro detail and trustworthy commercial lighting",
  },
  {
    id: "banner-16-9",
    label: "배너 광고 16:9",
    ratio: "16:9",
    summaryKo: "디지털 배너용 16:9의 명료한 히어로 레인과 브랜드 여백",
    englishScene:
      "16:9 premium digital banner composition with clear hero lane, elegant brand negative space, and polished campaign polish",
  },
];

export type AdflexFormState = {
  productName: string;
  industry: string;
  campaignGoal: string;
  features: string;
  targetAudience: string;
  requirements: string;
  formatId: AdFormatId;
  imageFileName: string | null;
};

export const DEFAULT_FORM_STATE: AdflexFormState = {
  productName: "",
  industry: "",
  campaignGoal: "",
  features: "",
  targetAudience: "",
  requirements: "",
  formatId: "instagram-feed-1-1",
  imageFileName: null,
};
