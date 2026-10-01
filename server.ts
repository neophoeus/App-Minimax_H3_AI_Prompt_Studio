import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, ThinkingLevel, HarmCategory, HarmBlockThreshold, FinishReason, BlockedReason } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini Client with clean configuration (No header spoofing)
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
  });
};

export type EngineTier = 'pro' | 'ultra_5x' | 'ultra_20x' | 'paid_direct';
export type AiProvider = 'gemini' | 'ollama' | 'llamacpp';
export type AppMode = 'ai_studio' | 'ollama' | 'llamacpp' | 'paid_api';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_MODEL = process.env.DEFAULT_OLLAMA_MODEL || "orcarouter/Qwen3.8-27B-Uncensored:q6_K";
const LLAMACPP_BASE_URL = process.env.LLAMACPP_BASE_URL || "http://127.0.0.1:8080";
const DEFAULT_LLAMACPP_MODEL = process.env.DEFAULT_LLAMACPP_MODEL || "default";

/**
 * Detect runtime environment: AI Studio (Cloud Run/Applet/Subscription) vs Local
 */
function detectEnvironment() {
  const isCloudRun = Boolean(process.env.K_SERVICE || process.env.K_REVISION || process.env.K_CONFIGURATION);
  const appUrl = (process.env.APP_URL || "").trim();
  const isAppUrlCloud = appUrl !== "" && appUrl !== "MY_APP_URL" && (
    appUrl.includes(".run.app") ||
    appUrl.includes("googleusercontent.com") ||
    appUrl.includes("aistudio.google.com")
  );
  const isExplicitAiStudio = process.env.AI_STUDIO_MODE === "true" || process.env.IS_AI_STUDIO === "true";
  const isAiStudioEnv = isCloudRun || isAppUrlCloud || isExplicitAiStudio;

  const rawKey = (process.env.GEMINI_API_KEY || "").trim();
  const hasGeminiApiKey = rawKey.length > 5 && rawKey !== "MY_GEMINI_API_KEY";

  return {
    isAiStudioEnv,
    hasGeminiApiKey,
  };
}

/**
 * Priority Order:
 * 1. 訂閱制度 AI Studio 內運行版 (ai_studio)
 * 2. 本地 Paid API 版 (paid_api)
 * 3. 本地 Ollama 版 (ollama)
 * 4. 本地 llama.cpp 版 (llamacpp)
 */
function calculateRecommendedMode(modes: { ai_studio: boolean; ollama: boolean; llamacpp: boolean; paid_api: boolean }): AppMode {
  if (modes.ai_studio) {
    return 'ai_studio';
  }
  if (modes.paid_api) {
    return 'paid_api';
  }
  if (modes.ollama) {
    return 'ollama';
  }
  if (modes.llamacpp) {
    return 'llamacpp';
  }
  return 'ai_studio'; // 預設回退
}

/**
 * Strips reasoning tokens (<think>...</think>) and markdown code fences from AI output
 */
function cleanModelOutput(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return "";
  let text = rawText;
  // Remove <think>...</think> reasoning blocks from thinking models (e.g. Qwen / DeepSeek)
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  // Remove markdown json fences if any
  text = text.trim();
  if (text.startsWith("```json")) {
    text = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  } else if (text.startsWith("```")) {
    text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return text.trim();
}

function parseJsonSafely(raw: string): any {
  const cleaned = cleanModelOutput(raw);
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (innerErr) {
        // fall through
      }
    }
    throw new Error(`無法解析模型輸出的 JSON 結構: ${cleaned.slice(0, 150)}`);
  }
}

/**
 * Call Local Ollama Chat API
 */
async function callOllamaChat(params: {
  model: string;
  systemPrompt?: string;
  userPrompt: string;
  images?: string[];
  formatJson?: boolean;
  temperature?: number;
}): Promise<string> {
  const modelToUse = params.model || DEFAULT_OLLAMA_MODEL;
  const messages: any[] = [];
  if (params.systemPrompt) {
    messages.push({ role: "system", content: params.systemPrompt });
  }
  const userMsg: any = { role: "user", content: params.userPrompt };
  if (params.images && params.images.length > 0) {
    userMsg.images = params.images;
  }
  messages.push(userMsg);

  const payload: any = {
    model: modelToUse,
    messages,
    stream: false,
    options: {
      temperature: typeof params.temperature === "number" ? params.temperature : 0.7,
      num_ctx: 32768,
    },
  };
  if (params.formatJson) {
    payload.format = "json";
  }

  const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS) || 600000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama API 錯誤 (${response.status}): ${errText.slice(0, 200)}`);
    }

    const data: any = await response.json();
    const rawContent = data?.message?.content || "";
    return cleanModelOutput(rawContent);
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error(`本機 Ollama 請求超時（超過 ${Math.round(timeoutMs / 1000)} 秒）。請確認模型 "${modelToUse}" 是否正在載入或記憶體/顯存負載是否過高。`);
    }
    if (err.code === "ECONNREFUSED" || err.message?.includes("fetch failed") || err.message?.includes("ECONNREFUSED")) {
      throw new Error(`無法連線至本機 Ollama 服務 (${OLLAMA_BASE_URL})。請確認 Ollama 已啟動，且終端或服務正在運行中。`);
    }
    throw err;
  }
}

/**
 * Call Local llama.cpp Server Chat API (/v1/chat/completions)
 * Supports OpenAI-compatible messages, multi-modal images, response_format json, and Flash Attention / RTX 5090 acceleration
 */
async function callLlamaCppChat(params: {
  model?: string;
  systemPrompt?: string;
  userPrompt: string;
  images?: string[];
  formatJson?: boolean;
  temperature?: number;
}): Promise<string> {
  const modelToUse = params.model || DEFAULT_LLAMACPP_MODEL;
  const messages: any[] = [];
  if (params.systemPrompt) {
    messages.push({ role: "system", content: params.systemPrompt });
  }

  if (params.images && params.images.length > 0) {
    const userContent: any[] = [
      { type: "text", text: params.userPrompt },
    ];
    for (const img of params.images) {
      const dataUrl = img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}`;
      userContent.push({
        type: "image_url",
        image_url: { url: dataUrl },
      });
    }
    messages.push({ role: "user", content: userContent });
  } else {
    messages.push({ role: "user", content: params.userPrompt });
  }

  const payload: any = {
    model: modelToUse,
    messages,
    stream: false,
    temperature: typeof params.temperature === "number" ? params.temperature : 0.7,
  };
  if (params.formatJson) {
    payload.response_format = { type: "json_object" };
  }

  const timeoutMs = Number(process.env.LLAMACPP_TIMEOUT_MS) || 600000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${LLAMACPP_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`llama.cpp API 錯誤 (${response.status}): ${errText.slice(0, 200)}`);
    }

    const data: any = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content || "";
    return cleanModelOutput(rawContent);
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error(`本機 llama.cpp 請求超時（超過 ${Math.round(timeoutMs / 1000)} 秒）。請確認模型 "${modelToUse}" 是否正在載入或記憶體/顯存負載是否過高。`);
    }
    if (err.code === "ECONNREFUSED" || err.message?.includes("fetch failed") || err.message?.includes("ECONNREFUSED")) {
      throw new Error(`無法連線至本機 llama.cpp 服務 (${LLAMACPP_BASE_URL})。請確認 llama-server 正在運行（預設端口 8080）。`);
    }
    throw err;
  }
}

interface ExecutionPlan {
  primaryModel: string;
  fallbackModels: string[];
  thinkingConfig?: {
    thinkingLevel?: ThinkingLevel;
    thinkingBudget?: number;
  };
}

/**
 * Strategy Planner based on Google AI Subscription Tiers:
 * 
 * - 'pro' (Default / Web UI & Free API Optimized):
 *    - Dialogue: gemini-3.5-flash-lite (Ultra-fast <400ms, separate high-quota pool, 0 pressure on 3.8)
 *    - Vision / Media Analysis: gemini-3.6-flash (Vision optimized, lightweight token footprint, thinking disabled)
 *    - Prompt Generation: gemini-3.8-flash (Medium thinking) with instant fallback to gemini-3.6-flash
 * 
 * - 'ultra_5x' (High Performance):
 *    - Full gemini-3.8-flash with deeper reasoning
 * 
 * - 'ultra_20x' (Extreme Flagship):
 *    - Maximum thinking tokens and high-precision visual analysis
 */
