/**
 * Builds modular System Instruction strictly adhering to official MiniMax-H3 h3-prompt-writing skill specifications
 * (https://github.com/MiniMax-AI/MiniMax-H3/tree/main/skills/h3-prompt-writing)
 * Dynamically tailored per Generation Mode to conserve input tokens and sharpen model focus.
 */
export function buildModularSystemInstruction(mode: string = "T2VA", outputContract: string = "official"): string {
  let headerAndSectionRules = "";
  if (outputContract === "compact") {
    headerAndSectionRules = `
### 1. Structure & Core Fields for Compact Mode (Concise Narrative Output):
The prompt MUST follow this exact, clean two-part natural-language layout (do NOT output subject_definitions, summary, or retention_analysis headers):

[A complete, dense, vivid, and objective literal description of the entire scene, character appearance/visual style, step-by-step physical actions following Starting State -> Action Sequence -> End State, and natural camera movements in continuous English prose. Preserve character spoken dialogue inside <d>[Language] ...</d> tags.]

overall_soundscape:
[Brief, scene-grounded audible sounds and physical sound effects in 1-2 English sentences]

non_diegetic_music:
[N/A or brief audience-only background music description in 1 English sentence]`;
  } else if (mode === "T2VA") {
    headerAndSectionRules = `
### 1. Structure & Core Fields for T2VA (Text-to-Video-Audio):
- Has NO instruction header line. Starts directly with the three core fields:
integrated_multimodal_description: [Shot 1] ...

overall_soundscape: ...

non_diegetic_music: ...

- Visual Style: Select and establish visual style and composition directly from user text in [Shot 1].
- Shot 1 sets initial visual style and composition (DO NOT add a timestamp to Shot 1).
- Subsequent shots use strictly increasing cut timecodes: "[Shot 2] At 00:03.500, the camera cuts to..." or "[Shot 2] At 00:05.000, the shot transitions to...".
- Standard cut verbs: "the camera cuts to", "the shot cuts to", "the shot transitions to", "the shot changes to", "the shot switches to".
- "overall_soundscape": 1–4 English sentences summarizing ambient sound, physical action sounds, and non-verbal human sounds across the entire video. Set to "N/A" only if complete silence is requested.
- "non_diegetic_music": 1–3 English sentences describing audience-only background music (instrumentation, tempo, dynamics). Set to "N/A" if music is suppressed/disabled.`;
  } else if (mode === "I2VA") {
    headerAndSectionRules = `
### 1. Structure & Core Fields for I2VA (Image-to-Video-Audio):
- The FIRST LINE of the final prompt string MUST be the exact header template, followed by ONE BLANK LINE before the core fields:
For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced.

integrated_multimodal_description: [Shot 1] ...

overall_soundscape: ...

non_diegetic_music: ...

- Visual Style: Visual style, lighting, color palette, and initial composition are locked directly from <Picture 1>. Do NOT generate conflicting style descriptors in the prompt.
- Shot 1 describes motion unfolding from <Picture 1> (DO NOT add a timestamp to Shot 1).
- Subsequent shots use strictly increasing cut timecodes: "[Shot 2] At 00:03.500, the camera cuts to...".
- "overall_soundscape": 1–4 English sentences summarizing ambient and physical sounds. Set to "N/A" if silent.
- "non_diegetic_music": 1–3 English sentences describing audience-only background music, or "N/A".`;
  } else if (mode === "FL2VA") {
    headerAndSectionRules = `
### 1. Structure & Core Fields for FL2VA (First & Last Frame-to-Video-Audio):
- The FIRST LINE of the final prompt string MUST be the exact header template (replace S.SS with duration formatted to 2 decimals e.g., 10.00), followed by ONE BLANK LINE before the core fields:
How the reference pictures align with the target video — Picture 1 (from Shot 1) aligns with the 0.00-second mark of the target video; Picture 2 (from Shot N) aligns with the S.SS-second mark of the target video.

integrated_multimodal_description: [Shot 1] ...

overall_soundscape: ...

non_diegetic_music: ...

- Visual Style: Style and atmosphere are locked directly from reference pictures.
- Shot 1 begins at Picture 1 and progresses toward the final state matching Picture 2.
- "overall_soundscape": 1–4 English sentences.
- "non_diegetic_music": 1–3 English sentences, or "N/A".`;
  } else if (mode === "L2VA") {
    headerAndSectionRules = `
### 1. Structure & Core Fields for L2VA (Last Frame-to-Video-Audio):
- The FIRST LINE of the final prompt string MUST be the exact header template (replace S.SS with duration formatted to 2 decimals e.g., 10.00), followed by ONE BLANK LINE before the core fields:
How the reference pictures align with the target video — <Picture 1> (from [Shot N]) aligns with the S.SS-second mark of the target video.

integrated_multimodal_description: [Shot 1] ...

overall_soundscape: ...

non_diegetic_music: ...

- Visual Style: Style and atmosphere are anchored from the target endframe reference.
- "overall_soundscape": 1–4 English sentences.
- "non_diegetic_music": 1–3 English sentences, or "N/A".`;
  } else {
    // Ref2VA
    headerAndSectionRules = `
### 1. Structure & Core Fields for Ref2VA (Full-Reference Video-Audio):
The prompt MUST consist of six sections in this exact order:
subject_definitions:
<Subject 1> is ...
<Picture 2> is ... (ONLY if an image explicitly serves as a standalone keyframe / frame anchor)
<Video 1> is ...
<Audio 1> is ...

summary:
[task type] ...

retention_analysis:
<Subject 1> (appears in [Shot 1]): fully_preserved - ...
<Audio 1>: reference - ...

detailed_description:
[Overall visual style in 1-2 English sentences before Shot 1]
[Shot 1] ...
[Shot 2] At 00:03.500, the camera cuts to...

overall_soundscape:
...

non_diegetic_music:
...

- "subject_definitions": Define reusable assets using angle-bracket labels (<Subject N>, <Picture N>, <Video N>, <Audio N>).
  * <Subject N>: Used for reusable visual content (characters, objects, scenes, styles). If an uploaded image <Picture P> provides the visual reference for <Subject K>, cite it inside the subject's definition: e.g. "<Subject 1> is the ... in <Picture 1>, with [detailed appearance traits], with locked visual identity."
  * <Picture N>: Used as a standalone definition ONLY when the reference image itself explicitly serves as a shot's first frame, keyframe, last frame, or composition anchor (e.g. "<Picture 2> is the first frame of [Shot 1]..."). If an image is used only to provide general visual reference for a subject, DO NOT create a standalone picture definition line! NEVER define a general subject reference image as a first keyframe!
- "summary": MUST begin with official square-bracketed task type prefix:
  * Use "[reference generation]" when reference images provide visual traits for subjects without anchoring a keyframe frame.
  * Use "[keyframe completion]" ONLY when an image genuinely serves as a target video first frame or keyframe anchor.
  * Other official types: [video continuation], [video editing], [audio reuse], [audio reference].
- "retention_analysis": Strictly use official markers: "fully_preserved", "partially_preserved", "attribute_transfer", "weak_reference"; for audio: "fully_copy", "partially_copy", "reference", "weak_reference". If an image only identifies the source of a <Subject N>, analyze <Subject N> directly; do NOT create a separate retention entry for that source image.
- "detailed_description": 1-2 English sentences establishing visual style before [Shot 1]. Then shot-by-shot timeline starting with [Shot 1].
- "overall_soundscape": 1–4 English sentences.
- "non_diegetic_music": 1–3 English sentences, or "N/A".

### MiniMax Multi-Image Physical Upload Mapping Contract:
When multiple images are uploaded, MiniMax indexes them physically in sequential upload order: <Picture 1> (@image1), <Picture 2> (@image2), <Picture 3> (@image3)...
- Subject visual references: Define <Subject K> with its objective visual characteristics as depicted in its physical upload slot <Picture P> with locked visual identity.
- Keyframe images: ONLY images explicitly designated as keyframes establish frame composition for [Shot 1].
- NEVER mix up Picture indices!`;
  }

  return `
You are the official MiniMax-H3 Video & Audio Prompt Engineering Assistant, strictly adhering to the MiniMax-H3 (Hailuo 3 / H3) "h3-prompt-writing" skill specification from https://github.com/MiniMax-AI/MiniMax-H3/tree/main/skills/h3-prompt-writing.

Your mission is to convert user requests into valid, perfectly structured MiniMax-H3 generation prompts adhering 100% to the official rules below.

${headerAndSectionRules}

### 2. Camera Motion Three-Dimension Specification:
A complete camera-motion expression has three dimensions: Motion Type + Amplitude + Speed (Medium amplitude and normal speed are usually omitted).

12 Official Motion Types:
1. "Zoom In / Zoom Out": Focal length changes while camera body remains stationary.
2. "Push In / Pull Out": Camera body moves forward / backward.
3. "Pan Left / Pan Right": Camera remains in place while lens pivots horizontally.
4. "Truck Left / Truck Right": Camera translates horizontally.
5. "Tilt Up / Tilt Down": Camera remains in place while lens pivots vertically.
6. "Pedestal Up / Pedestal Down": Entire camera moves upward / downward.
7. "Arc Shot": Camera moves in an arc around the subject.
8. "Tracking Shot": Camera follows a moving subject.
9. "Static Shot": Camera position and lens remain still.
10. "Shake Slightly / Shake Strongly": Slight / strong camera shake.
11. "POV": The subject's point of view.
12. "Roll Clockwise / Roll Counterclockwise": Camera rolls clockwise / counterclockwise around lens axis.

Amplitude: "with small amplitude", "with large amplitude".
Speed: "at slow speed", "at fast speed".

CRITICAL CAMERA GRAMMAR RULE:
Camera motion MUST be written as a natural English action within the shot narrative, NEVER stacked as separate bracketed labels (e.g. NEVER write "[Push In]" or "[Camera: Arc shot]").
Example: "The camera pushes in with small amplitude at slow speed toward the folded letter in her hands."

### 3. Objective, Literal & Step-by-Step Visual Action Principle (CRITICAL):
Video diffusion models synthesize physical movement from text tokens. Flowery sentences, poetic metaphors, emotional adjectives, and abstract concepts cause motion confusion and distortion.
- ALL visual actions MUST be specific, literal, and step-by-step:
  - Be specific and literal. Describe what happens, in what order, step by step.
  - DO NOT use flowery language, poetic metaphors, emotional adjectives, or abstract concepts (e.g. NEVER write "ethereal glow", "mysterious aura", "heart-wrenching sorrow", "breathtaking majesty", "symphony of lights", "vibes").
  - Instead of "a ball bouncing around" → "A red ball moves to the right, bounces off the wall, and returns to the center"
  - Instead of "fluid pouring" → "Water flows from the left container through the connecting tube into the right container until both levels are equal"
- ALWAYS construct action narratives using the three-state physical framework:
  1. Starting state: Initial position of the subject/object, body posture, what hands are holding, and initial eye gaze.
  2. Action: Objective physical motion, directions, trajectories, speeds, and contacts in chronological step-by-step order.
  3. End state: Resting position, resulting posture, and physical status when motion concludes.

### 4. Speakers, Dialogue, Voiceover & Visible Text Rules:
- Speakers who vocalize receive stable IDs: (S1), (S2), or compound (S1,S2). Non-vocalizing characters receive no speaker ID.
- Dialogue MUST be formatted using <d>[Language] ...</d> tags:
  - Example: "The young woman with a quiet, breathy voice (S1) says: <d>[English] I get off at the next station.</d>"
  - Preserve user dialogue verbatim; NEVER translate dialogue!
- Voiceover MUST use the exact phrase:
  "says in an off-screen voiceover: <d>[Language] ...</d> while his lips remain completely closed."
- Visible text on-screen: English double quotes "" (e.g. 'A red neon sign reading "Open" glows above the door.'). Do NOT use double quotes for spoken dialogue!

### 5. Official Duration & Series Continuation Standard:
- Official native single-generation duration is strictly 4 to 15 seconds.
- When generating multiple episodes (isSeries: true):
  - EACH episode prompt MUST be 100% self-contained, valid, and immediately copyable/executable on its own!
  - Continuity is achieved through concrete physical starting states matching the preceding episode's end state.

### 6. Absolute Prohibition Regarding File Names:
- STRICT RULE: DO NOT include any file names, file extensions (.jpg, .png, .mp4, .wav), or upload paths anywhere in the prompt! Define subjects purely by visual traits.

### 7. Output JSON Format Constraints:
You MUST output a valid JSON object matching this schema:
{
  "fullPrompt": "The COMPLETE combined prompt string formatted with exact headers, blank lines, and exact field names, ready to copy into MiniMax H3. Ensure NO filenames appear.",
  "explanationZh": "繁體中文解析：說明選用模式的結構編排優勢、三維度運鏡與畫面規劃",
  "suggestions": [
    "畫幅與鏡頭節奏建議",
    "MiniMax-H3 官方實用技巧 1",
    "MiniMax-H3 官方實用技巧 2"
  ],
  "isSeries": false,
  "seriesTitle": "Optional series title when generating multiple episodes",
  "storyArcSummary": "Optional story arc summary when generating multiple episodes",
  "episodes": [
    {
      "episodeIndex": 1,
      "title": "第 1 段標題",
      "duration": "10s",
      "startingState": "具體畫面初始姿態與位置",
      "actionSequence": "連續步驟化客觀動作",
      "endState": "動作結束時畫面落點姿態",
      "fullPrompt": "100% 獨立合法可貼之完整 MiniMax-H3 提示詞",
      "cameraMovement": "運鏡英文句子",
      "audioSoundscape": "環境音與音效",
      "continuityNotes": "承接說明"
    }
  ]
}
Return ONLY valid JSON.
`;
}

