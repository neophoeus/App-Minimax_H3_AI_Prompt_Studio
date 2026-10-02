import { Type } from "@google/genai";
import { StudioEngine, SystemModeStatus, EngineTier, resolveTemperature, detectEnvironment } from "../core/types";
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

export class AiStudioEngine implements StudioEngine {
  readonly mode = 'ai_studio' as const;

  async getStatus(): Promise<SystemModeStatus> {
    const { isAiStudioEnv, hasGeminiApiKey } = detectEnvironment();
    return {
      detectedModes: {
        ai_studio: true,
        paid_api: false,
        ollama: false,
        llamacpp: false,
      },
      details: {
        isAiStudioEnv: true,
        hasGeminiApiKey,
        ollamaOnline: false,
        ollamaBaseUrl: "",
        ollamaModelCount: 0,
        llamacppOnline: false,
        llamacppBaseUrl: "",
        llamacppModelCount: 0,
      },
      recommendedMode: 'ai_studio',
      fixedMode: 'ai_studio',
      ollamaModels: [],
      llamacppModels: [],
    };
  }

  private resolveTier(config: any): EngineTier {
    return config.subscriptionTier || config.engineTier || 'pro';
  }

  async generateH3Prompt(config: any): Promise<any> {
    const ai = getGeminiClient();
    const effectiveTier = this.resolveTier(config);
    const geminiTemperature = resolveTemperature('gemini', config.temperatureMode, config.manualTemperature);

    const { userPrompt, multimodalParts, isSeriesMode, durationSec } = buildH3UserPrompt(config);

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
    const effectiveTier = this.resolveTier(params);
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
    const effectiveTier = this.resolveTier(params);
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
        `Analyze this reference image for MiniMax-H3 model with declared Role = "${role || 'character'}". Provide a concise, highly detailed visual description suitable for Reference Definitions & Retention Analysis (e.g. key facial traits, clothing, lighting, color palette, or object texture). Keep it concise and within 60 words.`
      ];
    } else {
      contents = [`Provide a concise reference description for file "${fileName || 'Asset'}" with role "${role || 'character'}". Keep it within 50 words.`];
    }

    const response = await callGeminiDynamic(
      ai,
      'media_analysis',
      effectiveTier,
      { contents }
    );

    return (response.text || "Analyzed visual characteristics for retention lock.").trim();
  }

  async optimizePrompt(params: any): Promise<any> {
    const ai = getGeminiClient();
    const effectiveTier = this.resolveTier(params);
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
    });

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
    if (resultJson.fullPrompt) {
      resultJson.fullPrompt = sanitizeGeneratedPromptText(resultJson.fullPrompt);
    }
    return resultJson;
  }

  async refineSeriesEpisode(params: any): Promise<any> {
    const ai = getGeminiClient();
    const effectiveTier = this.resolveTier(params.config || {});
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
