import { test, describe, mock } from "node:test";
import assert from "node:assert/strict";
import { GoogleGenAI } from "@google/genai";
import {
  PRIMARY_GEMINI_MODEL,
  DIALOGUE_GEMINI_MODEL,
  normalizeThinkingLevelForModel,
  normalizeInteractionInput,
  checkInteractionStatus,
  extractInteractionText,
  callGeminiDynamic,
} from "../../server/engines/geminiCore";
import { GeminiApiEngine } from "../../server/engines/geminiApiEngine";

describe("Gemini 4 Hydrogen & Interactions API Core", () => {
  describe("normalizeThinkingLevelForModel", () => {
    test("coerces unsupported 'minimal' to 'low' for gemini-4-hydrogen and keeps valid levels", () => {
      assert.equal(normalizeThinkingLevelForModel(PRIMARY_GEMINI_MODEL, "minimal"), "low");
      assert.equal(normalizeThinkingLevelForModel(PRIMARY_GEMINI_MODEL, "low"), "low");
      assert.equal(normalizeThinkingLevelForModel(PRIMARY_GEMINI_MODEL, "medium"), "medium");
      assert.equal(normalizeThinkingLevelForModel(PRIMARY_GEMINI_MODEL, "high"), "high");
      assert.equal(normalizeThinkingLevelForModel(PRIMARY_GEMINI_MODEL, "xhigh"), "xhigh");
    });

    test("coerces unsupported 'xhigh' to 'high' for gemini-3.5-flash-lite and preserves 'minimal'", () => {
      assert.equal(normalizeThinkingLevelForModel(DIALOGUE_GEMINI_MODEL, "xhigh"), "high");
      assert.equal(normalizeThinkingLevelForModel(DIALOGUE_GEMINI_MODEL, "minimal"), "minimal");
    });
  });

  describe("normalizeInteractionInput", () => {
    test("passes through plain string prompts untouched", () => {
      assert.equal(normalizeInteractionInput("Create a cinematic shot", "low"), "Create a cinematic shot");
    });

    test("injects resolution: 'low' on native and legacy image blocks without mutating originals", () => {
      const originalNative = { type: "image", mime_type: "image/jpeg", data: "abc123" };
      const originalLegacy = { inlineData: { mimeType: "image/png", data: "xyz789" } };
      const normalized = normalizeInteractionInput(
        [originalNative, originalLegacy, "Describe the opening frame"],
        "low"
      ) as any[];

      assert.equal(normalized.length, 3);
      assert.deepEqual(normalized[0], {
        type: "image",
        mime_type: "image/jpeg",
        data: "abc123",
        resolution: "low",
      });
      assert.deepEqual(normalized[1], {
        type: "image",
        mime_type: "image/png",
        data: "xyz789",
        resolution: "low",
      });
      assert.deepEqual(normalized[2], {
        type: "text",
        text: "Describe the opening frame",
      });
      assert.equal("resolution" in originalNative, false);
    });
  });

  describe("extractInteractionText", () => {
    test("prefers non-empty top-level output_text", () => {
      const text = extractInteractionText({
        status: "completed",
        output_text: '{"fullPrompt":"Subject stands in rain"}',
        steps: [],
      });
      assert.equal(text, '{"fullPrompt":"Subject stands in rain"}');
    });

    test("falls back to model_output steps when output_text is omitted", () => {
      const text = extractInteractionText({
        status: "completed",
        steps: [
          { type: "thought", content: [{ type: "thought", summary: [{ type: "text", text: "internal" }] }] },
          {
            type: "model_output",
            content: [
              { type: "text", text: '{"dialogueEn":' },
              { type: "text", text: '"Stay sharp.", "sfxSuggestion":"Rain"}' },
            ],
          },
        ],
      });
      assert.equal(text, '{"dialogueEn":"Stay sharp.", "sfxSuggestion":"Rain"}');
    });

    test("throws descriptive error when no usable text output is present", () => {
      assert.throws(() => extractInteractionText({ status: "completed", steps: [] }), /有效文字內容/);
    });
  });

  describe("checkInteractionStatus", () => {
    test("allows completed status", () => {
      assert.doesNotThrow(() => checkInteractionStatus({ status: "completed", output_text: "ok" }));
    });

    test("surfaces safety block error when failed with safety error code", () => {
      assert.throws(
        () =>
          checkInteractionStatus({
            status: "failed",
            errors: [{ code: "image_safety", message: "Reference image blocked" }],
          }),
        /內容安全性阻擋通知/
      );
    });

    test("surfaces non-safety failure details when failed or cancelled", () => {
      assert.throws(
        () =>
          checkInteractionStatus({
            status: "failed",
            errors: [{ code: "invalid_argument", message: "Malformed schema" }],
          }),
        /Gemini Interaction 執行失敗 \(invalid_argument: Malformed schema\)/
      );
    });

    test("surfaces truncation notice when status is incomplete or budget_exceeded", () => {
      assert.throws(() => checkInteractionStatus({ status: "incomplete" }), /輸出長度截斷通知/);
      assert.throws(() => checkInteractionStatus({ status: "budget_exceeded" }), /輸出長度截斷通知/);
    });
  });

  describe("callGeminiDynamic", () => {
    test("sends Interactions API payload for prompt_generation without deprecated sampling parameters", async () => {
      let capturedPayload: any = null;
      const fakeAi = {
        interactions: {
          create: async (payload: any) => {
            capturedPayload = payload;
            return {
              id: "int_001",
              status: "completed",
              output_text: '{"fullPrompt":"Prompt output","explanationZh":"說明","suggestions":["s1"]}',
            };
          },
        },
      } as unknown as GoogleGenAI;

      const schemaFormat = {
        type: "text" as const,
        mime_type: "application/json" as const,
        schema: {
          type: "object",
          properties: { fullPrompt: { type: "string" } },
          required: ["fullPrompt"],
        },
      };

      const res = await callGeminiDynamic(fakeAi, "prompt_generation", {
        input: [{ type: "image", mime_type: "image/jpeg", data: "img64" }, { type: "text", text: "Hello" }],
        systemInstruction: "System directive",
        responseFormat: schemaFormat,
      });

      assert.equal(capturedPayload.model, "gemini-4-hydrogen");
      assert.equal(capturedPayload.system_instruction, "System directive");
      assert.deepEqual(capturedPayload.response_format, schemaFormat);
      assert.deepEqual(capturedPayload.generation_config, {
        thinking_level: "high",
        thinking_summaries: "none",
      });
      assert.equal(capturedPayload.store, false);
      assert.equal(capturedPayload.input[0].resolution, "low");
      assert.equal("temperature" in capturedPayload, false);
      assert.equal("temperature" in capturedPayload.generation_config, false);
      assert.equal("top_p" in capturedPayload.generation_config, false);
      assert.equal("top_k" in capturedPayload.generation_config, false);
      assert.ok(res.text.includes("Prompt output"));
    });

    test("routes dialogue task to gemini-3.5-flash-lite with minimal thinking and store: false", async () => {
      let capturedPayload: any = null;
      const fakeAi = {
        interactions: {
          create: async (payload: any) => {
            capturedPayload = payload;
            return {
              id: "int_002",
              status: "completed",
              steps: [
                {
                  type: "model_output",
                  content: [{ type: "text", text: '{"dialogueEn":"Go now.","sfxSuggestion":"Door slam"}' }],
                },
              ],
            };
          },
        },
      } as unknown as GoogleGenAI;

      const res = await callGeminiDynamic(fakeAi, "dialogue", {
        input: "Generate short dialogue",
      });

      assert.equal(capturedPayload.model, "gemini-3.5-flash-lite");
      assert.deepEqual(capturedPayload.generation_config, {
        thinking_level: "minimal",
        thinking_summaries: "none",
      });
      assert.equal(capturedPayload.store, false);
      assert.equal(res.text, '{"dialogueEn":"Go now.","sfxSuggestion":"Door slam"}');
    });
  });

  describe("GeminiApiEngine mocked Interactions integration", () => {
    test("routes all 5 engine methods via ai.interactions.create without sending temperature", async () => {
      const prevKey = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = "unit-test-gemini-key";
      const capturedCalls: any[] = [];

      const proto = Object.getPrototypeOf(new GoogleGenAI({ apiKey: "unit-test-gemini-key" }).interactions);
      const createMock = mock.method(proto, "create", async (payload: any) => {
        capturedCalls.push(payload);
        if (payload.model === DIALOGUE_GEMINI_MODEL) {
          return {
            id: "int_dlg",
            status: "completed",
            output_text: '{"dialogueEn":"Hold the line!","sfxSuggestion":"Radio static"}',
          };
        }
        if (Array.isArray(payload.input) && !payload.response_format) {
          return {
            id: "int_media",
            status: "completed",
            output_text: "A worn leather jacket under cool tungsten rim lighting.",
          };
        }
        if (payload.response_format?.schema?.properties?.episodes) {
          return {
            id: "int_series",
            status: "completed",
            output_text: JSON.stringify({
              isSeries: true,
              seriesTitle: "Neon Chase",
              storyArcSummary: "Two-part rooftop pursuit",
              explanationZh: "分鏡解析",
              suggestions: ["Add rain"],
              episodes: [
                {
                  episodeIndex: 1,
                  title: "Jump",
                  duration: "10s",
                  startingState: "Runner crouches at roof edge [00:00.000-00:03.000].",
                  actionSequence: "Runner sprints and leaps cleanly [00:03.000-00:08.000].",
                  endState: "Runner lands softly on fire escape [00:08.000-00:10.000].",
                  fullPrompt: "00:00~00:10 Wide tracking shot, runner leaps across rooftop.",
                  cameraMovement: "Tracking shot",
                  audioSoundscape: "Footsteps and distant sirens",
                  continuityNotes: "Maintain teal jacket",
                },
              ],
            }),
          };
        }
        if (payload.response_format?.schema?.properties?.episodeIndex) {
          return {
            id: "int_refine",
            status: "completed",
            output_text: JSON.stringify({
              episodeIndex: 2,
              title: "Landing",
              duration: "6s",
              startingState: "Runner lands in wet alley [00:00.000-00:02.000].",
              actionSequence: "Runner ducks behind steel dumpster [00:02.000-00:04.500].",
              endState: "Runner glances down empty lane [00:04.500-00:06.000].",
              fullPrompt: "00:00~00:06 Low-angle medium shot in wet alley.",
              cameraMovement: "Low push-in",
              audioSoundscape: "Dripping water",
              continuityNotes: "Teal jacket soaked",
            }),
          };
        }
        return {
          id: "int_single",
          status: "completed",
          output_text: JSON.stringify({
            fullPrompt: "00:00~00:06 Medium close-up in cyber alley under neon glow.",
            explanationZh: "採用 Interactions API 高深度推理生成。",
            suggestions: ["可強化雨絲細節"],
          }),
        };
      });

      try {
        const engine = new GeminiApiEngine();

        // 1. generateH3Prompt (single shot + multimodal image + ignored manual temperature)
        const h3Res = await engine.generateH3Prompt({
          idea: "Hero stands in cyber alley",
          mode: "Ref2VA",
          duration: "6s",
          temperatureMode: "manual",
          manualTemperature: 1.4,
          references: [
            {
              id: "r1",
              tag: "<Subject 1>",
              role: "character",
              name: "hero.png",
              description: "Hero in jacket",
              fileType: "image",
              fileUrl: "data:image/jpeg;base64,base64img",
              physicalTag: "<Picture 1>",
              pictureIndex: 1,
            },
          ],
        });
        assert.ok(h3Res.fullPrompt.includes("Medium close-up"));

        // 2. generateDialogue (gemini-3.5-flash-lite)
        const dlgRes = await engine.generateDialogue({ idea: "Hero calls backup" });
        assert.equal(dlgRes.dialogueEn, "Hold the line!");

        // 3. analyzeReferenceMedia (gemini-4-hydrogen + resolution: low)
        const mediaText = await engine.analyzeReferenceMedia({
          imageBase64: "data:image/jpeg;base64,ref64",
          role: "character",
        });
        assert.ok(mediaText.includes("leather jacket"));

        // 4. optimizePrompt (gemini-4-hydrogen + low thinking)
        const optRes = await engine.optimizePrompt({
          rawPrompt: "Hero in alley",
          duration: "6s",
          temperatureMode: "manual",
          manualTemperature: 0.2,
        });
        assert.ok(optRes.fullPrompt.includes("cyber alley"));

        // 5. refineSeriesEpisode
        const refRes = await engine.refineSeriesEpisode({
          seriesTitle: "Neon Chase",
          targetEpisodeIndex: 2,
          refineInstruction: "Tighten pacing",
          currentEpisode: { duration: "6s", fullPrompt: "Old prompt" },
          config: { mode: "T2VA", duration: "6s", temperatureMode: "manual", manualTemperature: 1.2 },
        });
        assert.equal(refRes.episodeIndex, 2);

        // 6. generateH3Prompt (series)
        const seriesRes = await engine.generateH3Prompt({
          idea: "Rooftop chase",
          mode: "T2VA",
          duration: "10s",
          isSeriesMode: true,
        });
        assert.equal(seriesRes.isSeries, true);
        assert.equal(seriesRes.episodes.length, 1);

        assert.equal(capturedCalls.length, 6);
        // Prompt generation, media analysis, optimize, series all route to gemini-4-hydrogen
        assert.equal(capturedCalls[0].model, "gemini-4-hydrogen");
        assert.equal(capturedCalls[0].generation_config.thinking_level, "high");
        assert.equal(capturedCalls[0].input[0].resolution, "low");
        assert.equal(capturedCalls[1].model, "gemini-3.5-flash-lite");
        assert.equal(capturedCalls[1].generation_config.thinking_level, "minimal");
        assert.equal(capturedCalls[2].model, "gemini-4-hydrogen");
        assert.equal(capturedCalls[2].generation_config.thinking_level, "low");
        assert.equal(capturedCalls[2].input[0].resolution, "low");
        assert.equal(capturedCalls[3].model, "gemini-4-hydrogen");
        assert.equal(capturedCalls[3].generation_config.thinking_level, "low");

        for (const call of capturedCalls) {
          assert.equal(call.store, false);
          assert.equal("temperature" in call, false);
          assert.equal("temperature" in call.generation_config, false);
        }
      } finally {
        createMock.mock.restore();
        if (prevKey === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = prevKey;
      }
    });
  });
});
