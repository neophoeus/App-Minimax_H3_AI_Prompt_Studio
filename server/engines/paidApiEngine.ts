import { Type } from "@google/genai";
import { StudioEngine, SystemModeStatus, resolveTemperature, detectEnvironment } from "../core/types";
import {
  buildModularSystemInstruction,
  buildH3UserPrompt,
  buildDialoguePrompt,
  buildOptimizePrompt,
  buildRefineSeriesPrompt,
  getAssistantDirectorDirective,
} from "../core/prompts";
import { formatGeneratedPromptResult, parseJsonSafely, sanitizeGeneratedPromptText } from "../core/sanitizer";
import { getGeminiClient, callGeminiDynamic } from "./geminiCore";

export class PaidApiEngine implements StudioEngine {
  readonly mode = 'paid_api' as const;

  async getStatus(): Promise<SystemModeStatus> {
    const { hasGeminiApiKey } = detectEnvironment();
    return {
      detectedModes: {
        ai_studio: false,
        paid_api: hasGeminiApiKey,
        ollama: false,
        llamacpp: false,
      },
      details: {
        isAiStudioEnv: false,
        hasGeminiApiKey,
        ollamaOnline: false,
        ollamaBaseUrl: "",
        ollamaModelCount: 0,
        llamacppOnline: false,
        llamacppBaseUrl: "",
        llamacppModelCount: 0,
      },
      recommendedMode: 'paid_api',
      fixedMode: 'paid_api',
      ollamaModels: [],
      llamacppModels: [],
    };
  }

  async generateH3Prompt(config: any): Promise<any> {
    const ai = getGeminiClient();
    const effectiveTier = 'paid_direct' as const;
    const geminiTemperature = resolveTemperature('gemini', config.temperatureMode, config.manualTemperature);

    const { userPrompt, multimodalParts } = buildH3UserPrompt(config);

    const requestContents = multimodalParts.length > 0
      ? [...multimodalParts, userPrompt]
      : userPrompt;

    const geminiConfig: any = {
      systemInstruction: buildModularSystemInstruction(config.mode || "T2VA", config.outputContract || "official"),
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
        required: ["fullPrompt", "explanationZh", "suggestions"],
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
    return formatGeneratedPromptResult(resultJson, config);
  }

  async generateDialogue(params: any): Promise<any> {
    const ai = getGeminiClient();
    const effectiveTier = 'paid_direct' as const;
    const prompt = buildDialoguePrompt(params);

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

    return JSON.parse(response.text || "{}");
  }

  async analyzeReferenceMedia(params: any): Promise<string> {
    const ai = getGeminiClient();
    const effectiveTier = 'paid_direct' as const;
    const { imageBase64, role, fileName } = params;

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
        `Analyze this reference image for MiniMax-H3 model with declared Role = "${role || 'character'}". Provide a concise, objective visual description focusing on observable physical traits (e.g. facial features, clothing materials, colors, lighting, or object structure) without abstract adjectives and without any file names. Keep it within 60 words.`
      ];
    } else {
      contents = [`Provide a concise, objective reference description for role "${role || 'character'}" focusing on observable physical traits without abstract adjectives or file names. Keep it within 50 words.`];
    }

    const response = await callGeminiDynamic(
      ai,
      'media_analysis',
      effectiveTier,
      { contents }
    );

    return sanitizeGeneratedPromptText((response.text || "Analyzed visual characteristics for retention lock.").trim());
  }

  async optimizePrompt(params: any): Promise<any> {
    const ai = getGeminiClient();
    const effectiveTier = 'paid_direct' as const;
    const assistantDirector = typeof params.assistantDirector === 'boolean'
      ? params.assistantDirector
      : (params.creativityLevel !== 0);
    const assistantDirectorDirective = getAssistantDirectorDirective(assistantDirector);
    const geminiTemperature = resolveTemperature('gemini', params.temperatureMode, params.manualTemperature);

    const promptText = buildOptimizePrompt({
      rawPrompt: params.rawPrompt,
      duration: params.duration,
      suppressMusic: params.suppressMusic,
      assistantDirectorDirective,
      mode: params.mode || 'T2VA',
      outputContract: params.outputContract,
    });

    const geminiConfig: any = {
      systemInstruction: buildModularSystemInstruction(params.mode || "T2VA", params.outputContract || "official"),
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
        required: ["fullPrompt", "explanationZh", "suggestions"],
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
        contents: promptText,
        config: geminiConfig,
      }
    );

    const resultJson = JSON.parse(response.text || "{}");
    return formatGeneratedPromptResult(resultJson, params);
  }

  async refineSeriesEpisode(params: any): Promise<any> {
    const ai = getGeminiClient();
    const effectiveTier = 'paid_direct' as const;
    const config = params.config || {};
    const durationToUse = params.currentEpisode?.duration || config.duration || "10s";
    const durationSec = parseFloat(durationToUse) || 10;
    const assistantDirector = typeof config.assistantDirector === 'boolean'
      ? config.assistantDirector
      : (config.creativityLevel !== 0);
    const assistantDirectorDirective = getAssistantDirectorDirective(assistantDirector);
    const geminiTemperature = resolveTemperature('gemini', config.temperatureMode, config.manualTemperature);

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

    const geminiConfig: any = {
      systemInstruction: buildModularSystemInstruction(config.mode || "T2VA", config.outputContract || "official"),
      responseMimeType: "application/json",
      responseSchema: {
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
    };

    if (typeof geminiTemperature === 'number') {
      geminiConfig.temperature = geminiTemperature;
    }

    const response = await callGeminiDynamic(
      ai,
      'prompt_generation',
      effectiveTier,
      {
        contents: userPrompt,
        config: geminiConfig,
      }
    );

    const resultJson = JSON.parse(response.text || "{}");
    resultJson.episodeIndex = params.targetEpisodeIndex;
    resultJson.fullPrompt = sanitizeGeneratedPromptText(resultJson.fullPrompt || '', durationSec);
    resultJson.startingState = sanitizeGeneratedPromptText(resultJson.startingState || '', durationSec);
    resultJson.actionSequence = sanitizeGeneratedPromptText(resultJson.actionSequence || '', durationSec);
    resultJson.endState = sanitizeGeneratedPromptText(resultJson.endState || '', durationSec);

    return resultJson;
  }
}
