import {
  findKoreanStockByCode,
  getKoreanStockMasterItems,
  type KoreanStockMasterItem,
} from "./koreanStockMaster";
import { STOCK_SYMBOL_MAP, type StockSymbolInfo } from "./stockSymbolMap";

export type KoreanStockSearchResult = {
  item: KoreanStockMasterItem;
  matchType: "exact_code" | "exact_name" | "alias" | "keyword" | "partial";
  score: number;
};

function normalizeSearchText(value: string): string {
  return value.trim().replace(/\s+/g, "").toLowerCase();
}

function isSixDigitCode(value: string): boolean {
  return /^\d{6}$/.test(value.trim());
}

export function isKoreanStockInput(input: string): boolean {
  const query = normalizeSearchText(input);
  if (!query) return false;
  if (isSixDigitCode(query)) return true;

  if (resolveKoreanStock(input)) return true;

  const legacy = STOCK_SYMBOL_MAP.find(
    (stock) =>
      (stock.market === "KOSPI" || stock.market === "KOSDAQ") &&
      [stock.name, stock.code, ...stock.aliases].some(
        (candidate) => normalizeSearchText(candidate) === query,
      ),
  );
  return Boolean(legacy);
}

export function searchKoreanStocks(query: string, limit = 8): KoreanStockSearchResult[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];

  const results: KoreanStockSearchResult[] = [];

  for (const item of getKoreanStockMasterItems()) {
    const code = item.code;
    const name = normalizeSearchText(item.name);
    const aliases = item.aliases.map(normalizeSearchText);
    const keywords = item.searchKeywords.map(normalizeSearchText);

    if (code === normalized) {
      results.push({ item, matchType: "exact_code", score: 100 });
      continue;
    }
    if (name === normalized) {
      results.push({ item, matchType: "exact_name", score: 95 });
      continue;
    }
    if (aliases.includes(normalized) || keywords.includes(normalized)) {
      results.push({ item, matchType: "alias", score: 90 });
      continue;
    }
    if (name.includes(normalized) || normalized.includes(name)) {
      results.push({ item, matchType: "partial", score: 75 });
      continue;
    }
    if (aliases.some((alias) => alias.includes(normalized) || normalized.includes(alias))) {
      results.push({ item, matchType: "partial", score: 70 });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function resolveKoreanStock(input: string): KoreanStockMasterItem | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (isSixDigitCode(trimmed)) {
    return findKoreanStockByCode(trimmed);
  }

  const ranked = searchKoreanStocks(trimmed, 1);
  if (ranked.length > 0 && ranked[0].score >= 70) {
    return ranked[0].item;
  }

  return null;
}

/** Map master item to legacy symbol info for Yahoo fallback. */
export function koreanMasterToSymbolInfo(item: KoreanStockMasterItem): StockSymbolInfo {
  return {
    name: item.name,
    code: item.code,
    market: item.market,
    yahooSymbol: item.yahooSymbol,
    aliases: item.aliases,
  };
}
