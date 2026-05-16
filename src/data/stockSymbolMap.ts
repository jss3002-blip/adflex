export type StockSymbolInfo = {
  name: string;
  code: string;
  market: "KOSPI" | "KOSDAQ" | "NASDAQ" | "NYSE";
  yahooSymbol: string;
  aliases: string[];
};

export const STOCK_SYMBOL_MAP: StockSymbolInfo[] = [
  {
    name: "삼성전자",
    code: "005930",
    market: "KOSPI",
    yahooSymbol: "005930.KS",
    aliases: ["삼전", "삼성"],
  },
  {
    name: "SK하이닉스",
    code: "000660",
    market: "KOSPI",
    yahooSymbol: "000660.KS",
    aliases: ["하이닉스", "sk하이닉스"],
  },
  {
    name: "현대차",
    code: "005380",
    market: "KOSPI",
    yahooSymbol: "005380.KS",
    aliases: ["현대자동차", "현차"],
  },
  {
    name: "기아",
    code: "000270",
    market: "KOSPI",
    yahooSymbol: "000270.KS",
    aliases: ["기아차"],
  },
  {
    name: "NAVER",
    code: "035420",
    market: "KOSPI",
    yahooSymbol: "035420.KS",
    aliases: ["네이버"],
  },
  {
    name: "카카오",
    code: "035720",
    market: "KOSPI",
    yahooSymbol: "035720.KS",
    aliases: [],
  },
  {
    name: "LG에너지솔루션",
    code: "373220",
    market: "KOSPI",
    yahooSymbol: "373220.KS",
    aliases: ["엘지에너지솔루션", "LG엔솔"],
  },
  {
    name: "삼성바이오로직스",
    code: "207940",
    market: "KOSPI",
    yahooSymbol: "207940.KS",
    aliases: ["삼바"],
  },
  {
    name: "셀트리온",
    code: "068270",
    market: "KOSPI",
    yahooSymbol: "068270.KS",
    aliases: [],
  },
  {
    name: "POSCO홀딩스",
    code: "005490",
    market: "KOSPI",
    yahooSymbol: "005490.KS",
    aliases: ["포스코홀딩스", "포스코"],
  },
  {
    name: "한화오션",
    code: "042660",
    market: "KOSPI",
    yahooSymbol: "042660.KS",
    aliases: [],
  },
  {
    name: "두산에너빌리티",
    code: "034020",
    market: "KOSPI",
    yahooSymbol: "034020.KS",
    aliases: [],
  },
  {
    name: "현대로템",
    code: "064350",
    market: "KOSPI",
    yahooSymbol: "064350.KS",
    aliases: [],
  },
  {
    name: "한국전력",
    code: "015760",
    market: "KOSPI",
    yahooSymbol: "015760.KS",
    aliases: ["한전"],
  },
  {
    name: "KB금융",
    code: "105560",
    market: "KOSPI",
    yahooSymbol: "105560.KS",
    aliases: [],
  },
  {
    name: "신한지주",
    code: "055550",
    market: "KOSPI",
    yahooSymbol: "055550.KS",
    aliases: [],
  },
  {
    name: "에코프로비엠",
    code: "247540",
    market: "KOSDAQ",
    yahooSymbol: "247540.KQ",
    aliases: [],
  },
  {
    name: "에코프로",
    code: "086520",
    market: "KOSDAQ",
    yahooSymbol: "086520.KQ",
    aliases: [],
  },
  {
    name: "알테오젠",
    code: "196170",
    market: "KOSDAQ",
    yahooSymbol: "196170.KQ",
    aliases: [],
  },
  {
    name: "HLB",
    code: "028300",
    market: "KOSDAQ",
    yahooSymbol: "028300.KQ",
    aliases: [],
  },
  {
    name: "레인보우로보틱스",
    code: "277810",
    market: "KOSDAQ",
    yahooSymbol: "277810.KQ",
    aliases: [],
  },
  {
    name: "엔비디아",
    code: "NVDA",
    market: "NASDAQ",
    yahooSymbol: "NVDA",
    aliases: ["NVDA", "NVIDIA"],
  },
  {
    name: "테슬라",
    code: "TSLA",
    market: "NASDAQ",
    yahooSymbol: "TSLA",
    aliases: ["TESLA"],
  },
  {
    name: "애플",
    code: "AAPL",
    market: "NASDAQ",
    yahooSymbol: "AAPL",
    aliases: ["APPLE"],
  },
  {
    name: "마이크로소프트",
    code: "MSFT",
    market: "NASDAQ",
    yahooSymbol: "MSFT",
    aliases: ["MICROSOFT"],
  },
  {
    name: "구글",
    code: "GOOGL",
    market: "NASDAQ",
    yahooSymbol: "GOOGL",
    aliases: ["알파벳", "GOOGLE"],
  },
];

export function resolveStockSymbol(input: string): StockSymbolInfo | null {
  const query = normalizeSymbolText(input);
  if (!query) return null;

  for (const stock of STOCK_SYMBOL_MAP) {
    const candidates = [stock.name, stock.code, stock.yahooSymbol, ...stock.aliases];
    if (candidates.some((candidate) => normalizeSymbolText(candidate) === query)) {
      return stock;
    }
  }

  return null;
}

function normalizeSymbolText(value: string): string {
  return value.trim().replace(/\s+/g, "").toLowerCase();
}
