<div align="center">

# 🎬 MiniMax-H3 AI Prompt Studio

**Professional Prompt Engineering Platform Tailored for MiniMax-H3 (Hailuo 3) Video & Audio Generation Models**

[![Version](https://img.shields.io/badge/version-v1.4.2-blue.svg)](CHANGELOG.md)
[![Model](https://img.shields.io/badge/AI%20Engine-Gemini%203.8%20%7C%203.6%20%7C%203.5-orange.svg)](https://deepmind.google/technologies/gemini/)
[![Framework](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite-green.svg)](https://react.dev/)
[![Styling](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38bdf8.svg)](https://tailwindcss.com/)

[English](README.md) • [繁體中文](README.zh-TW.md)

</div>

---

## 📖 Overview

**MiniMax-H3 AI Prompt Studio** is a state-of-the-art prompt creation and optimization studio engineered specifically for the **MiniMax-H3 (Hailuo 3 / H3)** multimodal video and audio generation model series.

Adhering 100% to the official MiniMax-H3 [`h3-prompt-writing`](https://github.com/MiniMax-AI/MiniMax-H3/tree/main/skills/h3-prompt-writing) skill specification, the studio transforms high-level creative concepts into production-ready, perfectly formatted prompts with one-click copy functionality.

Powered by Google's latest **Gemini 3.8 Flash (`gemini-3.8-flash`)**, **Gemini 3.6 Flash (`gemini-3.6-flash`)**, and **Gemini 3.5 Flash-Lite (`gemini-3.5-flash-lite`)** via the modern `@google/genai` SDK, it delivers deep reasoning capabilities for multi-shot timeline planning, multimodal asset retention analysis, and cinematic audio-visual soundscape composition with zero rate-limit interruptions.

---

## ✨ Key Features

### 1. Complete MiniMax-H3 Specification Compliance
- **Base Modes (T2VA, I2VA, FL2VA, L2VA)**:
  - Implements exact header alignment instruction lines for First/Last Keyframes.
  - Generates the standard 3 core fields: `integrated_multimodal_description`, `overall_soundscape`, and `non_diegetic_music`.
- **Full-Reference Mode (Ref2VA)**:
  - Generates the complete 6-section structure: `subject_definitions`, `summary`, `retention_analysis`, `detailed_description`, `overall_soundscape`, and `non_diegetic_music`.
  - Automatically manages angle-bracket asset labels (`<Subject N>`, `<Picture N>`, `<Video N>`, `<Audio N>`).

### 2. Multi-Tier AI Engine with Instant Automatic Fallback
- **Three Selectable Engine Tiers**:
  - **🟢 AI Pro (Web UI Quota Optimized - Default)**: Zero-cost mode with smart model specialization (`gemini-3.5-flash-lite` for dialogues, `gemini-3.6-flash` for image analysis, and `gemini-3.8-flash` for core prompts) to guarantee smooth execution without 429 quota exhaustion.
  - **🔵 AI Ultra 5x (Performance)**: Unlocks full `gemini-3.8-flash` with deeper multi-shot reasoning.
  - **🟣 AI Ultra 20x (Extreme Flagship)**: Maximum thinking capacity and high-resolution asset retention analysis.
- **Resilient Multi-Model Fallback**: Automatically switches to backup models upon 429 / 503 errors to guarantee a 100% request success rate.

### 3. Multimodal Reference Media Analyzer
- Upload character, scene, or prop reference images directly in the browser.
- **Deep Token Optimization**: Automatically downscales images to 768px (quality 0.8), reducing token usage by over 70% while preserving all key facial traits, clothing textures, and lighting characteristics.

### 4. Cinematic Dialogue & Audio Director
- Generates character-driven, on-screen dialogues with atmospheric sound effect (SFX) suggestions tailored for AI video models in under 400ms.
- Support for background music suppression (`non_diegetic_music: N/A`).

### 5. Production-Ready Studio UI (v1.4.2 Widescreen Architecture)
- **Three-Column Widescreen Layout (`max-w-[1800px]`, 35% / 25% / 40%)**: Dedicated columns for Input Concept & References (Left 35%), Parameter Configuration & Generation (Middle 25%), and Output Inspector & One-Click Copy (Right 40%).
- **Spacious & Adjustable Idea Input Canvas**: Substantially expanded textarea (`rows={8}`, `min-h-[240px]`) with 5-step font sizing (12px ~ 20px), stepper controls, and `localStorage` persistence.
- **AI Quota Switcher**: Instant switching between Pro and Ultra modes with tooltip guides and `localStorage` persistence.
- **Unified Toast Notifications**: Non-blocking floating toasts across all workflows.
- **Preset Library**: Instant access to curated scene presets (Cyberpunk, Anime, Fantasy, Epic Commercial).
- **Temporal Timeline View**: Interactive visual shot timeline showing timeframes, camera movements, actions, and audio cues.
- **One-Click Export**: Copy the full prompt or individual blocks directly ready to paste into MiniMax-H3.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite 6, Lucide Icons, Motion
- **Styling**: Tailwind CSS v4
- **Backend / API**: Express 4, TypeScript, `tsx`
- **AI SDK**: `@google/genai` (v2.17.0+), Google Gemini 3.8 Flash

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.0.0` or higher
- **Gemini API Key**: Obtain a key from [Google AI Studio](https://aistudio.google.com/apikey)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/App-Minimax_H3_AI_Prompt_Studio.git
   cd App-Minimax_H3_AI_Prompt_Studio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory (or copy from `.env.example`):
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   PORT=3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Express server with Vite middleware in development mode |
| `npm run build` | Builds the client SPA bundle and compiles `server.ts` with esbuild |
| `npm run start` | Runs the production-built application (`dist/server.cjs`) |
| `npm run lint` | Runs TypeScript static type checking (`tsc --noEmit`) |
| `npm run preview` | Previews the production Vite build locally |
| `npm run clean` | Removes build artifacts (`dist/` directory) |

---

## 📁 Project Structure

```text
App-Minimax_H3_AI_Prompt_Studio/
├── src/
│   ├── components/       # UI components (Studio header, mode selector, prompt outputs)
│   ├── data/             # Presets and camera movement configuration
│   ├── types.ts          # TypeScript type definitions
│   ├── App.tsx           # Main application state and layout
│   ├── main.tsx          # React application entry point
│   └── index.css         # Tailwind CSS styles
├── server.ts             # Express backend with Gemini 3.8 Flash API integration
├── CHANGELOG.md          # Release history and migration notes
├── README.md             # English documentation
├── README.zh-TW.md       # Traditional Chinese documentation
├── package.json          # Project dependencies and metadata (v1.3.1)
└── tsconfig.json         # TypeScript configuration
```

---

## 📄 Versioning & Changelog

This project adheres to Semantic Versioning. For detailed release notes and migration guides, please refer to [CHANGELOG.md](CHANGELOG.md).

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
