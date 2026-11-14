import { AuditIssue, AuditResult } from '../types';

const VALID_TIMESTAMP_REGEX = /^(\d{2}):(\d{2})\.(\d{3})$/;
const TIMESTAMP_CANDIDATE_REGEX = /(?<!\d)(?:(?:\d{1,2}:)?\d{1,2}:\d{2,3}(?:\.\d{1,3})?)(?!\d)/g;

const INTERNAL_VIDEO_LEAKAGE_REGEX =
  /\b(?:contact\s+sheet|sheet\s+cells?|sampled?\s+frames?|sample\s+frames?|\d+(?:\.\d+)?s\s+mark|internal\s+video\s+representation)\b/gi;

const CAMERA_MOVEMENT_REGEX =
  /\b(?:cut(?:s)?\s+to|zoom(?:s|ed|ing)?(?:-in|-out|\s+in|\s+out)?|pan(?:s|ned|ning)?(?:\s+(?:up|down|left|right|across))?|doll(?:y|ies|ied|ying)|tracking\s+shot|camera\s+(?:moves?|pulls?|pushes?|pans?|zooms?|tracks?|dollies?|arcs?|tilts?|rolls?))\b/gi;

const FILENAME_LEAK_REGEX = /\b[\w-]+\.(?:png|jpe?g|webp|gif|mp4|mov|webm|mp3|wav|ogg)\b/gi;

const SHOT1_TIMESTAMP_REGEX = /\[Shot 1\]\s*(?:At\s+)?(?:\d{1,2}:)?\d{1,2}:\d{2,3}(?:\.\d{1,3})?/i;

const BRACKETED_CAMERA_REGEX =
  /\[\s*(?:Camera\s*:\s*)?(?:Zoom[- ](?:In|Out)|Push[- ](?:In|Out)|Pull[- ](?:In|Out)|Pan[- ](?:Left|Right|Across|Up|Down)|Truck[- ](?:Left|Right)|Tilt[- ](?:Up|Down)|Pedestal[- ](?:Up|Down)|Arc[- ]Shot|Tracking[- ]Shot|Static[- ]Shot|Dolly[- ](?:In|Out)|Shake[- ](?:Slightly|Strongly)|POV|Roll(?:\s+(?:Clockwise|Counterclockwise))?)\s*\]/gi;

const SHOT_TIMESTAMP_REGEX = /\[Shot\s+(\d+)\]\s*(?:At\s+)?((?:\d{1,2}:)?\d{1,2}:\d{2,3}(?:\.\d{1,3})?)/gi;

const INVALID_MUSIC_NONE_REGEX = /\bnon_diegetic_music:\s*none\b/i;

const CONCURRENCY_MARKER_REGEX =
  /\b(?:while|as|simultaneously|meanwhile|together|both|each\s+other|in\s+unison|at\s+the\s+same\s+(?:time|moment)|mid-(?:motion|stride|sentence|gesture)|already)\b/i;

function timestampToMs(normalizedTs: string): number | null {
  const match = normalizedTs.match(VALID_TIMESTAMP_REGEX);
  if (!match) return null;
  const mins = parseInt(match[1], 10);
  const secs = parseInt(match[2], 10);
  const millis = parseInt(match[3], 10);
  return (mins * 60 + secs) * 1000 + millis;
}