function getExecutionPlan(
  task: 'dialogue' | 'media_analysis' | 'prompt_generation' | 'optimize',
  tier: EngineTier = 'pro'
): ExecutionPlan {
  switch (tier) {
    case 'paid_direct':
      // Paid API Mode: Direct Flagship Gemini 3.8 Flash for all tasks with High reasoning, no subscription quota throttling
      return {
        primaryModel: 'gemini-3.8-flash',
        fallbackModels: ['gemini-3.6-flash', 'gemini-3.5-flash-lite'],
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      };

    case 'ultra_20x':
      if (task === 'dialogue') {
        return {
          primaryModel: 'gemini-3.8-flash',
          fallbackModels: ['gemini-3.5-flash-lite', 'gemini-3.6-flash'],
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        };
      }
      if (task === 'media_analysis') {
        return {
          primaryModel: 'gemini-3.8-flash',
          fallbackModels: ['gemini-3.6-flash', 'gemini-3.5-flash-lite'],
          thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
        };
      }
      return {
        primaryModel: 'gemini-3.8-flash',
        fallbackModels: ['gemini-3.6-flash', 'gemini-3.5-flash-lite'],
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      };

    case 'ultra_5x':
      if (task === 'dialogue') {
        return {
          primaryModel: 'gemini-3.8-flash',
          fallbackModels: ['gemini-3.5-flash-lite', 'gemini-3.6-flash'],
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        };
      }
      if (task === 'media_analysis') {
        return {
          primaryModel: 'gemini-3.8-flash',
          fallbackModels: ['gemini-3.6-flash', 'gemini-3.5-flash-lite'],
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        };
      }
      return {
        primaryModel: 'gemini-3.8-flash',
        fallbackModels: ['gemini-3.6-flash', 'gemini-3.5-flash-lite'],
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      };

    case 'pro':
    default:
      if (task === 'dialogue') {
        return {
          primaryModel: 'gemini-3.5-flash-lite',
          fallbackModels: ['gemini-3.6-flash', 'gemini-3.8-flash'],
          thinkingConfig: { thinkingBudget: 0 },
        };
      }
      if (task === 'media_analysis') {
        return {
          primaryModel: 'gemini-3.6-flash',
          fallbackModels: ['gemini-3.5-flash-lite', 'gemini-3.8-flash'],
          thinkingConfig: { thinkingBudget: 0 },
        };
      }
      return {
        primaryModel: 'gemini-3.8-flash',
        fallbackModels: ['gemini-3.6-flash', 'gemini-3.5-flash-lite'],
        thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
      };
  }
}

/**
 * Ultra-permissive safety settings for creative video production and cinematic storytelling.
 * Sets BLOCK_NONE across all core harm categories to maximize creative freedom.
 */
const RELAXED_SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isTransientRateLimitOrServerError(err: any): boolean {
  const status = err?.status || err?.statusCode || err?.response?.status || err?.code;
  const errMsg = typeof err?.message === 'string' ? err.message : JSON.stringify(err || '');
  const lowerMsg = errMsg.toLowerCase();
  return (
    status === 429 ||
    status === '429' ||
    status === 503 ||
    status === '503' ||
    status === 500 ||
    status === 502 ||
    status === 504 ||
    lowerMsg.includes('429') ||
    lowerMsg.includes('503') ||
    lowerMsg.includes('500') ||
    lowerMsg.includes('resource_exhausted') ||
    lowerMsg.includes('exhausted') ||
    lowerMsg.includes('quota') ||
    lowerMsg.includes('unavailable') ||
    lowerMsg.includes('high demand') ||
    lowerMsg.includes('overloaded') ||
    lowerMsg.includes('fetch failed') ||
    lowerMsg.includes('econnreset') ||
    lowerMsg.includes('etimedout') ||
    lowerMsg.includes('rate limit') ||
    lowerMsg.includes('spikes in demand')
  );
}

function isPermanentModelError(err: any): boolean {
  const status = err?.status || err?.statusCode || err?.response?.status || err?.code;
  const errMsg = typeof err?.message === 'string' ? err.message : JSON.stringify(err || '');
  const lowerMsg = errMsg.toLowerCase();
  return (
    status === 404 ||
    status === '404' ||
    lowerMsg.includes('404') ||
    lowerMsg.includes('not_found') ||
    lowerMsg.includes('not found') ||
    lowerMsg.includes('no longer available') ||
    lowerMsg.includes('is not supported')
  );
}

/**
 * Check if the Gemini response or candidate was blocked due to safety violations.
 * Throws a structured, user-friendly error if blocked.
 */
function checkSafetyViolations(response: any) {
  if (!response) return;

  // 1. Check prompt-level safety block
  const promptFeedback = response.promptFeedback;
  if (promptFeedback?.blockReason && promptFeedback.blockReason !== BlockedReason.BLOCKED_REASON_UNSPECIFIED) {
    const reason = promptFeedback.blockReason;
    throw new Error(
      `🛡️【內容安全性阻擋通知】您的輸入提示詞觸發了 Google Gemini 安全性審查（原因：${reason}），請求已被攔截。請修改提示詞中的敏感、暴力或爭議性描述後再試！`
    );
  }

  // 2. Check candidate-level safety finishReason
  const firstCandidate = response.candidates?.[0];
  if (firstCandidate) {
    const finishReason = firstCandidate.finishReason;
    if (
      finishReason === FinishReason.SAFETY ||
      finishReason === FinishReason.BLOCKLIST ||
      finishReason === FinishReason.PROHIBITED_CONTENT ||
      finishReason === FinishReason.IMAGE_SAFETY ||
      finishReason === FinishReason.SPII
    ) {
      throw new Error(
        `🛡️【內容安全性阻擋通知】AI 生成的分鏡或台詞觸發了安全性審查標準（原因：${finishReason}），已中止輸出。建議微調分鏡情節或關鍵字後重新生成！`
      );
    }
  }
}

/**
 * Execute Gemini API with automatic model specialization, relaxed safety settings,
 * exponential backoff retry with jitter, and seamless 429/503 fallback routing.
 */
async function callGeminiDynamic(
  ai: GoogleGenAI,
  task: 'dialogue' | 'media_analysis' | 'prompt_generation' | 'optimize',
  tier: EngineTier = 'pro',
  requestOptions: Omit<Parameters<typeof ai.models.generateContent>[0], 'model'>
) {
  const plan = getExecutionPlan(task, tier);
  const modelsToTry = [plan.primaryModel, ...plan.fallbackModels];
  let lastError: any = null;
  const MAX_RETRIES_PER_MODEL = 2; // Total 3 attempts per model: initial + 2 retries
  const BASE_DELAY_MS = 1000;

  for (let mIdx = 0; mIdx < modelsToTry.length; mIdx++) {
    const currentModel = modelsToTry[mIdx];
    const isFallback = mIdx > 0;

    // Merge task base config with tier-specific thinking settings and relaxed safety settings
    const mergedConfig = {
      safetySettings: RELAXED_SAFETY_SETTINGS,
      ...(requestOptions.config || {}),
      ...(plan.thinkingConfig ? { thinkingConfig: plan.thinkingConfig } : {}),
    };

    if (isFallback) {
      console.log(`[Gemini Dynamic Router] Activating fallback model "${currentModel}" for task "${task}" (Tier: ${tier})...`);
    }

    let modelAttemptSucceeded = false;

    for (let attempt = 0; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        if (attempt > 0) {
          const jitter = Math.floor(Math.random() * 500);
          const delayMs = BASE_DELAY_MS * Math.pow(2, attempt - 1) + jitter;
          console.log(
            `[Gemini Dynamic Router] Retry attempt ${attempt}/${MAX_RETRIES_PER_MODEL} for model "${currentModel}" after ${delayMs}ms exponential backoff (Task: "${task}")...`
          );
          await sleep(delayMs);
        }

        const response = await ai.models.generateContent({
          ...requestOptions,
          config: mergedConfig,
          model: currentModel,
        });

        // Inspect prompt-level and candidate-level safety filters
        checkSafetyViolations(response);

        modelAttemptSucceeded = true;
        return response;
      } catch (err: any) {
        lastError = err;
        const status = err?.status || err?.statusCode || err?.response?.status || err?.code;
        const errMsg = typeof err?.message === 'string' ? err.message : JSON.stringify(err || '');

        // If error is a safety block, do NOT retry same prompt or fallback blindly (user prompt triggered policy)
        if (errMsg.includes('【內容安全性阻擋通知】')) {
          throw err;
        }

        console.warn(
          `[Gemini Dynamic Router] Model "${currentModel}" attempt ${attempt + 1}/${MAX_RETRIES_PER_MODEL + 1} failed for task "${task}" (Status: ${status || 'N/A'}):`,
          errMsg
        );

        // If permanent model error (e.g. 404 model not found), stop retrying this model immediately
        if (isPermanentModelError(err)) {
          console.warn(`[Gemini Dynamic Router] Model "${currentModel}" has permanent error. Skipping retries.`);
          break;
        }

        // If not a transient error, stop retrying this model
        if (!isTransientRateLimitOrServerError(err)) {
          break;
        }

        // If we reached max retries for this model, break inner loop to allow failover
        if (attempt === MAX_RETRIES_PER_MODEL) {
          console.warn(`[Gemini Dynamic Router] Exhausted ${MAX_RETRIES_PER_MODEL} retries for model "${currentModel}".`);
        }
      }
    }

    if (modelAttemptSucceeded) break;

    // If quota/high demand or transient error and a fallback model is available, switch to next model
    if (mIdx < modelsToTry.length - 1) {
      const nextModel = modelsToTry[mIdx + 1];
      console.log(
        `[Gemini Dynamic Router] Failover: Switching from "${currentModel}" to next fallback model "${nextModel}"...`
      );
      continue;
    }

    break;
  }

  const status = lastError?.status || lastError?.statusCode || lastError?.response?.status || lastError?.code;
  const errMsg = typeof lastError?.message === 'string' ? lastError.message : JSON.stringify(lastError || '');

  if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || status === 429) {
    throw new Error('⚠️ Gemini API 請求頻率/額度受限 (429 Rate Limit)，系統已自動執行同模型指數退避重試並嘗試多模型備援，目前配額仍處於冷卻中，請稍等 1~2 分鐘後重試！');
  }
  if (errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || status === 503) {
    throw new Error('⚠️ Gemini AI 模型目前高負載 (503)，系統已完成多次退避重試與備援，請稍候數秒後再試！');
  }

  throw lastError || new Error('Gemini API 請求失敗');
}

