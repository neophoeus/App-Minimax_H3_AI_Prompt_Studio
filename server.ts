import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Sleep helper for backoff
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Call Gemini 3.7 Flash with automatic retry for transient 503 (high demand) / 429 errors
async function callGeminiFlash37(
  ai: GoogleGenAI,
  requestOptions: Omit<Parameters<typeof ai.models.generateContent>[0], 'model'>,
  maxRetries = 3
) {
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        ...requestOptions,
        model: "gemini-3.7-flash",
      });
      return response;
    } catch (err: any) {
      lastError = err;
      console.error(`Gemini 3.7 Flash execution attempt ${attempt}/${maxRetries} error:`, err?.message || err);

      const status = err?.status || err?.statusCode || err?.response?.status || err?.code;
      const errMsg = typeof err?.message === 'string' ? err.message : JSON.stringify(err || '');

      const isUnavailableOrHighDemand =
        status === 503 ||
        status === '503' ||
        errMsg.includes('503') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('high demand') ||
        errMsg.includes('Spikes in demand') ||
        errMsg.includes('overloaded');

      const isQuotaOrRateLimit =
        status === 429 ||
        status === '429' ||
        errMsg.includes('429') ||
        errMsg.includes('quota') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('Rate limit');

      const isTransientNetwork =
        errMsg.includes('fetch failed') ||
        errMsg.includes('ECONNRESET') ||
        errMsg.includes('ETIMEDOUT') ||
        errMsg.includes('socket hang up') ||
        status === 500 ||
        status === 502 ||
        status === 504 ||
        status === '500' ||
        status === '502' ||
        status === '504';

      if ((isUnavailableOrHighDemand || isQuotaOrRateLimit || isTransientNetwork) && attempt < maxRetries) {
        const delayMs = attempt * 1200 + Math.floor(Math.random() * 600);
        console.log(`Retrying Gemini request in ${delayMs}ms due to transient status ${status || 'network'} (attempt ${attempt})...`);
        await sleep(delayMs);
        continue;
      }

      if (isUnavailableOrHighDemand) {
        throw new Error('⚠️ Gemini AI 模型目前高負載繁忙 (503 High Demand)，系統已自動重試，請稍候數秒後再試一次！');
      }

      if (isQuotaOrRateLimit) {
        throw new Error('⚠️ Gemini API 額度已用完 (429 Rate Limit / Quota Exceeded)，請稍等 1~2 分鐘後重試！');
      }

      throw err;
    }
  }

  throw lastError || new Error('Gemini API 請求失敗');
}

