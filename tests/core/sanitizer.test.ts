import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  cleanModelOutput,
  parseJsonSafely,
  sanitizeGeneratedPromptText,
  formatGeneratedPromptResult,
} from "../../server/core/sanitizer";

describe("Sanitizer & Output Parser Module", () => {
  describe("cleanModelOutput", () => {
    test("removes thinking reasoning tokens from Qwen/DeepSeek", () => {
      const input = "<think>Let me reason about this scene. First samurai enters.</think>integrated_multimodal_description: [Shot 1] A samurai walks.";
      const cleaned = cleanModelOutput(input);
      assert.equal(cleaned, "integrated_multimodal_description: [Shot 1] A samurai walks.");
    });

    test("removes markdown code fences", () => {
      const input = "```json\n{\"fullPrompt\": \"test prompt\"}\n```";
      const cleaned = cleanModelOutput(input);
      assert.equal(cleaned, '{"fullPrompt": "test prompt"}');
    });
  });

  describe("parseJsonSafely", () => {
    test("parses standard json string", () => {
      const obj = parseJsonSafely('{"key": "value", "num": 123}');
      assert.deepEqual(obj, { key: "value", num: 123 });
    });

    test("extracts JSON object embedded inside chatty model text", () => {
      const messy = "Sure, here is the generated output you requested:\n{\"fullPrompt\": \"Hello World\"}\nHope this helps!";
      const obj = parseJsonSafely(messy);
      assert.equal(obj.fullPrompt, "Hello World");
    });

    test("throws meaningful error if no json structure is found", () => {
      assert.throws(() => {
        parseJsonSafely("Totally invalid text with no braces");
      }, /無法解析模型輸出的 JSON 結構/);
    });
  });

  describe("sanitizeGeneratedPromptText", () => {
    test("strips accidental image/video file extensions", () => {
      const text = "A scene with character_reference.png standing by car_model.jpg and video_bg.mp4.";
      const sanitized = sanitizeGeneratedPromptText(text);
      assert.ok(!sanitized.includes(".png"));
      assert.ok(!sanitized.includes(".jpg"));
      assert.ok(!sanitized.includes(".mp4"));
    });
  });

  describe("formatGeneratedPromptResult", () => {
    test("audits prompt and attaches auditResult", () => {
      const rawResult = {
        fullPrompt: "integrated_multimodal_description: [Shot 1] The camera pushes in toward a red mug on a wooden table.\n\noverall_soundscape:\nQuiet room hum.\n\nnon_diegetic_music:\nN/A",
        explanationZh: "測試解析",
        suggestions: ["建議1"],
      };

      const formatted = formatGeneratedPromptResult(rawResult, {
        duration: "5s",
        cameraMoves: ["Push In"],
        mode: "T2VA",
      });

      assert.ok(formatted.auditResult);
      assert.equal(typeof formatted.auditResult.isValid, "boolean");
      assert.equal(formatted.auditResult.hasLeakage, false);
    });

    test("formats series episodes with index and sanitized prompt text", () => {
      const rawResult = {
        isSeries: true,
        episodes: [
          {
            title: "Ep 1",
            fullPrompt: "Episode 1 content test.png",
          },
        ],
      };

      const formatted = formatGeneratedPromptResult(rawResult, {
        duration: "10s",
        isSeriesMode: true,
      });

      assert.equal(formatted.isSeries, true);
      assert.equal(formatted.episodes.length, 1);
      assert.equal(formatted.episodes[0].episodeIndex, 1);
      assert.ok(!formatted.episodes[0].fullPrompt.includes("test.png"));
    });
  });
});
