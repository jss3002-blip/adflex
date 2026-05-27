export type MarketType =
  | "KOSPI"
  | "KOSDAQ"
  | "NASDAQ"
  | "NYSE"
  | "AMEX"
  | "CRYPTO"
  | "OTHER";

export type AnalysisMode = "INTRADAY" | "EOD" | "BACKTEST";

export type MarketRegime =
  | "STRONG_UPTREND"
  | "WEAK_UPTREND"
  | "SIDEWAYS"
  | "WEAK_DOWNTREND"
  | "STRONG_DOWNTREND"
  | "HIGH_VOLATILITY"
  | "LOW_VOLATILITY"
  | "EVENT_MARKET";

export type StockType =
  | "LARGE_CAP"
  | "MID_CAP"
  | "SMALL_CAP"
  | "THEME"
  | "BIO"
  | "SEMICONDUCTOR"
  | "SHIPBUILDING"
  | "FINANCIAL"
  | "LOW_LIQUIDITY"
  | "UNKNOWN";

export type ActionCode =
  | "WATCHLIST"
  | "WAIT_CONFIRMATION"
  | "BUY_ON_PULLBACK"
  | "RISK_REDUCTION"
  | "EXIT_PRIORITY"
  | "AVOID"
  | "HUMAN_REVIEW";

export type StockState =
  | "STRONG_UPTREND"
  | "BREAKOUT_ATTEMPT"
  | "PULLBACK_SETUP"
  | "OVERHEATED"
  | "BOTTOM_REBOUND"
  | "TREND_BREAKDOWN"
  | "WATCHLIST"
  | "HIGH_RISK_MOMENTUM"
  | "NEUTRAL"
  | "INSUFFICIENT_DATA";

export type Candle = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  value?: number;
  vwap?: number;
};

export type OHLCVSeries = {
  candles: Candle[];
  timeframe: "1m" | "3m" | "5m" | "15m" | "30m" | "1h" | "1d";
  source: "sample" | "realtime" | "confirmed" | "backtest";
};

export type StockAnalysisInput = {
  ticker: string;
  name: string;
  market: MarketType;
  analysisMode: AnalysisMode;
  asOf: string;
  marketRegime: MarketRegime;
  stockType: StockType;
  currentPrice: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  averageVolume20d?: number;
  averageVolume10d?: number;
  vwap?: number;
  week52High?: number;
  week52Low?: number;
  ohlcv: OHLCVSeries;
  metadata?: {
    currency?: string;
    sector?: string;
    industry?: string;
    isRealtime?: boolean;
    isConfirmedEOD?: boolean;
    dataSource?: string;
    analysisInputSource?: string;
    kisCandleCount?: number;
    periodHighLowDays?: number;
    week52IsLimitedHistory?: boolean;
    week52HistoryLabel?: string;
    vwapIsDailyEstimate?: boolean;
    vwapBasisLabel?: string;
    latestCandleDate?: string;
    firstCandleDate?: string;
  };
};

export type ScoreSummary = {
  opportunityScore: number;
  riskScore: number;
  confidenceScore: number;
  finalScore: number;
  technicalScore?: number;
  volumeScore?: number;
  vwapScore?: number;
  priceLocationScore?: number;
  dataQualityScore?: number;
};

export type GateSummary = {
  passed: boolean;
  triggeredGates: string[];
  blockedReason?: string;
  requiresHumanReview: boolean;
};

export type ActionDecision = {
  actionCode: ActionCode;
  labelKo: string;
  reasonKo: string;
  cautionKo?: string;
};

export type EvidenceSummary = {
  positive: string[];
  negative: string[];
  neutral: string[];
  missingData: string[];
};

export type DataQualitySummary = {
  score: number;
  missingFields: string[];
  staleFields: string[];
  warnings: string[];
  isAnalysisAllowed: boolean;
};

export type StockAnalysisResult = {
  ticker: string;
  name: string;
  asOf: string;
  analysisMode: AnalysisMode;
  marketRegime: MarketRegime;
  stockType: StockType;
  scores: ScoreSummary;
  state: StockState;
  action: ActionDecision;
  gates: GateSummary;
  evidence: EvidenceSummary;
  dataQuality: DataQualitySummary;
  warnings: string[];
  summaryKo: string;
};
