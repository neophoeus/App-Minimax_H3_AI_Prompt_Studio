import { auditPrompt, repairPrompt } from "../../src/utils/promptAudit";

/**
 * Strips reasoning tokens (<think>...</think>) and markdown code fences from AI output
 */
export function cleanModelOutput(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return "";
  let text = rawText;
  // Remove <think>...</think> reasoning blocks from thinking models (e.g. Qwen / DeepSeek)
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  // Remove markdown json fences if any
  text = text.trim();
  if (text.startsWith("```json")) {
    text = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  } else if (text.startsWith("```")) {
    text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return text.trim();
}

/**
 * Robust JSON parser with fallback regex extraction
 */
export function parseJsonSafely(raw: string): any {
  const cleaned = cleanModelOutput(raw);
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (innerErr) {
        // fall through
      }
    }
    throw new Error(`無法解析模型輸出的 JSON 結構: ${cleaned.slice(0, 150)}`);
  }
}

/**
 * Strips raw filenames, file extensions, and internal video leakage tokens from AI-generated prompts
 * and normalizes timestamp formats.
 */
export function sanitizeGeneratedPromptText(text: string, durationSeconds: number = 10): string {
  if (!text || typeof text !== 'string') return text;
  return repairPrompt(text, durationSeconds);
}

/**
 * Post-processes generated prompt output with sanitization and promptAudit
 */
export function formatGeneratedPromptResult(resultJson: any, config: any): any {
  const durationSec = parseFloat(config.duration || '10') || 10;
  const isSeriesMode = Boolean(config.isSeriesMode);

  if (resultJson.fullPrompt) {
    resultJson.fullPrompt = sanitizeGeneratedPromptText(resultJson.fullPrompt, durationSec);
    resultJson.auditResult = auditPrompt(resultJson.fullPrompt, {
      duration: config.duration,
      cameraMoves: config.cameraMoves,
      mode: config.mode,
    });
  }

  if (Array.isArray(resultJson.episodes)) {
    resultJson.episodes = resultJson.episodes.map((ep: any, idx: number) => ({
      ...ep,
      episodeIndex: ep.episodeIndex || idx + 1,
      fullPrompt: sanitizeGeneratedPromptText(ep.fullPrompt || '', durationSec),
      startingState: sanitizeGeneratedPromptText(ep.startingState || '', durationSec),
      actionSequence: sanitizeGeneratedPromptText(ep.actionSequence || '', durationSec),
      endState: sanitizeGeneratedPromptText(ep.endState || '', durationSec),
    }));
    if (isSeriesMode && resultJson.episodes.length > 0 && !resultJson.fullPrompt) {
      resultJson.fullPrompt = resultJson.episodes[0].fullPrompt;
    }
    resultJson.isSeries = isSeriesMode;
  }
  resultJson.outputContract = config.outputContract || 'official';

  return resultJson;
}
