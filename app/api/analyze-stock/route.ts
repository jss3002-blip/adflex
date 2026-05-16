import { NextResponse } from "next/server";
import { analyzeStock } from "@/src/engine/analyzeStock";
import { sampleStockInput } from "@/src/data/sampleStockInput";
import { resolveStockSymbol } from "@/src/data/stockSymbolMap";
import { fetchYahooFinanceStockInput } from "@/src/data/yahooFinanceProvider";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
} as const;

export async function GET() {
  try {
    const result = analyzeStock(sampleStockInput);

    return NextResponse.json(
      {
        success: true,
        mode: "sample",
        source: "sample",
        data: result,
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
      const result = analyzeStock(sampleStockInput);

      return NextResponse.json(
        {
          success: true,
          mode: "sample",
          source: "sample",
          data: result,
        },
        { status: 200, headers: JSON_HEADERS },
      );
    }

    const resolvedStock = resolveStockSymbol(stockName);

    if (!resolvedStock) {
      return NextResponse.json(
        {
          success: false,
          error: "지원하지 않는 종목명입니다.",
          detail: "현재 등록된 종목명 또는 별칭을 입력해 주세요.",
        },
        { status: 400, headers: JSON_HEADERS },
      );
    }

    try {
      const realInput = await fetchYahooFinanceStockInput({ stock: resolvedStock });
      const result = analyzeStock(realInput);

      return NextResponse.json(
        {
          success: true,
          mode: "real-data",
          source: "yahoo-finance",
          stock: resolvedStock,
          data: result,
        },
        { status: 200, headers: JSON_HEADERS },
      );
    } catch {
      const result = analyzeStock(sampleStockInput);

      return NextResponse.json(
        {
          success: true,
          mode: "sample-fallback",
          source: "sample",
          stock: resolvedStock,
          warning: "실제 시세 데이터를 가져오지 못해 샘플 데이터로 대체했습니다.",
          data: result,
        },
        { status: 200, headers: JSON_HEADERS },
      );
    }
  } catch (error) {
    return createAnalysisErrorResponse(error);
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