/**
 * Builds modular System Instruction strictly adhering to official MiniMax-H3 h3-prompt-writing skill specifications
 * (https://github.com/MiniMax-AI/MiniMax-H3/tree/main/skills/h3-prompt-writing)
 * Dynamically tailored per Generation Mode to conserve input tokens and sharpen model focus.
 */
function buildModularSystemInstruction(mode: string = "T2VA"): string {
  let headerAndSectionRules = "";
  if (mode === "T2VA") {
    headerAndSectionRules = `
### 1. Structure & Core Fields for T2VA (Text-to-Video-Audio):
- Has NO instruction header line. Starts directly with the three core fields:
integrated_multimodal_description: [Shot 1] ...

overall_soundscape: ...

non_diegetic_music: ...

- Visual Style: Select and establish visual style and composition directly from user text in [Shot 1].
- Shot 1 sets initial visual style and composition (DO NOT add a timestamp to Shot 1).
- Subsequent shots use strictly increasing cut timecodes: "[Shot 2] At 00:03.500, the camera cuts to..." or "[Shot 2] At 00:05.000, the shot transitions to...".
- Standard cut verbs: "the camera cuts to", "the shot cuts to", "the shot transitions to", "the shot changes to", "the shot switches to".
- "overall_soundscape": 1–4 English sentences summarizing ambient sound, physical action sounds, and non-verbal human sounds across the entire video. Set to "N/A" only if complete silence is requested.
- "non_diegetic_music": 1–3 English sentences describing audience-only background music (instrumentation, tempo, dynamics). Set to "N/A" if music is suppressed/disabled.`;
  } else if (mode === "I2VA") {
    headerAndSectionRules = `
### 1. Structure & Core Fields for I2VA (Image-to-Video-Audio):
- The FIRST LINE of the final prompt string MUST be the exact header template, followed by ONE BLANK LINE before the core fields:
For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced.

integrated_multimodal_description: [Shot 1] ...

overall_soundscape: ...

non_diegetic_music: ...

- Visual Style: Visual style, lighting, color palette, and initial composition are locked directly from <Picture 1>. Do NOT generate conflicting style descriptors in the prompt.
- Shot 1 describes motion unfolding from <Picture 1> (DO NOT add a timestamp to Shot 1).
- Subsequent shots use strictly increasing cut timecodes: "[Shot 2] At 00:03.500, the camera cuts to...".
- "overall_soundscape": 1–4 English sentences summarizing ambient and physical sounds. Set to "N/A" if silent.
- "non_diegetic_music": 1–3 English sentences describing audience-only background music, or "N/A".`;
  } else if (mode === "FL2VA") {
    headerAndSectionRules = `
### 1. Structure & Core Fields for FL2VA (First & Last Frame-to-Video-Audio):
- The FIRST LINE of the final prompt string MUST be the exact header template (replace S.SS with duration formatted to 2 decimals e.g., 10.00), followed by ONE BLANK LINE before the core fields:
How the reference pictures align with the target video — Picture 1 (from Shot 1) aligns with the 0.00-second mark of the target video; Picture 2 (from Shot N) aligns with the S.SS-second mark of the target video.

integrated_multimodal_description: [Shot 1] ...

overall_soundscape: ...

non_diegetic_music: ...

- Visual Style: Style and atmosphere are locked directly from reference pictures.
- Shot 1 begins at Picture 1 and progresses toward the final state matching Picture 2.
- "overall_soundscape": 1–4 English sentences.
- "non_diegetic_music": 1–3 English sentences, or "N/A".`;
  } else if (mode === "L2VA") {
    headerAndSectionRules = `
### 1. Structure & Core Fields for L2VA (Last Frame-to-Video-Audio):
- The FIRST LINE of the final prompt string MUST be the exact header template (replace S.SS with duration formatted to 2 decimals e.g., 10.00), followed by ONE BLANK LINE before the core fields:
How the reference pictures align with the target video — <Picture 1> (from [Shot N]) aligns with the S.SS-second mark of the target video.

integrated_multimodal_description: [Shot 1] ...

overall_soundscape: ...

non_diegetic_music: ...

- Visual Style: Style and atmosphere are anchored from the target endframe reference.
- "overall_soundscape": 1–4 English sentences.
- "non_diegetic_music": 1–3 English sentences, or "N/A".`;
  } else {
    // Ref2VA
    headerAndSectionRules = `
### 1. Structure & Core Fields for Ref2VA (Full-Reference Video-Audio):
The prompt MUST consist of six sections in this exact order:
subject_definitions:
<Subject 1> is ...
<Picture 1> is ...
<Video 1> is ...
<Audio 1> is ...

summary:
[task type] ...

retention_analysis:
<Subject 1> (appears in [Shot 1]): fully_preserved - ...
<Audio 1>: reference - ...

detailed_description:
[Overall visual style in 1-2 English sentences before Shot 1]
[Shot 1] ...
[Shot 2] At 00:03.500, the camera cuts to...

overall_soundscape:
...

non_diegetic_music:
...

- "subject_definitions": Define reusable assets using angle-bracket labels (<Subject N>, <Picture N>, <Video N>, <Audio N>). Define each <Subject K> with its detailed appearance as depicted in its physical upload slot <Picture P>, with locked visual identity.
- "summary": MUST begin with official square-bracketed task type prefix ([reference generation], [keyframe completion], [video continuation], [video editing], [audio reuse], [audio reference]).
- "retention_analysis": Strictly use official markers: "fully_preserved", "partially_preserved", "attribute_transfer", "weak_reference"; for audio: "fully_copy", "partially_copy", "reference", "weak_reference".
- "detailed_description": 1-2 English sentences establishing visual style before [Shot 1]. Then shot-by-shot timeline starting with [Shot 1].
- "overall_soundscape": 1–4 English sentences.
- "non_diegetic_music": 1–3 English sentences, or "N/A".

### MiniMax Multi-Image Physical Upload Mapping Contract:
When multiple images are uploaded, MiniMax indexes them physically in sequential upload order: <Picture 1> (@image1), <Picture 2> (@image2), <Picture 3> (@image3)...
- Character/Subject references: Define <Subject K> as depicted in <Picture P> with locked visual identity.
- Scene/Keyframe images: Define as opening keyframe image establishing setting and composition. [Shot 1] matches this keyframe image.
- NEVER mix up Picture indices!`;
  }

  return `
You are the official MiniMax-H3 Video & Audio Prompt Engineering Assistant, strictly adhering to the MiniMax-H3 (Hailuo 3 / H3) "h3-prompt-writing" skill specification from https://github.com/MiniMax-AI/MiniMax-H3/tree/main/skills/h3-prompt-writing.

Your mission is to convert user requests into valid, perfectly structured MiniMax-H3 generation prompts adhering 100% to the official rules below.

${headerAndSectionRules}

### 2. Camera Motion Three-Dimension Specification:
A complete camera-motion expression has three dimensions: Motion Type + Amplitude + Speed (Medium amplitude and normal speed are usually omitted).

12 Official Motion Types:
1. "Zoom In / Zoom Out": Focal length changes while camera body remains stationary.
2. "Push In / Pull Out": Camera body moves forward / backward.
3. "Pan Left / Pan Right": Camera remains in place while lens pivots horizontally.
4. "Truck Left / Truck Right": Camera translates horizontally.
5. "Tilt Up / Tilt Down": Camera remains in place while lens pivots vertically.
6. "Pedestal Up / Pedestal Down": Entire camera moves upward / downward.
7. "Arc Shot": Camera moves in an arc around the subject.
8. "Tracking Shot": Camera follows a moving subject.
9. "Static Shot": Camera position and lens remain still.
10. "Shake Slightly / Shake Strongly": Slight / strong camera shake.
11. "POV": The subject's point of view.
12. "Roll Clockwise / Roll Counterclockwise": Camera rolls clockwise / counterclockwise around lens axis.

Amplitude: "with small amplitude", "with large amplitude".
Speed: "at slow speed", "at fast speed".

CRITICAL CAMERA GRAMMAR RULE:
Camera motion MUST be written as a natural English action within the shot narrative, NEVER stacked as separate bracketed labels (e.g. NEVER write "[Push In]" or "[Camera: Arc shot]").
Example: "The camera pushes in with small amplitude at slow speed toward the folded letter in her hands."

### 3. Objective, Literal & Step-by-Step Visual Action Principle (CRITICAL):
Video diffusion models synthesize physical movement from text tokens. Flowery sentences, poetic metaphors, emotional adjectives, and abstract concepts cause motion confusion and distortion.
- ALL visual actions MUST be specific, literal, and step-by-step:
  - Be specific and literal. Describe what happens, in what order, step by step.
  - DO NOT use flowery language, poetic metaphors, emotional adjectives, or abstract concepts (e.g. NEVER write "ethereal glow", "mysterious aura", "heart-wrenching sorrow", "breathtaking majesty", "symphony of lights", "vibes").
  - Instead of "a ball bouncing around" → "A red ball moves to the right, bounces off the wall, and returns to the center"
  - Instead of "fluid pouring" → "Water flows from the left container through the connecting tube into the right container until both levels are equal"
- ALWAYS construct action narratives using the three-state physical framework:
  1. Starting state: Initial position of the subject/object, body posture, what hands are holding, and initial eye gaze.
  2. Action: Objective physical motion, directions, trajectories, speeds, and contacts in chronological step-by-step order.
  3. End state: Resting position, resulting posture, and physical status when motion concludes.

### 4. Speakers, Dialogue, Voiceover & Visible Text Rules:
- Speakers who vocalize receive stable IDs: (S1), (S2), or compound (S1,S2). Non-vocalizing characters receive no speaker ID.
- Dialogue MUST be formatted using <d>[Language] ...</d> tags:
  - Example: "The young woman with a quiet, breathy voice (S1) says: <d>[English] I get off at the next station.</d>"
  - Preserve user dialogue verbatim; NEVER translate dialogue!
- Voiceover MUST use the exact phrase:
  "says in an off-screen voiceover: <d>[Language] ...</d> while his lips remain completely closed."
- Visible text on-screen: English double quotes "" (e.g. 'A red neon sign reading "Open" glows above the door.'). Do NOT use double quotes for spoken dialogue!

### 5. Official Duration & Series Continuation Standard:
- Official native single-generation duration is strictly 4 to 15 seconds.
- When generating multiple episodes (isSeries: true):
  - EACH episode prompt MUST be 100% self-contained, valid, and immediately copyable/executable on its own!
  - Continuity is achieved through concrete physical starting states matching the preceding episode's end state.

### 6. Absolute Prohibition Regarding File Names:
- STRICT RULE: DO NOT include any file names, file extensions (.jpg, .png, .mp4, .wav), or upload paths anywhere in the prompt! Define subjects purely by visual traits.

### 7. Output JSON Format Constraints:
You MUST output a valid JSON object matching this schema:
{
  "fullPrompt": "The COMPLETE combined prompt string formatted with exact headers, blank lines, and exact field names, ready to copy into MiniMax H3. Ensure NO filenames appear.",
  "explanationZh": "繁體中文解析：說明選用模式的結構編排優勢、三維度運鏡與畫面規劃",
  "suggestions": [
    "畫幅與鏡頭節奏建議",
    "MiniMax-H3 官方實用技巧 1",
    "MiniMax-H3 官方實用技巧 2"
  ],
  "isSeries": false,
  "seriesTitle": "Optional series title when generating multiple episodes",
  "storyArcSummary": "Optional story arc summary when generating multiple episodes",
  "episodes": [
    {
      "episodeIndex": 1,
      "title": "第 1 段標題",
      "duration": "10s",
      "startingState": "具體畫面初始姿態與位置",
      "actionSequence": "連續步驟化客觀動作",
      "endState": "動作結束時畫面落點姿態",
      "fullPrompt": "100% 獨立合法可貼之完整 MiniMax-H3 提示詞",
      "cameraMovement": "運鏡英文句子",
      "audioSoundscape": "環境音與音效",
      "continuityNotes": "承接說明"
    }
  ]
}
Return ONLY valid JSON.
`;
}

