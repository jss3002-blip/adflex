/** 브라우저에서 항상 동일 오리진으로 API 호출 (프록시/상대경로 이슈 완화) */
export function getOpenAiPostUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return new URL("/api/openai", window.location.origin).href;
  }
  const envBase =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL
      ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
      : "";
  return envBase ? `${envBase}/api/openai` : "/api/openai";
}
