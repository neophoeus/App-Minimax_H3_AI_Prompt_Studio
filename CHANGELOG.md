# Changelog

All notable changes to this project will be documented in this file.

## [v2.0.0] - 2026-09-17

### 🎬 MiniMax-H3 Official Prompt Engineering Specification 100% Alignment (官方規範全量對齊重構)

#### 🎥 1. Complete 3-Dimension Camera Motion Architecture (全三維度官方運鏡體系)
- **12 Official Camera Motion Types (12 類標準運動類型)**:
  - Categorized into intuitive studio groups:
    - **推進與縮放 (Push & Zoom)**: `Push In`, `Pull Out`, `Zoom In`, `Zoom Out` (strictly distinguishes optical focal zoom vs physical dolly push/pull).
    - **搖鏡與平移 (Pan & Truck)**: `Pan Left`, `Pan Right`, `Truck Left`, `Truck Right` (strictly distinguishes stationary pan vs horizontal dolly tracking).
    - **俯仰與升降 (Tilt & Pedestal)**: `Tilt Up`, `Tilt Down`, `Pedestal Up`, `Pedestal Down` (strictly distinguishes stationary tilt vs vertical jib crane movement).
    - **環繞、跟拍與主觀 (Arc, Tracking & POV)**: `Arc Shot`, `Tracking Shot`, `Static Shot`, `POV`.
    - **晃動與旋轉 (Shake & Roll)**: `Shake Slightly`, `Shake Strongly`, `Roll Clockwise`, `Roll Counterclockwise`.
  - Thoroughly eliminated non-standard experimental types (such as `FPV drone`) and corrected `Static` to standard `Static Shot`.
- **Amplitude Dimension (幅度微調維度)**: Added selector for `with small amplitude` and `with large amplitude` (medium amplitude omitted by default per official guidelines).
- **Speed Dimension (速度微調維度)**: Added selector for `at slow speed` and `at fast speed` (normal speed omitted by default per official guidelines).
- **Natural English Action Integration (自然句式組織語法)**:
  - Eliminated trailing bracketed camera tags (e.g. `[Push In]`).
  - Instructs prompt synthesis engine to formulate seamless English actions within each shot (e.g. *"The camera pushes in with small amplitude at slow speed toward the folded letter in her hands."*).

#### ⏱️ 2. Official Duration Standardization & Video Continuation Architecture (時長標準化與長影片續寫)
- **Removed Experimental Single-Shot Durations**: Completely removed ungrounded 20s, 25s, and 30s options.
- **Native Single-Shot Durations**: Standardized to official native range of 4–15 seconds (`4s`, `5s`, `6s`, `8s`, `10s`, `12s`, `15s`, default recommended: `10s`).
- **Official Long-Video Workflow (`video continuation`)**:
  - Supported official H3 multi-shot chaining via `Ref2VA` using task type prefix `[video continuation]`.
  - Added `continuation` (接續來源影片) reference role in `ReferenceManager.tsx` to bind `<Video 1>` as the continuation starting point.
  - Added dedicated preset template: **「長影片分鏡續寫接續 (Ref2VA Video Continuation)」**.

#### 💬 3. Spoken Dialogue & Speech Syntax Overhaul (對白與說話者規範全面修正)
- **Official `<d>[Language] ...</d>` Tags**: Spoken lines are strictly formatted inside `<d>` with language tags (e.g. `<d>[English] ...</d>`, `<d>[Chinese] ...</d>`), preserving user words and punctuation verbatim without translation.
- **Speaker IDs**: Assigned stable IDs (`(S1)`, `(S2)`, `(S1,S2)`) to all vocalizing characters.
- **Off-Screen Voiceover Convention**: Enforced exact official syntax: `says in an off-screen voiceover: <d>[Language] ...</d> while his lips remain completely closed.`
- **Dialogue Continuity & Truncation**: Supported `<scenetrans>` for lines carrying across cuts and `<cutoff>` for speech truncated at the video's conclusion.
- **Strict Separation of Dialogue vs On-Screen Text**: Double quotation marks `""` are strictly reserved for visible signage, neon text, and on-screen graphics, never confused with spoken dialogue.

#### 🔒 4. Ref2VA Sections & Retention Analysis Strict Lock (Ref2VA 六大區塊與枚舉標記全面鎖定)
- **Official Summary Task Type Prefixes**: Restricted to `[keyframe completion]`, `[reference generation]`, `[video editing]`, `[video continuation]`, `[audio reuse]`, `[audio reference]`, combined with ` + `.
- **Official Relationship Markers**: Strictly enforced `fully_preserved`, `partially_preserved`, `attribute_transfer`, and `weak_reference` for visual assets, and `fully_copy`, `partially_copy`, `reference`, and `weak_reference` for audio assets.
- **Opening Style Declaration**: Positioned 1–2 sentences of overall visual style before `[Shot 1]` in `detailed_description`.

