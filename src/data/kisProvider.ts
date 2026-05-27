/**
 * KIS (한국투자증권) Open API provider.
 * Fallback is handled in stockDataProvider.ts — this module does not call Yahoo.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ProviderStatus } from "./stockDataProvider.types";

export type KisProviderErrorReason =
  | "KIS_ENV_MISSING"
  | "KIS_CREDENTIALS_MISSING"
  | "KIS_NOT_IMPLEMENTED"
  | "KIS_TOKEN_UNAVAILABLE"
  | "KIS_TOKEN_FAILED"
  | "KIS_REQUEST_FAILED"
  | "KIS_INVALID_RESPONSE"
  | "KIS_RESPONSE_PARSE_FAILED"
  | "KIS_EMPTY_DATA"
  | "KIS_QUOTE_FAILED"
  | "KIS_DAILY_FAILED"
  | "KIS_DAILY_EMPTY"
  | "KIS_DAILY_TOO_FEW_CANDLES"
  | "KIS_PERMISSION_DENIED"
  | "KIS_RATE_LIMITED"
  | "KIS_NETWORK_ERROR";

/** Minimum daily candles required for engine analysis (see normalizedMarketData). */
export const KIS_MIN_DAILY_CANDLES_FOR_ANALYSIS = 20;

export type KisEnvDiagnostics = {
  hasAppKey: boolean;
  hasAppSecret: boolean;
  appKeyLength: number;
  appSecretLength: number;
  baseUrlHost: string | null;
  baseUrlConfigured: boolean;
  useMock: boolean;
  accountNoConfigured: boolean;
  accountProductCode: string | null;
  envSource: "process.env";
  configured: boolean;
};

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
  change?: number;
  changeRate?: number;
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

const KIS_REAL_BASE_URL = "https://openapi.koreainvestment.com:9443";
const KIS_MOCK_BASE_URL = "https://openapivts.koreainvestment.com:29443";
const TOKEN_REFRESH_BUFFER_MS = 60_000;
const DAILY_LOOKBACK_DAYS = 120;

let cachedKisToken: string | null = null;
let cachedKisTokenExpiresAt = 0;
let envLocalBootstrapAttempted = false;

/**
 * Next.js dev server occasionally starts without .env.local in process.env
 * (e.g. first load timing). One-time server-side bootstrap — never logs values.
 */
function bootstrapEnvLocalIfNeeded(): void {
  if (envLocalBootstrapAttempted) return;
  envLocalBootstrapAttempted = true;

  if (typeof window !== "undefined") return;
  if (readEnv(KIS_ENV_KEYS.appKey) && readEnv(KIS_ENV_KEYS.appSecret)) return;

  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  try {
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!key.startsWith("KIS_")) continue;
      let value = trimmed.slice(eq + 1).trim();
      value = stripEnvQuotes(value);
      if (!process.env[key] && value.length > 0) {
        process.env[key] = value;
      }
    }
  } catch {
    // ignore — fall back to Yahoo when env cannot be read
  }
}

const KIS_ENV_KEYS = {
  appKey: "KIS_APP_KEY",
  appSecret: "KIS_APP_SECRET",
  accountNo: "KIS_ACCOUNT_NO",
  accountProductCode: "KIS_ACCOUNT_PRODUCT_CODE",
  baseUrl: "KIS_BASE_URL",
  useMock: "KIS_USE_MOCK",
} as const;

export function getKisEnvConfig(): {
  appKey: string | null;
  appSecret: string | null;
  accountNo: string | null;
  accountProductCode: string | null;
  baseUrl: string;
  useMock: boolean;
} {
  bootstrapEnvLocalIfNeeded();
  const useMock = readEnvBoolean(KIS_ENV_KEYS.useMock);
  const configuredBase = readEnv(KIS_ENV_KEYS.baseUrl);
  const baseUrl =
    configuredBase ??
    (useMock ? KIS_MOCK_BASE_URL : KIS_REAL_BASE_URL);

  return {
    appKey: readEnv(KIS_ENV_KEYS.appKey),
    appSecret: readEnv(KIS_ENV_KEYS.appSecret),
    accountNo: readEnv(KIS_ENV_KEYS.accountNo),
    accountProductCode: readEnv(KIS_ENV_KEYS.accountProductCode) ?? "01",
    baseUrl,
    useMock,
  };
}