/**
 * Builds specific instruction directives for the Assistant Director (輔助導演開關)
 * Enabled: Autonomously extrapolates and enriches secondary physical interactions and environment.
 * Disabled: Strictly faithful mode, zero extrapolation beyond user explicit input.
 */
export function getAssistantDirectorDirective(assistantDirector: boolean = true): string {
  if (assistantDirector) {
    return `
### ASSISTANT DIRECTOR DIRECTIVE (ENABLED / 輔助導演開啟):
- ROLE: Professional Cinematographer & Scene Coordinator.
- ENRICH PHYSICAL LOGIC: Faithfully maintain the user's core intent, characters, and primary storyline, while automatically extrapolating and enriching realistic physical context and secondary motions:
  1. Secondary Micro-Motions: Incorporate realistic secondary physical reactions (e.g. hair strands or clothing fluttering in the breeze, steam billows rising from liquid, droplets beading and streaking down surfaces, subtle eyelid twitches, natural breathing rhythm, fingers micro-adjusting grip).
  2. Multi-Plane Spatial Depth: Structure the composition with clear foreground layers (e.g. out-of-focus wet glass, door frame, passing dust particles), midground action, and deep atmospheric background.
  3. Plausible Environmental Interaction: Objects realistically react to the environment (e.g. feet kicking up subtle dust puffs, neon light shimmering in puddle ripples).
- OBJECTIVE PHRASING: Ensure all enriched details are described strictly as literal physical actions (Starting state -> Action -> End state) without flowery adjectives.`;
  } else {
    return `
### ASSISTANT DIRECTOR DIRECTIVE (DISABLED / 保守忠實模式):
- ROLE: Precision Technical Transcriber & Spec Compliance Officer.
- STRICT & FAITHFUL: Follow ONLY what the user explicitly requested without introducing unasked creative extrapolation or secondary elements.
- STRUCTURE: Follow the exact three-state physical framework (Starting state -> Action -> End state) concisely, cleanly, and faithfully.`;
  }
}