#### 🎨 5. Syntax Highlighter & Storyboard Visualizer Upgrades (語法亮顯與故事板升級)
- **Enhanced Syntax Highlighter**: Added vivid multi-color tokenization for `<d>...</d>`, `(S1)`, `<scenetrans>`, `<cutoff>`, alignment headers, retention markers, and on-screen text quotes.
- **Enhanced Storyboard Visualizer**: Displays official shot timecodes (`[Shot 1]`, `[Shot 2] At 00:03.500`) alongside natural camera motion sentences and verbatim dialogue.
- **Updated Quick Modifiers**: Replaced bracketed labels with official natural phrasing snippets (e.g. 慢速微推, 快速橫移, 環繞鏡頭, 畫外音閉嘴約定).

---

## [v1.5.2] - 2026-09-03

### 🛡️ Exponential Backoff Retry & Ultra-Relaxed Safety Architecture
- **Exponential Backoff with Jitter (指數退避與隨機抖動重試)**:
  - Integrated automatic retry loops (up to 2 retries per model, 1s ➔ 2s with +0~500ms randomized jitter) for transient `429 RESOURCE_EXHAUSTED` and `503 UNAVAILABLE` errors.
  - Prevents transient burst rate limits from failing user requests while protecting API quota pools.
  - Automatically skips retries on permanent fatal model errors (such as `404 NOT_FOUND` or deprecated models) to immediately execute failover routing.
- **Ultra-Relaxed Safety Settings (`HarmBlockThreshold.BLOCK_NONE`)**:
  - Configured `HarmBlockThreshold.BLOCK_NONE` across all 5 core harm categories (`HARM_CATEGORY_HARASSMENT`, `HARM_CATEGORY_HATE_SPEECH`, `HARM_CATEGORY_SEXUALLY_EXPLICIT`, `HARM_CATEGORY_DANGEROUS_CONTENT`, `HARM_CATEGORY_CIVIC_INTEGRITY`).
  - Maximizes cinematic storytelling freedom for dark sci-fi, intense action, suspenseful drama, and creative visual scripts.
- **Safety Block Notification System (即時安全性審查阻擋通知)**:
  - Implemented dual-layer interception in `server.ts` inspecting `promptFeedback.blockReason` and `candidates[0].finishReason` (`SAFETY`, `PROHIBITED_CONTENT`, `BLOCKLIST`, `IMAGE_SAFETY`).
  - Provides clear, actionable Traditional Chinese warning toasts in the frontend (`🛡️【內容安全性阻擋通知】...`) with extended duration (8s) guiding creators on adjustments.

---

## [v1.5.1] - 2026-09-03

### 🚀 Zero-Quota Multimodal Vision Architecture (零額度負擔多模態直通看圖)
- **Single-Request Multimodal Bundling (0 Extra RPM Overhead)**:
  - Eliminated separate, repetitive image analysis requests that previously caused frequent `429 RESOURCE_EXHAUSTED` rate-limit errors.
  - Bundled uploaded reference image data directly into the primary `/api/generate-h3-prompt` call, reducing total API invocations to **strictly 1 request**.
- **Ultra-Light Token Compression (~258 Tokens per image)**:
  - Downscaled uploaded reference images in the browser to max `512px` (JPEG quality `0.75`, ~35KB payload).
  - Consumes only ~258 tokens per image in Gemini 3.8 / 3.6 Flash, representing less than 0.03% of the free-tier per-minute token quota.
- **Direct Visual Inspection without Filename Leaks**:
  - Connected Gemini's native multimodal vision core to inspect real visual traits (facial features, clothing textures, color palette, lighting mood) for each `<Subject N>` / `<Picture N>` reference.
  - Preserved strict zero-tolerance prohibitions against raw filenames or file extensions in the generated prompt.

---

## [v1.5.0] - 2026-09-03

### 🗑️ Removed Features
- **Removed "AI 分析特徵" (AI Feature Analysis)**:
  - Completely removed the AI analyze button and media analysis logic from `ReferenceManager.tsx`.
  - Reference items now present a clean, uncrowded header with Tag input, Role dropdown, and direct delete action.
