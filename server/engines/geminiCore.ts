import { GoogleGenAI } from "@google/genai";

export const PRIMARY_GEMINI_MODEL = 'gemini-4-hydrogen';
export const DIALOGUE_GEMINI_MODEL = 'gemini-3.5-flash-lite';

/**
 * Initializes the Google Gemini SDK client from GEMINI_API_KEY.
 */
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
export type InteractionThinkingLevel = 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
export type InteractionMediaResolution = 'low' | 'medium' | 'high' | 'ultra_high';

export interface ExecutionPlan {
  primaryModel: string;
  generationConfig: {
    thinking_level: InteractionThinkingLevel;
    thinking_summaries: 'none';
  };
  mediaResolution?: InteractionMediaResolution;
}

export interface InteractionJsonSchemaFormat {
  type: 'text';
  mime_type: 'application/json';
  schema: Record<string, any>;
}

export interface InteractionTextBlock {
  type: 'text';
  text: string;
}

export interface InteractionImageBlock {
  type: 'image';
  mime_type?: string;
  data?: string;
  uri?: string;
  resolution?: InteractionMediaResolution;
}

export type InteractionContentBlock = InteractionTextBlock | InteractionImageBlock;

export interface GeminiDynamicRequest {
  input: string | Array<Record<string, any> | string>;
  systemInstruction?: string;
  responseFormat?: InteractionJsonSchemaFormat;
}

export interface GeminiDynamicResult {
  interaction: any;
  text: string;
}

const SAFETY_ERROR_PATTERN = /safety|prohibited|blocklist|spii|image_safety/i;

/**
 * Normalizes thinking_level against per-model API constraints so unsupported levels never trigger HTTP 400:
 * - Gemini 4 models (e.g. gemini-4-hydrogen) support low/medium/high/xhigh and reject minimal.
 * - gemini-3.5-flash-lite supports minimal/low/medium/high and rejects xhigh.
 */
export function normalizeThinkingLevelForModel(
  model: string,
  level: InteractionThinkingLevel
): InteractionThinkingLevel {
  if (model.startsWith('gemini-4') && level === 'minimal') {
    return 'low';
  }
  if (model === DIALOGUE_GEMINI_MODEL && level === 'xhigh') {
    return 'high';
  }
  return level;
}

/**
 * Task-based execution plan targeting Interactions API:
 * - prompt_generation: gemini-4-hydrogen + high thinking + low-res media compression (~280 tokens/image)
 * - optimize: gemini-4-hydrogen + low thinking
 * - media_analysis: gemini-4-hydrogen + low thinking + low-res media compression
 * - dialogue: gemini-3.5-flash-lite + minimal thinking (lowest latency & cost)
 */
export function getExecutionPlan(task: GeminiTaskType): ExecutionPlan {
  switch (task) {
    case 'prompt_generation':
      return {
        primaryModel: PRIMARY_GEMINI_MODEL,
        generationConfig: {
          thinking_level: 'high',
          thinking_summaries: 'none',
        },
        mediaResolution: 'low',
      };
    case 'optimize':
      return {
        primaryModel: PRIMARY_GEMINI_MODEL,
        generationConfig: {
          thinking_level: 'low',
          thinking_summaries: 'none',
        },
      };
    case 'media_analysis':
      return {
        primaryModel: PRIMARY_GEMINI_MODEL,
        generationConfig: {
          thinking_level: 'low',
          thinking_summaries: 'none',
        },
        mediaResolution: 'low',
      };
    case 'dialogue':
    default:
      return {
        primaryModel: DIALOGUE_GEMINI_MODEL,
        generationConfig: {
          thinking_level: 'minimal',
          thinking_summaries: 'none',
        },
      };
  }
}

/**
 * Converts string/multimodal arrays (both Interactions Content blocks and legacy inlineData objects)
 * into strictly typed Interactions API input blocks and injects per-image resolution where configured.
 */
export function normalizeInteractionInput(
  rawInput: GeminiDynamicRequest['input'],
  mediaResolution?: InteractionMediaResolution
): string | Array<InteractionContentBlock> {
  if (typeof rawInput === 'string') {
    return rawInput;
  }

  return rawInput.map((item): InteractionContentBlock => {
    if (typeof item === 'string') {
      return { type: 'text', text: item };
    }

    if (item && item.inlineData) {
      return {
        type: 'image',
        mime_type: item.inlineData.mimeType,
        data: item.inlineData.data,
        ...(mediaResolution ? { resolution: mediaResolution } : {}),
      };
    }

    if (item && item.type === 'image') {
      const effectiveResolution = item.resolution || mediaResolution;
      return {
        type: 'image',
        ...(item.mime_type ? { mime_type: item.mime_type } : {}),
        ...(item.data ? { data: item.data } : {}),
        ...(item.uri ? { uri: item.uri } : {}),
        ...(effectiveResolution ? { resolution: effectiveResolution } : {}),
      };
    }

    return {
      type: 'text',
      text: String(item?.text ?? ''),
    };
  });
}

