import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { insertQuickModifier } from "../../src/utils/promptModifiers";

describe("Prompt Quick Modifiers (insertQuickModifier)", () => {
  test("inserts camera/action modifier before overall_soundscape in Official 3-field prompt", () => {
    const base = [
      "integrated_multimodal_description: [Shot 1] Two detectives stand on opposite sides of a desk.",
      "",
      "overall_soundscape:",
      "Rain pattering against glass.",
      "",
      "non_diegetic_music:",
      "Low cello drone.",
    ].join("\n");

    const updated = insertQuickModifier(
      base,
      "The camera pushes in with small amplitude at slow speed toward the subject."
    );

    const idxModifier = updated.indexOf("The camera pushes in");
    const idxSoundscape = updated.indexOf("overall_soundscape:");
    const idxMusic = updated.indexOf("non_diegetic_music:");

    assert.ok(idxModifier !== -1);
    assert.ok(idxModifier < idxSoundscape);
    assert.ok(idxSoundscape < idxMusic);
    assert.ok(updated.endsWith("Low cello drone."));
  });

  test("inserts modifier before overall_soundscape in Official 6-field Ref2VA prompt", () => {
    const base = [
      "subject_definitions:",
      "<Subject 1> is a woman in a trench coat.",
      "",
      "summary:",
      "[reference generation] Two agents meet at a cafe.",
      "",
      "retention_analysis:",
      "<Subject 1> (appears in [Shot 1]): fully_preserved - trench coat.",
      "",
      "detailed_description:",
      "Gritty realism.",
      "[Shot 1] <Subject 1> slides a folder forward.",
      "",
      "overall_soundscape:",
      "Quiet cafe chatter.",
      "",
      "non_diegetic_music:",
      "N/A",
    ].join("\n");

    const updated = insertQuickModifier(
      base,
      "Simultaneously, the other character tracks the movement with their eyes."
    );

    const idxModifier = updated.indexOf("Simultaneously, the other character");
    const idxDetailed = updated.indexOf("[Shot 1] <Subject 1> slides a folder forward.");
    const idxSoundscape = updated.indexOf("overall_soundscape:");

    assert.ok(idxModifier > idxDetailed);
    assert.ok(idxModifier < idxSoundscape);
  });

  test("inserts modifier before overall_soundscape in Compact mode prompt", () => {
    const base = [
      "[Shot 1] A samurai draws his blade in heavy rain.",
      "",
      "overall_soundscape:",
      "Heavy downpour.",
      "",
      "non_diegetic_music:",
      "N/A",
    ].join("\n");

    const updated = insertQuickModifier(base, "The camera moves in an arc shot around the subject.");
    assert.ok(
      updated.includes(
        "[Shot 1] A samurai draws his blade in heavy rain. The camera moves in an arc shot around the subject.\n\noverall_soundscape:"
      )
    );
  });

  test("replaces existing non_diegetic_music section instead of duplicating when applying music N/A", () => {
    const base = [
      "integrated_multimodal_description: [Shot 1] A quiet street at dawn.",
      "",
      "overall_soundscape:",
      "Distant birds chirping.",
      "",
      "non_diegetic_music:",
      "A gentle acoustic guitar melody plays softly.",
    ].join("\n");

    const updated = insertQuickModifier(base, "non_diegetic_music: N/A");
    const matches = updated.match(/non_diegetic_music:/gi) || [];
    assert.equal(matches.length, 1);
    assert.ok(updated.includes("non_diegetic_music: N/A"));
    assert.ok(!updated.includes("acoustic guitar"));
  });

  test("handles free-form draft and empty prompt edge cases cleanly", () => {
    assert.equal(insertQuickModifier("", "The camera pushes in."), "The camera pushes in.");
    assert.equal(insertQuickModifier("   ", "non_diegetic_music: N/A"), "non_diegetic_music: N/A");

    const freeForm = "A courier bikes through neon alleys.";
    const updatedFree = insertQuickModifier(freeForm, "The camera tracks alongside.");
    assert.equal(updatedFree, "A courier bikes through neon alleys.\nThe camera tracks alongside.");

    const unchanged = insertQuickModifier(freeForm, "   ");
    assert.equal(unchanged, freeForm);
  });
});