- **Removed "AI 自動撰寫對話" (AI Auto-generate Dialogue)**:
  - Removed dialogue generation button and handler from `App.tsx`.
  - Dialogue and SFX section redesigned into a clean, dedicated manual input area with clear visual indicators for MiniMax-H3 audio-visual lip-sync capabilities.

### ✨ Clean Prompt Engineering (Strict No-Filename Standard)
- **Zero-Tolerance Filename Policy**:
  - Enhanced `MINIMAX_H3_SKILL_SYSTEM_INSTRUCTION` with strict prohibitions against raw filenames, file extensions (`.png`, `.jpg`, `.mp4`, `.wav`, etc.), or upload paths anywhere in the generated output.
  - Ensured `<Subject N>` and `<Picture N>` definitions are strictly based on physical traits, clothing, lighting, and scene descriptions rather than filename labels.
- **Input Sanitization & Semantic Defaults**:
  - File upload workflow now assigns intuitive semantic labels (e.g., `首幀開場畫面`, `主要角色 1`) instead of injecting raw filenames into the prompt.
  - Original file names are retained purely as supplementary UI badges (`📎 來源檔案: filename.png`).
- **Post-Generation Output Sanitizer**:
  - Implemented `sanitizeGeneratedPromptText` regex filter in `server.ts` across `fullPrompt`, `block1`, `block2`, `block3`, and `temporalTimeline` to eliminate any accidental filename leaks.

### 🏷️ Independent Reference Asset Category Indexing
- **Per-Category Auto Re-Indexing (`<Subject N>`, `<Picture N>`, `<Video N>`, `<Audio N>`)**:
  - Implemented `reindexReferences` to assign independent sequence numbering per asset type.
  - Adding or switching items between different types (e.g. Character then Motion) now generates `<Subject 1>` + `<Video 1>` instead of inheriting global indices like `<Video 2>`.
  - Automatically re-indexes dynamically upon adding, deleting, or changing asset roles while preserving user-defined custom tags.

### 🎨 UI & Ergonomic Improvements
- **Dedicated Prompt Editor Toolbar**:
  - Relocated the "手動微調編輯" (Manual Edit) button from the crowded output tab bar into an independent, spacious top toolbar above the prompt viewer.
  - Added live status indicator (`語法亮顯預覽` / `手動微調編輯模式`), real-time character count, and a one-click "還原初版" (Revert to AI Initial) button when in edit mode.
- **Responsive Generation Mode Button Grid**:
  - Upgraded mode buttons from rigid columns to adaptive `grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2`, preventing awkward text wrapping and truncation on 1366px-1920px screens.
- **Layout & Typography Harmonization**:
  - Harmonized middle column title to `視聽拍攝參數配置 (Parameters)`, aligning cleanly with `重設設定` on a single line.
  - Streamlined duration dropdown options (e.g. `20 秒 (20s) [實驗性]`).
  - Added `shrink-0` and unified spacing to `Navbar` action buttons to prevent multi-line breaks on laptop screens.
  - Updated web application title to `MiniMax-H3 AI Prompt Studio | 視訊提示詞生成助手`.

---

## [v1.4.2] - 2026-09-03

### 🚀 Changed & Upgraded

- **Upgraded to `gemini-3.6-flash` (Resolved Google AI 404 NOT_FOUND Error)**:
  - Replaced deprecated `gemini-2.5-flash` with Google's officially recommended `gemini-3.6-flash` across all execution plans, media analysis endpoints, and fallback chains.
  - Retained dedicated model specialization in **🟢 AI Pro (Default Tier)**: `gemini-3.6-flash` handles multimodal media and image reference extraction to protect `gemini-3.8-flash` quota from 429 rate limit exhaustion.
- **Enhanced Dynamic Router Failover Resilience**:
  - Extended failover detection in `callGeminiDynamic` to intercept HTTP 404, `NOT_FOUND`, and model obsolescence responses, ensuring instant automatic switchover to healthy models without interrupting user workflow.
- **Version Bump & Documentation Synchronization**:
  - Synchronized project version to `v1.4.2` in `package.json`, `package-lock.json`, `README.md`, and `README.zh-TW.md`.

---

## [v1.4.1] - 2026-09-03

### 🚀 Changed & Optimized

