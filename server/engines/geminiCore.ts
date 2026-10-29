import { GoogleGenAI, ThinkingLevel, MediaResolution, FinishReason, BlockedReason } from "@google/genai";

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

/**
 * Pure Pay-as-you-go Execution Plan with Task-Adaptive Token Optimization.
 * No quota fallback models; each task uses its optimal model, thinking depth, and media resolution.
 */
export interface ExecutionPlan {
  primaryModel: string;
  thinkingConfig: {
    thinkingLevel: ThinkingLevel;
    includeThoughts: boolean;
  };
  mediaResolution?: MediaResolution;
}

/**
 * Strategy Planner for Gemini API Direct Engine:
 * Pure Pay-as-you-go direct flagship routing with task-adaptive token optimization:
 * - prompt_generation: Flagship gemini-3.8-flash with HIGH thinking depth & MEDIA_RESOLUTION_LOW
 * - optimize: gemini-3.8-flash with LOW thinking depth (fast spec restructuring)
 * - media_analysis: gemini-3.8-flash with LOW thinking depth & MEDIA_RESOLUTION_LOW (280 tokens/image)
 * - dialogue: Ultra-fast gemini-3.5-flash-lite with MINIMAL thinking depth
 */
export function getExecutionPlan(task: GeminiTaskType): ExecutionPlan {
  switch (task) {
    case 'prompt_generation':
      return {
        primaryModel: 'gemini-3.8-flash',
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
          includeThoughts: false,
        },
        mediaResolution: MediaResolution.MEDIA_RESOLUTION_LOW,
      };
    case 'optimize':
      return {
        primaryModel: 'gemini-3.8-flash',
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
          includeThoughts: false,
        },
      };
    case 'media_analysis':
      return {
        primaryModel: 'gemini-3.8-flash',
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
          includeThoughts: false,
        },
        mediaResolution: MediaResolution.MEDIA_RESOLUTION_LOW,
      };
    case 'dialogue':
      return {
        primaryModel: 'gemini-3.5-flash-lite',
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL,
          includeThoughts: false,
        },
      };
    default:
      return {
        primaryModel: 'gemini-3.8-flash',
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
          includeThoughts: false,
        },
      };
  }
}

/**
 * Check if the Gemini response or candidate was blocked due to core built-in safety violations.
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
 * Execute Gemini API with pure Pay-as-you-go direct routing and task-adaptive token optimization.
 * Additional safety filters are Off by default per official Gemini API specifications.
 */
export async function callGeminiDynamic(
  ai: GoogleGenAI,
  task: GeminiTaskType,
  requestOptions: Omit<Parameters<typeof ai.models.generateContent>[0], 'model'>
) {
  const plan = getExecutionPlan(task);

  const mergedConfig = {
    ...(plan.mediaResolution ? { mediaResolution: plan.mediaResolution } : {}),
    ...(plan.thinkingConfig ? { thinkingConfig: plan.thinkingConfig } : {}),
    ...(requestOptions.config || {}),
  };

  const response = await ai.models.generateContent({
    ...requestOptions,
    config: mergedConfig,
    model: plan.primaryModel,
  });

  checkSafetyViolations(response);

  return response;
}