const MINIMAX_H3_SKILL_SYSTEM_INSTRUCTION = buildModularSystemInstruction("T2VA");

/**
 * Builds specific instruction directives for the Assistant Director (輔助導演開關)
 * Enabled: Autonomously extrapolates and enriches secondary physical interactions and environment.
 * Disabled: Strictly faithful mode, zero extrapolation beyond user explicit input.
 */
function getAssistantDirectorDirective(assistantDirector: boolean = true): string {
  if (assistantDirector) {
    return `
### ASSISTANT DIRECTOR DIRECTIVE (ENABLED / 輔助導演開啟):
- ROLE: Professional Cinematographer & Scene Coordinator.
- ENRICH PHYSICAL LOGIC: Faithfully maintain the user's core intent, characters, and primary storyline, while automatically extrapolating and enriching realistic physical context and secondary motions:
  1. Secondary Micro-Motions: Incorporate realistic secondary physical reactions (e.g. hair strands or clothing fluttering in the breeze, steam billows rising from liquid, droplets beading and streaking down surfaces, subtle eyelid twitches, natural breathing rhythm, fingers micro-adjusting grip).
  2. Multi-Plane Spatial Depth: Structure the composition with clear foreground layers (e.g. out-of-focus wet glass, door frame, passing dust particles), midground action, and deep atmospheric background.
  3. Plausible Environmental Interaction: Objects realistically react to the environment (e.g. feet kicking up subtle dust puffs, neon light shimmering in puddle ripples).
- OBJECTIVE PHRASING: Ensure all enriched details are described strictly as literal physical actions (Starting state -> Action -> End state) without flowery adjectives.`;
  } else {
    return `
### ASSISTANT DIRECTOR DIRECTIVE (DISABLED / 保守忠實模式):
- ROLE: Precision Technical Transcriber & Spec Compliance Officer.
- STRICT & FAITHFUL: Follow ONLY what the user explicitly requested without introducing unasked creative extrapolation or secondary elements.
- STRUCTURE: Follow the exact three-state physical framework (Starting state -> Action -> End state) concisely, cleanly, and faithfully.`;
  }
}

/**
 * Resolves sampling temperature per engine according to strategy:
 * - Google Gemini: Omit temperature (undefined) to use Gemini native default in Auto mode.
 * - Local Engines (Ollama & llama.cpp): Default to 0.7 in Auto mode.
 * - Manual mode: Use user-specified manualTemperature (clamped to 0.0 ~ 1.5).
 */
function resolveTemperature(
  provider: 'gemini' | 'ollama' | 'llamacpp',
  temperatureMode?: string,
  manualTemperature?: number
): number | undefined {
  if (temperatureMode === 'manual' && typeof manualTemperature === 'number' && !isNaN(manualTemperature)) {
    return Math.max(0.0, Math.min(1.5, manualTemperature));
  }
  // Auto mode
  if (provider === 'gemini') {
    return undefined; // Model native default
  }
  return 0.7; // Local engines default
}

// Backward compatibility helper
function getCreativityDirective(level: number): string {
  return getAssistantDirectorDirective(level !== 0);
}
function getCreativityTemperature(_level?: number): number {
  return 0.7;
}

// Helper to resolve effective runtime mode and execution tier
function resolveAppMode(reqBody: any): {
  appMode: AppMode;
  effectiveTier: EngineTier;
  ollamaModelToUse: string;
  llamacppModelToUse: string;
} {
  const { isAiStudioEnv } = detectEnvironment();
  let appMode: AppMode = reqBody.appMode;
  if (!appMode) {
    if (reqBody.provider === 'ollama') {
      appMode = 'ollama';
    } else if (reqBody.provider === 'llamacpp') {
      appMode = 'llamacpp';
    } else if (isAiStudioEnv) {
      appMode = 'ai_studio';
    } else {
      appMode = 'paid_api';
    }
  }

  let effectiveTier: EngineTier = 'pro';
  if (appMode === 'ai_studio') {
    // AI Studio is subscription-based, using user's chosen subscription tier (pro / ultra_5x / ultra_20x)
    effectiveTier = reqBody.subscriptionTier || reqBody.engineTier || 'pro';
  } else if (appMode === 'paid_api') {
    // Paid API is pay-as-you-go, running full flagship Gemini 3.8 Flash directly without subscription quota limits
    effectiveTier = 'paid_direct';
  }

  const ollamaModelToUse = reqBody.ollamaModel || DEFAULT_OLLAMA_MODEL;
  const llamacppModelToUse = reqBody.llamacppModel || DEFAULT_LLAMACPP_MODEL;
  return { appMode, effectiveTier, ollamaModelToUse, llamacppModelToUse };
}

