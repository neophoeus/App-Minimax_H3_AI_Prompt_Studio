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

    test("detects non-monotonic or duplicate shot timestamps", () => {
      const inverted = "[Shot 1] Opening. [Shot 2] At 00:06.000, cuts. [Shot 3] At 00:04.000, cuts back.";
      const res1 = auditPrompt(inverted, { duration: "10s" });
      assert.equal(res1.hasTimestampError, true);
      assert.ok(res1.issues.some((i) => i.code === "NON_MONOTONIC_TIMESTAMPS"));

      const duplicate = "[Shot 1] Opening. [Shot 2] At 00:05.000, cuts. [Shot 3] At 00:05.000, cuts again.";
      const res2 = auditPrompt(duplicate, { duration: "10s" });
      assert.equal(res2.hasTimestampError, true);
      assert.ok(res2.issues.some((i) => i.code === "NON_MONOTONIC_TIMESTAMPS"));
    });

    test("detects non-standard non_diegetic_music: none", () => {
      const text = "integrated_multimodal_description: [Shot 1] A quiet hallway.\n\noverall_soundscape:\nHum.\n\nnon_diegetic_music: none";
      const res = auditPrompt(text, { duration: "10s" });
      assert.equal(res.hasConstraintViolation, true);
      assert.ok(res.issues.some((i) => i.code === "INVALID_MUSIC_SUPPRESSION"));
    });

    test("detects sequential multi-subject turn-taking risk and passes when concurrency words exist", () => {
      const sequential = [
        "subject_definitions:",
        "<Subject 1> is a detective.",
        "<Subject 2> is an informant.",
        "",
        "detailed_description:",
        "[Shot 1] <Subject 1> walks up to the table and sets down a folder. <Subject 2> opens the folder and reads the first page.",
        "",
        "overall_soundscape:",
        "Rain outside.",
        "",
        "non_diegetic_music:",
        "N/A",
      ].join("\n");

      const riskRes = auditPrompt(sequential, { duration: "10s", mode: "Ref2VA" });
      assert.ok(riskRes.issues.some((i) => i.code === "SEQUENTIAL_ENSEMBLE_RISK"));

      const parallel = [
        "subject_definitions:",
        "<Subject 1> is a detective.",
        "<Subject 2> is an informant.",
        "",
        "detailed_description:",
        "[Shot 1] As <Subject 1> slides a folder across the table, <Subject 2> simultaneously leans in and reaches for the edge.",
        "",
        "overall_soundscape:",
        "Rain outside.",
        "",
        "non_diegetic_music:",
        "N/A",
      ].join("\n");

      const cleanRes = auditPrompt(parallel, { duration: "10s", mode: "Ref2VA" });
      assert.ok(!cleanRes.issues.some((i) => i.code === "SEQUENTIAL_ENSEMBLE_RISK"));
    });

    test("does not falsely flag single-subject prompts with SEQUENTIAL_ENSEMBLE_RISK", () => {
      const solo = [
        "integrated_multimodal_description: [Shot 1] <Subject 1> opens the door. <Subject 1> steps into the rain.",
        "",
        "overall_soundscape:",
        "Rain.",
        "",
        "non_diegetic_music:",
        "N/A",
      ].join("\n");
      const res = auditPrompt(solo, { duration: "10s" });
      assert.ok(!res.issues.some((i) => i.code === "SEQUENTIAL_ENSEMBLE_RISK"));
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

    test("closes unclosed <d> inside its shot/line before overall_soundscape and non_diegetic_music", () => {
      const dirty = [
        "integrated_multimodal_description: [Shot 1] (S1) says: <d>[English] Wait for me [Shot 2] At 00:05.000, the shot cuts.",
        "",
        "overall_soundscape:",
        "Footsteps on wet stone.",
        "",
        "non_diegetic_music:",
        "N/A",
      ].join("\n");
      const repaired = repairPrompt(dirty, 10);
      const idxCloseD = repaired.indexOf("</d>");
      const idxShot2 = repaired.indexOf("[Shot 2]");
      const idxSoundscape = repaired.indexOf("overall_soundscape:");
      assert.ok(idxCloseD !== -1);
      assert.ok(idxCloseD < idxShot2);
      assert.ok(idxCloseD < idxSoundscape);
    });

    test("keeps multiple out-of-range shot timestamps strictly increasing after clamping", () => {
      const dirty = "[Shot 1] Opening. [Shot 2] At 00:12.000, cut one. [Shot 3] At 00:15.000, cut two.";
      const repaired = repairPrompt(dirty, 10);
      assert.ok(repaired.includes("00:09.000"));
      assert.ok(repaired.includes("00:09.500"));
      const reAudit = auditPrompt(repaired, { duration: "10s" });
      assert.equal(reAudit.hasTimestampError, false);
    });

    test("repairs non_diegetic_music: none to N/A", () => {
      const dirty = "integrated_multimodal_description: [Shot 1] Quiet room.\n\noverall_soundscape:\nHum.\n\nnon_diegetic_music: none";
      const repaired = repairPrompt(dirty, 10);
      assert.ok(repaired.includes("non_diegetic_music: N/A"));
      assert.ok(!repaired.includes("none"));
    });

    test("preserves valid multi-line <d>...</d> while closing a subsequent unclosed <d> without over-closing", () => {
      const dirty = [
        "integrated_multimodal_description: [Shot 1] (S1) says: <d>[English] Keep moving",
        "before the patrol turns.</d>",
        "[Shot 2] At 00:04.500, (S2) replies: <d>[English] Already on it",
        "",
        "overall_soundscape:",
        "Rain.",
        "",
        "non_diegetic_music:",
        "N/A",
      ].join("\n");
      const repaired = repairPrompt(dirty, 10);
      const reAudit = auditPrompt(repaired, { duration: "10s" });
      assert.equal((repaired.match(/<d>/gi) || []).length, 2);
      assert.equal((repaired.match(/<\/d>/gi) || []).length, 2);
      assert.equal(reAudit.isValid, true);
    });
  });
});
