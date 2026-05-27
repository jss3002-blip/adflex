/**
 * Korean stock master — development seed list only.
 * Replace/extend with full KRX master import in a later phase.
 */

export type KoreanMarket = "KOSPI" | "KOSDAQ";

export type KoreanStockMasterItem = {
  code: string;
  name: string;
  market: KoreanMarket;
  aliases: string[];
  searchKeywords: string[];
  yahooSymbol: string;
};

/** Extensible in-memory master (later: load from KRX file/API). */
export type KoreanStockMaster = {
  version: string;
  updatedAt: string;
  items: KoreanStockMasterItem[];
};

const DEV_KOREAN_STOCKS: KoreanStockMasterItem[] = [
  {
    code: "005930",
    name: "삼성전자",
    market: "KOSPI",
    aliases: ["삼전", "삼성"],
    searchKeywords: ["삼성전자", "005930", "삼전", "삼성", "samsung"],
    yahooSymbol: "005930.KS",
  },
  {
    code: "000660",
    name: "SK하이닉스",
    market: "KOSPI",
    aliases: ["하이닉스", "sk하이닉스"],
    searchKeywords: ["sk하이닉스", "000660", "하이닉스", "hynix"],
    yahooSymbol: "000660.KS",
  },
  {
    code: "035420",
    name: "NAVER",
    market: "KOSPI",
    aliases: ["네이버"],
    searchKeywords: ["naver", "035420", "네이버"],
    yahooSymbol: "035420.KS",
  },
  {
    code: "035720",
    name: "카카오",
    market: "KOSPI",
    aliases: ["카카오톡"],
    searchKeywords: ["카카오", "035720", "kakao"],
    yahooSymbol: "035720.KS",
  },
  {
    code: "005380",
    name: "현대차",
    market: "KOSPI",
    aliases: ["현대자동차", "현차"],
    searchKeywords: ["현대차", "005380", "현대자동차", "hyundai"],
    yahooSymbol: "005380.KS",
  },
];

export const KOREAN_STOCK_MASTER: KoreanStockMaster = {
  version: "dev-seed-1",
  updatedAt: "2026-05-27",
  items: DEV_KOREAN_STOCKS,
};

export function getKoreanStockMasterItems(): KoreanStockMasterItem[] {
  return KOREAN_STOCK_MASTER.items;
}

export function findKoreanStockByCode(code: string): KoreanStockMasterItem | null {
  const normalized = code.trim().replace(/\D/g, "").padStart(6, "0").slice(-6);
  return KOREAN_STOCK_MASTER.items.find((item) => item.code === normalized) ?? null;
}
