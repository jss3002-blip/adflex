import OpenAI from "openai";
import { NextResponse } from "next/server";
import { buildAdvertisingMessages } from "@/lib/adflex/advertising-prompt-engine";
import { runAdCreativeEngineWithRetries } from "@/lib/adflex/ad-creative-engine-v2";
import type {
  AdvertisingPromptApiError,
  AdvertisingPromptApiSuccess,
  AdvertisingPromptRequest,
} from "@/lib/adflex/structured-advertising-types";
import type { AdFormatId } from "@/lib/adflex/types";
import { AD_FORMAT_OPTIONS } from "@/lib/adflex/types";

/** OpenAI SDK는 Node 런타임 필요 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const FORMAT_IDS = new Set<string>(AD_FORMAT_OPTIONS.map((f) => f.id));

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function parseAdvertisingRequest(body: unknown): AdvertisingPromptRequest | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const id = (b.adFormatId ?? b.ad_format_id ?? b.formatId ?? b.format_id) as unknown;
  if (typeof id !== "string" || !FORMAT_IDS.has(id)) return null;

  return {
    productName: asString(b.productName ?? b.product_name),
    industry: asString(b.industry),
    features: asString(b.features),
    targetAudience: asString(b.targetAudience ?? b.target_audience),
    campaignGoal: asString(b.campaignGoal ?? b.campaign_goal),
    requirements: asString(b.requirements),
    adFormatId: id as AdFormatId,
    imageFileName: asString(b.imageFileName ?? b.image_file_name) || null,
  };
}

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
} as const;

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      endpoint: "/api/openai",
      methods: ["GET", "POST", "OPTIONS"],
      engine: "v2_ad_creative_engine",
      usage:
        "POST JSON: productName, industry, features, targetAudience, campaignGoal, requirements, adFormatId (or formatId). Response data follows v2 schema (meta, strategy, scenario, visual, final_prompt, negative_prompt).",
      adFormatIds: AD_FORMAT_OPTIONS.map((f) => f.id),
    },
    { status: 200, headers: JSON_HEADERS },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "GET, POST, OPTIONS",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "OPENAI_API_KEY가 설정되지 않았습니다." } satisfies AdvertisingPromptApiError,
      { status: 500, headers: JSON_HEADERS },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "JSON 본문을 읽을 수 없습니다." } satisfies AdvertisingPromptApiError,
      { status: 400, headers: JSON_HEADERS },
    );
  }

  const payload = parseAdvertisingRequest(json);
  if (!payload) {
    return NextResponse.json(
      {
        ok: false,
        error: "유효하지 않은 요청입니다. adFormatId(또는 formatId) 및 필드를 확인하세요.",
        details: `허용 adFormatId: ${[...FORMAT_IDS].join(", ")}`,
      } satisfies AdvertisingPromptApiError,
      { status: 400, headers: JSON_HEADERS },
    );
  }

  try {
    const client = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

    const { raw, data, usedFallback } = await runAdCreativeEngineWithRetries(
      client,
      model,
      payload,
      buildAdvertisingMessages,
      3,
    );

    return NextResponse.json(
      {
        ok: true,
        data,
        rawModelJson: raw,
        usedFallback,
      } satisfies AdvertisingPromptApiSuccess,
      { status: 200, headers: JSON_HEADERS },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: "OpenAI 호출 중 오류가 발생했습니다.", details: message } satisfies AdvertisingPromptApiError,
      { status: 500, headers: JSON_HEADERS },
    );
  }
}