// System Instruction strictly adhering to official MiniMax-H3 h3-prompt-writing skill specifications
const MINIMAX_H3_SKILL_SYSTEM_INSTRUCTION = `
You are the official MiniMax-H3 Video & Audio Prompt Engineering Assistant, strictly adhering to the MiniMax-H3 (Hailuo 3 / H3) "h3-prompt-writing" skill specification from https://github.com/MiniMax-AI/MiniMax-H3/tree/main/skills/h3-prompt-writing.

Your mission is to convert user requests into valid, perfectly structured MiniMax-H3 generation prompts adhering 100% to the official rules below.

### 1. Header Alignment Instruction Rules (Part One):
For Base Modes (I2VA, FL2VA, L2VA), the FIRST LINE of the final prompt string MUST be the exact instruction template specified below, followed by ONE BLANK LINE before the core fields:

- **T2VA**: Has NO instruction header line. Starts directly with "integrated_multimodal_description: [Shot 1] ...".
- **I2VA**: MUST use the exact first line:
  For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced.
- **FL2VA**: MUST use the exact first line (replace S.SS with duration formatted to 2 decimals e.g., 10.00):
  How the reference pictures align with the target video — Picture 1 (from Shot 1) aligns with the 0.00-second mark of the target video; Picture 2 (from Shot N) aligns with the S.SS-second mark of the target video.
- **L2VA**: MUST use the exact first line (replace S.SS with duration formatted to 2 decimals e.g., 10.00):
  How the reference pictures align with the target video — <Picture 1> (from [Shot N]) aligns with the S.SS-second mark of the target video.

### 2. Mandatory Field Names & Exact Order:

**For Base Modes (T2VA, I2VA, FL2VA, L2VA):**
The prompt MUST consist of exactly three core fields (plus the header line for I2VA/FL2VA/L2VA):
integrated_multimodal_description: [Shot 1] ...

overall_soundscape: ...

non_diegetic_music: ...

- "integrated_multimodal_description": Begins with [Shot 1] (setting visual style, initial composition, subjects, lighting). Do not add a timestamp to Shot 1. Subsequent shots use strictly increasing cut timecodes: "[Shot 2] At 00:03.500, the camera cuts to..." or "[Shot 2] At 00:05.000, the shot transitions to...". Incorporate character movement, dialogue in quotes "...", and camera motion (type, amplitude, speed).
- "overall_soundscape": Explicit summary of ambient sound, physical action sounds, environmental noise, and voice timbre.
- "non_diegetic_music": Set to "N/A" if music is suppressed/disabled, or specify non-diegetic background music style.

**For Full-Reference Mode (Ref2VA):**
The prompt MUST consist of six sections in this exact order:
subject_definitions:
<Subject 1> is ...
<Picture 1> is ...

summary:
[reference generation] ...

retention_analysis:
- <Subject 1>: preserved/transferred ...

detailed_description:
[Shot 1] ...

overall_soundscape:
...

non_diegetic_music:
...

- "subject_definitions": Define reusable assets using angle-bracket labels:
  - <Subject N>: reusable people, animals, objects, scenes, costumes, actions.
  - <Picture N>: reference image used as concrete target frame/shot anchor.
  - <Video N>: reference video providing editing source, continuation, or temporal structure.
  - <Audio N>: audio track or voice reference. For speaker voice timbre: <Subject N> (Sx) (e.g. <Subject 1> (S1)).
- "summary": MUST begin with a square-bracketed task type prefix, e.g. [reference generation], [keyframe completion], [video editing + reference generation + audio reuse].
- "retention_analysis": Explicitly list features preserved/locked vs dynamically generated for each reference label.
- "detailed_description": Full timeline starting with [Shot 1] and subsequent shots with cut timecodes ([Shot 2] At 00:03.500...).
- "overall_soundscape": Ambience, action sounds, voice characteristics.
- "non_diegetic_music": "N/A" or background music style description.

### 3. Output JSON Format Constraints:
{
  "mode": "T2VA" | "I2VA" | "FL2VA" | "L2VA" | "Ref2VA",
  "fullPrompt": "The COMPLETE combined prompt string formatted with exact headers, blank lines, and exact field names, ready to copy into MiniMax H3",
  "block1": "Formatted Subject Definitions / Keyframe Header Instruction & First Section",
  "block2": "Formatted Summary & Retention Analysis or Integrated Multimodal Description",
  "block3": "Formatted Scene-by-Scene Detailed Timeline",
  "audioNotes": "Formatted overall_soundscape and non_diegetic_music",
  "temporalTimeline": [
    {
      "timeframe": "Shot 1 / [00:03.500]",
      "action": "Description of action...",
      "camera": "Camera movement description...",
      "audio": "Audio description..."
    }
  ],
  "explanationZh": "繁體中文解析：說明選用模式的結構編排優勢與 Retention Analysis 鎖定特徵",
  "suggestions": [
    "解析度與畫幅建議",
    "MiniMax-H3 實用生成技巧 1",
    "MiniMax-H3 實用生成技巧 2"
  ]
}
`;


// API Endpoint to Auto-Generate Cinematic Dialogue
app.post("/api/generate-dialogue", async (req, res) => {
  try {
    const { idea, style, mode, duration } = req.body;
    const ai = getGeminiClient();

    const prompt = `
You are a Hollywood scriptwriter and anime dialogue director.
Based on the following scene parameters:
- Core Idea: "${idea || 'A cinematic scene'}"
- Style: "${style || 'Cinematic'}"
- Mode: "${mode || 'T2VA'}"
- Video Duration: "${duration || '10s'}"

Generate 1-2 punchy, immersive, character-driven on-screen dialogue sentences or monologues in English (with optional Traditional Chinese translation if requested). The dialogue must sound natural for video generation models (MiniMax-H3).

Return JSON format:
{
  "dialogueEn": "English dialogue text...",
  "sfxSuggestion": "Suggested atmospheric sound effects (e.g. rain dripping, mechanical hum, wind gust)"
}
`;

    const response = await callGeminiFlash37(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dialogueEn: { type: Type.STRING },
            sfxSuggestion: { type: Type.STRING },
          },
          required: ["dialogueEn", "sfxSuggestion"],
        },
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error generating dialogue:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate dialogue.",
    });
  }
});

// API Endpoint to analyze uploaded reference file image/media
app.post("/api/analyze-reference-media", async (req, res) => {
  try {
    const { imageBase64, role, fileName } = req.body;
    const ai = getGeminiClient();

    let contents: any[] = [];
    if (imageBase64 && imageBase64.includes(",")) {
      const mimeType = imageBase64.split(";")[0].split(":")[1] || "image/jpeg";
      const base64Data = imageBase64.split(",")[1];
      contents = [
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
        `Analyze this reference image for MiniMax-H3 model with declared Role = "${role || 'character'}". Provide a concise, highly detailed visual description suitable for Block 1 & Retention Analysis (e.g. key facial traits, clothing, lighting, color palette, or object texture).`
      ];
    } else {
      contents = [`Provide a concise reference description for file "${fileName || 'Asset'}" with role "${role || 'character'}".`];
    }

    const response = await callGeminiFlash37(ai, {
      contents,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });

    const text = response.text || "Analyzed visual characteristics for retention lock.";
    return res.json({ success: true, description: text.trim() });
  } catch (error: any) {
    console.error("Error analyzing reference media:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze reference media.",
    });
  }
});