export function isKisConfigured(): boolean {
  const config = getKisEnvConfig();
  return Boolean(config.appKey && config.appSecret);
}

function stripEnvQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function readEnv(key: string): string | null {
  const value = process.env[key];
  if (typeof value !== "string") return null;
  const trimmed = stripEnvQuotes(value);
  return trimmed.length > 0 ? trimmed : null;
}

function getBaseUrlHost(baseUrl: string): string | null {
  try {
    return new URL(baseUrl).host;
  } catch {
    return null;
  }
}

export function getKisEnvDiagnostics(): KisEnvDiagnostics {
  bootstrapEnvLocalIfNeeded();
  const config = getKisEnvConfig();
  const rawKey = process.env[KIS_ENV_KEYS.appKey];
  const rawSecret = process.env[KIS_ENV_KEYS.appSecret];
  const appKeyLength =
    typeof rawKey === "string" ? stripEnvQuotes(rawKey).length : config.appKey?.length ?? 0;
  const appSecretLength =
    typeof rawSecret === "string"
      ? stripEnvQuotes(rawSecret).length
      : config.appSecret?.length ?? 0;

  return {
    hasAppKey: Boolean(config.appKey),
    hasAppSecret: Boolean(config.appSecret),
    appKeyLength,
    appSecretLength,
    baseUrlHost: getBaseUrlHost(config.baseUrl),
    baseUrlConfigured: Boolean(readEnv(KIS_ENV_KEYS.baseUrl)),
    useMock: config.useMock,
    accountNoConfigured: Boolean(config.accountNo),
    accountProductCode: config.accountProductCode,
    envSource: "process.env",
    configured: isKisConfigured(),
  };
}

function readEnvBoolean(key: string): boolean {
  const value = readEnv(key);
  if (!value) return false;
  return value.toLowerCase() === "true" || value === "1";
}

function unavailable(
  reason: KisProviderErrorReason,
  message: string,
  providerStatus: Extract<ProviderStatus, "UNAVAILABLE" | "ERROR"> = "UNAVAILABLE",
): KisUnavailableResult {
  return { ok: false, reason, providerStatus, message };
}

function mapHttpFailureReason(status: number): KisProviderErrorReason {
  if (status === 401 || status === 403) return "KIS_PERMISSION_DENIED";
  if (status === 429) return "KIS_RATE_LIMITED";
  return "KIS_REQUEST_FAILED";
}

function safeApiErrorMessage(body: Record<string, unknown>): string {
  const msg1 = typeof body.msg1 === "string" ? body.msg1.trim() : "";
  const msgCd = typeof body.msg_cd === "string" ? body.msg_cd.trim() : "";
  if (msg1 && msgCd) return `${msgCd}: ${msg1}`;
  return msg1 || msgCd || "API error";
}

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }
  return null;
}

export function normalizeTime(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d{6}$/.test(raw)) {
    return `${raw.slice(0, 2)}:${raw.slice(2, 4)}:${raw.slice(4, 6)}`;
  }
  return raw;
}

function normalizeStockCode(code: string): string {
  return code.trim().replace(/\D/g, "").padStart(6, "0").slice(-6);
}

function isKisSuccessBody(body: Record<string, unknown>): boolean {
  const rtCd = body.rt_cd;
  if (rtCd === undefined || rtCd === null) return true;
  return String(rtCd) === "0";
}

function extractOutputRows(body: Record<string, unknown>): Record<string, unknown>[] {
  const output = body.output;
  const output2 = body.output2;

  if (Array.isArray(output2) && output2.length > 0) {
    return output2.filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object"));
  }
  if (Array.isArray(output) && output.length > 0) {
    return output.filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object"));
  }
  if (output && typeof output === "object" && !Array.isArray(output)) {
    return [output as Record<string, unknown>];
  }
  return [];
}

