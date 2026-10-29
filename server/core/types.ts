export type AiProvider = 'gemini' | 'ollama' | 'llamacpp';
export type AppMode = 'gemini_api' | 'ollama' | 'llamacpp';

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
    gemini_api: boolean;
    ollama: boolean;
    llamacpp: boolean;
  };
  details: {
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
 * Detect runtime environment: Checks if a valid GEMINI_API_KEY is configured.
 */
export function detectEnvironment(): { hasGeminiApiKey: boolean } {
  const rawKey = (process.env.GEMINI_API_KEY || "").trim();
  const hasGeminiApiKey = rawKey.length > 5 && rawKey !== "MY_GEMINI_API_KEY";

  return {
    hasGeminiApiKey,
  };
}