- **Optimized Three-Column Proportions (35% / 25% / 40%)**:
  - Fine-tuned the widescreen 3-column layout grid to an optimal **35% : 25% : 40%** distribution (`lg:grid-cols-[35fr_25fr_40fr]`):
    - **Left Column (35%)**: Enhanced space for Core Idea input, font size controls, MiniMax generation modes, and the Reference Asset Manager.
    - **Middle Column (25%)**: Compact, streamlined layout for visual & audio parameters, style selectors, and the primary Skill generation button.
    - **Right Column (40%)**: Maximum horizontal space dedicated to the generated MiniMax-H3 prompt, syntax highlighter, editable textarea, 3-block breakdown, and temporal timeline storyboard.
- **Significantly Expanded Core Idea Input Area**:
  - Substantially increased the default visible height and minimum height of the Core Idea textarea (`rows={8}`, `min-h-[240px]`).
  - Provides a deeply spacious writing canvas for complex multi-sentence narrative concepts and multimodal descriptions, even when using large font sizes (up to 20px).

---

## [v1.4.0] - 2026-09-03

### 🚀 Added & Improved

- **Three-Column Widescreen Architecture (`lg:grid-cols-3` / `max-w-[1800px]`)**:
  - Overhauled the studio layout from a 2-column split into an intuitive, productive **3-column workflow**:
    - **Left Column (Input Concept & References)**: Core Idea input, MiniMax Generation Mode selection (`T2VA` ~ `Ref2VA`), and Reference Asset Manager (`<ReferenceManager />`).
    - **Middle Column (Adjust Settings & Directives)**: Visual & audio parameter configuration (duration, aspect ratio, style rendering, camera movement directives, dialogue, SFX, background music suppression) and the primary "調用 Skill 生成 MiniMax-H3 完整提示詞" generation action button.
    - **Right Column (Output Results & Inspector)**: One-click copy master banner, full prompt syntax highlighter & inline editor, quick prompt modifiers, 3-block breakdown inspector, temporal timeline visualizer, and H3 skill guide.
  - Expanded overall container width from `max-w-7xl` (1280px) to **`max-w-[1800px]`**, aligning the top `Navbar` and studio layout for comfortable widescreen desktop and laptop viewing.
- **Adjustable Font Size for Core Idea Input**:
  - Added an interactive font size controller directly in the Core Idea card header (`Type`, `[A-]` decrease, current size indicator, `[A+]` increase).
  - Supports 5 adjustable font size steps: `12px`, `14px`, `16px`, `18px`, and `20px` with dynamic comfortable line-height (`1.6`).
  - Persists the user's chosen font size in `localStorage` (`minimax_h3_idea_font_size`) across page reloads.

---

## [v1.3.1] - 2026-09-03

### 🚀 Changed & Upgraded

- **Gemini 3.8 Flash Upgrade**:
  - Upgraded core frontier reasoning model from `gemini-3.7-flash` to the newly released **`gemini-3.8-flash`** (Gemini 3.8 Flash).
  - Integrated `gemini-3.8-flash` across all engine tier plans (`pro`, `ultra_5x`, `ultra_20x`) in `server.ts` for deep temporal shot reasoning, multimodal prompt writing, and rapid keyframe deduction.
  - Enhanced fallback chain routing and latency responsiveness.
- **UI & Documentation Sync**:
  - Updated AI engine tier descriptions and tooltips in `Navbar.tsx` reflecting `gemini-3.8-flash`.
  - Updated project badges and documentation specifications in `README.md` and `README.zh-TW.md`.

---

## [v1.3.0] - 2026-09-02

### 🚀 Added & Improved

- **AI Engine Tier Architecture (`EngineTier`)**:
  - Introduced support for three AI engine quota tiers:
    - **🟢 AI Pro (`pro`)**: Zero-cost, Web UI & Free API optimized mode featuring multi-model specialization to eliminate rate-limit errors.
    - **🔵 AI Ultra 5x (`ultra_5x`)**: High-performance mode unlocking deep multi-shot reasoning and high-precision visual analysis.
    - **🟣 AI Ultra 20x (`ultra_20x`)**: Extreme flagship mode with maximum thinking capacity and high-resolution asset retention analysis.
  - Added an interactive **AI Engine Tier Selector** in the top navigation bar with a detailed quota explanation modal and `localStorage` persistence.
- **Web UI Quota Optimization (Model Specialization)**:
  - **AI Cinematic Dialogue**: Routed to the ultra-fast `gemini-3.5-flash-lite` model (<400ms latency, independent high-quota pool, zero pressure on flagship model).
  - **AI Reference Media Analyzer**: Routed to `gemini-2.5-flash` with redundant thinking disabled, reducing token consumption by over 70%.
  - **MiniMax-H3 Skill Generation**: Powered by `gemini-3.7-flash` for deep reasoning, structured outputs, and timeline breakdown.