function extractSingleOutput(body: Record<string, unknown>): Record<string, unknown> | null {
  const output = body.output;
  if (output && typeof output === "object" && !Array.isArray(output)) {
    return output as Record<string, unknown>;
  }
  const rows = extractOutputRows(body);
  return rows[0] ?? null;
}

function parseTokenExpiry(body: Record<string, unknown>): number {
  const expiresIn = toNumber(body.expires_in);
  if (expiresIn !== null && expiresIn > 0) {
    return Date.now() + expiresIn * 1000;
  }

  const expiredText =
    typeof body.access_token_token_expired === "string"
      ? body.access_token_token_expired
      : typeof body.access_token_expired === "string"
        ? body.access_token_expired
        : null;

  if (expiredText) {
    const parsed = Date.parse(expiredText.replace(" ", "T"));
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return Date.now() + 23 * 60 * 60 * 1000;
}

export type KisTokenResult =
  | { ok: true }
  | { ok: false; reason: KisProviderErrorReason; message: string };

export async function ensureKisAccessToken(): Promise<KisTokenResult> {
  if (!isKisConfigured()) {
    return {
      ok: false,
      reason: "KIS_ENV_MISSING",
      message: "KIS_APP_KEY 또는 KIS_APP_SECRET이 설정되지 않았습니다.",
    };
  }

  const token = await getKisAccessToken();
  if (token) return { ok: true };

  return {
    ok: false,
    reason: "KIS_TOKEN_FAILED",
    message: "KIS 접근 토큰 발급에 실패했습니다. 자격 증명·Base URL·모의투자 설정을 확인하세요.",
  };
}

export async function getKisAccessToken(): Promise<string | null> {
  if (!isKisConfigured()) return null;

  if (cachedKisToken && Date.now() < cachedKisTokenExpiresAt - TOKEN_REFRESH_BUFFER_MS) {
    return cachedKisToken;
  }

  const config = getKisEnvConfig();
  const url = `${config.baseUrl.replace(/\/$/, "")}/oauth2/tokenP`;

  try {
    const response = await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        appkey: config.appKey,
        appsecret: config.appSecret,
      }),
    });

    if (!response.ok) {
      const reason = mapHttpFailureReason(response.status);
      console.error("[StockAI KIS]", {
        stage: "kis-token",
        tokenOk: false,
        httpStatus: response.status,
        reason,
      });
      cachedKisToken = null;
      cachedKisTokenExpiresAt = 0;
      return null;
    }

    const body = (await response.json()) as Record<string, unknown>;
    if (!isKisSuccessBody(body)) {
      console.error("[StockAI KIS]", {
        stage: "kis-token",
        tokenOk: false,
        reason: "KIS_TOKEN_FAILED",
        apiMessage: safeApiErrorMessage(body),
      });
      cachedKisToken = null;
      cachedKisTokenExpiresAt = 0;
      return null;
    }

    const token =
      typeof body.access_token === "string" && body.access_token.trim()
        ? body.access_token.trim()
        : null;

    if (!token) {
      console.error("[StockAI KIS]", {
        stage: "kis-token",
        tokenOk: false,
        reason: "KIS_RESPONSE_PARSE_FAILED",
      });
      return null;
    }

    cachedKisToken = token;
    cachedKisTokenExpiresAt = parseTokenExpiry(body);
    return token;
  } catch {
    console.error("[StockAI KIS]", {
      stage: "kis-token",
      tokenOk: false,
      reason: "KIS_NETWORK_ERROR",
    });
    cachedKisToken = null;
    cachedKisTokenExpiresAt = 0;
    return null;
  }
}

type KisJsonResult =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; reason: KisProviderErrorReason; message: string };

