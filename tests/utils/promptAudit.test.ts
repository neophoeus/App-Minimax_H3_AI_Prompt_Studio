import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  parseDurationToSeconds,
  normalizeTimestamp,
  auditPrompt,
  repairPrompt,
} from "../../src/utils/promptAudit";

describe("Prompt Audit & Repair System", () => {
  describe("parseDurationToSeconds & normalizeTimestamp", () => {
    test("correctly parses duration string", () => {
      assert.equal(parseDurationToSeconds("10s"), 10);
      assert.equal(parseDurationToSeconds("5.5s"), 5.5);
      assert.equal(parseDurationToSeconds(""), 10);
    });

    test("normalizes timestamp to MM:SS.mmm", () => {
      assert.equal(normalizeTimestamp("00:03.500"), "00:03.500");
      assert.equal(normalizeTimestamp("0:3.5"), "00:03.500");
      assert.equal(normalizeTimestamp("0:05"), "00:05.000");
    });
  });

  describe("auditPrompt", () => {
    test("detects empty prompt", () => {
      const res = auditPrompt("");
      assert.equal(res.isValid, false);
      assert.ok(res.issues.some((i) => i.code === "EMPTY_PROMPT"));
    });

    test("detects filename leakages", () => {
      const text = "integrated_multimodal_description: [Shot 1] Look at hero_character.png standing in rain.";
      const res = auditPrompt(text);
      assert.equal(res.hasLeakage, true);
      assert.ok(res.issues.some((i) => i.code === "FILENAME_LEAKAGE"));
    });

    test("detects internal video leakage tokens", () => {
      const text = "integrated_multimodal_description: [Shot 1] Based on contact sheet cells and sample frames.";
      const res = auditPrompt(text);
      assert.equal(res.hasLeakage, true);
      assert.ok(res.issues.some((i) => i.code === "INTERNAL_TOKEN_LEAKAGE"));
    });

    test("passes clean valid prompt", () => {
      const text = `integrated_multimodal_description: [Shot 1] The camera pushes in at slow speed toward an antique clock on the mantelpiece.\n\noverall_soundscape:\nClock ticking.\n\nnon_diegetic_music:\nN/A`;
      const res = auditPrompt(text, { duration: "10s", mode: "T2VA" });
      assert.equal(res.hasLeakage, false);
      assert.equal(res.hasConstraintViolation, false);
      assert.equal(res.isValid, true);
    });

    test("detects timestamp in Shot 1", () => {
      const text = "[Shot 1] At 00:00.000, the camera pushes in toward the subject.";
      const res = auditPrompt(text);
      assert.equal(res.hasTimestampError, true);
      assert.ok(res.issues.some((i) => i.code === "SHOT1_HAS_TIMESTAMP"));
    });

    test("detects bracketed camera movement tags", () => {
      const text = "[Shot 1] [Push In] The camera moves forward.";
      const res = auditPrompt(text);
      assert.ok(res.issues.some((i) => i.code === "BRACKETED_CAMERA_TAG"));
    });

    test("detects unbalanced lyrics tags", () => {
      const text = "[Shot 1] The singer sings <l>[English] We are the champions while looking up.";
      const res = auditPrompt(text);
      assert.equal(res.isValid, false);
      assert.ok(res.issues.some((i) => i.code === "UNBALANCED_LYRICS_TAGS"));
    });
  });

  describe("repairPrompt", () => {
    test("automatically repairs filenames and internal tokens", () => {
      const dirty = "Look at face_sample.png and contact sheet cells in the room.";
      const repaired = repairPrompt(dirty, 10);
      assert.ok(!repaired.includes(".png"));
      assert.ok(!repaired.includes("contact sheet cells"));
    });

    test("clamps out-of-range timestamps to within duration", () => {
      const dirty = "[Shot 2] At 00:15.000, the camera cuts to the exterior.";
      const repaired = repairPrompt(dirty, 10);
      assert.ok(!repaired.includes("00:15.000"));
      assert.ok(repaired.includes("00:09.500"));
    });

    test("automatically removes timestamps from Shot 1 and strips bracketed camera tags", () => {
      const dirty = "[Shot 1] At 00:00.000, [Push In] The camera pushes in.";
      const repaired = repairPrompt(dirty, 10);
      assert.ok(!repaired.includes("At 00:00.000"));
      assert.ok(!repaired.includes("[Push In]"));
      assert.ok(repaired.startsWith("[Shot 1] "));
    });

    test("automatically closes unclosed speech and lyrics tags", () => {
      const dirty = "[Shot 1] (S1) says: <d>[English] Hello and sings <l>[English] Lalala";
      const repaired = repairPrompt(dirty, 10);
      assert.ok(repaired.includes("</d>"));
      assert.ok(repaired.includes("</l>"));
    });
  });
});
