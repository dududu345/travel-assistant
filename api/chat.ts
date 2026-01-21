import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants.js";

const MODEL_NAME = "gemini-2.0-flash";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Missing GEMINI_API_KEY" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const { userMessage, regionTable, standardTable } = body || {};
  if (!userMessage) {
    res.status(400).json({ error: "Missing userMessage" });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  const multiTableContext = `
### 数据库 A：地区分类表 (TABLE_REGIONS)
${regionTable || "未上传数据。"}

### 数据库 B：费用控制标准表 (TABLE_STANDARDS)
${standardTable || "未上传数据。"}

---
### 逻辑执行深度要求：
- **目的地与职级**：精准匹配。
- **交通工具**：必须捕获“轮船”及相关等级信息。
- **补助明细**：在 [TABLE_STANDARDS] 中重点检索以下列或关键词：
  1. “伙食补助”
  2. “在途日补助” 或 “在途补贴”
  3. “始末日补助” 或 “起止日补贴”
- 如果这些数据分布在不同的列中，请准确提取对应职级的数值。
`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: "user",
          parts: [
            { text: multiTableContext },
            { text: SYSTEM_INSTRUCTION },
            { text: `用户咨询：${userMessage}` }
          ]
        }
      ],
      config: {
        temperature: 0.0,
        topP: 0.1,
        topK: 1,
      }
    });

    res.status(200).json({
      text: response.text || "查询超时或无结果，请检查表格数据是否包含该关键词。"
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Request failed" });
  }
}
