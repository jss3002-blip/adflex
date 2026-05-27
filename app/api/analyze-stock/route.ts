import { NextResponse } from "next/server";
import { analyzeStock, type StockAnalysisResult } from "@/src/engine/analyzeStock";
import { sampleStockInput } from "@/src/data/sampleStockInput";
import { buildSampleFreshness, getStockDataForAnalysis } from "@/src/data/stockDataProvider";
import {
  buildStockSummaryInputFromAnalysis,
  generateStockSummary,
  isOpenAIApiKeyConfigured,
  type StockSummaryAiOutput,
} from "@/src/ai/generateStockSummary";

export const runtime = "nodejs";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
} as const;

export async function GET() {
  try {
    const result = analyzeStock(sampleStockInput);
    const aiSummary = await resolveAiSummary(result);

    return NextResponse.json(
      {
        success: true,
        mode: "SAMPLE",
        source: "sample",
        freshness: buildSampleFreshness("SAMPLE"),
        data: result,
        aiSummary,
      },
      { status: 200, headers: JSON_HEADERS },
    );
  } catch (error) {
    return createAnalysisErrorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req);
    const stockName = getStockName(body);

    if (!stockName) {
      const freshness = buildSampleFreshness("SAMPLE");
      const result = analyzeStock(sampleStockInput);
      const aiSummary = await resolveAiSummary(result);

      return NextResponse.json(
        {
          success: true,
          mode: freshness.mode,
          source: freshness.provider,
          freshness,
          data: result,
          aiSummary,
        },
        { status: 200, headers: JSON_HEADERS },
      );
    }

    try {
      const providerResult = await getStockDataForAnalysis({ stockName });
      const result = analyzeStock(providerResult.input);
      const aiSummary = await resolveAiSummary(result, stockName, {
        freshness: providerResult.freshness,
        dataLineage: providerResult.dataLineage,
      });

      return NextResponse.json(
        {
          success: true,
          mode: providerResult.freshness.mode,
          source: providerResult.freshness.provider,
          freshness: providerResult.freshness,
          marketData: providerResult.marketData,
          chartSeries: providerResult.chartSeries,
          diagnostics: providerResult.diagnostics,
          dataLineage: providerResult.dataLineage,
          sourceConsistency: providerResult.sourceConsistency,
          kisEnv: providerResult.kisEnv,
          kisFallbackReason: providerResult.kisFallbackReason,
          warning: providerResult.warning,
          data: result,
          aiSummary,
        },
        { status: 200, headers: JSON_HEADERS },
      );
    } catch (error) {
      if (getErrorMessage(error) === "UNSUPPORTED_STOCK_SYMBOL") {
        return NextResponse.json(
          {
            success: false,
            error: "지원하지 않는 종목명입니다.",
            detail: "현재 등록된 종목명 또는 별칭을 입력해 주세요.",
          },
          { status: 400, headers: JSON_HEADERS },
        );
      }

      const freshness = buildSampleFreshness("FALLBACK");
      const result = analyzeStock(sampleStockInput);
      const aiSummary = await resolveAiSummary(result, stockName);

      return NextResponse.json(
        {
          success: true,
          mode: freshness.mode,
          source: freshness.provider,
          freshness,
          warning: "실제 시세 데이터를 가져오지 못해 샘플 데이터로 대체했습니다.",
          data: result,
          aiSummary,
        },
        { status: 200, headers: JSON_HEADERS },
      );
    }
  } catch (error) {
    return createAnalysisErrorResponse(error);
  }
}

type AiSummaryContext = {
  freshness?: Awaited<ReturnType<typeof getStockDataForAnalysis>>["freshness"];
  dataLineage?: Awaited<ReturnType<typeof getStockDataForAnalysis>>["dataLineage"];
};

async function resolveAiSummary(
  result: StockAnalysisResult,
  stockName?: string,
  context?: AiSummaryContext,
): Promise<StockSummaryAiOutput | null> {
  console.log("[StockAI] OPENAI_API_KEY exists", isOpenAIApiKeyConfigured());

  try {
    const aiSummaryResult = await generateStockSummary(
      buildStockSummaryInputFromAnalysis(result, {
        stockName,
        dataBasis: context?.freshness
          ? {
              provider: context.freshness.provider,
              dataMode: context.freshness.dataMode ?? context.freshness.mode,
              sourceLabel: context.freshness.sourceLabel,
              analysisInputSource:
                context.dataLineage?.analysisInputSource ??
                result.normalized.metadata?.analysisInputSource ??
                result.normalized.metadata?.dataSource,
              isRealtime: context.freshness.isRealtime,
              baseDate: context.freshness.baseDate,
              vwapBasis: context.dataLineage?.vwapBasis,
              week52HistoryLabel: context.dataLineage?.week52HistoryLabel,
            }
          : undefined,
      }),
    );

    const aiSummary = aiSummaryResult.ok ? aiSummaryResult.data : null;
    console.log("[StockAI] aiSummary", JSON.stringify(aiSummary, null, 2));
    console.log("[StockAI] has sixWForecast", Boolean(aiSummary?.sixWForecast));
    console.log("[StockAI] has howMuch", Boolean(aiSummary?.sixWForecast?.howMuch));
    console.log(
      "[StockAI] has consumerDecisionGuide",
      Boolean(aiSummary?.sixWForecast?.consumerDecisionGuide),
    );
    console.log(
      "[StockAI] has dynamicReasoning",
      Boolean(aiSummary?.sixWForecast?.dynamicReasoning),
    );

    if (aiSummary) return aiSummary;

    console.error(
      "[StockAI] AI summary generation failed",
      aiSummaryResult.error ?? aiSummaryResult.source,
    );
    return null;
  } catch (error) {
    console.error("[StockAI] AI summary generation failed", error);
    return null;
  }
}

function getStockName(value: unknown): string {
  if (!value || typeof value !== "object") return "";

  const candidate = value as Record<string, unknown>;
  if (typeof candidate.stockName !== "string") return "";
  return candidate.stockName.trim();
}

async function readJsonBody(req: Request): Promise<unknown> {
  const rawBody = await req.text();
  if (!rawBody.trim()) return null;
  return JSON.parse(rawBody);
}

function createAnalysisErrorResponse(error: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: "StockAI analysis failed.",
      detail: getErrorMessage(error),
    },
    { status: 500, headers: JSON_HEADERS },
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}
