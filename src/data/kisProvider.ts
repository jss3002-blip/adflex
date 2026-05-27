/**
 * KIS (한국투자증권) Open API provider skeleton — Phase 1 foundation only.
 * Does NOT return fake quotes. Fallback is handled in stockDataProvider.ts.
 */

import type { ProviderStatus } from "./stockDataProvider.types";

export type KisProviderErrorReason =
  | "KIS_CREDENTIALS_MISSING"
  | "KIS_NOT_IMPLEMENTED"
  | "KIS_TOKEN_UNAVAILABLE"
  | "KIS_REQUEST_FAILED";

export type KisUnavailableResult = {
  ok: false;
  reason: KisProviderErrorReason;
  providerStatus: Extract<ProviderStatus, "UNAVAILABLE" | "ERROR">;
  message: string;
};

export type KisQuoteResult = {
  ok: true;
  code: string;
  currentPrice: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  baseDate: string;
  baseTime?: string;
  isRealtime: boolean;
};

export type KisCandle = {
  date: string;
  time?: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type KisCandlesResult = {
  ok: true;
  code: string;
  candles: KisCandle[];
  interval: "1d" | "1m";
};

export type KisProviderResult<T> = T | KisUnavailableResult;

const KIS_ENV_KEYS = {
  appKey: "KIS_APP_KEY",
  appSecret: "KIS_APP_SECRET",
  accountNo: "KIS_ACCOUNT_NO",
  accountProductCode: "KIS_ACCOUNT_PRODUCT_CODE",
  baseUrl: "KIS_BASE_URL",
} as const;

export function getKisEnvConfig(): {
  appKey: string | null;
  appSecret: string | null;
  accountNo: string | null;
  accountProductCode: string | null;
  baseUrl: string;
} {
  return {
    appKey: readEnv(KIS_ENV_KEYS.appKey),
    appSecret: readEnv(KIS_ENV_KEYS.appSecret),
    accountNo: readEnv(KIS_ENV_KEYS.accountNo),
    accountProductCode: readEnv(KIS_ENV_KEYS.accountProductCode),
    baseUrl: readEnv(KIS_ENV_KEYS.baseUrl) ?? "https://openapi.koreainvestment.com:9443",
  };
}

export function isKisConfigured(): boolean {
  const config = getKisEnvConfig();
  return Boolean(config.appKey && config.appSecret);
}

function readEnv(key: string): string | null {
  const value = process.env[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function unavailable(
  reason: KisProviderErrorReason,
  message: string,
  providerStatus: Extract<ProviderStatus, "UNAVAILABLE" | "ERROR"> = "UNAVAILABLE",
): KisUnavailableResult {
  return { ok: false, reason, providerStatus, message };
}

/** Placeholder: OAuth/token flow to be implemented when credentials are available. */
export async function getKisAccessToken(): Promise<string | null> {
  if (!isKisConfigured()) return null;
  // TODO: Implement KIS token issuance per official API docs when credentials exist.
  return null;
}

export async function getKoreanStockQuote(
  code: string,
): Promise<KisProviderResult<KisQuoteResult>> {
  if (!isKisConfigured()) {
    return unavailable(
      "KIS_CREDENTIALS_MISSING",
      "KIS API 자격 증명이 설정되지 않았습니다. 환경 변수 KIS_APP_KEY, KIS_APP_SECRET을 확인하세요.",
    );
  }

  const token = await getKisAccessToken();
  if (!token) {
    return unavailable(
      "KIS_TOKEN_UNAVAILABLE",
      "KIS 접근 토큰을 발급할 수 없습니다. 토큰 연동 구현이 필요합니다.",
    );
  }

  return unavailable(
    "KIS_NOT_IMPLEMENTED",
    `KIS 시세 조회(${code})는 Phase 1 스켈레톤 단계이며, 공식 API 연동 후 제공됩니다.`,
  );
}

export async function getKoreanStockDailyCandles(
  code: string,
): Promise<KisProviderResult<KisCandlesResult>> {
  if (!isKisConfigured()) {
    return unavailable(
      "KIS_CREDENTIALS_MISSING",
      "KIS API 자격 증명이 설정되지 않았습니다.",
    );
  }

  const token = await getKisAccessToken();
  if (!token) {
    return unavailable("KIS_TOKEN_UNAVAILABLE", "KIS 접근 토큰을 발급할 수 없습니다.");
  }

  return unavailable(
    "KIS_NOT_IMPLEMENTED",
    `KIS 일봉 조회(${code})는 Phase 1 스켈레톤 단계입니다.`,
  );
}

export async function getKoreanStockMinuteCandles(
  code: string,
): Promise<KisProviderResult<KisCandlesResult>> {
  if (!isKisConfigured()) {
    return unavailable(
      "KIS_CREDENTIALS_MISSING",
      "KIS API 자격 증명이 설정되지 않았습니다.",
    );
  }

  const token = await getKisAccessToken();
  if (!token) {
    return unavailable("KIS_TOKEN_UNAVAILABLE", "KIS 접근 토큰을 발급할 수 없습니다.");
  }

  return unavailable(
    "KIS_NOT_IMPLEMENTED",
    `KIS 분봉 조회(${code})는 Phase 1 스켈레톤 단계입니다.`,
  );
}
