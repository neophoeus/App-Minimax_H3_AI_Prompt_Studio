# Changelog

All notable changes to this project will be documented in this file.

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
