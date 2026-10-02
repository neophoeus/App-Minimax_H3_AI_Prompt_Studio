import { StudioEngine, SystemModeStatus, OllamaModelItem, resolveTemperature } from "../core/types";
import {
  buildModularSystemInstruction,
  buildH3UserPrompt,
  buildDialoguePrompt,
  buildOptimizePrompt,
  buildRefineSeriesPrompt,
  getAssistantDirectorDirective,
} from "../core/prompts";
import { cleanModelOutput, formatGeneratedPromptResult, parseJsonSafely, sanitizeGeneratedPromptText } from "../core/sanitizer";

export class OllamaEngine implements StudioEngine {
  readonly mode = 'ollama' as const;
  private baseUrl: string;
  private defaultModel: string;

  constructor(
    baseUrl: string = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
    defaultModel: string = process.env.DEFAULT_OLLAMA_MODEL || "orcarouter/Qwen3.8-27B-Uncensored:q6_K"
  ) {
    this.baseUrl = baseUrl;
    this.defaultModel = defaultModel;
  }

  async getStatus(): Promise<SystemModeStatus> {
    let online = false;
    let models: OllamaModelItem[] = [];
    let error: string | undefined = undefined;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const resp = await fetch(`${this.baseUrl}/api/tags`, { signal: controller.signal });
      clearTimeout(timeout);

      if (resp.ok) {
        const data: any = await resp.json();
        online = true;
        models = data.models || [];
      } else {
        error = `Ollama HTTP ${resp.status}`;
      }
    } catch (err: any) {
      error = err.message || "無法連線至本機 Ollama 服務";
    }

