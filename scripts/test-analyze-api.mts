const res = await fetch("http://localhost:3000/api/analyze-stock", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ stockName: "005930" }),
});
const data = await res.json();
console.log(
  JSON.stringify(
    {
      success: data.success,
      provider: data.freshness?.provider,
      sourceLabel: data.freshness?.sourceLabel,
      dataMode: data.freshness?.dataMode,
      providerPriority: data.freshness?.providerPriority,
      providerStatus: data.freshness?.providerStatus,
      kisEnv: data.kisEnv,
      kisFallbackReason: data.kisFallbackReason,
      dataLineage: data.dataLineage,
      diagnostics: data.diagnostics,
      price: data.marketData?.currentPrice,
      warning: data.warning,
    },
    null,
    2,
  ),
);
