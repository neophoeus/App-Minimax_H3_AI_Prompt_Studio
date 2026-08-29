<div align="center">

# 🎬 MiniMax-H3 AI Prompt Studio

**Professional Prompt Engineering Platform Tailored for MiniMax-H3 (Hailuo 3) Video & Audio Generation Models**

[![Version](https://img.shields.io/badge/version-v1.2.1-blue.svg)](CHANGELOG.md)
[![Model](https://img.shields.io/badge/AI%20Engine-Gemini%203.7%20Flash-orange.svg)](https://deepmind.google/technologies/gemini/)
[![Framework](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite-green.svg)](https://react.dev/)
[![Styling](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38bdf8.svg)](https://tailwindcss.com/)

[English](README.md) • [繁體中文](README.zh-TW.md)

</div>

---

## 📖 Overview

**MiniMax-H3 AI Prompt Studio** is a state-of-the-art prompt creation and optimization studio engineered specifically for the **MiniMax-H3 (Hailuo 3 / H3)** multimodal video and audio generation model series.

Adhering 100% to the official MiniMax-H3 [`h3-prompt-writing`](https://github.com/MiniMax-AI/MiniMax-H3/tree/main/skills/h3-prompt-writing) skill specification, the studio transforms high-level creative concepts into production-ready, perfectly formatted prompts with one-click copy functionality.

Powered by Google's latest **Gemini 3.7 Flash (`gemini-3.7-flash`)** model and the modern `@google/genai` SDK, it delivers deep reasoning capabilities for multi-shot timeline planning, multimodal asset retention analysis, and cinematic audio-visual soundscape composition.

---

## ✨ Key Features

### 1. Complete MiniMax-H3 Specification Compliance
- **Base Modes (T2VA, I2VA, FL2VA, L2VA)**:
  - Implements exact header alignment instruction lines for First/Last Keyframes.
  - Generates the standard 3 core fields: `integrated_multimodal_description`, `overall_soundscape`, and `non_diegetic_music`.
- **Full-Reference Mode (Ref2VA)**:
  - Generates the complete 6-section structure: `subject_definitions`, `summary`, `retention_analysis`, `detailed_description`, `overall_soundscape`, and `non_diegetic_music`.
  - Automatically manages angle-bracket asset labels (`<Subject N>`, `<Picture N>`, `<Video N>`, `<Audio N>`).

### 2. Powered by Gemini 3.7 Flash with High Resilience
- Integrates Google's latest `gemini-3.7-flash` model.
- **Smart Transient Retry**: Built-in exponential backoff with jitter (up to 3 retries) handling 503 high-demand spikes, 429 quota bursts, and temporary network connection drops.
- Dynamic reasoning depth via `ThinkingLevel`:
  - `ThinkingLevel.LOW`: Ultra-low latency for instant cinematic dialogue generation and image tag extraction.
  - `ThinkingLevel.MEDIUM`: Balanced, deep reasoning for complex multi-shot timeline breakdowns and retention analysis.
- Compliant with the newest Google GenAI SDK standards (zero legacy parameters).

### 3. Multimodal Reference Media Analyzer
- Upload character, scene, or prop reference images directly in the browser.
- Automatically analyzes and synthesizes visual characteristics (lighting, facial traits, textures) to populate Block 1 Subject Definitions and Retention Analysis locks.

### 4. Cinematic Dialogue & Audio Director
- Generates character-driven, on-screen dialogues with atmospheric sound effect (SFX) suggestions tailored for AI video models.
- Support for background music suppression (`non_diegetic_music: N/A`).

### 5. Production-Ready Studio UI
- **Unified Toast Notifications**: Replaced browser popups with non-blocking, sleek floating toasts across all workflows.
- **Preset Library**: Instant access to curated scene presets (Cyberpunk, Anime, Fantasy, Epic Cinematic).
- **Temporal Timeline View**: Interactive visual shot timeline showing timeframes, camera movements, actions, and audio cues.
- **One-Click Export**: Copy the full prompt or individual blocks directly ready to paste into MiniMax-H3.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite 6, Lucide Icons, Motion
- **Styling**: Tailwind CSS v4
- **Backend / API**: Express 4, TypeScript, `tsx`
- **AI SDK**: `@google/genai` (v2.17.0+), Google Gemini 3.7 Flash

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
├── server.ts             # Express backend with Gemini 3.7 Flash API integration
├── CHANGELOG.md          # Release history and migration notes
├── README.md             # English documentation
├── README.zh-TW.md       # Traditional Chinese documentation
├── package.json          # Project dependencies and metadata (v1.2.0)
└── tsconfig.json         # TypeScript configuration
```

---

## 📄 Versioning & Changelog

This project adheres to Semantic Versioning. For detailed release notes and migration guides, please refer to [CHANGELOG.md](CHANGELOG.md).

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
