export type EngineTier = 'pro' | 'ultra_5x' | 'ultra_20x' | 'paid_direct';
export type AiProvider = 'gemini' | 'ollama' | 'llamacpp';
export type AppMode = 'ai_studio' | 'ollama' | 'llamacpp' | 'paid_api';

export interface OllamaModelItem {
  name: string;
  model: string;
  size?: number;
  details?: {
    parameter_size?: string;
    quantization_level?: string;
    context_length?: number;
    family?: string;
  };
  capabilities?: string[];
}

export interface LlamaCppModelItem {
  id: string;
  name?: string;
  object?: string;
  size?: number;
}

export interface SystemModeStatus {
  detectedModes: {
    ai_studio: boolean;
    ollama: boolean;
    llamacpp: boolean;
    paid_api: boolean;
  };
  details: {
    isAiStudioEnv: boolean;
    hasGeminiApiKey: boolean;
    ollamaOnline: boolean;
    ollamaBaseUrl: string;
    ollamaModelCount: number;
    llamacppOnline: boolean;
    llamacppBaseUrl: string;
    llamacppModelCount: number;
  };
  recommendedMode: AppMode;
  fixedMode?: AppMode;
  ollamaModels: OllamaModelItem[];
  defaultOllamaModel?: string;
  llamacppModels: LlamaCppModelItem[];
  defaultLlamaCppModel?: string;
  error?: string;
}

export interface StudioEngine {
  readonly mode: AppMode;
  getStatus(): Promise<SystemModeStatus>;
  generateH3Prompt(config: any): Promise<any>;
  generateDialogue(params: any): Promise<any>;
  analyzeReferenceMedia(params: any): Promise<any>;
  optimizePrompt(params: any): Promise<any>;
  refineSeriesEpisode(params: any): Promise<any>;
}

/**
 * Resolves sampling temperature per engine according to strategy:
 * - Google Gemini: Omit temperature (undefined) to use Gemini native default in Auto mode.
 * - Local Engines (Ollama & llama.cpp): Default to 0.7 in Auto mode.
 * - Manual mode: Use user-specified manualTemperature (clamped to 0.0 ~ 1.5).
 */
export function resolveTemperature(
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

/**
 * Detect runtime environment: AI Studio (Cloud Run/Applet/Subscription) vs Local
 */
export function detectEnvironment() {
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