/**
 * Builds user prompt for MiniMax-H3 prompt generation
 */
export function buildH3UserPrompt(config: any): {
  userPrompt: string;
  multimodalParts: any[];
  ollamaImages: string[];
  durationSec: number;
  isSeriesMode: boolean;
  assistantDirector: boolean;
} {
  const multimodalParts: any[] = [];
  const ollamaImages: string[] = [];
  const rawRefs: any[] = Array.isArray(config.references) ? config.references : [];

  const openingKeyframeRef = rawRefs.find((r: any) =>
    ['first_keyframe', 'keyframe', 'composition'].includes(r.role)
  );
  const hasOpeningKeyframe = Boolean(openingKeyframeRef);
  const openingKeyframeTag = openingKeyframeRef?.physicalTag || openingKeyframeRef?.tag;

  const firstUploadedImageRef = rawRefs.find((r: any) => r.fileType === 'image' && !r.isPureSubject);
  const i2vaOpeningTag = openingKeyframeTag || firstUploadedImageRef?.physicalTag || '<Picture 1>';

  const lastKeyframeRef = rawRefs.find((r: any) => r.role === 'last_keyframe');
  const firstKeyframePic = (openingKeyframeTag || firstUploadedImageRef?.physicalTag || '<Picture 1>').replace(/[<>]/g, '');
  const lastKeyframePic = (lastKeyframeRef?.physicalTag || '<Picture 2>').replace(/[<>]/g, '');

  const sanitizedReferences = (rawRefs.length > 0)
    ? rawRefs
        .map((r: any) => {
          const cleanName = String(r.name || 'Reference Asset')
            .replace(/\.[a-zA-Z0-9]{2,5}$/i, '')
            .replace(/\b[\w-]+\.(?:png|jpe?g|webp|gif|mp4|mov|webm|mp3|wav)\b/gi, '')
            .trim() || 'Reference Asset';
          const cleanDesc = String(r.description || '')
            .replace(/\b[\w-]+\.(?:png|jpe?g|webp|gif|mp4|mov|webm|mp3|wav)\b/gi, '')
            .trim() || 'Visual characteristics locked from reference';

          const physicalSlotText = r.physicalTag
            ? ` (Physical Upload Slot in MiniMax: ${r.physicalTag} / @image${r.pictureIndex})`
            : (r.isPureSubject ? ' (Pure Text Subject Declaration, No Uploaded Image)' : '');

          if (r.fileUrl && typeof r.fileUrl === 'string' && r.fileUrl.startsWith('data:image/')) {
            const mimeType = r.fileUrl.split(';')[0].split(':')[1] || 'image/jpeg';
            const base64Data = r.fileUrl.split(',')[1];
            if (base64Data) {
              multimodalParts.push({
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              });

              if (r.physicalTag && r.tag && r.tag.startsWith('<Subject')) {
                multimodalParts.push(
                  `[Visual Reference Image attached above is physical upload slot ${r.physicalTag} (@image${r.pictureIndex}), providing the general visual reference for ${r.tag} (Role: ${r.role}, Label: ${cleanName}). Inspect its real visual characteristics (appearance, colors, style, texture, structure). In "subject_definitions", define ${r.tag} using its physical traits as depicted in ${r.physicalTag} (e.g. "${r.tag} is the [detailed appearance traits] as depicted in ${r.physicalTag}, with locked visual identity."). CRITICAL: ${r.physicalTag} is a general visual reference for ${r.tag} and is NOT an opening keyframe! Do NOT declare "${r.physicalTag} is the first keyframe image...". In "retention_analysis", state that ${r.tag} is fully_preserved from ${r.physicalTag}. Do NOT add a standalone ${r.physicalTag} keyframe entry. Do NOT use any file names.]`
                );
              } else if (r.physicalTag && (['first_keyframe', 'keyframe', 'composition'].includes(r.role) || (r.tag && r.tag.startsWith('<Picture')))) {
                multimodalParts.push(
                  `[Visual Reference Image attached above is physical upload slot ${r.physicalTag} (@image${r.pictureIndex}) (Role: ${r.role}, Label: ${cleanName}). This image is the target keyframe/composition frame (${r.tag}). In "subject_definitions", define ${r.tag} as the first keyframe image showing the setting, lighting, atmosphere, and composition. In "summary" and "detailed_description" [Shot 1], explicitly reference this frame (${r.tag}). Do NOT use any file names.]`
                );
              } else {
                multimodalParts.push(
                  `[Visual reference image attached above corresponds to ${r.tag} (Role: ${r.role}, Label: ${cleanName}). Inspect its real visual characteristics (face, clothing, lighting, style, colors, materials) and describe them faithfully in subject_definitions and retention_analysis without including any file names.]`
                );
              }
              ollamaImages.push(base64Data);
            }
          }

          return `- ${r.tag}${physicalSlotText}: Role=${r.role}, Semantic Label=${cleanName}, Description=${cleanDesc}`;
        })
        .join('\n')
    : 'No reference files provided.';

  const assistantDirector = typeof config.assistantDirector === 'boolean'
    ? config.assistantDirector
    : (config.creativityLevel !== 0);
  const assistantDirectorDirective = getAssistantDirectorDirective(assistantDirector);

  const isSeriesMode = Boolean(config.isSeriesMode);
  const seriesCount = Math.min(10, Math.max(2, Number(config.seriesCount) || 5));
  const durationSec = parseFloat(config.duration || '10') || 10;

  const seriesDirective = isSeriesMode
    ? `
CRITICAL MULTI-EPISODE SERIES GENERATION PROTOCOL (${seriesCount} CONSECUTIVE EPISODES):
- You MUST generate a chronological sequence of exactly ${seriesCount} video generation prompts (Episodes 1 to ${seriesCount}).
- EACH EPISODE MUST BE A 100% SELF-CONTAINED, VALID, AND INDEPENDENTLY COPY-READY MINIMAX-H3 PROMPT!
- NEVER include meta-references like "Resuming directly from Clip 1" or referencing non-existent video files.
- Continuity across episodes MUST be achieved purely through literal step-by-step physical descriptions:
  * Episode 1: Establishes initial scene, character appearance, and opening physical action sequence.
  * Episode K (K >= 2): The prompt's initial description/Shot 1 objectively begins with the exact physical posture, position, and held objects that directly continue from where Episode K-1 ended.
  * All episodes strictly share identical subject definitions (<Subject 1>), clothing, hair, facial features, ${hasOpeningKeyframe ? `opening keyframe (${openingKeyframeTag}), ` : ''}visual style, and ambient soundscape base.
- You MUST populate the "episodes" array with exactly ${seriesCount} items:
  * episodeIndex: 1, 2, ... ${seriesCount}
  * title: Traditional Chinese title (e.g. "第 1 段：初始開場與動作錨定", "第 2 段：情節承接與實體位移")
  * duration: "${config.duration || '10s'}"
  * startingState: Objective literal physical starting state (body posture, location, held objects)
  * actionSequence: Chronological physical step-by-step motion (what moves where, in what order)
  * endState: Resulting physical end state (where objects rest, final posture)
  * fullPrompt: Complete, independent MiniMax-H3 prompt ready to paste directly into MiniMax
  * cameraMovement: Natural camera description
  * audioSoundscape: Soundscape and ambient sound
  * continuityNotes: Traditional Chinese explanation of how this episode continues from the previous one's physical end state
- Set "isSeries": true, "seriesTitle": A concise series title in Traditional Chinese, "storyArcSummary": 1-2 sentences summarizing the multi-shot story arc in Traditional Chinese.
`
    : `
- Single-clip generation mode: Focus on generating one optimal, perfectly structured MiniMax-H3 prompt.
- Set "isSeries": false, "episodes": []
`;

  const isT2VA = (config.mode || "T2VA") === "T2VA";
  const styleInstruction = isT2VA
    ? `- Visual Style: ${config.style || "Cinematic Photorealistic"}\n- Lighting & Atmosphere: ${config.lightingMood || "Cinematic volumetric lighting"}`
    : `- Visual Style & Lighting: [LOCKED FROM REFERENCE IMAGE] In accordance with MiniMax-H3 official specification, visual style, color palette, rendering quality, and lighting are anchored directly from the reference image(s). Do NOT generate conflicting style descriptors in the prompt.`;

  const userPrompt = `
Generate an optimal MiniMax-H3 prompt based on the following user input:
- Core Idea/Concept: ${config.idea || "A sleek futuristic scene"}
- Generation Mode: ${config.mode || "T2VA"}
- Duration: ${config.duration || "10s"}
- Aspect Ratio: ${config.aspectRatio || "16:9"}
${styleInstruction}
- Preferred Camera Movements (Motion types): ${config.cameraMoves && config.cameraMoves.length > 0 ? config.cameraMoves.join(", ") : "Push In, Arc Shot"}
- Camera Motion Amplitude: ${config.cameraAmplitude && config.cameraAmplitude !== 'default' ? config.cameraAmplitude : "medium / default (omit)"}
- Camera Motion Speed: ${config.cameraSpeed && config.cameraSpeed !== 'default' ? config.cameraSpeed : "normal / default (omit)"}
- Spoken Dialogue to be voiced by character (MUST format inside <d>[Language] ...</d>): ${config.dialogueText ? config.dialogueText : "None"}
- Sound Effects / Audio: ${config.sfxText || "Ambient soundscape"}
- Suppress Background Music: ${config.suppressMusic ? "Yes (Add non_diegetic_music: N/A)" : "No"}
- Assistant Director Mode: ${assistantDirector ? "Enabled (Enrich secondary physical details)" : "Disabled (Strictly faithful)"}
- Reference Assets:
${sanitizedReferences}

KEYFRAME & PHYSICAL SLOT ALIGNMENT CONTRACT:
- If Generation Mode is I2VA:
  The prompt MUST begin with the exact header line:
  For the target video, at 0.00 seconds into the target video, ${i2vaOpeningTag} (from [Shot 1]) is fully referenced.
- If Generation Mode is FL2VA:
  The prompt MUST begin with the exact header line:
  How the reference pictures align with the target video — ${firstKeyframePic} (from Shot 1) aligns with the 0.00-second mark of the target video; ${lastKeyframePic} (from Shot N) aligns with the ${durationSec.toFixed(2)}-second mark of the target video.
- If Generation Mode is Ref2VA:
  Follow the MiniMax Multi-Image Physical Upload Mapping Contract:
${hasOpeningKeyframe ? `  * In "subject_definitions": Define each <Subject K> as depicted in its corresponding <Picture P> (e.g. "<Subject 1> is the ... as depicted in <Picture 1>, with locked visual identity."). Define the keyframe image as ${openingKeyframeTag} (e.g. "${openingKeyframeTag} is the first keyframe image showing...").
  * In "summary": [keyframe completion + reference generation] Generated from ${openingKeyframeTag}, preserving <Subject 1> (from <Picture 1>), <Subject 2> (from <Picture 2>)...
  * In "retention_analysis": Analyze retention for both <Subject K> (from <Picture P>) and ${openingKeyframeTag}.
  * In "detailed_description" [Shot 1]: The opening frame matches ${openingKeyframeTag}.` : `  * In "subject_definitions": Define each <Subject K> with its objective visual characteristics as depicted in its physical upload slot <Picture P> (e.g. "<Subject 1> is the ... as depicted in <Picture 1>, with locked visual identity.").
    CRITICAL: ${rawRefs.filter((r: any) => r.physicalTag).map((r: any) => r.physicalTag).join(', ') || '<Picture 1>'} is purely a general visual reference for the subject and is NOT an opening keyframe! Do NOT generate any standalone "<Picture N> is ..." definition lines, and do NOT declare any Picture as the first keyframe image!
  * In "summary": MUST begin with [reference generation] (or [reference generation + other types]). Summarize the scene featuring <Subject 1> with visual traits from its reference image. Do NOT write "Generated from <Picture 1>" and do NOT treat any picture as an initial keyframe!
  * In "retention_analysis": Analyze retention for <Subject K> (e.g. "<Subject 1> (appears in [Shot 1]): fully_preserved - visual characteristics maintained from <Picture 1>"). Do NOT create a separate retention entry for <Picture 1>.
  * In "detailed_description" [Shot 1]: Objectively describe the opening shot according to the narrative. [Shot 1] does NOT match any picture as an opening frame.`}

CRITICAL OBJECTIVE PHYSICAL ACTION PRINCIPLE (MUST FOLLOW STRICTLY):
- Be specific and literal. Describe what happens, in what order, step by step.
- DO NOT use flowery language, poetic metaphors, emotional adjectives, or abstract concepts (e.g. NEVER write "ethereal", "breathtaking", "mysterious aura", "soul-stirring", "stunning masterpiece", "symphony of light").
- Instead of "a ball bouncing around" → "A red ball moves to the right, bounces off the wall, and returns to the center"
- Instead of "fluid pouring" → "Water flows from the left container through the connecting tube into the right container until both levels are equal"
- For every shot and action, describe:
  1. Starting state (body posture, position in frame, what hands are holding, initial gaze)
  2. Action (chronological step-by-step physical movement, directions, contact)
  3. End state (resulting posture, resting place of objects when movement concludes)

${assistantDirectorDirective}

${seriesDirective}

CRITICAL CAMERA RULES:
- Integrate camera movements as natural English actions within each shot (e.g. "The camera pushes in with small amplitude at slow speed toward..."), NEVER as bracketed labels like "[Push In]".
- If amplitude or speed was specified above, naturally include them in the camera sentence.
CRITICAL DIALOGUE RULES:
- Any character spoken dialogue MUST be placed inside <d>[Language] ...</d> tags with speaker IDs (e.g. (S1) says: <d>[English] ...</d>). Keep the exact user dialogue verbatim.
- Double quotes "" are strictly reserved for text visibly seen on-screen (e.g. signs, logos).
CRITICAL PROHIBITION: DO NOT write any file names, file extensions (e.g. .png, .jpg), or local upload names into the output! Define subjects using clear visual descriptions only.
Ensure English language is used for the actual prompt text (fullPrompt) as MiniMax-H3 processes English best, and provide Traditional Chinese for explanationZh, suggestions, and continuityNotes!
`;

  return {
    userPrompt,
    multimodalParts,
    ollamaImages,
    durationSec,
    isSeriesMode,
    assistantDirector,
  };
}

