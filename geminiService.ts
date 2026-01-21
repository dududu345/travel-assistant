export const chatWithGemini = async (
  userMessage: string,
  regionTable: string,
  standardTable: string
) => {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ userMessage, regionTable, standardTable })
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const detail = data?.error ? `: ${data.error}` : "";
    throw new Error(`Request failed (${response.status})${detail}`);
  }

  return data?.text || "查询超时或无结果，请检查表格数据是否包含该关键词。";
};