function msToTimestamp(totalMs: number): string {
  const clamped = Math.max(0, Math.round(totalMs));
  const totalSeconds = Math.floor(clamped / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const millis = clamped % 1000;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

function extractShotNarrative(prompt: string): string {
  let text = prompt;
  const footerMatch = /(?:^|\r?\n)\s*(?:overall_soundscape|non_diegetic_music):/i.exec(text);
  if (footerMatch && typeof footerMatch.index === 'number') {
    text = text.slice(0, footerMatch.index);
  }
  const integratedMatch = /integrated_multimodal_description:/i.exec(text);
  if (integratedMatch && typeof integratedMatch.index === 'number') {
    return text.slice(integratedMatch.index + integratedMatch[0].length);
  }
  const detailedMatch = /detailed_description:/i.exec(text);
  if (detailedMatch && typeof detailedMatch.index === 'number') {
    return text.slice(detailedMatch.index + detailedMatch[0].length);
  }
  return text;
}

function closeUnbalancedTagSafely(text: string, tagName: 'd' | 'l'): string {
  const pairOrUnclosed = new RegExp(
    `<${tagName}>(?:(?!<\\/?${tagName}>)[\\s\\S])*?<\\/${tagName}>|<${tagName}>([^\\r\\n]*?)(?=[ \\t]*(?:<\\/?[dl]>|\\[Shot\\s+\\d+\\]|\\b(?:overall_soundscape|non_diegetic_music):|\\r?\\n|$))`,
    'gi'
  );
  return text.replace(pairOrUnclosed, (fullMatch, unclosedBody) =>
    unclosedBody !== undefined ? `<${tagName}>${unclosedBody}</${tagName}>` : fullMatch
  );
}

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

  // 4. Shot 1 Timestamp Constraint Check (Shot 1 must be baseline and have NO timestamp)
  if (SHOT1_TIMESTAMP_REGEX.test(prompt)) {
    hasTimestampError = true;
    issues.push({
      level: 'error',
      code: 'SHOT1_HAS_TIMESTAMP',
      messageZh: 'Shot 1 包含時間戳，違反 MiniMax-H3 規範（Shot 1 必須為基準鏡頭且無時間標籤）',
      suggestionZh: '移除 Shot 1 的時間戳，例如將 "[Shot 1] At 00:00.000, " 改為 "[Shot 1] "。',
    });
  }

  // 5. Bracketed Camera Movement Tags Check (e.g. [Push In], [Pan Left])
  const bracketedCameraMatches = prompt.match(BRACKETED_CAMERA_REGEX);
  if (bracketedCameraMatches && bracketedCameraMatches.length > 0) {
    hasConstraintViolation = true;
    const uniqueTags = Array.from(new Set(bracketedCameraMatches));
    issues.push({
      level: 'warning',
      code: 'BRACKETED_CAMERA_TAG',
      messageZh: `偵測到中括號形式的運鏡標籤：${uniqueTags.join(', ')}`,
      suggestionZh: 'MiniMax-H3 不支援中括號運鏡標籤，應寫成自然英文動作（如 "The camera pushes in slowly toward..."）。',
    });
  }

  // 6. Constraint Check: Static Shot vs Moving Camera
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

  // 7. Dialogue Tag Balance
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

  // 8. Lyrics Tag Balance (<l> vs </l>)
  const openLTags = (prompt.match(/<l>/gi) || []).length;
  const closeLTags = (prompt.match(/<\/l>/gi) || []).length;
  if (openLTags !== closeLTags) {
    issues.push({
      level: 'error',
      code: 'UNBALANCED_LYRICS_TAGS',
      messageZh: `歌詞標籤未對稱閉合（<l> 共 ${openLTags} 個，</l> 共 ${closeLTags} 個）`,
      suggestionZh: 'MiniMax-H3 的歌詞必須完整置於 <l>[Language] ...</l> 標籤中。',
    });
  }

  // 9. Monotonic Shot Cut Timestamps Check
  const shotMatches = Array.from(prompt.matchAll(SHOT_TIMESTAMP_REGEX));
  let prevShotMs: number | null = null;
  let hasNonMonotonic = false;
  for (const sm of shotMatches) {
    const shotNum = parseInt(sm[1], 10);
    if (shotNum <= 1) continue;
    const ms = timestampToMs(normalizeTimestamp(sm[2]));
    if (ms === null) continue;
    if (prevShotMs !== null && ms <= prevShotMs) {
      hasNonMonotonic = true;
      break;
    }
    prevShotMs = ms;
  }
  if (hasNonMonotonic) {
    hasTimestampError = true;
    issues.push({
      level: 'warning',
      code: 'NON_MONOTONIC_TIMESTAMPS',
      messageZh: '偵測到分鏡時間戳未按時間順序遞增或發生重複',
      suggestionZh: '多個 [Shot N] 的切換時間點必須嚴格遞增（例如 [Shot 2] 00:03.500 -> [Shot 3] 00:07.000），可點擊「一鍵修復」自動校正。',
    });
  }

  // 10. Invalid Music Suppression ("none" instead of "N/A")
  if (INVALID_MUSIC_NONE_REGEX.test(prompt)) {
    hasConstraintViolation = true;
    issues.push({
      level: 'warning',
      code: 'INVALID_MUSIC_SUPPRESSION',
      messageZh: 'non_diegetic_music 使用了非標準的 "none"，官方規範應使用 "N/A"',
      suggestionZh: '點擊「一鍵修復」將自動將 "non_diegetic_music: none" 修正為官方標準 "non_diegetic_music: N/A"。',
    });
  }

  // 11. Multi-Subject Sequential Turn-Taking Risk Detection
  const shotNarrative = extractShotNarrative(prompt);
  const distinctSubjects = new Set(
    (shotNarrative.match(/<Subject\s+\d+>/gi) || []).map((s) => s.toLowerCase().replace(/\s+/g, ' '))
  );
  const distinctSpeakers = new Set<string>();
  for (const spkGroup of shotNarrative.match(/\(S\d+(?:,S\d+)*\)/g) || []) {
    for (const spk of spkGroup.match(/S\d+/g) || []) {
      distinctSpeakers.add(spk);
    }
  }

  if (distinctSubjects.size >= 2 || distinctSpeakers.size >= 2) {
    const narrativeWithoutTimestamps = shotNarrative.replace(TIMESTAMP_CANDIDATE_REGEX, ' ');
    const sentences = narrativeWithoutTimestamps
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => /[a-zA-Z]/.test(s));

    if (sentences.length >= 2 && !CONCURRENCY_MARKER_REGEX.test(shotNarrative)) {
      issues.push({
        level: 'warning',
        code: 'SEQUENTIAL_ENSEMBLE_RISK',
        messageZh: '偵測到雙人/多主體場景缺乏並行時間連接詞（如 while / simultaneously），可能導致角色輪流排隊動作、另一人呆若木雞',
        suggestionZh: '建議點擊「🪄 AI 規格優化」或加入 "+ 雙人同步反應" 修飾詞，讓角色在對手動作期間保持視線追蹤與同步微動態。',
      });
    }
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

  // 3. Strip timestamp from [Shot 1] first so it does not skew monotonic timestamp repair
  text = text.replace(/\[Shot 1\]\s*(?:At\s+)?(?:\d{1,2}:)?\d{1,2}:\d{2,3}(?:\.\d{1,3})?,?\s*/gi, '[Shot 1] ');

  // 4. Normalize, clamp, and enforce strictly increasing timestamps
  const durationMs = Math.max(1000, Math.round(durationSeconds * 1000));
  const maxAllowedMs = Math.max(500, durationMs - 500);
  const rawTimestampMatches = Array.from(text.matchAll(TIMESTAMP_CANDIDATE_REGEX));

  if (rawTimestampMatches.length > 0) {
    const parsedEntries = rawTimestampMatches.map((m) => {
      const raw = m[0];
      const norm = normalizeTimestamp(raw);
      const ms = timestampToMs(norm);
      return { raw, norm, ms };
    });

    const validMsList = parsedEntries.map((e) => (e.ms !== null ? e.ms : 0));
    const adjustedMsList = validMsList.map((ms) => (ms > durationMs ? maxAllowedMs : ms));

    if (adjustedMsList.length >= 2) {
      const stepMs = Math.min(500, Math.max(100, Math.floor(maxAllowedMs / (adjustedMsList.length + 1))));
      for (let i = adjustedMsList.length - 2; i >= 0; i--) {
        if (adjustedMsList[i] >= adjustedMsList[i + 1]) {
          adjustedMsList[i] = Math.max(100, adjustedMsList[i + 1] - stepMs);
        }
      }
      for (let i = 1; i < adjustedMsList.length; i++) {
        if (adjustedMsList[i] <= adjustedMsList[i - 1]) {
          adjustedMsList[i] = Math.min(durationMs - 50, adjustedMsList[i - 1] + stepMs);
        }
      }
    }

    let tsCursor = 0;
    text = text.replace(TIMESTAMP_CANDIDATE_REGEX, (rawTs) => {
      const entry = parsedEntries[tsCursor];
      const adjustedMs = adjustedMsList[tsCursor];
      tsCursor += 1;
      if (!entry || entry.ms === null) return rawTs;
      return msToTimestamp(adjustedMs);
    });
  }

  // 5. Strip bracketed camera tags like [Push In]
  text = text.replace(BRACKETED_CAMERA_REGEX, '');

  // 6. Normalize non_diegetic_music: none -> non_diegetic_music: N/A
  text = text.replace(/(\bnon_diegetic_music:\s*)none\b/gi, '$1N/A');

  // 7. Clean formatting punctuation leftovers
  text = text
    .replace(/\bis\s*,\s*/gi, 'is ')
    .replace(/,\s*,/g, ',')
    .replace(/\(\s*\)/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // 8. Safely balance unclosed speech and lyrics tags within their own line/shot segment
  text = closeUnbalancedTagSafely(text, 'd');
  text = closeUnbalancedTagSafely(text, 'l');

  return text;
}
