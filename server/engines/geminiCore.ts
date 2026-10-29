import { GoogleGenAI, ThinkingLevel, HarmCategory, HarmBlockThreshold, FinishReason, BlockedReason } from "@google/genai";

// Initialize Gemini Client
export const getGeminiClient = () => {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY environment variable is missing or not configured.");
  }
  return new GoogleGenAI({
    apiKey,
  });
};

export type GeminiTaskType = 'dialogue' | 'media_analysis' | 'prompt_generation' | 'optimize';

export interface ExecutionPlan {
  primaryModel: string;
  fallbackModels: string[];
  thinkingConfig?: {
    thinkingLevel?: ThinkingLevel;
    thinkingBudget?: number;
  };
}

/**
 * Strategy Planner for Gemini API Direct Engine:
 * Direct Flagship Gemini 3.8 Flash for all tasks with High reasoning and 3.5 Flash Lite fallback.
 * Fully compatible with Google AI Studio Free Tier and Google Cloud Pay-as-you-go keys.
 */
export function getExecutionPlan(task: GeminiTaskType): ExecutionPlan {
  return {
    primaryModel: 'gemini-3.8-flash',
    fallbackModels: ['gemini-3.5-flash-lite'],
    thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
  };
}

/**
 * Ultra-permissive safety settings for creative video production and cinematic storytelling.
 * Sets BLOCK_NONE across all core harm categories to maximize creative freedom.
 */
export const RELAXED_SAFETY_SETTINGS = [
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

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function isTransientRateLimitOrServerError(err: any): boolean {
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

export function isPermanentModelError(err: any): boolean {
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
 */
export function checkSafetyViolations(response: any) {
  if (!response) return;

  const promptFeedback = response.promptFeedback;
  if (promptFeedback?.blockReason && promptFeedback.blockReason !== BlockedReason.BLOCKED_REASON_UNSPECIFIED) {
    const reason = promptFeedback.blockReason;
    throw new Error(
      `🛡️【內容安全性阻擋通知】您的輸入提示詞觸發了 Google Gemini 安全性審查（原因：${reason}），請求已被攔截。請修改提示詞中的敏感、暴力或爭議性描述後再試！`
    );
  }

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
export async function callGeminiDynamic(
  ai: GoogleGenAI,
  task: GeminiTaskType,
  requestOptions: Omit<Parameters<typeof ai.models.generateContent>[0], 'model'>
) {
  const plan = getExecutionPlan(task);
  const modelsToTry = [plan.primaryModel, ...plan.fallbackModels];
  let lastError: any = null;
  const MAX_RETRIES_PER_MODEL = 2; // Total 3 attempts per model: initial + 2 retries
  const BASE_DELAY_MS = 1000;

  for (let mIdx = 0; mIdx < modelsToTry.length; mIdx++) {
    const currentModel = modelsToTry[mIdx];
    const isFallback = mIdx > 0;

    const mergedConfig = {
      safetySettings: RELAXED_SAFETY_SETTINGS,
      ...(requestOptions.config || {}),
      ...(plan.thinkingConfig ? { thinkingConfig: plan.thinkingConfig } : {}),
    };

    if (isFallback) {
      console.log(`[Gemini Dynamic Router] Activating fallback model "${currentModel}" for task "${task}"...`);
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

        checkSafetyViolations(response);

        modelAttemptSucceeded = true;
        return response;
      } catch (err: any) {
        lastError = err;
        const status = err?.status || err?.statusCode || err?.response?.status || err?.code;
        const errMsg = typeof err?.message === 'string' ? err.message : JSON.stringify(err || '');

        if (errMsg.includes('【內容安全性阻擋通知】')) {
          throw err;
        }

        console.warn(
          `[Gemini Dynamic Router] Model "${currentModel}" attempt ${attempt + 1}/${MAX_RETRIES_PER_MODEL + 1} failed for task "${task}" (Status: ${status || 'N/A'}):`,
          errMsg
        );

        if (isPermanentModelError(err)) {
          console.warn(`[Gemini Dynamic Router] Model "${currentModel}" has permanent error. Skipping retries.`);
          break;
        }

        if (!isTransientRateLimitOrServerError(err)) {
          break;
        }

        if (attempt === MAX_RETRIES_PER_MODEL) {
          console.warn(`[Gemini Dynamic Router] Exhausted ${MAX_RETRIES_PER_MODEL} retries for model "${currentModel}".`);
        }
      }
    }

    if (modelAttemptSucceeded) break;

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
