import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  buildModularSystemInstruction,
  getAssistantDirectorDirective,
  buildH3UserPrompt,
  buildDialoguePrompt,
  buildOptimizePrompt,
  buildRefineSeriesPrompt,
} from "../../server/core/prompts";

describe("Prompt Engineering Specifications (MiniMax-H3)", () => {
  describe("buildModularSystemInstruction", () => {
    test("T2VA instruction has no header line and contains core 3 fields", () => {
      const instruction = buildModularSystemInstruction("T2VA", "official");
      assert.ok(instruction.includes("Structure & Core Fields for T2VA"));
      assert.ok(instruction.includes("integrated_multimodal_description: [Shot 1]"));
      assert.ok(instruction.includes("overall_soundscape:"));
      assert.ok(instruction.includes("non_diegetic_music:"));
      assert.ok(!instruction.includes("For the target video, at 0.00 seconds"));
    });

    test("I2VA instruction enforces exact opening keyframe header", () => {
      const instruction = buildModularSystemInstruction("I2VA", "official");
      assert.ok(instruction.includes("For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced."));
    });

    test("FL2VA instruction enforces first and last frame alignment header", () => {
      const instruction = buildModularSystemInstruction("FL2VA", "official");
      assert.ok(instruction.includes("How the reference pictures align with the target video — Picture 1 (from Shot 1) aligns with the 0.00-second mark of the target video; Picture 2 (from Shot N) aligns with the S.SS-second mark"));
    });

    test("L2VA instruction enforces last frame alignment header", () => {
      const instruction = buildModularSystemInstruction("L2VA", "official");
      assert.ok(instruction.includes("How the reference pictures align with the target video — <Picture 1> (from [Shot N]) aligns with the S.SS-second mark"));
    });

    test("Ref2VA instruction enforces all 6 official sections in exact order", () => {
      const instruction = buildModularSystemInstruction("Ref2VA", "official");
      const idxSubject = instruction.indexOf("subject_definitions:");
      const idxSummary = instruction.indexOf("summary:");
      const idxRetention = instruction.indexOf("retention_analysis:");
      const idxDetailed = instruction.indexOf("detailed_description:");
      const idxSoundscape = instruction.indexOf("overall_soundscape:");
      const idxMusic = instruction.indexOf("non_diegetic_music:");

      assert.ok(idxSubject !== -1 && idxSummary !== -1 && idxRetention !== -1);
      assert.ok(idxDetailed !== -1 && idxSoundscape !== -1 && idxMusic !== -1);
      assert.ok(idxSubject < idxSummary);
      assert.ok(idxSummary < idxRetention);
      assert.ok(idxRetention < idxDetailed);
      assert.ok(idxDetailed < idxSoundscape);
      assert.ok(idxSoundscape < idxMusic);
    });

    test("Compact mode outputs concise 2-part natural layout", () => {
      const instruction = buildModularSystemInstruction("T2VA", "compact");
      assert.ok(instruction.includes("Structure & Core Fields for Compact Mode"));
      assert.ok(instruction.includes("do NOT output subject_definitions, summary, or retention_analysis"));
    });
  });

  describe("getAssistantDirectorDirective", () => {
    test("Enabled mode includes secondary micro-motions and spatial depth", () => {
      const enabled = getAssistantDirectorDirective(true);
      assert.ok(enabled.includes("ASSISTANT DIRECTOR DIRECTIVE (ENABLED / 輔助導演開啟)"));
      assert.ok(enabled.includes("Secondary Micro-Motions"));
      assert.ok(enabled.includes("Multi-Plane Spatial Depth"));
    });

    test("Disabled mode restricts extrapolation", () => {
      const disabled = getAssistantDirectorDirective(false);
      assert.ok(disabled.includes("ASSISTANT DIRECTOR DIRECTIVE (DISABLED / 保守忠實模式)"));
      assert.ok(disabled.includes("STRICT & FAITHFUL"));
    });
  });

  describe("buildH3UserPrompt", () => {
    test("correctly parses single shot T2VA configuration", () => {
      const res = buildH3UserPrompt({
        idea: "A lone samurai in rain",
        mode: "T2VA",
        duration: "10s",
        aspectRatio: "16:9",
        cameraMoves: ["Push In", "Tilt Up"],
        suppressMusic: true,
      });

      assert.ok(res.userPrompt.includes("A lone samurai in rain"));
      assert.ok(res.userPrompt.includes("Push In, Tilt Up"));
      assert.ok(res.userPrompt.includes("non_diegetic_music: N/A"));
      assert.equal(res.isSeriesMode, false);
      assert.equal(res.durationSec, 10);
    });

    test("correctly formats consecutive series multi-episode protocol", () => {
      const res = buildH3UserPrompt({
        idea: "Cyberpunk infiltration",
        mode: "T2VA",
        isSeriesMode: true,
        seriesCount: 4,
      });

      assert.equal(res.isSeriesMode, true);
      assert.ok(res.userPrompt.includes("CRITICAL MULTI-EPISODE SERIES GENERATION PROTOCOL (4 CONSECUTIVE EPISODES)"));
      assert.ok(res.userPrompt.includes("EACH EPISODE MUST BE A 100% SELF-CONTAINED, VALID, AND INDEPENDENTLY COPY-READY"));
    });

    test("correctly handles reference image multimodal parts and slot tags", () => {
      const res = buildH3UserPrompt({
        idea: "Product showcase",
        mode: "Ref2VA",
        references: [
          {
            id: "ref-1",
            tag: "<Picture 1>",
            role: "first_keyframe",
            name: "opening_frame.png",
            description: "Futuristic watch on marble desk",
            fileType: "image",
            fileUrl: "data:image/jpeg;base64,samplebase64data",
            physicalTag: "<Picture 1>",
            pictureIndex: 1,
          },
        ],
      });

      assert.equal(res.ollamaImages.length, 1);
      assert.equal(res.ollamaImages[0], "samplebase64data");
      assert.ok(res.multimodalParts.length > 0);
      assert.ok(res.userPrompt.includes("<Picture 1>"));
      assert.ok(!res.userPrompt.includes("opening_frame.png")); // filename must be sanitized out
    });

    test("Ref2VA with general subject reference image does NOT declare Picture as first keyframe", () => {
      const res = buildH3UserPrompt({
        idea: "Hero standing in futuristic city",
        mode: "Ref2VA",
        references: [
          {
            id: "ref-subj-1",
            tag: "<Subject 1>",
            role: "character",
            name: "Cyberpunk Hero",
            description: "Woman in black leather outfit",
            fileType: "image",
            fileUrl: "data:image/jpeg;base64,herobase64data",
            physicalTag: "<Picture 1>",
            pictureIndex: 1,
          },
        ],
      });

      assert.ok(res.userPrompt.includes("<Subject 1>"));
      assert.ok(res.userPrompt.includes("<Picture 1>"));
      // Must NOT treat <Picture 1> as an opening keyframe
      assert.ok(!res.userPrompt.includes("Define the keyframe image as <Picture 1>"));
      assert.ok(!res.userPrompt.includes("The opening frame matches <Picture 1>"));
      assert.ok(res.userPrompt.includes("[reference generation]"));
      assert.ok(res.userPrompt.includes("is purely a general visual reference for the subject and is NOT an opening keyframe"));
      assert.ok(res.userPrompt.includes("Do NOT generate any standalone \"<Picture N> is ...\" definition lines"));
      // Multimodal prompt directive check
      const multiPartString = res.multimodalParts.join("\n");
      assert.ok(multiPartString.includes("general visual reference"));
      assert.ok(multiPartString.includes("NOT an opening keyframe"));
    });

    test("Ref2VA with explicit first_keyframe instructs keyframe completion", () => {
      const res = buildH3UserPrompt({
        idea: "Hero standing in futuristic city",
        mode: "Ref2VA",
        references: [
          {
            id: "ref-subj-1",
            tag: "<Subject 1>",
            role: "character",
            name: "Cyberpunk Hero",
            description: "Woman in black leather outfit",
            fileType: "image",
            fileUrl: "data:image/jpeg;base64,herobase64data",
            physicalTag: "<Picture 1>",
            pictureIndex: 1,
          },
          {
            id: "ref-kf-1",
            tag: "<Picture 2>",
            role: "first_keyframe",
            name: "Opening Scene Frame",
            description: "Wide shot of neon skyscraper courtyard",
            fileType: "image",
            fileUrl: "data:image/jpeg;base64,scenebase64data",
            physicalTag: "<Picture 2>",
            pictureIndex: 2,
          },
        ],
      });

      assert.ok(res.userPrompt.includes("Define the keyframe image as <Picture 2>"));
      assert.ok(res.userPrompt.includes("[keyframe completion + reference generation]"));
      assert.ok(res.userPrompt.includes("The opening frame matches <Picture 2>"));
    });
  });

  describe("buildDialoguePrompt & buildOptimizePrompt & buildRefineSeriesPrompt", () => {
    test("buildDialoguePrompt asks for natural dialogue and sfx in JSON format", () => {
      const p = buildDialoguePrompt({ idea: "Sci-fi confrontation", style: "Cyberpunk", duration: "5s" });
      assert.ok(p.includes("Sci-fi confrontation"));
      assert.ok(p.includes("dialogueEn"));
      assert.ok(p.includes("sfxSuggestion"));
    });

    test("buildOptimizePrompt preserves objective action rules", () => {
      const p = buildOptimizePrompt({
        rawPrompt: "A cool guy walking",
        duration: "10s",
        assistantDirectorDirective: "DIRECTOR DIRECTIVE",
      });
      assert.ok(p.includes("A cool guy walking"));
      assert.ok(p.includes("CRITICAL OBJECTIVE PHYSICAL ACTION PRINCIPLE"));
    });

    test("buildRefineSeriesPrompt anchors previous and next episode states", () => {
      const p = buildRefineSeriesPrompt({
        seriesTitle: "Epic Adventure",
        storyArcSummary: "Journey to the mountain",
        targetEpisodeIndex: 2,
        currentEpisode: {
          title: "Part 2",
          startingState: "Standing at gate",
          actionSequence: "Walks inside",
          endState: "Sitting on throne",
          fullPrompt: "...",
        },
        previousEpisode: {
          episodeIndex: 1,
          title: "Part 1",
          endState: "Standing at gate",
        },
        nextEpisode: {
          episodeIndex: 3,
          startingState: "Sitting on throne",
        },
        refineInstruction: "Make the walk slower and add rain",
        durationToUse: "10s",
        assistantDirectorDirective: "DIRECTOR DIRECTIVE",
      });

      assert.ok(p.includes("CRITICAL PRECEDING EPISODE CONTINUITY (Episode #1)"));
      assert.ok(p.includes("FOLLOWING EPISODE CONTINUITY CONTEXT (Episode #3)"));
      assert.ok(p.includes("Make the walk slower and add rain"));
    });
  });
});
