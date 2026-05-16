import { NextResponse } from "next/server";
import { analyzeStock } from "@/src/engine/analyzeStock";
import { sampleStockInput } from "@/src/data/sampleStockInput";

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
    let input = sampleStockInput;
    if (hasUsableStockInput(body)) input = body;
    const result = analyzeStock(input);

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200, headers: JSON_HEADERS },
    );
  } catch (error) {
    return createAnalysisErrorResponse(error);
  }
}

function hasUsableStockInput(value: unknown): value is Parameters<typeof analyzeStock>[0] {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    isFiniteNumber(candidate.currentPrice) &&
    isFiniteNumber(candidate.open) &&
    isFiniteNumber(candidate.high) &&
    isFiniteNumber(candidate.low) &&
    isFiniteNumber(candidate.close) &&
    isFiniteNumber(candidate.volume)
  );
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

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
