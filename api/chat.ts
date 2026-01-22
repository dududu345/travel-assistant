import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = "gemini-2.0-flash";
const SYSTEM_INSTRUCTION = `你是一位专业的差旅费报销审核官，具备极强的数据比对能力。
你的回复必须基于“双表联查”的结果。

### 严苛回复规则：
1. **职级敏感度**：识别用户职级（高层、中层、基层），严格匹配标准。
2. **多表联查链条**：目的地 -> 分类表 -> 判定地区类别；单位+职级 -> 标准表 -> 读取金额。
3. **核心字段提取**：必须完整列出交通工具（含轮船）、住宿、伙食、在途日补助、始末日补助。

4. **输出格式**：
   【核查报告】
   - 目的地判定：[目的地名称] -> [判定分类]
   - 职级定位：[单位] | [职级]
   ---------------------------------
   【详细标准】
   - 交通工具：...
   - 住宿标准：...
   - 伙食补助：...
   - 在途日补助：...
   - 始末日补助：...
   - 其他备注：...`;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY");
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
    console.error("Gemini request failed", {
      message: error?.message,
      status: error?.status,
      name: error?.name
    });
    res.status(500).json({ error: error?.message || "Request failed" });
  }
}