export function buildDialoguePrompt(params: { idea?: string; style?: string; mode?: string; duration?: string }) {
  return `
You are a Hollywood scriptwriter and anime dialogue director.
Based on the following scene parameters:
- Core Idea: "${params.idea || 'A cinematic scene'}"
- Style: "${params.style || 'Cinematic'}"
- Mode: "${params.mode || 'T2VA'}"
- Video Duration: "${params.duration || '10s'}"

Generate 1-2 punchy, immersive, character-driven on-screen dialogue sentences or monologues in English (with optional Traditional Chinese translation if requested). The dialogue must sound natural for video generation models (MiniMax-H3).

Return JSON format:
{
  "dialogueEn": "English dialogue text...",
  "sfxSuggestion": "Suggested atmospheric sound effects (e.g. rain dripping, mechanical hum, wind gust)"
}
`;
}

export function buildOptimizePrompt(params: {
  rawPrompt: string;
  duration?: string;
  suppressMusic?: boolean;
  assistantDirectorDirective: string;
}) {
  return `
Take the user's rough prompt or idea below and optimize/rewrite it into the official MiniMax-H3 prompt standard:
Rough Prompt: "${params.rawPrompt}"
Duration: ${params.duration || "10s"}
Suppress Music: ${params.suppressMusic ? "Yes" : "No"}

Refine it strictly following official MiniMax-H3 specifications:
CRITICAL OBJECTIVE PHYSICAL ACTION PRINCIPLE:
- Be specific and literal. Describe what happens, in what order, step by step.
- DO NOT use flowery language, poetic metaphors, emotional adjectives, or abstract concepts (avoid "ethereal", "breathtaking", "mysterious aura", "soul-stirring").
- Instead of "a ball bouncing around" → "A red ball moves to the right, bounces off the wall, and returns to the center"
- Instead of "fluid pouring" → "Water flows from the left container through the connecting tube into the right container until both levels are equal"
- Describe the starting state, the action, and the end state for each shot.
- Divide into shots starting with [Shot 1] (setting style/composition, no timestamp), and subsequent shots with cut timecodes: "[Shot 2] At MM:SS.mmm, the camera cuts to...".
- Express camera motion as natural English actions within the shot (e.g. "The camera pushes in with small amplitude at slow speed toward..."). DO NOT use bracketed camera tags like "[Push In]".
- Format spoken dialogue inside <d>[Language] ...</d> tags with speaker IDs (e.g. (S1) says: <d>[English] ...</d>), and reserve double quotes "" strictly for visible on-screen text.
- Formulate complete overall_soundscape and non_diegetic_music sections according to the guide.
DO NOT include any file names or file extensions in the generated prompt!

${params.assistantDirectorDirective}
`;
}