async function kisGetJson(params: {
  path: string;
  trId: string;
  query: Record<string, string>;
  stage: string;
}): Promise<KisJsonResult> {
  const config = getKisEnvConfig();
  const token = await getKisAccessToken();
  if (!token || !config.appKey || !config.appSecret) {
    return {
      ok: false,
      reason: "KIS_TOKEN_FAILED",
      message: "KIS 접근 토큰이 없어 API를 호출할 수 없습니다.",
    };
  }

  const search = new URLSearchParams(params.query);
  const url = `${config.baseUrl.replace(/\/$/, "")}${params.path}?${search.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        authorization: `Bearer ${token}`,
        appkey: config.appKey,
        appsecret: config.appSecret,
        tr_id: params.trId,
        custtype: "P",
      },
    });

    if (!response.ok) {
      const reason = mapHttpFailureReason(response.status);
      console.error("[StockAI KIS]", {
        stage: params.stage,
        httpStatus: response.status,
        reason,
        path: params.path,
      });
      return {
        ok: false,
        reason,
        message: `KIS API HTTP ${response.status} (${params.stage})`,
      };
    }

    const body = (await response.json()) as Record<string, unknown>;
    if (!isKisSuccessBody(body)) {
      const apiMessage = safeApiErrorMessage(body);
      console.error("[StockAI KIS]", {
        stage: params.stage,
        reason: "KIS_REQUEST_FAILED",
        apiMessage,
        path: params.path,
      });
      return {
        ok: false,
        reason: "KIS_REQUEST_FAILED",
        message: apiMessage,
      };
    }

    return { ok: true, body };
  } catch {
    console.error("[StockAI KIS]", {
      stage: params.stage,
      reason: "KIS_NETWORK_ERROR",
      path: params.path,
    });
    return {
      ok: false,
      reason: "KIS_NETWORK_ERROR",
      message: `KIS 네트워크 오류 (${params.stage})`,
    };
  }
}

function formatSeoulYmd(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date).replace(/-/g, "");
}

function getDailyQueryDateRange(): { start: string; end: string } {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - DAILY_LOOKBACK_DAYS);
  return {
    start: formatSeoulYmd(startDate),
    end: formatSeoulYmd(endDate),
  };
}

export async function getKoreanStockQuote(
  code: string,
): Promise<KisProviderResult<KisQuoteResult>> {
  const normalizedCode = normalizeStockCode(code);

  if (!isKisConfigured()) {
    return unavailable(
      "KIS_ENV_MISSING",
      "KIS API 자격 증명이 설정되지 않았습니다. .env.local의 KIS_APP_KEY, KIS_APP_SECRET을 확인하세요.",
    );
  }

  const tokenCheck = await ensureKisAccessToken();
  if (!tokenCheck.ok) {
    return unavailable(tokenCheck.reason, tokenCheck.message, "ERROR");
  }

  const jsonResult = await kisGetJson({
    path: "/uapi/domestic-stock/v1/quotations/inquire-price",
    trId: "FHKST01010100",
    stage: "kis-quote",
    query: {
      FID_COND_MRKT_DIV_CODE: "J",
      FID_INPUT_ISCD: normalizedCode,
    },
  });

  if (!jsonResult.ok) {
    return unavailable(
      jsonResult.reason === "KIS_REQUEST_FAILED" ? "KIS_QUOTE_FAILED" : jsonResult.reason,
      jsonResult.message,
      "ERROR",
    );
  }

  const row = extractSingleOutput(jsonResult.body);
  if (!row) {
    return unavailable("KIS_EMPTY_DATA", "KIS 현재가 응답 데이터가 비어 있습니다.");
  }

  const currentPrice = toNumber(row.stck_prpr);
  if (currentPrice === null || currentPrice <= 0) {
    return unavailable("KIS_INVALID_RESPONSE", "KIS 현재가가 유효하지 않습니다.");
  }

  const previousClose =
    toNumber(row.stck_sdpr) ??
    toNumber(row.prdy_clpr) ??
    currentPrice;
  const open = toNumber(row.stck_oprc) ?? currentPrice;
  const high = toNumber(row.stck_hgpr) ?? currentPrice;
  const low = toNumber(row.stck_lwpr) ?? currentPrice;
  const volume = toNumber(row.acml_vol) ?? 0;
  const change = toNumber(row.prdy_vrss);
  const changeRate = toNumber(row.prdy_ctrt);
  const baseDate =
    normalizeDate(row.stck_bsop_date) ?? normalizeDate(new Date().toISOString()) ?? "";
  const baseTime = normalizeTime(row.stck_cntg_hour) ?? undefined;

  return {
    ok: true,
    code: normalizedCode,
    currentPrice,
    previousClose,
    open,
    high,
    low,
    close: currentPrice,
    volume,
    change: change ?? undefined,
    changeRate: changeRate ?? undefined,
    baseDate,
    baseTime,
    isRealtime: true,
  };
}

export const fetchKisCurrentPrice = getKoreanStockQuote;

function parseDailyCandleRow(row: Record<string, unknown>): KisCandle | null {
  const date = normalizeDate(row.stck_bsop_date);
  const open = toNumber(row.stck_oprc);
  const high = toNumber(row.stck_hgpr);
  const low = toNumber(row.stck_lwpr);
  const close = toNumber(row.stck_clpr);
  const volume = toNumber(row.acml_vol) ?? 0;

  if (!date) return null;
  if (close === null || close <= 0) return null;
  if (open === null || high === null || low === null) return null;
  if (high < low || open <= 0) return null;

  return {
    date,
    open,
    high,
    low,
    close,
    volume,
  };
}

export async function getKoreanStockDailyCandles(
  code: string,
): Promise<KisProviderResult<KisCandlesResult>> {
  const normalizedCode = normalizeStockCode(code);

  if (!isKisConfigured()) {
    return unavailable(
      "KIS_ENV_MISSING",
      "KIS API 자격 증명이 설정되지 않았습니다.",
    );
  }

  const tokenCheck = await ensureKisAccessToken();
  if (!tokenCheck.ok) {
    return unavailable(tokenCheck.reason, tokenCheck.message, "ERROR");
  }

  const { start, end } = getDailyQueryDateRange();
  const jsonResult = await kisGetJson({
    path: "/uapi/domestic-stock/v1/quotations/inquire-daily-price",
    trId: "FHKST01010400",
    stage: "kis-daily",
    query: {
      FID_COND_MRKT_DIV_CODE: "J",
      FID_INPUT_ISCD: normalizedCode,
      FID_PERIOD_DIV_CODE: "D",
      FID_ORG_ADJ_PRC: "0",
      FID_INPUT_DATE_1: start,
      FID_INPUT_DATE_2: end,
    },
  });

  if (!jsonResult.ok) {
    return unavailable(
      jsonResult.reason === "KIS_REQUEST_FAILED" ? "KIS_DAILY_FAILED" : jsonResult.reason,
      jsonResult.message,
      "ERROR",
    );
  }

  const rows = extractOutputRows(jsonResult.body);
  const candles = rows
    .map(parseDailyCandleRow)
    .filter((candle): candle is KisCandle => candle !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (candles.length === 0) {
    return unavailable(
      "KIS_DAILY_EMPTY",
      "KIS 일봉 응답에 유효한 캔들이 없습니다.",
    );
  }

  if (candles.length < KIS_MIN_DAILY_CANDLES_FOR_ANALYSIS) {
    return unavailable(
      "KIS_DAILY_TOO_FEW_CANDLES",
      `KIS 일봉 ${candles.length}개 — 분석 최소 ${KIS_MIN_DAILY_CANDLES_FOR_ANALYSIS}개 필요`,
    );
  }

  return {
    ok: true,
    code: normalizedCode,
    candles,
    interval: "1d",
  };
}

export const fetchKisDailyPrice = getKoreanStockDailyCandles;

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
    `KIS 분봉 조회(${normalizeStockCode(code)})는 아직 지원하지 않습니다.`,
  );
}