    return {
      detectedModes: {
        ai_studio: false,
        paid_api: false,
        ollama: online,
        llamacpp: false,
      },
      details: {
        isAiStudioEnv: false,
        hasGeminiApiKey: false,
        ollamaOnline: online,
        ollamaBaseUrl: this.baseUrl,
        ollamaModelCount: models.length,
        llamacppOnline: false,
        llamacppBaseUrl: "",
        llamacppModelCount: 0,
      },
      recommendedMode: 'ollama',
      fixedMode: 'ollama',
      ollamaModels: models,
      defaultOllamaModel: this.defaultModel,
      llamacppModels: [],
      error,
    };
  }

  private async callChat(params: {
    model?: string;
    systemPrompt?: string;
    userPrompt: string;
    images?: string[];
    formatJson?: boolean;
    temperature?: number;
  }): Promise<string> {
    const modelToUse = params.model || this.defaultModel;
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
      const response = await fetch(`${this.baseUrl}/api/chat`, {
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
        throw new Error(`無法連線至本機 Ollama 服務 (${this.baseUrl})。請確認 Ollama 已啟動，且終端或服務正在運行中。`);
      }
      throw err;
    }
  }

  async generateH3Prompt(config: any): Promise<any> {
    const { userPrompt, ollamaImages, isSeriesMode } = buildH3UserPrompt(config);
    const temperature = resolveTemperature('ollama', config.temperatureMode, config.manualTemperature);
    const modelToUse = config.ollamaModel || this.defaultModel;

    const systemPrompt = `${buildModularSystemInstruction(config.mode || "T2VA", config.outputContract || "official")}

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
      "title": "string (Title in Traditional Chinese)",
      "duration": "${config.duration || '10s'}",
      "startingState": "string (Physical starting state)",
      "actionSequence": "string (Continuous physical action sequence)",
      "endState": "string (Physical end state)",
      "fullPrompt": "string (Independent, valid, complete prompt)",
      "cameraMovement": "string (Camera motion)",
      "audioSoundscape": "string (Sound effects)",
      "continuityNotes": "string (Continuity notes in Traditional Chinese)"
    }
  ]
}
Do NOT output any markdown tags outside the JSON. Return only the valid JSON object.`;

    const raw = await this.callChat({
      model: modelToUse,
      systemPrompt,
      userPrompt,
      images: ollamaImages.length > 0 ? ollamaImages : undefined,
      formatJson: true,
      temperature,
    });

    const resultJson = parseJsonSafely(raw);
    return formatGeneratedPromptResult(resultJson, config);
  }

  async generateDialogue(params: any): Promise<any> {
    const prompt = buildDialoguePrompt(params);
    const modelToUse = params.ollamaModel || this.defaultModel;

    const raw = await this.callChat({
      model: modelToUse,
      userPrompt: prompt + `\nCRITICAL: Return ONLY a valid JSON object matching the requested schema.`,
      formatJson: true,
    });

    return parseJsonSafely(raw);
  }

  async analyzeReferenceMedia(params: any): Promise<string> {
    const { imageBase64, role, fileName } = params;
    const modelToUse = params.ollamaModel || this.defaultModel;

    const userPrompt = imageBase64 && imageBase64.includes(",")
      ? `Analyze this reference image for MiniMax-H3 model with declared Role = "${role || 'character'}". Provide a concise, highly detailed visual description suitable for Reference Definitions & Retention Analysis (e.g. key facial traits, clothing, lighting, color palette, or object texture). Keep it concise and within 60 words.`
      : `Provide a concise reference description for file "${fileName || 'Asset'}" with role "${role || 'character'}". Keep it within 50 words.`;

    const images = (imageBase64 && imageBase64.includes(","))
      ? [imageBase64.split(",")[1]]
      : undefined;

    const text = await this.callChat({
      model: modelToUse,
      userPrompt,
      images,
    });

    return text.trim();
  }

  async optimizePrompt(params: any): Promise<any> {
    const assistantDirector = typeof params.assistantDirector === 'boolean'
      ? params.assistantDirector
      : (params.creativityLevel !== 0);
    const assistantDirectorDirective = getAssistantDirectorDirective(assistantDirector);
    const temperature = resolveTemperature('ollama', params.temperatureMode, params.manualTemperature);
    const modelToUse = params.ollamaModel || this.defaultModel;

    const promptText = buildOptimizePrompt({
      rawPrompt: params.rawPrompt,
      duration: params.duration,
      suppressMusic: params.suppressMusic,
      assistantDirectorDirective,
    });

    const systemPrompt = `${buildModularSystemInstruction("T2VA")}

CRITICAL FORMAT REQUIREMENT:
You MUST output a valid JSON object matching this schema:
{
  "fullPrompt": "string (The complete assembled MiniMax-H3 prompt)",
  "explanationZh": "string (Traditional Chinese explanation of the prompt design and cinematography)",
  "suggestions": ["string (Suggestions and tips for MiniMax-H3 generation in Traditional Chinese)"]
}
Do NOT output any markdown tags outside the JSON. Return only the valid JSON object.`;

    const raw = await this.callChat({
      model: modelToUse,
      systemPrompt,
      userPrompt: promptText,
      formatJson: true,
      temperature,
    });

    const resultJson = parseJsonSafely(raw);
    if (resultJson.fullPrompt) {
      resultJson.fullPrompt = sanitizeGeneratedPromptText(resultJson.fullPrompt);
    }
    return resultJson;
  }

  async refineSeriesEpisode(params: any): Promise<any> {
    const config = params.config || {};
    const durationToUse = params.currentEpisode?.duration || config.duration || "10s";
    const durationSec = parseFloat(durationToUse) || 10;
    const assistantDirector = typeof config.assistantDirector === 'boolean'
      ? config.assistantDirector
      : (config.creativityLevel !== 0);
    const assistantDirectorDirective = getAssistantDirectorDirective(assistantDirector);
    const temperature = resolveTemperature('ollama', config.temperatureMode, config.manualTemperature);
    const modelToUse = config.ollamaModel || this.defaultModel;

    const userPrompt = buildRefineSeriesPrompt({
      seriesTitle: params.seriesTitle || "連續劇本故事板",
      storyArcSummary: params.storyArcSummary || "",
      targetEpisodeIndex: params.targetEpisodeIndex || 1,
      currentEpisode: params.currentEpisode,
      previousEpisode: params.previousEpisode,
      nextEpisode: params.nextEpisode,
      refineInstruction: params.refineInstruction,
      durationToUse,
      assistantDirectorDirective,
    });

    const jsonSchemaInstructions = `
CRITICAL FORMAT REQUIREMENT:
You MUST output a valid JSON object matching this schema:
{
  "episodeIndex": ${params.targetEpisodeIndex || 1},
  "title": "string (Updated Traditional Chinese Title)",
  "duration": "${durationToUse}",
  "startingState": "string (Literal physical starting state)",
  "actionSequence": "string (Step-by-step physical action sequence incorporating user's refinement)",
  "endState": "string (Literal physical end state)",
  "fullPrompt": "string (Complete, independent, copy-ready MiniMax-H3 prompt)",
  "cameraMovement": "string (Natural camera action)",
  "audioSoundscape": "string (Audio soundscape)",
  "continuityNotes": "string (Explanation of continuity in Traditional Chinese)"
}
Do NOT output any markdown tags outside the JSON. Return only the valid JSON object.`;

    const systemPrompt = `${buildModularSystemInstruction(config.mode || "T2VA", config.outputContract || "official")}
${jsonSchemaInstructions}`;

    const raw = await this.callChat({
      model: modelToUse,
      systemPrompt,
      userPrompt,
      formatJson: true,
      temperature,
    });

    const resultJson = parseJsonSafely(raw);
    resultJson.episodeIndex = params.targetEpisodeIndex || 1;
    resultJson.fullPrompt = sanitizeGeneratedPromptText(resultJson.fullPrompt || '', durationSec);
    resultJson.startingState = sanitizeGeneratedPromptText(resultJson.startingState || '', durationSec);
    resultJson.actionSequence = sanitizeGeneratedPromptText(resultJson.actionSequence || '', durationSec);
    resultJson.endState = sanitizeGeneratedPromptText(resultJson.endState || '', durationSec);

    return resultJson;
  }
}
