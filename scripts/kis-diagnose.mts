/**
 * Safe KIS connectivity check — never prints secrets.
 * Usage: npx tsx scripts/kis-diagnose.mts
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

async function main() {
  const {
    getKisEnvDiagnostics,
    isKisConfigured,
    getKisAccessToken,
    getKoreanStockQuote,
    getKoreanStockDailyCandles,
  } = await import("../src/data/kisProvider");

  const envDiag = getKisEnvDiagnostics();
  console.log("[KIS env]", envDiag);
  console.log("[KIS] configured:", isKisConfigured());

  const token = await getKisAccessToken();
  console.log("[KIS] tokenOk:", Boolean(token));

  const quote = await getKoreanStockQuote("005930");
  console.log(
    "[KIS] quote:",
    quote.ok
      ? { ok: true, price: quote.currentPrice, volume: quote.volume }
      : { ok: false, reason: quote.reason, message: quote.message },
  );

  const daily = await getKoreanStockDailyCandles("005930");
  console.log(
    "[KIS] daily:",
    daily.ok
      ? { ok: true, candleCount: daily.candles.length }
      : { ok: false, reason: daily.reason, message: daily.message },
  );
}

main().catch((err) => {
  console.error("[KIS] diagnose failed", err instanceof Error ? err.message : err);
  process.exit(1);
});