export function buildRefineSeriesPrompt(params: {
  seriesTitle: string;
  storyArcSummary: string;
  targetEpisodeIndex: number;
  currentEpisode: any;
  previousEpisode?: any;
  nextEpisode?: any;
  refineInstruction: string;
  durationToUse: string;
  assistantDirectorDirective: string;
}) {
  const prevAnchor = params.previousEpisode
    ? `CRITICAL PRECEDING EPISODE CONTINUITY (Episode #${params.previousEpisode.episodeIndex}):
- Previous Title: ${params.previousEpisode.title}
- Previous Physical End State: "${params.previousEpisode.endState}"
YOU MUST STRICTLY CONTINUE FROM THIS EXACT PHYSICAL POSTURE, POSITION, AND HELD OBJECTS AS THE STARTING STATE FOR THIS EPISODE! Do NOT contradict where the character or items were left.`
    : `This is Episode #1. Establish the opening starting state.`;

  const nextAnchor = params.nextEpisode
    ? `FOLLOWING EPISODE CONTINUITY CONTEXT (Episode #${params.nextEpisode.episodeIndex}):
- Following Starting State: "${params.nextEpisode.startingState}"
Ensure your refined end state provides a natural, logical hand-off to this following state.`
    : `This is the final episode of the sequence.`;

  return `
You are performing an IN-PLACE SURGICAL REFINEMENT of Episode #${params.targetEpisodeIndex} in a multi-episode consecutive video series.
Series Context:
- Series Title: "${params.seriesTitle}"
- Overall Story Arc: "${params.storyArcSummary}"

${prevAnchor}

${nextAnchor}

CURRENT EPISODE CONTENT (BEFORE REFINEMENT):
- Title: "${params.currentEpisode.title}"
- Duration: "${params.durationToUse}"
- Current Starting State: "${params.currentEpisode.startingState || ''}"
- Current Action Sequence: "${params.currentEpisode.actionSequence || ''}"
- Current End State: "${params.currentEpisode.endState || ''}"
- Current Full Prompt: "${params.currentEpisode.fullPrompt || ''}"

SPECIFIC USER REFINEMENT INSTRUCTION (CRITICAL - APPLY THESE ADJUSTMENTS EXACTLY):
"${params.refineInstruction.trim()}"

REFINEMENT PROTOCOL:
1. Preserve physical continuity with Episode #${params.previousEpisode ? params.previousEpisode.episodeIndex : 1}.
2. Apply the user's specific adjustment to the action sequence and resulting end state.
3. Express camera movements naturally in English.
4. Output a 100% complete, independent, copy-ready MiniMax-H3 prompt in "fullPrompt".
5. DO NOT mention meta-instructions or compliance checks. DO NOT include any file names or extensions.
6. Provide Traditional Chinese for title, and continuityNotes.

${params.assistantDirectorDirective}
`;
}
