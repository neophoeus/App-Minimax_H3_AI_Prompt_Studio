import { AuditIssue, AuditResult } from '../types';

const VALID_TIMESTAMP_REGEX = /^(\d{2}):(\d{2})\.(\d{3})$/;
const TIMESTAMP_CANDIDATE_REGEX = /(?<!\d)(?:(?:\d{1,2}:)?\d{1,2}:\d{2,3}(?:\.\d{1,3})?)(?!\d)/g;

const INTERNAL_VIDEO_LEAKAGE_REGEX =
  /\b(?:contact\s+sheet|sheet\s+cells?|sampled?\s+frames?|sample\s+frames?|\d+(?:\.\d+)?s\s+mark|internal\s+video\s+representation)\b/gi;

const CAMERA_MOVEMENT_REGEX =
  /\b(?:cut(?:s)?\s+to|zoom(?:s|ed|ing)?(?:-in|-out|\s+in|\s+out)?|pan(?:s|ned|ning)?(?:\s+(?:up|down|left|right|across))?|doll(?:y|ies|ied|ying)|tracking\s+shot|camera\s+(?:moves?|pulls?|pushes?|pans?|zooms?|tracks?|dollies?|arcs?|tilts?|rolls?))\b/gi;

const FILENAME_LEAK_REGEX = /\b[\w-]+\.(?:png|jpe?g|webp|gif|mp4|mov|webm|mp3|wav|ogg)\b/gi;

/**
 * Parses duration string like '10s' to seconds number (10)
 */