// API Endpoint to detect system operating modes & Ollama/llama.cpp models
app.get("/api/system/mode-status", async (req, res) => {
  try {
    const { isAiStudioEnv, hasGeminiApiKey } = detectEnvironment();
    let ollamaOnline = false;
    let ollamaModels: any[] = [];
    let ollamaError = "";

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const resp = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { signal: controller.signal });
      clearTimeout(timeout);
      if (resp.ok) {
        const data: any = await resp.json();
        ollamaOnline = true;
        ollamaModels = data.models || [];
      } else {
        ollamaError = `Ollama HTTP ${resp.status}`;
      }
    } catch (err: any) {
      ollamaError = err.message || "無法連線至本機 Ollama 服務";
    }

    let llamacppOnline = false;
    let llamacppModels: any[] = [];
    let llamacppError = "";

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const resp = await fetch(`${LLAMACPP_BASE_URL}/v1/models`, { signal: controller.signal });
      clearTimeout(timeout);
      if (resp.ok) {
        const data: any = await resp.json();
        llamacppOnline = true;
        llamacppModels = Array.isArray(data.data)
          ? data.data.map((m: any) => ({
              id: m.id || m.name || "default",
              name: m.id || m.name || "default",
              object: m.object,
            }))
          : [];
        if (llamacppModels.length === 0) {
          llamacppModels = [{ id: "default", name: "llama-server (活躍中)" }];
        }
      } else {
        llamacppError = `llama.cpp HTTP ${resp.status}`;
      }
    } catch (err: any) {
      try {
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 2000);
        const resp2 = await fetch(`${LLAMACPP_BASE_URL}/health`, { signal: controller2.signal });
        clearTimeout(timeout2);
        if (resp2.ok) {
          llamacppOnline = true;
          llamacppModels = [{ id: "default", name: "llama-server (活躍中)" }];
        } else {
          llamacppError = err.message || "無法連線至本機 llama.cpp 服務";
        }
      } catch (err2: any) {
        llamacppError = err.message || "無法連線至本機 llama.cpp 服務";
      }
    }

    const detectedModes = {
      ai_studio: Boolean(isAiStudioEnv && hasGeminiApiKey),
      ollama: Boolean(ollamaOnline && ollamaModels.length > 0),
      llamacpp: Boolean(llamacppOnline),
      paid_api: Boolean(!isAiStudioEnv && hasGeminiApiKey),
    };

    const recommendedMode = calculateRecommendedMode(detectedModes);

    let defaultOllamaModel: string | undefined;
    if (ollamaModels.length > 0) {
      const preferred =
        ollamaModels.find((m: any) => m.name === DEFAULT_OLLAMA_MODEL) ||
        ollamaModels.find((m: any) => m.name?.toLowerCase().includes("qwen3.8") || m.name?.toLowerCase().includes("qwen")) ||
        ollamaModels[0];
      defaultOllamaModel = preferred?.name;
    }

    let defaultLlamaCppModel: string | undefined;
    if (llamacppModels.length > 0) {
      defaultLlamaCppModel = llamacppModels[0].id || llamacppModels[0].name;
    }

    return res.json({
      detectedModes,
      details: {
        isAiStudioEnv,
        hasGeminiApiKey,
        ollamaOnline,
        ollamaBaseUrl: OLLAMA_BASE_URL,
        ollamaModelCount: ollamaModels.length,
        llamacppOnline,
        llamacppBaseUrl: LLAMACPP_BASE_URL,
        llamacppModelCount: llamacppModels.length,
      },
      recommendedMode,
      ollamaModels,
      defaultOllamaModel,
      llamacppModels,
      defaultLlamaCppModel,
      error: ollamaError || llamacppError || undefined,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || "Failed to detect system mode status",
    });
  }
});

// API Endpoint to check llama.cpp local status
app.get("/api/llamacpp/status", async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch(`${LLAMACPP_BASE_URL}/v1/models`, { signal: controller.signal });
    clearTimeout(timeout);

    if (!resp.ok) {
      return res.json({
        online: false,
        baseUrl: LLAMACPP_BASE_URL,
        models: [],
        error: `llama.cpp 回傳 HTTP ${resp.status}`,
      });
    }

    const data: any = await resp.json();
    const models = Array.isArray(data.data) && data.data.length > 0
      ? data.data
      : [{ id: "default", name: "llama-server (活躍中)" }];
    return res.json({
      online: true,
      baseUrl: LLAMACPP_BASE_URL,
      models,
    });
  } catch (err: any) {
    return res.json({
      online: false,
      baseUrl: LLAMACPP_BASE_URL,
      models: [],
      error: err.message || "無法連線至本機 llama.cpp 服務",
    });
  }
});

// API Endpoint to check Ollama local status and list models (legacy backward compatible)
app.get("/api/ollama/status", async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);

    if (!resp.ok) {
      return res.json({
        online: false,
        baseUrl: OLLAMA_BASE_URL,
        models: [],
        error: `Ollama 回傳 HTTP ${resp.status}`,
      });
    }

    const data: any = await resp.json();
    return res.json({
      online: true,
      baseUrl: OLLAMA_BASE_URL,
      models: data.models || [],
    });
  } catch (err: any) {
    return res.json({
      online: false,
      baseUrl: OLLAMA_BASE_URL,
      models: [],
      error: err.message || "無法連線至本機 Ollama 服務",
    });
  }
});

// API Endpoint to Auto-Generate Cinematic Dialogue
app.post("/api/generate-dialogue", async (req, res) => {
  try {
    const { idea, style, mode, duration } = req.body;
    const { appMode, effectiveTier, ollamaModelToUse, llamacppModelToUse } = resolveAppMode(req.body);

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

    if (appMode === 'ollama') {
      const raw = await callOllamaChat({
        model: ollamaModelToUse,
        userPrompt: prompt + `\nCRITICAL: Return ONLY a valid JSON object matching the requested schema.`,
        formatJson: true,
      });
      const result = parseJsonSafely(raw);
      return res.json({ success: true, data: result });
    }

    if (appMode === 'llamacpp') {
      const raw = await callLlamaCppChat({
        model: llamacppModelToUse,
        userPrompt: prompt + `\nCRITICAL: Return ONLY a valid JSON object matching the requested schema.`,
        formatJson: true,
      });
      const result = parseJsonSafely(raw);
      return res.json({ success: true, data: result });
    }

    const ai = getGeminiClient();
    const response = await callGeminiDynamic(
      ai,
      'dialogue',
      effectiveTier,
      {
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
        },
      }
    );

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
    const { appMode, effectiveTier, ollamaModelToUse, llamacppModelToUse } = resolveAppMode(req.body);

    if (appMode === 'ollama') {
      const userPrompt = imageBase64 && imageBase64.includes(",")
        ? `Analyze this reference image for MiniMax-H3 model with declared Role = "${role || 'character'}". Provide a concise, highly detailed visual description suitable for Reference Definitions & Retention Analysis (e.g. key facial traits, clothing, lighting, color palette, or object texture). Keep it concise and within 60 words.`
        : `Provide a concise reference description for file "${fileName || 'Asset'}" with role "${role || 'character'}". Keep it within 50 words.`;

      const images = (imageBase64 && imageBase64.includes(","))
        ? [imageBase64.split(",")[1]]
        : undefined;

      const text = await callOllamaChat({
        model: ollamaModelToUse,
        userPrompt,
        images,
      });

      return res.json({ success: true, description: text.trim() });
    }

    if (appMode === 'llamacpp') {
      const userPrompt = imageBase64 && imageBase64.includes(",")
        ? `Analyze this reference image for MiniMax-H3 model with declared Role = "${role || 'character'}". Provide a concise, highly detailed visual description suitable for Reference Definitions & Retention Analysis (e.g. key facial traits, clothing, lighting, color palette, or object texture). Keep it concise and within 60 words.`
        : `Provide a concise reference description for file "${fileName || 'Asset'}" with role "${role || 'character'}". Keep it within 50 words.`;

      const images = (imageBase64 && imageBase64.includes(","))
        ? [imageBase64.split(",")[1]]
        : undefined;

      const text = await callLlamaCppChat({
        model: llamacppModelToUse,
        userPrompt,
        images,
      });

      return res.json({ success: true, description: text.trim() });
    }

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
        `Analyze this reference image for MiniMax-H3 model with declared Role = "${role || 'character'}". Provide a concise, highly detailed visual description suitable for Reference Definitions & Retention Analysis (e.g. key facial traits, clothing, lighting, color palette, or object texture). Keep it concise and within 60 words.`
      ];
    } else {
      contents = [`Provide a concise reference description for file "${fileName || 'Asset'}" with role "${role || 'character'}". Keep it within 50 words.`];
    }

    const response = await callGeminiDynamic(
      ai,
      'media_analysis',
      effectiveTier,
      {
        contents,
      }
    );

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

/**
 * Strips raw filenames, file extensions (.jpg, .png, etc.), or accidental file paths from AI-generated prompts
 */
