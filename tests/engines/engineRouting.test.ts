import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { MediaResolution, ThinkingLevel } from "@google/genai";
import { resolveTemperature } from "../../server/core/types";
import * as geminiCore from "../../server/engines/geminiCore";
import { getExecutionPlan, getGeminiClient } from "../../server/engines/geminiCore";
import { GeminiApiEngine } from "../../server/engines/geminiApiEngine";
import { OllamaEngine } from "../../server/engines/ollamaEngine";
import { LlamaCppEngine } from "../../server/engines/llamaCppEngine";

describe("Engine Routing & Strategy Specifications", () => {
  describe("resolveTemperature", () => {
    test("Gemini in auto mode returns undefined for model native calibration", () => {
      assert.equal(resolveTemperature("gemini", "auto"), undefined);
      assert.equal(resolveTemperature("gemini"), undefined);
    });

    test("Local engines (Ollama and llama.cpp) in auto mode default to 0.7", () => {
      assert.equal(resolveTemperature("ollama", "auto"), 0.7);
      assert.equal(resolveTemperature("llamacpp", "auto"), 0.7);
    });

    test("Manual mode clamps temperature between 0.0 and 1.5", () => {
      assert.equal(resolveTemperature("gemini", "manual", 0.3), 0.3);
      assert.equal(resolveTemperature("ollama", "manual", -0.5), 0.0);
      assert.equal(resolveTemperature("llamacpp", "manual", 2.5), 1.5);
    });
  });

  describe("getExecutionPlan for Gemini API Flagship Direct Engine (Pay-as-you-go & Token Optimized)", () => {
    test("prompt_generation routes to flagship gemini-3.8-flash with HIGH thinking and MEDIA_RESOLUTION_LOW", () => {
      const plan = getExecutionPlan("prompt_generation");
      assert.equal(plan.primaryModel, "gemini-3.8-flash");
      assert.equal("fallbackModels" in plan, false);
      assert.deepEqual(plan.thinkingConfig, {
        thinkingLevel: ThinkingLevel.HIGH,
        includeThoughts: false,
      });
      assert.equal(plan.mediaResolution, MediaResolution.MEDIA_RESOLUTION_LOW);
    });

    test("dialogue routes to high-throughput gemini-3.5-flash-lite with MINIMAL thinking to save tokens", () => {
      const plan = getExecutionPlan("dialogue");
      assert.equal(plan.primaryModel, "gemini-3.5-flash-lite");
      assert.equal("fallbackModels" in plan, false);
      assert.deepEqual(plan.thinkingConfig, {
        thinkingLevel: ThinkingLevel.MINIMAL,
        includeThoughts: false,
      });
    });

    test("media_analysis and optimize route to gemini-3.8-flash with LOW thinking", () => {
      const mediaPlan = getExecutionPlan("media_analysis");
      assert.equal(mediaPlan.primaryModel, "gemini-3.8-flash");
      assert.equal("fallbackModels" in mediaPlan, false);
      assert.deepEqual(mediaPlan.thinkingConfig, {
        thinkingLevel: ThinkingLevel.LOW,
        includeThoughts: false,
      });
      assert.equal(mediaPlan.mediaResolution, MediaResolution.MEDIA_RESOLUTION_LOW);

      const optPlan = getExecutionPlan("optimize");
      assert.equal(optPlan.primaryModel, "gemini-3.8-flash");
      assert.equal("fallbackModels" in optPlan, false);
      assert.deepEqual(optPlan.thinkingConfig, {
        thinkingLevel: ThinkingLevel.LOW,
        includeThoughts: false,
      });
    });

    test("safety settings and quota retry artifacts are removed from geminiCore exports", () => {
      assert.equal("RELAXED_SAFETY_SETTINGS" in geminiCore, false);
      assert.equal("sleep" in geminiCore, false);
    });

    test("getGeminiClient rejects blank or default placeholder MY_GEMINI_API_KEY", () => {
      const prev = process.env.GEMINI_API_KEY;
      try {
        process.env.GEMINI_API_KEY = "MY_GEMINI_API_KEY";
        assert.throws(() => getGeminiClient(), /GEMINI_API_KEY/);
        process.env.GEMINI_API_KEY = "   ";
        assert.throws(() => getGeminiClient(), /GEMINI_API_KEY/);
      } finally {
        if (prev === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = prev;
      }
    });
  });

  describe("Engine Isolation & Status Verification", () => {
    test("GeminiApiEngine returns fixedMode 'gemini_api' and clean 3-engine mode status", async () => {
      const engine = new GeminiApiEngine();
      assert.equal(engine.mode, "gemini_api");

      const status = await engine.getStatus();
      assert.equal(status.fixedMode, "gemini_api");
      assert.equal(status.recommendedMode, "gemini_api");
      assert.equal(status.detectedModes.ollama, false);
      assert.equal(status.detectedModes.llamacpp, false);
      assert.equal(typeof status.detectedModes.gemini_api, "boolean");
      assert.equal("paid_api" in status.detectedModes, false);
      assert.equal("ai_studio" in status.detectedModes, false);
      assert.equal("isAiStudioEnv" in status.details, false);
    });

    test("OllamaEngine and LlamaCppEngine have dedicated mode identifiers and clean status", async () => {
      const ollama = new OllamaEngine();
      const llamacpp = new LlamaCppEngine();
      assert.equal(ollama.mode, "ollama");
      assert.equal(llamacpp.mode, "llamacpp");

      const ollamaStatus = await ollama.getStatus();
      assert.equal(ollamaStatus.fixedMode, "ollama");
      assert.equal(ollamaStatus.detectedModes.gemini_api, false);
      assert.equal("paid_api" in ollamaStatus.detectedModes, false);
      assert.equal("ai_studio" in ollamaStatus.detectedModes, false);
      assert.equal("isAiStudioEnv" in ollamaStatus.details, false);

      const llamaStatus = await llamacpp.getStatus();
      assert.equal(llamaStatus.fixedMode, "llamacpp");
      assert.equal(llamaStatus.detectedModes.gemini_api, false);
      assert.equal("paid_api" in llamaStatus.detectedModes, false);
      assert.equal("ai_studio" in llamaStatus.detectedModes, false);
      assert.equal("isAiStudioEnv" in llamaStatus.details, false);
    });
  });
});