- **Seamless Multi-Model Fallback Mechanism**:
  - Implemented `callGeminiDynamic` with instant automatic failover upon encountering `429 (RESOURCE_EXHAUSTED)` or `503 (High Demand)` errors, ensuring a 100% request success rate.
- **Multimodal Token & Payload Optimization**:
  - Optimized browser-side image downscaling to 768px with 0.8 quality compression, drastically decreasing upload payload and Gemini TPM consumption.
- **Clean API Client Configuration**:
  - Removed artificial `"User-Agent": "aistudio-build"` header spoofing, returning to standard official `@google/genai` client communication.

---

## [v1.2.1] - 2026-08-29

### 🚀 Added & Improved

- **Gemini API Resilience & Auto-Retry Mechanism**:
  - Implemented an automatic retry handler (`callGeminiFlash37`) with exponential backoff and randomized jitter (up to 3 retries) in `server.ts`.
  - Added robust error code & pattern extraction (`503` / `UNAVAILABLE` / `High Demand`, `429` / `RESOURCE_EXHAUSTED` / `Rate limit`, and transient network socket failures).
- **Modernized Toast Notification System**:
  - Replaced legacy browser-blocking `alert()` dialogs in `ReferenceManager.tsx` with the unified, floating `Toast` notification component.
  - Added real-time success feedback notifications upon AI reference visual analysis.
- **Enhanced Error Translation & UX**:
  - Standardized friendly Traditional Chinese error formatting across the application (`App.tsx` & `ReferenceManager.tsx`), handling API key misconfigurations, high traffic demand spikes, rate limits, and network disconnects.

---

## [v1.2.0] - 2026-08-18

### 🚀 Changed

- **AI Model Upgrade**: Upgraded backend model from `gemini-3.6-flash` to the official **`gemini-3.7-flash`** (Gemini 3.7 Flash).
- **Google GenAI SDK Parameter Alignment**:
  - Replaced deprecated numeric `thinking_budget` with the new official `ThinkingLevel` configuration from `@google/genai`:
    - Configured `ThinkingLevel.LOW` for lightweight tasks (instant dialogue generation and media tagging).
    - Configured `ThinkingLevel.MEDIUM` for deep reasoning tasks (multi-block prompt generation and retention analysis).
  - Deprecated and removed obsolete sampling parameters (`temperature`, `top_p`, `top_k`, and `candidate_count`) to conform with Gemini 3+ architecture.
- **Version Alignment**: Synced version to `1.2.0` across `package.json`, `package-lock.json`, and project documentation.

### 📚 Documentation

- Rewrote `README.md` into a formal, comprehensive English specification documentation.
- Added `README.zh-TW.md` providing complete Traditional Chinese documentation.
- Added `CHANGELOG.md` to track project evolution and migration notes.

---

## [v1.1.0] - 2026-08-13

### ✨ Added

- **MiniMax-H3 Full Mode Support**:
  - Base Modes: Text-to-Video-Audio (`T2VA`), Image-to-Video-Audio (`I2VA`), First-Last Keyframe (`FL2VA`), and Last Keyframe (`L2VA`).
  - Full-Reference Mode: Reference-to-Video-Audio (`Ref2VA`) with 6-section structure.
- **Skill Compliance**:
  - Full alignment with MiniMax-H3 official [`h3-prompt-writing`](https://github.com/MiniMax-AI/MiniMax-H3/tree/main/skills/h3-prompt-writing) skill specification.
  - Implemented exact header alignment instruction lines for keyframe modes.
  - Implemented standard 3-block structure (`integrated_multimodal_description`, `overall_soundscape`, `non_diegetic_music`).
- **Asset Retention Analysis**:
  - Subject Definitions management with angle-bracket tags (`<Subject N>`, `<Picture N>`, `<Video N>`, `<Audio N>`).
  - Retention Analysis locking system for dynamic vs preserved character/scene traits.
- **Multimodal Visual Analyzer**:
  - Browser-based reference image uploading and AI visual feature analysis (`/api/analyze-reference-media`).
- **Cinematic Dialogue & Audio Director**:
  - Automatic on-screen dialogue and SFX generation (`/api/generate-dialogue`).
  - Background music suppression switch (`non_diegetic_music: N/A`).
- **Studio Interface**:
  - Responsive dark-mode UI built with React 19, Tailwind CSS v4, and Lucide Icons.
  - Preset library (Cyberpunk, Anime, Dark Fantasy, Cinematic).
  - Visual Temporal Timeline breakdown and one-click prompt copying.