/**
 * Inspects Interactions API lifecycle status & diagnostic errors to surface clear Traditional Chinese alerts
 * for safety blocks, execution failures, and token-limit truncation before JSON parsing runs.
 */
export function checkInteractionStatus(interaction: any): void {
  const status = interaction?.status;
  const errors = Array.isArray(interaction?.errors) ? interaction.errors : [];

  if (status === 'failed' || status === 'cancelled') {
    const detail = errors
      .map((err: any) => [err?.code, err?.message].filter(Boolean).join(': '))
      .filter(Boolean)
      .join('; ') || status;

    const isSafetyBlocked = errors.some((err: any) =>
      SAFETY_ERROR_PATTERN.test(`${err?.code || ''} ${err?.message || ''}`)
    );

    if (isSafetyBlocked) {
      throw new Error(
        `🛡️【內容安全性阻擋通知】您的提示詞或參考圖片觸發了 Google Gemini 安全防護機制 (${detail})，請調整描述用詞或更換圖片後再試。`
      );
    }

    throw new Error(`Gemini Interaction 執行失敗 (${detail})`);
  }

  if (status === 'incomplete' || status === 'budget_exceeded') {
    throw new Error(
      '⚠️【輸出長度截斷通知】模型生成的提示詞過長，已達 Token 上限而中斷。請精簡輸入內容或減少分鏡數量後再試。'
    );
  }
}

export const checkSafetyViolations = checkInteractionStatus;

/**
 * Extracts final model text from an Interaction response via SDK `output_text` or multi-step `steps[]` fallback.
 */
export function extractInteractionText(interaction: any): string {
  if (typeof interaction?.output_text === 'string' && interaction.output_text.trim().length > 0) {
    return interaction.output_text;
  }

  if (Array.isArray(interaction?.steps)) {
    const stepTexts: string[] = [];
    for (const step of interaction.steps) {
      if (step?.type === 'model_output' && Array.isArray(step.content)) {
        const chunkText = step.content
          .filter((block: any) => block?.type === 'text' && typeof block.text === 'string')
          .map((block: any) => block.text)
          .join('');
        if (chunkText.length > 0) {
          stepTexts.push(chunkText);
        }
      }
    }
    const combinedStepText = stepTexts.join('\n');
    if (combinedStepText.trim().length > 0) {
      return combinedStepText;
    }
  }

  if (Array.isArray(interaction?.outputs)) {
    const legacyText = interaction.outputs
      .filter((output: any) => output?.type === 'text' && typeof output.text === 'string')
      .map((output: any) => output.text)
      .join('');
    if (legacyText.trim().length > 0) {
      return legacyText;
    }
  }

  throw new Error('⚠️ Gemini Interaction 未回傳有效文字內容，請稍後再試。');
}

/**
 * Executes a stateless single-turn Gemini request through `ai.interactions.create()`.
 * Deprecated sampling parameters (`temperature`, `top_p`, `top_k`) are never sent.
 */
export async function callGeminiDynamic(
  ai: GoogleGenAI,
  task: GeminiTaskType,
  request: GeminiDynamicRequest
): Promise<GeminiDynamicResult> {
  const plan = getExecutionPlan(task);
  const safeThinkingLevel = normalizeThinkingLevelForModel(
    plan.primaryModel,
    plan.generationConfig.thinking_level
  );
  const normalizedInput = normalizeInteractionInput(request.input, plan.mediaResolution);

  const interaction = await ai.interactions.create({
    model: plan.primaryModel,
    input: normalizedInput,
    ...(request.systemInstruction ? { system_instruction: request.systemInstruction } : {}),
    ...(request.responseFormat ? { response_format: request.responseFormat } : {}),
    generation_config: {
      thinking_level: safeThinkingLevel,
      thinking_summaries: plan.generationConfig.thinking_summaries,
    },
    store: false,
  });

  checkInteractionStatus(interaction);
  const text = extractInteractionText(interaction);

  return { interaction, text };
}