function sanitizeGeneratedPromptText(text: string): string {
  if (!text || typeof text !== 'string') return text;
  return text
    // Replace patterns like "is file.png, " or "is image.jpg" with "is "
    .replace(/\b(?:is\s+)?[\w-]+\.(?:png|jpe?g|webp|gif|mp4|mov|webm|mp3|wav|ogg)\b/gi, (match) =>
      match.toLowerCase().startsWith('is ') ? 'is ' : ''
    )
    // Strip standalone file extensions or remaining filename patterns
    .replace(/\b[\w-]+\.(?:png|jpe?g|webp|gif|mp4|mov|webm|mp3|wav|ogg)\b/gi, '')
    // Clean up double commas, empty brackets, dangling spaces, and 'is ,'
    .replace(/\bis\s*,\s*/gi, 'is ')
    .replace(/,\s*,/g, ',')
    .replace(/\(\s*\)/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

// API Endpoint to generate/refine MiniMax-H3 prompt
app.post("/api/generate-h3-prompt", async (req, res) => {
  try {
    const config = req.body;
    const { appMode, effectiveTier, ollamaModelToUse, llamacppModelToUse } = resolveAppMode(config);

    const multimodalParts: any[] = [];
    const ollamaImages: string[] = [];

    const rawRefs: any[] = Array.isArray(config.references) ? config.references : [];

    // Identify opening keyframe tag and secondary keyframe tag for header lines
    const openingKeyframeRef = rawRefs.find((r: any) =>
      ['first_keyframe', 'keyframe', 'composition'].includes(r.role) || (r.tag && r.tag.startsWith('<Picture'))
    );
    const openingKeyframeTag = openingKeyframeRef?.physicalTag || openingKeyframeRef?.tag || '<Picture 1>';

    const lastKeyframeRef = rawRefs.find((r: any) => r.role === 'last_keyframe');
    const firstKeyframePic = (openingKeyframeRef?.physicalTag || '<Picture 1>').replace(/[<>]/g, '');
    const lastKeyframePic = (lastKeyframeRef?.physicalTag || '<Picture 2>').replace(/[<>]/g, '');

    const sanitizedReferences = (rawRefs.length > 0)
      ? rawRefs
          .map((r: any) => {
            const cleanName = String(r.name || 'Reference Asset')
              .replace(/\.[a-zA-Z0-9]{2,5}$/i, '')
              .replace(/\b[\w-]+\.(?:png|jpe?g|webp|gif|mp4|mov|webm|mp3|wav)\b/gi, '')
              .trim() || 'Reference Asset';
            const cleanDesc = String(r.description || '')
              .replace(/\b[\w-]+\.(?:png|jpe?g|webp|gif|mp4|mov|webm|mp3|wav)\b/gi, '')
              .trim() || 'Visual characteristics locked from reference';

            const physicalSlotText = r.physicalTag
              ? ` (Physical Upload Slot in MiniMax: ${r.physicalTag} / @image${r.pictureIndex})`
              : (r.isPureSubject ? ' (Pure Text Subject Declaration, No Uploaded Image)' : '');

            // Check if this reference has an ultra-light image payload (~35KB, ~258 tokens)
            if (r.fileUrl && typeof r.fileUrl === 'string' && r.fileUrl.startsWith('data:image/')) {
              const mimeType = r.fileUrl.split(';')[0].split(':')[1] || 'image/jpeg';
              const base64Data = r.fileUrl.split(',')[1];
              if (base64Data) {
                multimodalParts.push({
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                });

                if (r.physicalTag && r.tag && r.tag.startsWith('<Subject')) {
                  multimodalParts.push(
                    `[Visual Reference Image attached above is physical upload slot ${r.physicalTag} (@image${r.pictureIndex}), providing the character/subject visual reference for ${r.tag} (Role: ${r.role}, Label: ${cleanName}). Inspect its real facial structure, hairstyle, clothing, colors, and materials. In "subject_definitions", define ${r.tag} using its physical traits as depicted in ${r.physicalTag} (e.g. "${r.tag} is the [detailed appearance traits] as depicted in ${r.physicalTag}, with locked visual identity."). In "retention_analysis", state that ${r.tag} is fully_preserved from ${r.physicalTag}. Do NOT use any file names.]`
                  );
                } else if (r.physicalTag && r.tag && r.tag.startsWith('<Picture')) {
                  multimodalParts.push(
                    `[Visual Reference Image attached above is physical upload slot ${r.physicalTag} (@image${r.pictureIndex}) (Role: ${r.role}, Label: ${cleanName}). This image is the target keyframe/composition frame (${r.tag}). In "subject_definitions", define ${r.tag} as the first keyframe image showing the setting, lighting, atmosphere, and composition. In "summary" and "detailed_description" [Shot 1], explicitly reference this frame (${r.tag}). Do NOT use any file names.]`
                  );
                } else {
                  multimodalParts.push(
                    `[Visual reference image attached above corresponds to ${r.tag} (Role: ${r.role}, Label: ${cleanName}). Inspect its real visual characteristics (face, clothing, lighting, style, colors, materials) and describe them faithfully in subject_definitions and retention_analysis without including any file names.]`
                  );
                }
                ollamaImages.push(base64Data);
              }
            }

            return `- ${r.tag}${physicalSlotText}: Role=${r.role}, Semantic Label=${cleanName}, Description=${cleanDesc}`;
          })
          .join('\n')
      : 'No reference files provided.';

    const assistantDirector = typeof config.assistantDirector === 'boolean'
      ? config.assistantDirector
      : (config.creativityLevel !== 0);
    const assistantDirectorDirective = getAssistantDirectorDirective(assistantDirector);

    const ollamaTemperature = resolveTemperature('ollama', config.temperatureMode, config.manualTemperature);
    const llamacppTemperature = resolveTemperature('llamacpp', config.temperatureMode, config.manualTemperature);
    const geminiTemperature = resolveTemperature('gemini', config.temperatureMode, config.manualTemperature);

    const isSeriesMode = Boolean(config.isSeriesMode);
    const seriesCount = Math.min(10, Math.max(2, Number(config.seriesCount) || 5));

    const seriesDirective = isSeriesMode
      ? `
CRITICAL MULTI-EPISODE SERIES GENERATION PROTOCOL (${seriesCount} CONSECUTIVE EPISODES):
- You MUST generate a chronological sequence of exactly ${seriesCount} video generation prompts (Episodes 1 to ${seriesCount}).
- EACH EPISODE MUST BE A 100% SELF-CONTAINED, VALID, AND INDEPENDENTLY COPY-READY MINIMAX-H3 PROMPT!
- NEVER include meta-references like "Resuming directly from Clip 1" or referencing non-existent video files.
- Continuity across episodes MUST be achieved purely through literal step-by-step physical descriptions:
  * Episode 1: Establishes initial scene, character appearance, and opening physical action sequence.
  * Episode K (K >= 2): The prompt's initial description/Shot 1 objectively begins with the exact physical posture, position, and held objects that directly continue from where Episode K-1 ended.
  * All episodes strictly share identical subject definitions (<Subject 1>), clothing, hair, facial features, reference image (${openingKeyframeTag}), visual style, and ambient soundscape base.
- You MUST populate the "episodes" array with exactly ${seriesCount} items:
  * episodeIndex: 1, 2, ... ${seriesCount}
  * title: Traditional Chinese title (e.g. "第 1 段：初始開場與動作錨定", "第 2 段：情節承接與實體位移")
  * duration: "${config.duration || '10s'}"
  * startingState: Objective literal physical starting state (body posture, location, held objects)
  * actionSequence: Chronological physical step-by-step motion (what moves where, in what order)
  * endState: Resulting physical end state (where objects rest, final posture)
  * fullPrompt: Complete, independent MiniMax-H3 prompt ready to paste directly into MiniMax
  * cameraMovement: Natural camera description
  * audioSoundscape: Soundscape and ambient sound
  * continuityNotes: Traditional Chinese explanation of how this episode continues from the previous one's physical end state
- Set "isSeries": true, "seriesTitle": A concise series title in Traditional Chinese, "storyArcSummary": 1-2 sentences summarizing the multi-shot story arc in Traditional Chinese.
`
      : `
- Single-clip generation mode: Focus on generating one optimal, perfectly structured MiniMax-H3 prompt.
- Set "isSeries": false, "episodes": []
`;

    const isT2VA = (config.mode || "T2VA") === "T2VA";
    const styleInstruction = isT2VA
      ? `- Visual Style: ${config.style || "Cinematic Photorealistic"}\n- Lighting & Atmosphere: ${config.lightingMood || "Cinematic volumetric lighting"}`
      : `- Visual Style & Lighting: [LOCKED FROM REFERENCE IMAGE] In accordance with MiniMax-H3 official specification, visual style, color palette, rendering quality, and lighting are anchored directly from the reference image(s). Do NOT generate conflicting style descriptors in the prompt.`;

    const userPrompt = `
Generate an optimal MiniMax-H3 prompt based on the following user input:
- Core Idea/Concept: ${config.idea || "A sleek futuristic scene"}
- Generation Mode: ${config.mode || "T2VA"}
- Duration: ${config.duration || "10s"}
- Aspect Ratio: ${config.aspectRatio || "16:9"}
${styleInstruction}
- Preferred Camera Movements (Motion types): ${config.cameraMoves && config.cameraMoves.length > 0 ? config.cameraMoves.join(", ") : "Push In, Arc Shot"}
- Camera Motion Amplitude: ${config.cameraAmplitude && config.cameraAmplitude !== 'default' ? config.cameraAmplitude : "medium / default (omit)"}
- Camera Motion Speed: ${config.cameraSpeed && config.cameraSpeed !== 'default' ? config.cameraSpeed : "normal / default (omit)"}
- Spoken Dialogue to be voiced by character (MUST format inside <d>[Language] ...</d>): ${config.dialogueText ? config.dialogueText : "None"}
- Sound Effects / Audio: ${config.sfxText || "Ambient soundscape"}
- Suppress Background Music: ${config.suppressMusic ? "Yes (Add non_diegetic_music: N/A)" : "No"}
- Assistant Director Mode: ${assistantDirector ? "Enabled (Enrich secondary physical details)" : "Disabled (Strictly faithful)"}
- Reference Assets:
${sanitizedReferences}

KEYFRAME & PHYSICAL SLOT ALIGNMENT CONTRACT:
- If Generation Mode is I2VA:
  The prompt MUST begin with the exact header line:
  For the target video, at 0.00 seconds into the target video, ${openingKeyframeTag} (from [Shot 1]) is fully referenced.
- If Generation Mode is FL2VA:
  The prompt MUST begin with the exact header line:
  How the reference pictures align with the target video — ${firstKeyframePic} (from Shot 1) aligns with the 0.00-second mark of the target video; ${lastKeyframePic} (from Shot N) aligns with the ${parseFloat(config.duration || '10').toFixed(2)}-second mark of the target video.
- If Generation Mode is Ref2VA:
  Follow the MiniMax Multi-Image Physical Upload Mapping Contract:
  * In "subject_definitions": Define each <Subject K> as depicted in its corresponding <Picture P> (e.g. "<Subject 1> is the ... as depicted in <Picture 1>, with locked visual identity."). Define the keyframe image as ${openingKeyframeTag} (e.g. "${openingKeyframeTag} is the first keyframe image showing...").
  * In "summary": Generated from ${openingKeyframeTag}, preserving <Subject 1> (from <Picture 1>), <Subject 2> (from <Picture 2>)...
  * In "retention_analysis": Analyze retention for both <Subject K> (from <Picture P>) and ${openingKeyframeTag}.
  * In "detailed_description" [Shot 1]: The opening frame matches ${openingKeyframeTag}.

CRITICAL OBJECTIVE PHYSICAL ACTION PRINCIPLE (MUST FOLLOW STRICTLY):
- Be specific and literal. Describe what happens, in what order, step by step.
- DO NOT use flowery language, poetic metaphors, emotional adjectives, or abstract concepts (e.g. NEVER write "ethereal", "breathtaking", "mysterious aura", "soul-stirring", "stunning masterpiece", "symphony of light").
- Instead of "a ball bouncing around" → "A red ball moves to the right, bounces off the wall, and returns to the center"
- Instead of "fluid pouring" → "Water flows from the left container through the connecting tube into the right container until both levels are equal"
- For every shot and action, describe:
  1. Starting state (body posture, position in frame, what hands are holding, initial gaze)
  2. Action (chronological step-by-step physical movement, directions, contact)
  3. End state (resulting posture, resting place of objects when movement concludes)

${assistantDirectorDirective}

${seriesDirective}

CRITICAL CAMERA RULES:
- Integrate camera movements as natural English actions within each shot (e.g. "The camera pushes in with small amplitude at slow speed toward..."), NEVER as bracketed labels like "[Push In]".
- If amplitude or speed was specified above, naturally include them in the camera sentence.
CRITICAL DIALOGUE RULES:
- Any character spoken dialogue MUST be placed inside <d>[Language] ...</d> tags with speaker IDs (e.g. (S1) says: <d>[English] ...</d>). Keep the exact user dialogue verbatim.
- Double quotes "" are strictly reserved for text visibly seen on-screen (e.g. signs, logos).
CRITICAL PROHIBITION: DO NOT write any file names, file extensions (e.g. .png, .jpg), or local upload names into the output! Define subjects using clear visual descriptions only.
Ensure English language is used for the actual prompt text (fullPrompt) as MiniMax-H3 processes English best, and provide Traditional Chinese for explanationZh, suggestions, and continuityNotes!
`;

    if (appMode === 'ollama') {
      const systemPrompt = `${buildModularSystemInstruction(config.mode || "T2VA")}

CRITICAL FORMAT REQUIREMENT:
You MUST output a valid JSON object matching this schema:
{
  "fullPrompt": "string (The complete assembled MiniMax-H3 prompt)",
  "explanationZh": "string (Traditional Chinese explanation of the prompt design and cinematography)",
  "suggestions": ["string (Suggestions and tips for MiniMax-H3 generation in Traditional Chinese)"],
  "isSeries": ${isSeriesMode ? "true" : "false"},
  "seriesTitle": "string (Series Title)",
  "storyArcSummary": "string (Story Arc Summary)",
  "episodes": [
    {
      "episodeIndex": 1,
      "title": "string (Episode Title in Traditional Chinese)",
      "duration": "string",
      "startingState": "string (Literal physical starting state)",
      "actionSequence": "string (Step-by-step physical action)",
      "endState": "string (Literal physical end state)",
      "fullPrompt": "string (Complete independent MiniMax-H3 prompt)",
      "cameraMovement": "string (Natural camera action)",
      "audioSoundscape": "string (Audio soundscape)",
      "continuityNotes": "string (How it continues from previous episode)"
    }
  ]
}
Do NOT output any markdown tags outside the JSON. Return only the valid JSON object.`;

      const raw = await callOllamaChat({
        model: ollamaModelToUse,
        systemPrompt,
        userPrompt,
        images: ollamaImages.length > 0 ? ollamaImages : undefined,
        formatJson: true,
        temperature: ollamaTemperature,
      });

      const resultJson = parseJsonSafely(raw);

      // Sanitize any accidental file names from Ollama output
      if (resultJson.fullPrompt) resultJson.fullPrompt = sanitizeGeneratedPromptText(resultJson.fullPrompt);
      if (Array.isArray(resultJson.episodes)) {
        resultJson.episodes = resultJson.episodes.map((ep: any, idx: number) => ({
          ...ep,
          episodeIndex: ep.episodeIndex || idx + 1,
          fullPrompt: sanitizeGeneratedPromptText(ep.fullPrompt || ''),
          startingState: sanitizeGeneratedPromptText(ep.startingState || ''),
          actionSequence: sanitizeGeneratedPromptText(ep.actionSequence || ''),
          endState: sanitizeGeneratedPromptText(ep.endState || ''),
        }));
        if (isSeriesMode && resultJson.episodes.length > 0 && !resultJson.fullPrompt) {
          resultJson.fullPrompt = resultJson.episodes[0].fullPrompt;
        }
        resultJson.isSeries = isSeriesMode;
      }

      return res.json({ success: true, data: resultJson });
    }

    if (appMode === 'llamacpp') {
      const systemPrompt = `${buildModularSystemInstruction(config.mode || "T2VA")}

CRITICAL FORMAT REQUIREMENT:
You MUST output a valid JSON object matching this schema:
{
  "fullPrompt": "string (The complete assembled MiniMax-H3 prompt)",
  "explanationZh": "string (Traditional Chinese explanation of the prompt design and cinematography)",
  "suggestions": ["string (Suggestions and tips for MiniMax-H3 generation in Traditional Chinese)"],
  "isSeries": ${isSeriesMode ? "true" : "false"},
  "seriesTitle": "string (Series Title)",
  "storyArcSummary": "string (Story Arc Summary)",
  "episodes": [
    {
      "episodeIndex": 1,
      "title": "string (Episode Title in Traditional Chinese)",
      "duration": "string",
      "startingState": "string (Literal physical starting state)",
      "actionSequence": "string (Step-by-step physical action)",
      "endState": "string (Literal physical end state)",
      "fullPrompt": "string (Complete independent MiniMax-H3 prompt)",
      "cameraMovement": "string (Natural camera action)",
      "audioSoundscape": "string (Audio soundscape)",
      "continuityNotes": "string (How it continues from previous episode)"
    }
  ]
}
Do NOT output any markdown tags outside the JSON. Return only the valid JSON object.`;

      const raw = await callLlamaCppChat({
        model: llamacppModelToUse,
        systemPrompt,
        userPrompt,
        images: ollamaImages.length > 0 ? ollamaImages : undefined,
        formatJson: true,
        temperature: llamacppTemperature,
      });

      const resultJson = parseJsonSafely(raw);

      // Sanitize any accidental file names from llama.cpp output
      if (resultJson.fullPrompt) resultJson.fullPrompt = sanitizeGeneratedPromptText(resultJson.fullPrompt);
      if (Array.isArray(resultJson.episodes)) {
        resultJson.episodes = resultJson.episodes.map((ep: any, idx: number) => ({
          ...ep,
          episodeIndex: ep.episodeIndex || idx + 1,
          fullPrompt: sanitizeGeneratedPromptText(ep.fullPrompt || ''),
          startingState: sanitizeGeneratedPromptText(ep.startingState || ''),
          actionSequence: sanitizeGeneratedPromptText(ep.actionSequence || ''),
          endState: sanitizeGeneratedPromptText(ep.endState || ''),
        }));
        if (isSeriesMode && resultJson.episodes.length > 0 && !resultJson.fullPrompt) {
          resultJson.fullPrompt = resultJson.episodes[0].fullPrompt;
        }
        resultJson.isSeries = isSeriesMode;
      }

      return res.json({ success: true, data: resultJson });
    }

    const ai = getGeminiClient();

    const requestContents = multimodalParts.length > 0
      ? [...multimodalParts, userPrompt]
      : userPrompt;

    const geminiConfig: any = {
      systemInstruction: buildModularSystemInstruction(config.mode || "T2VA"),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          fullPrompt: { type: Type.STRING },
          explanationZh: { type: Type.STRING },
          suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          isSeries: { type: Type.BOOLEAN },
          seriesTitle: { type: Type.STRING },
          storyArcSummary: { type: Type.STRING },
          episodes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                episodeIndex: { type: Type.INTEGER },
                title: { type: Type.STRING },
                duration: { type: Type.STRING },
                startingState: { type: Type.STRING },
                actionSequence: { type: Type.STRING },
                endState: { type: Type.STRING },
                fullPrompt: { type: Type.STRING },
                cameraMovement: { type: Type.STRING },
                audioSoundscape: { type: Type.STRING },
                continuityNotes: { type: Type.STRING },
              },
              required: [
                "episodeIndex",
                "title",
                "duration",
                "startingState",
                "actionSequence",
                "endState",
                "fullPrompt",
                "cameraMovement",
                "audioSoundscape",
                "continuityNotes",
              ],
            },
          },
        },
        required: [
          "fullPrompt",
          "explanationZh",
          "suggestions",
        ],
      },
    };

    if (typeof geminiTemperature === 'number') {
      geminiConfig.temperature = geminiTemperature;
    }

    const response = await callGeminiDynamic(
      ai,
      'prompt_generation',
      effectiveTier,
      {
        contents: requestContents,
        config: geminiConfig,
      }
    );

    const outputText = response.text || "{}";
    const resultJson = JSON.parse(outputText);

    // Sanitize any accidental file names from Gemini output
    if (resultJson.fullPrompt) resultJson.fullPrompt = sanitizeGeneratedPromptText(resultJson.fullPrompt);
    if (Array.isArray(resultJson.episodes)) {
      resultJson.episodes = resultJson.episodes.map((ep: any, idx: number) => ({
        ...ep,
        episodeIndex: ep.episodeIndex || idx + 1,
        fullPrompt: sanitizeGeneratedPromptText(ep.fullPrompt || ''),
        startingState: sanitizeGeneratedPromptText(ep.startingState || ''),
        actionSequence: sanitizeGeneratedPromptText(ep.actionSequence || ''),
        endState: sanitizeGeneratedPromptText(ep.endState || ''),
      }));
      if (isSeriesMode && resultJson.episodes.length > 0 && !resultJson.fullPrompt) {
        resultJson.fullPrompt = resultJson.episodes[0].fullPrompt;
      }
      resultJson.isSeries = isSeriesMode;
    }

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
    const { appMode, effectiveTier, ollamaModelToUse, llamacppModelToUse } = resolveAppMode(req.body);

    const assistantDirector = typeof req.body.assistantDirector === 'boolean'
      ? req.body.assistantDirector
      : (req.body.creativityLevel !== 0);
    const assistantDirectorDirective = getAssistantDirectorDirective(assistantDirector);

    const ollamaTemperature = resolveTemperature('ollama', req.body.temperatureMode, req.body.manualTemperature);
    const llamacppTemperature = resolveTemperature('llamacpp', req.body.temperatureMode, req.body.manualTemperature);
    const geminiTemperature = resolveTemperature('gemini', req.body.temperatureMode, req.body.manualTemperature);

    const requestText = `
Take the user's rough prompt or idea below and optimize/rewrite it into the official MiniMax-H3 prompt standard:
Rough Prompt: "${rawPrompt}"
Duration: ${duration}
Suppress Music: ${suppressMusic ? "Yes" : "No"}
Assistant Director Mode: ${assistantDirector ? "Enabled" : "Disabled"}

Refine it strictly following official MiniMax-H3 specifications:
CRITICAL OBJECTIVE PHYSICAL ACTION PRINCIPLE:
- Be specific and literal. Describe what happens, in what order, step by step.
- DO NOT use flowery language, poetic metaphors, emotional adjectives, or abstract concepts (avoid "ethereal", "breathtaking", "mysterious aura", "soul-stirring").
- Instead of "a ball bouncing around" → "A red ball moves to the right, bounces off the wall, and returns to the center"
- Instead of "fluid pouring" → "Water flows from the left container through the connecting tube into the right container until both levels are equal"
- Describe the starting state, the action, and the end state for each shot.
- Divide into shots starting with [Shot 1] (setting style/composition, no timestamp), and subsequent shots with cut timecodes: "[Shot 2] At MM:SS.mmm, the camera cuts to...".
- Express camera motion as natural English actions within the shot (e.g. "The camera pushes in with small amplitude at slow speed toward..."). DO NOT use bracketed camera tags like "[Push In]".
- Format spoken dialogue inside <d>[Language] ...</d> tags with speaker IDs (e.g. (S1) says: <d>[English] ...</d>), and reserve double quotes "" strictly for visible on-screen text.
- Formulate complete overall_soundscape and non_diegetic_music sections according to the guide.
DO NOT include any file names or file extensions in the generated prompt!

${assistantDirectorDirective}
`;

    if (appMode === 'ollama') {
      const systemPrompt = `${buildModularSystemInstruction("T2VA")}

CRITICAL FORMAT REQUIREMENT:
You MUST output a valid JSON object matching this schema:
{
  "fullPrompt": "string (The complete assembled MiniMax-H3 prompt)",
  "explanationZh": "string (Traditional Chinese explanation of the prompt design and cinematography)",
  "suggestions": ["string (Suggestions and tips for MiniMax-H3 generation in Traditional Chinese)"]
}
Do NOT output any markdown tags outside the JSON. Return only the valid JSON object.`;

      const raw = await callOllamaChat({
        model: ollamaModelToUse,
        systemPrompt,
        userPrompt: requestText,
        formatJson: true,
        temperature: ollamaTemperature,
      });

      const resultJson = parseJsonSafely(raw);

      if (resultJson.fullPrompt) resultJson.fullPrompt = sanitizeGeneratedPromptText(resultJson.fullPrompt);

      return res.json({ success: true, data: resultJson });
    }

    if (appMode === 'llamacpp') {
      const systemPrompt = `${buildModularSystemInstruction("T2VA")}

CRITICAL FORMAT REQUIREMENT:
You MUST output a valid JSON object matching this schema:
{
  "fullPrompt": "string (The complete assembled MiniMax-H3 prompt)",
  "explanationZh": "string (Traditional Chinese explanation of the prompt design and cinematography)",
  "suggestions": ["string (Suggestions and tips for MiniMax-H3 generation in Traditional Chinese)"]
}
Do NOT output any markdown tags outside the JSON. Return only the valid JSON object.`;

      const raw = await callLlamaCppChat({
        model: llamacppModelToUse,
        systemPrompt,
        userPrompt: requestText,
        formatJson: true,
        temperature: llamacppTemperature,
      });

      const resultJson = parseJsonSafely(raw);

      if (resultJson.fullPrompt) resultJson.fullPrompt = sanitizeGeneratedPromptText(resultJson.fullPrompt);

      return res.json({ success: true, data: resultJson });
    }

    const ai = getGeminiClient();

    const geminiConfig: any = {
      systemInstruction: buildModularSystemInstruction("T2VA"),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          fullPrompt: { type: Type.STRING },
          explanationZh: { type: Type.STRING },
          suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: [
          "fullPrompt",
          "explanationZh",
          "suggestions",
        ],
      },
    };

    if (typeof geminiTemperature === 'number') {
      geminiConfig.temperature = geminiTemperature;
    }

    const response = await callGeminiDynamic(
      ai,
      'optimize',
      effectiveTier,
      {
        contents: requestText,
        config: geminiConfig,
      }
    );

    const outputText = response.text || "{}";
    const resultJson = JSON.parse(outputText);

    if (resultJson.fullPrompt) resultJson.fullPrompt = sanitizeGeneratedPromptText(resultJson.fullPrompt);

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
