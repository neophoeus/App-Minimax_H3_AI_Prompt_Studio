import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { resolveTemperature } from "../../server/core/types";
import { getExecutionPlan } from "../../server/engines/geminiCore";
import { AiStudioEngine } from "../../server/engines/aiStudioEngine";
import { PaidApiEngine } from "../../server/engines/paidApiEngine";
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

  describe("getExecutionPlan for Subscription Tiers", () => {
    test("paid_direct tier always routes to gemini-3.8-flash with HIGH thinking", () => {
      const plan = getExecutionPlan("prompt_generation", "paid_direct");
      assert.equal(plan.primaryModel, "gemini-3.8-flash");
      assert.ok(plan.thinkingConfig);
    });

    test("pro tier specializes models by task (lite for dialogue, 3.6 for media, 3.8 for prompt)", () => {
      const dialoguePlan = getExecutionPlan("dialogue", "pro");
      assert.equal(dialoguePlan.primaryModel, "gemini-3.5-flash-lite");

      const mediaPlan = getExecutionPlan("media_analysis", "pro");
      assert.equal(mediaPlan.primaryModel, "gemini-3.6-flash");

      const promptPlan = getExecutionPlan("prompt_generation", "pro");
      assert.equal(promptPlan.primaryModel, "gemini-3.8-flash");
    });

    test("ultra_20x tier runs flagship models across tasks", () => {
      const promptPlan = getExecutionPlan("prompt_generation", "ultra_20x");
      assert.equal(promptPlan.primaryModel, "gemini-3.8-flash");
    });
  });

  describe("Engine Isolation & Status Verification", () => {
    test("AiStudioEngine returns fixedMode 'ai_studio' and pure cloud status with no local port checking", async () => {
      const engine = new AiStudioEngine();
      assert.equal(engine.mode, "ai_studio");

      const status = await engine.getStatus();
      assert.equal(status.fixedMode, "ai_studio");
      assert.equal(status.recommendedMode, "ai_studio");
      assert.equal(status.detectedModes.ai_studio, true);
      assert.equal(status.detectedModes.ollama, false);
      assert.equal(status.detectedModes.llamacpp, false);
      assert.equal(status.details.ollamaOnline, false);
      assert.equal(status.details.llamacppOnline, false);
      assert.deepEqual(status.ollamaModels, []);
      assert.deepEqual(status.llamacppModels, []);
    });

    test("PaidApiEngine returns fixedMode 'paid_api'", async () => {
      const engine = new PaidApiEngine();
      assert.equal(engine.mode, "paid_api");

      const status = await engine.getStatus();
      assert.equal(status.fixedMode, "paid_api");
      assert.equal(status.recommendedMode, "paid_api");
    });

    test("OllamaEngine and LlamaCppEngine have dedicated mode identifiers", () => {
      const ollama = new OllamaEngine();
      const llamacpp = new LlamaCppEngine();
      assert.equal(ollama.mode, "ollama");
      assert.equal(llamacpp.mode, "llamacpp");
    });
  });
});