export function parseDurationToSeconds(durationStr?: string): number {
  if (!durationStr) return 10;
  const match = durationStr.match(/^(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 10;
}

/**
 * Normalizes single timestamp string to standard MM:SS.mmm format
 */
export function normalizeTimestamp(raw: string): string {
  const clean = raw.trim();
  if (VALID_TIMESTAMP_REGEX.test(clean)) return clean;

  const parts = clean.split(':');
  let mins = 0;
  let secs = 0;
  let millis = 0;

  if (parts.length === 2) {
    mins = parseInt(parts[0], 10) || 0;
    const secPart = parts[1];
    if (secPart.includes('.')) {
      const [s, ms] = secPart.split('.');
      secs = parseInt(s, 10) || 0;
      millis = parseInt(ms.padEnd(3, '0').slice(0, 3), 10) || 0;
    } else if (secPart.length >= 4) {
      // e.g. 05000 -> 05.000
      secs = parseInt(secPart.slice(0, 2), 10) || 0;
      millis = parseInt(secPart.slice(2, 5), 10) || 0;
    } else {
      secs = parseInt(secPart, 10) || 0;
    }
  } else if (parts.length === 3) {
    mins = parseInt(parts[1], 10) || 0;
    const secPart = parts[2];
    if (secPart.includes('.')) {
      const [s, ms] = secPart.split('.');
      secs = parseInt(s, 10) || 0;
      millis = parseInt(ms.padEnd(3, '0').slice(0, 3), 10) || 0;
    } else {
      secs = parseInt(secPart, 10) || 0;
    }
  }

  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  const mmm = String(millis).padStart(3, '0');
  return `${mm}:${ss}.${mmm}`;
}

/**
 * Audits a MiniMax-H3 prompt text for standard syntax, limits, and leakage
 */
export function auditPrompt(
  prompt: string,
  options: {
    duration?: string;
    cameraMoves?: string[];
    mode?: string;
  } = {}
): AuditResult {
  const issues: AuditIssue[] = [];
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return {
      isValid: false,
      issues: [
        {
          level: 'error',
          code: 'EMPTY_PROMPT',
          messageZh: '提示詞為空，無法進行審計',
        },
      ],
      hasLeakage: false,
      hasTimestampError: false,
      hasConstraintViolation: false,
    };
  }

  const durationSec = parseDurationToSeconds(options.duration);
  let hasLeakage = false;
  let hasTimestampError = false;
  let hasConstraintViolation = false;

  // 1. Check for Internal Leakage (Contact Sheets, etc.)
  const leakageMatches = prompt.match(INTERNAL_VIDEO_LEAKAGE_REGEX);
  if (leakageMatches && leakageMatches.length > 0) {
    hasLeakage = true;
    const uniqueTerms = Array.from(new Set(leakageMatches.map((m) => m.toLowerCase())));
    issues.push({
      level: 'error',
      code: 'INTERNAL_TOKEN_LEAKAGE',
      messageZh: `偵測到內部抽幀特徵殘留詞：${uniqueTerms.join(', ')}`,
      suggestionZh: '這通常是視覺模型理解影片時遺留的標記，建議一鍵修復剝離。',
    });
  }

  // 2. Check for File Name / Extension Leaks
  const fileMatches = prompt.match(FILENAME_LEAK_REGEX);
  if (fileMatches && fileMatches.length > 0) {
    hasLeakage = true;
    const uniqueFiles = Array.from(new Set(fileMatches));
    issues.push({
      level: 'warning',
      code: 'FILENAME_LEAKAGE',
      messageZh: `提示詞包含具體檔案名稱或副檔名：${uniqueFiles.slice(0, 3).join(', ')}`,
      suggestionZh: 'MiniMax-H3 為純語意模型，應使用 <Picture 1> 或純外觀語意描述，而非實體檔名。',
    });
  }

  // 3. Check Timestamps
  const timestampCandidates = prompt.match(TIMESTAMP_CANDIDATE_REGEX) || [];
  const invalidOrOutOfRange: string[] = [];

  for (const rawTs of timestampCandidates) {
    const isStrictFormat = VALID_TIMESTAMP_REGEX.test(rawTs);
    const normalized = normalizeTimestamp(rawTs);
    const match = normalized.match(VALID_TIMESTAMP_REGEX);
    if (!match) {
      invalidOrOutOfRange.push(rawTs);
      continue;
    }
    const mins = parseInt(match[1], 10);
    const secs = parseInt(match[2], 10);
    const millis = parseInt(match[3], 10);
    const totalSecs = mins * 60 + secs + millis / 1000;

    if (totalSecs > durationSec + 0.05) {
      invalidOrOutOfRange.push(`${rawTs} (超出時長 ${durationSec}s)`);
    } else if (!isStrictFormat) {
      invalidOrOutOfRange.push(`${rawTs} (非標準 00:00.000)`);
    }
  }

  if (invalidOrOutOfRange.length > 0) {
    hasTimestampError = true;
    issues.push({
      level: 'warning',
      code: 'INVALID_TIMESTAMP',
      messageZh: `發現異常或超出影片長度之時間戳：${invalidOrOutOfRange.slice(0, 3).join(', ')}`,
      suggestionZh: `影片總長度設定為 ${durationSec}s，時間戳不可超出設定上限，且須保持 MM:SS.mmm 格式。`,
    });
  }

  // 4. Constraint Check: Static Shot vs Moving Camera
  const hasStaticRequest =
    (options.cameraMoves && options.cameraMoves.includes('Static Shot')) ||
    /\b(?:static|locked(?:-off)?|fixed)\s+camera\b|\bno\s+camera\s+movement\b/i.test(prompt);

  if (hasStaticRequest) {
    const movesFound = prompt.match(CAMERA_MOVEMENT_REGEX);
    if (movesFound && movesFound.length > 0) {
      const filteredMoves = movesFound.filter((m) => !/static/i.test(m));
      if (filteredMoves.length > 0) {
        hasConstraintViolation = true;
        issues.push({
          level: 'warning',
          code: 'CAMERA_CONSTRAINT_VIOLATION',
          messageZh: '設定為固定鏡頭 (Static Shot)，但提示詞中偵測到運動運鏡指令',
          suggestionZh: '建議移除如 zoom、pan、push in 等運動運鏡以確保鏡位絕對鎖定。',
        });
      }
    }
  }

  // 5. Dialogue Tag Balance
  const openDTags = (prompt.match(/<d>/gi) || []).length;
  const closeDTags = (prompt.match(/<\/d>/gi) || []).length;
  if (openDTags !== closeDTags) {
    issues.push({
      level: 'error',
      code: 'UNBALANCED_DIALOGUE_TAGS',
      messageZh: `對白標籤未對稱閉合（<d> 共 ${openDTags} 個，</d> 共 ${closeDTags} 個）`,
      suggestionZh: 'MiniMax-H3 的人物對白必須完整置於 <d>[Language] ...</d> 標籤中。',
    });
  }

  const isValid = issues.filter((i) => i.level === 'error').length === 0;

  return {
    isValid,
    issues,
    hasLeakage,
    hasTimestampError,
    hasConstraintViolation,
    repairedPrompt: issues.length > 0 ? repairPrompt(prompt, durationSec) : undefined,
  };
}

/**
 * Performs lossless, deterministic repair of timestamps, leakage, and file extension artifacts
 */
export function repairPrompt(prompt: string, durationSeconds: number = 10): string {
  if (!prompt || typeof prompt !== 'string') return prompt;

  let text = prompt;

  // 1. Remove internal video leakage tokens
  text = text.replace(INTERNAL_VIDEO_LEAKAGE_REGEX, '');

  // 2. Strip raw file names and extensions
  text = text
    .replace(/\b(?:is\s+)?[\w-]+\.(?:png|jpe?g|webp|gif|mp4|mov|webm|mp3|wav|ogg)\b/gi, (match) =>
      match.toLowerCase().startsWith('is ') ? 'is ' : ''
    )
    .replace(FILENAME_LEAK_REGEX, '');

  // 3. Normalize and clamp timestamps
  text = text.replace(TIMESTAMP_CANDIDATE_REGEX, (rawTs) => {
    try {
      const norm = normalizeTimestamp(rawTs);
      const m = norm.match(VALID_TIMESTAMP_REGEX);
      if (!m) return rawTs;
      const mins = parseInt(m[1], 10);
      const secs = parseInt(m[2], 10);
      const millis = parseInt(m[3], 10);
      const totalSecs = mins * 60 + secs + millis / 1000;

      // If out of range, clamp to (duration - 0.5s)
      if (totalSecs > durationSeconds) {
        const clampedTotal = Math.max(0, durationSeconds - 0.5);
        const cMins = Math.floor(clampedTotal / 60);
        const cSecs = Math.floor(clampedTotal % 60);
        const cMillis = Math.floor((clampedTotal % 1) * 1000);
        return `${String(cMins).padStart(2, '0')}:${String(cSecs).padStart(2, '0')}.${String(cMillis).padStart(3, '0')}`;
      }
      return norm;
    } catch {
      return rawTs;
    }
  });

  // 4. Clean formatting punctuation leftovers
  text = text
    .replace(/\bis\s*,\s*/gi, 'is ')
    .replace(/,\s*,/g, ',')
    .replace(/\(\s*\)/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}
