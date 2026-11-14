import { StudioEngine, SystemModeStatus, detectEnvironment } from "../core/types";
import {
  buildModularSystemInstruction,
  buildH3UserPrompt,
  buildDialoguePrompt,
  buildOptimizePrompt,
  buildRefineSeriesPrompt,
  formatReferencesSummary,
  getAssistantDirectorDirective,
} from "../core/prompts";
import { formatGeneratedPromptResult, parseJsonSafely, sanitizeGeneratedPromptText } from "../core/sanitizer";
import {
  getGeminiClient,
  callGeminiDynamic,
  GeminiDynamicRequest,
  InteractionJsonSchemaFormat,
} from "./geminiCore";

const EPISODE_ITEM_SCHEMA = {
  type: "object",
  properties: {
    episodeIndex: { type: "integer" },
    title: { type: "string" },
    duration: { type: "string" },
    startingState: { type: "string" },
    actionSequence: { type: "string" },
    endState: { type: "string" },
    fullPrompt: { type: "string" },
    cameraMovement: { type: "string" },
    audioSoundscape: { type: "string" },
    continuityNotes: { type: "string" },
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
};

const SINGLE_SHOT_RESPONSE_FORMAT: InteractionJsonSchemaFormat = {
  type: "text",
  mime_type: "application/json",
  schema: {
    type: "object",
    properties: {
      fullPrompt: { type: "string" },
      explanationZh: { type: "string" },
      suggestions: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["fullPrompt", "explanationZh", "suggestions"],
  },
};

const SERIES_RESPONSE_FORMAT: InteractionJsonSchemaFormat = {
  type: "text",
  mime_type: "application/json",
  schema: {
    type: "object",
    properties: {
      isSeries: { type: "boolean" },
      seriesTitle: { type: "string" },
      storyArcSummary: { type: "string" },
      explanationZh: { type: "string" },
      suggestions: {
        type: "array",
        items: { type: "string" },
      },
      episodes: {
        type: "array",
        items: EPISODE_ITEM_SCHEMA,
      },
    },
    required: ["isSeries", "seriesTitle", "storyArcSummary", "explanationZh", "suggestions", "episodes"],
  },
};

const EPISODE_REFINE_RESPONSE_FORMAT: InteractionJsonSchemaFormat = {
  type: "text",
  mime_type: "application/json",
  schema: EPISODE_ITEM_SCHEMA,
};

const DIALOGUE_RESPONSE_FORMAT: InteractionJsonSchemaFormat = {
  type: "text",
  mime_type: "application/json",
  schema: {
    type: "object",
    properties: {
      dialogueEn: { type: "string" },
      sfxSuggestion: { type: "string" },
    },
    required: ["dialogueEn", "sfxSuggestion"],
  },
};

export class GeminiApiEngine implements StudioEngine {
  readonly mode = 'gemini_api' as const;

  async getStatus(): Promise<SystemModeStatus> {
    const { hasGeminiApiKey } = detectEnvironment();
    return {
      detectedModes: {
        gemini_api: hasGeminiApiKey,
        ollama: false,
        llamacpp: false,
      },
      details: {
        hasGeminiApiKey,
        ollamaOnline: false,
        ollamaBaseUrl: "",
        ollamaModelCount: 0,
        llamacppOnline: false,
        llamacppBaseUrl: "",
        llamacppModelCount: 0,
      },
      recommendedMode: 'gemini_api',
      fixedMode: 'gemini_api',
      ollamaModels: [],
      llamacppModels: [],
    };
  }

  async generateH3Prompt(config: any): Promise<any> {
    const ai = getGeminiClient();
    const { userPrompt, multimodalParts } = buildH3UserPrompt(config);

    const requestInput: GeminiDynamicRequest['input'] = multimodalParts.length > 0
      ? [...multimodalParts, { type: "text", text: userPrompt }]
      : userPrompt;

    const isSeries = Boolean(config.isSeriesMode);
    const { text } = await callGeminiDynamic(ai, 'prompt_generation', {
      input: requestInput,
      systemInstruction: buildModularSystemInstruction(
        config.mode || "T2VA",
        config.outputContract || "official",
        isSeries
      ),
      responseFormat: isSeries ? SERIES_RESPONSE_FORMAT : SINGLE_SHOT_RESPONSE_FORMAT,
    });

    const resultJson = parseJsonSafely(text || "{}");
    if (isSeries && !resultJson.fullPrompt && Array.isArray(resultJson.episodes) && resultJson.episodes[0]?.fullPrompt) {
      resultJson.fullPrompt = resultJson.episodes[0].fullPrompt;
    }
    return formatGeneratedPromptResult(resultJson, config);
  }

  async generateDialogue(params: any): Promise<any> {
    const ai = getGeminiClient();
    const prompt = buildDialoguePrompt(params);

    const { text } = await callGeminiDynamic(ai, 'dialogue', {
      input: prompt,
      responseFormat: DIALOGUE_RESPONSE_FORMAT,
    });

    return parseJsonSafely(text || "{}");
  }

  async analyzeReferenceMedia(params: any): Promise<string> {
    const ai = getGeminiClient();
    const { imageBase64, role } = params;

    let input: GeminiDynamicRequest['input'];
    if (imageBase64 && imageBase64.includes(",")) {
      const mimeType = imageBase64.split(";")[0].split(":")[1] || "image/jpeg";
      const base64Data = imageBase64.split(",")[1];
      input = [
        {
          type: "image",
          mime_type: mimeType,
          data: base64Data,
        },
        {
          type: "text",
          text: `Analyze this reference image for MiniMax-H3 model with declared Role = "${role || 'character'}". Provide a concise, objective visual description focusing on observable physical traits (e.g. facial features, clothing materials, colors, lighting, or object structure) without abstract adjectives and without any file names. Keep it within 60 words.`,
        },
      ];
    } else {
      input = `Provide a concise, objective reference description for role "${role || 'character'}" focusing on observable physical traits without abstract adjectives or file names. Keep it within 50 words.`;
    }

    const { text } = await callGeminiDynamic(ai, 'media_analysis', { input });

    return sanitizeGeneratedPromptText((text || "Analyzed visual characteristics for retention lock.").trim());
  }

  async optimizePrompt(params: any): Promise<any> {
    const ai = getGeminiClient();
    const assistantDirector = typeof params.assistantDirector === 'boolean'
      ? params.assistantDirector
      : (params.creativityLevel !== 0);
    const assistantDirectorDirective = getAssistantDirectorDirective(assistantDirector);

    const promptText = buildOptimizePrompt({
      rawPrompt: params.rawPrompt,
      duration: params.duration,
      suppressMusic: params.suppressMusic,
      assistantDirectorDirective,
      mode: params.mode || 'T2VA',
      outputContract: params.outputContract,
      choreographyMode: params.choreographyMode,
    });

    const { text } = await callGeminiDynamic(ai, 'optimize', {
      input: promptText,
      systemInstruction: buildModularSystemInstruction(params.mode || "T2VA", params.outputContract || "official"),
      responseFormat: SINGLE_SHOT_RESPONSE_FORMAT,
    });

    const resultJson = parseJsonSafely(text || "{}");
    return formatGeneratedPromptResult(resultJson, params);
  }

  async refineSeriesEpisode(params: any): Promise<any> {
    const ai = getGeminiClient();
    const config = params.config || {};
    const durationToUse = params.currentEpisode?.duration || config.duration || "10s";
    const durationSec = parseFloat(durationToUse) || 10;
    const assistantDirector = typeof config.assistantDirector === 'boolean'
      ? config.assistantDirector
      : (config.creativityLevel !== 0);
    const assistantDirectorDirective = getAssistantDirectorDirective(assistantDirector);

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
      mode: config.mode,
      referencesSummary: formatReferencesSummary(config.references),
    });

    const { text } = await callGeminiDynamic(ai, 'prompt_generation', {
      input: userPrompt,
      systemInstruction: buildModularSystemInstruction(config.mode || "T2VA", config.outputContract || "official"),
      responseFormat: EPISODE_REFINE_RESPONSE_FORMAT,
    });

    const resultJson = parseJsonSafely(text || "{}");
    resultJson.episodeIndex = params.targetEpisodeIndex;
    resultJson.fullPrompt = sanitizeGeneratedPromptText(resultJson.fullPrompt || '', durationSec);
    resultJson.startingState = sanitizeGeneratedPromptText(resultJson.startingState || '', durationSec);
    resultJson.actionSequence = sanitizeGeneratedPromptText(resultJson.actionSequence || '', durationSec);
    resultJson.endState = sanitizeGeneratedPromptText(resultJson.endState || '', durationSec);

    return resultJson;
  }
}