// API Endpoint to generate/refine MiniMax-H3 prompt
app.post("/api/generate-h3-prompt", async (req, res) => {
  try {
    const config = req.body;
    const ai = getGeminiClient();

    const userPrompt = `
Generate an optimal MiniMax-H3 prompt based on the following user input:
- Core Idea/Concept: ${config.idea || "A sleek futuristic scene"}
- Generation Mode: ${config.mode || "T2VA"}
- Duration: ${config.duration || "10s"}
- Aspect Ratio: ${config.aspectRatio || "16:9"}
- Visual Style: ${config.style || "Cinematic Photorealistic"}
- Lighting & Atmosphere: ${config.lightingMood || "Cinematic volumetric lighting"}
- Preferred Camera Movements: ${config.cameraMoves ? config.cameraMoves.join(", ") : "Push in, Arc shot"}
- On-Screen Dialogue: ${config.dialogueText ? `"${config.dialogueText}"` : "None"}
- Sound Effects / Audio: ${config.sfxText || "Ambient soundscape"}
- Suppress Background Music: ${config.suppressMusic ? "Yes (Add non_diegetic_music: N/A)" : "No"}
- Reference Assets (Block 1):
${
  config.references && config.references.length > 0
    ? config.references
        .map(
          (r: any) =>
            `- ${r.tag}: Role=${r.role}, Name=${r.name}, Description=${r.description}`
        )
        .join("\n")
    : "No reference files provided."
}

Please synthesize all these options into the official 3-block MiniMax-H3 prompt format as instructed.
Ensure English language is used for the actual prompt text (fullPrompt, block1, block2, block3) as MiniMax-H3 processes English best, and provide Traditional Chinese for explanationZh and suggestions!
`;

    const response = await callGeminiFlash37(ai, {
      contents: userPrompt,
      config: {
        systemInstruction: MINIMAX_H3_SKILL_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            block1: { type: Type.STRING },
            block2: { type: Type.STRING },
            block3: { type: Type.STRING },
            audioNotes: { type: Type.STRING },
            fullPrompt: { type: Type.STRING },
            temporalTimeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeframe: { type: Type.STRING },
                  action: { type: Type.STRING },
                  camera: { type: Type.STRING },
                  audio: { type: Type.STRING },
                },
                required: ["timeframe", "action", "camera", "audio"],
              },
            },
            explanationZh: { type: Type.STRING },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            "block1",
            "block2",
            "block3",
            "audioNotes",
            "fullPrompt",
            "temporalTimeline",
            "explanationZh",
            "suggestions",
          ],
        },
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MEDIUM,
        },
      },
    });

    const outputText = response.text || "{}";
    const resultJson = JSON.parse(outputText);
    return res.json({ success: true, data: resultJson });
  } catch (error: any) {
    console.error("Error generating MiniMax H3 prompt:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate MiniMax-H3 prompt.",
    });
  }
});

// Quick Optimize Endpoint
app.post("/api/optimize-existing-prompt", async (req, res) => {
  try {
    const { rawPrompt, duration = "10s", suppressMusic = false } = req.body;
    const ai = getGeminiClient();

    const requestText = `
Take the user's rough prompt or idea below and optimize/rewrite it into the official MiniMax-H3 3-block prompt standard:
Rough Prompt: "${rawPrompt}"
Duration: ${duration}
Suppress Music: ${suppressMusic ? "Yes" : "No"}

Refine it with temporal brackets [0s-Xs], camera movement brackets [Camera Move], concrete visual descriptions, and audio cues.
`;

    const response = await callGeminiFlash37(ai, {
      contents: requestText,
      config: {
        systemInstruction: MINIMAX_H3_SKILL_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            block1: { type: Type.STRING },
            block2: { type: Type.STRING },
            block3: { type: Type.STRING },
            audioNotes: { type: Type.STRING },
            fullPrompt: { type: Type.STRING },
            temporalTimeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeframe: { type: Type.STRING },
                  action: { type: Type.STRING },
                  camera: { type: Type.STRING },
                  audio: { type: Type.STRING },
                },
                required: ["timeframe", "action", "camera", "audio"],
              },
            },
            explanationZh: { type: Type.STRING },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            "block1",
            "block2",
            "block3",
            "audioNotes",
            "fullPrompt",
            "temporalTimeline",
            "explanationZh",
            "suggestions",
          ],
        },
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MEDIUM,
        },
      },
    });

    const outputText = response.text || "{}";
    const resultJson = JSON.parse(outputText);
    return res.json({ success: true, data: resultJson });
  } catch (error: any) {
    console.error("Error optimizing raw prompt:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to optimize prompt.",
    });
  }
});

// Express error handler to return JSON instead of HTML error page
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global Server Error:", err);
  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    success: false,
    error: err.message || "伺服器處理請求時發生錯誤",
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MiniMax-H3 Prompt Studio Server running on http://localhost:${PORT}`);
  });
}

startServer();
