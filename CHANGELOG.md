# Changelog

All notable changes to this project will be documented in this file.

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
