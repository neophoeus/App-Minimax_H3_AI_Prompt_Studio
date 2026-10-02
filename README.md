<div align="center">

# 🎬 MiniMax-H3 AI Prompt Studio

**Professional Prompt Engineering Platform Tailored for MiniMax-H3 (Hailuo 3) Video & Audio Generation Models**

[![Version](https://img.shields.io/badge/version-v5.0.0-blue.svg)](CHANGELOG.md)
[![Model](https://img.shields.io/badge/AI%20Engine-Gemini%203.8%20%7C%20Ollama%20%7C%20llama.cpp-orange.svg)](https://deepmind.google/technologies/gemini/)
[![Framework](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite-green.svg)](https://react.dev/)
[![Styling](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38bdf8.svg)](https://tailwindcss.com/)

[English](README.md) • [繁體中文](README.zh-TW.md)

</div>

---

## 📖 Overview

**MiniMax-H3 AI Prompt Studio** is a state-of-the-art prompt creation and optimization studio engineered specifically for the **MiniMax-H3 (Hailuo 3 / H3)** multimodal video and audio generation model series.

Adhering 100% to the official MiniMax-H3 [`h3-prompt-writing`](https://github.com/MiniMax-AI/MiniMax-H3/tree/main/skills/h3-prompt-writing) skill specification, the studio transforms high-level creative concepts into production-ready, perfectly formatted prompts with one-click copy functionality.

Featuring a **Quad-Engine Independent Architecture with Dedicated UI Panels**:
1. **🏢 AI Studio Cloud Engine (`server-aistudio.ts`)**: Built for Google AI Studio cloud deployment, accompanied by a pure export tool (`pack_aistudio.bat`) yielding standalone zip bundles with selectable quota tiers (**AI Pro**, **AI Ultra 5x**, **AI Ultra 20x**).
2. **🔑 Local Paid API Direct Engine (`start_paid_api.bat` / `server-paid-api.ts`)**: Direct pay-as-you-go execution utilizing the user's paid Google Gemini API key, unlocking full-core flagship `gemini-3.8-flash` deep reasoning across all tasks without subscription quota constraints.
3. **💻 Local Ollama Offline Engine (`start_ollama.bat` / `server-ollama.ts`)**: 100% private and offline on `http://127.0.0.1:11434`, with **dynamic local model discovery** (automatically scans all installed models like `Qwen3.8-27B-Uncensored`).
4. **⚡ Local llama.cpp Offline Engine (`start_llamacpp.bat` / `server-llamacpp.ts`)**: Pure C/C++ ultra-low latency offline inference for the NVIDIA RTX 5090 (32GB VRAM), with Flash Attention, 32K context windows, and `mmproj` multimodal vision support.

## ✨ Key Features

### 0. Quad-Engine Independent Architecture, Dedicated UI & Pure Packager (v5.0.0)
- **Independent Dedicated Entrypoints**: Fully decoupled monolithic routers into standalone server entrypoints (`server-paid-api.ts`, `server-ollama.ts`, `server-llamacpp.ts`, `server-aistudio.ts`).
- **Dedicated UI Status & Controls**: Frontend UI dynamically locks to the active independent backend with custom indicator panels and a global studio footer.
- **Pure AI Studio Cloud Packager (`pack_aistudio.bat`)**: Zero-offline-artifact exporter creating lightweight deployable bundles.
- **Pure ASCII Batch Scripts**: 100% immune to Windows cmd.exe byte-offset drift and crash bugs.
- **End-to-End Test Suite**: 40 automated tests covering official prompt specifications, syntax auto-repair, and packaging isolation.

### 1. Prompt Audit, Auto-Repair, Series Refinement & Dual Contracts (v4.1.0)
- **Prompt Audit & Lossless Auto-Repair Engine**: Integrated a static regex syntax auditor (`promptAudit.ts`) verifying timeline bounds, normalizing timestamps (`MM:SS.mmm`), scrubbing multimodal leakage tokens (`contact sheet`, `sampled frame`, etc.), and enforcing stationary camera syntax with live UI badges and one-click auto-repair.
- **Series Single-Episode In-Place Refinement**: Surgically refine any individual episode within a multi-episode series via `POST /api/refine-series-episode` while strictly locking the preceding episode's physical ending posture.
- **Dual Output Contracts (Official vs Compact)**: Seamlessly toggle between MiniMax official 6-section/3-section structured prompts and compact dense narrative prose.
- **ComfyUI Workflow Format Copying**: Export full series prompts formatted with chapter dividers (`=== Episode X: ... ===`) ready for direct ingestion by ComfyUI nodes.

### 1. Assistant Director Toggle, Dual-Mode Temperature & Full Prompt Architecture (v4.0.0)
- **Assistant Director Toggle**: Replaced legacy stepped sliders with an intuitive Assistant Director toggle (enabled by default). When enabled, it maintains core storytelling while automatically extrapolating rich environmental and micro-physical interactions (atmospheric depth, air currents, lighting dynamics); when disabled, it acts as a strict technical transcriber with zero extrapolation.
- **Dual-Mode Temperature Strategy**:
  - **Google Gemini**: Automatically omits sampling temperature parameters in Auto mode to leverage Gemini's native model default.
  - **Local Engines (Ollama / llama.cpp)**: Defaults to `0.7` in Auto mode for optimal narrative balance and structural precision.
  - **Manual Mode**: Allows fine-grained manual tuning between `0.0` and `1.5` via an interactive slider.
- **Style & Rendering Conditioning**: Strictly adheres to official specifications (`base-en.txt` line 86) — Text-to-Video (T2VA) allows full custom visual styles and lighting moods, while image-based modes (I2VA, FL2VA, L2VA, Ref2VA) anchor visual style directly from reference imagery to avoid conflicting text adjectives.
- **Direct Full Prompt Generation**: Removed redundant Block 1/2/3 and timeline JSON outputs, directly generating copy-ready `fullPrompt` with official three-state physics (`Starting state -> Action -> End state`), slashing generation token footprints by >70% and accelerating inference by 3~4x.
- **Local Long-Inference Timeout Protection (LLAMACPP_TIMEOUT_MS)**: Extended timeout to 600 seconds (10 minutes, configurable in `.env`), completely preventing premature connection aborts during deep reasoning phases.

### 1. Multi-Image Dual-Track Physical & Semantic Mapping (v3.1.0)
- **Decoupling Physical Slots from Semantic Entities**: Hailuo models strictly index all uploaded images by physical arrival order: `<Picture 1>` (`@image1`), `<Picture 2>` (`@image2`), `<Picture 3>` (`@image3`).
- **Dual Identification & Auto-Alignment**:
  - When multiple images are provided (e.g., 2 character portrait references + 1 opening scene keyframe), the studio automatically maps Character 1 and Character 2 as **`<Subject 1 aka Picture 1> (@image1)`** and **`<Subject 2 aka Picture 2> (@image2)`**.
  - The opening keyframe image dynamically advances to **`<Picture 3> (@image3)`**, preventing the model from erroneously treating a character close-up as the opening composition.
- **Text-Only Subject Declaration Mode**: Supports one-click toggle to "📝 Pure Text Declaration" so that text-only subjects do not waste physical Picture slots.
- **Backend Multimodal Contract (System Protocol 2.1)**: Formally defines `<Subject 1> is ... as depicted in <Picture 1>` in `subject_definitions`, and aligns `detailed_description` [Shot 1] to opening keyframe `<Picture 3>`.

### 1. Multi-Episode Consecutive Series Storyboard Studio (v3.0.0)
- **2 to 10 Sequential Video Prompts Generation**: Generate coherent, step-by-step consecutive video prompts in a single click (recommended 5-clip golden narrative arc: Hook ➔ Progression ➔ Twist ➔ Resolution ➔ Outro).
- **Single Global Inference Context**: Avoids narrative drift and fragmented reasoning by orchestrating the entire sequence with a unified `storyArcSummary`.
- **Persistent State & Inventory Memory**: Automatically carries over character appearance (`<Subject 1>`), held items and inventory (items placed in pockets in Episode 1 can be retrieved in Episode 4), environmental wear (rain-soaked coats, night progression), and causal story goals across all clips.
- **Pure Physical Continuity Hand-off**: Eliminates confusing references to ungenerated videos (e.g. no fake "Resuming from Clip 1"). Episode $K$ naturally and objectively begins by describing the ending posture, held objects, and position from Episode $K-1$. Every prompt is **100% independent, syntactically valid, and immediately copy-ready** for MiniMax-H3!
- **Interactive Series Storyboard Dashboard**:
  - Episode switcher tabs (`Episode #1`, `Episode #2`, ... `Episode #N`).
  - Physical 3-state breakdown cards (`Starting State` ➔ `Action Sequence` ➔ `End State`) + Camera & Soundscape analysis.
  - Quick action toolbar: **Copy Episode Prompt**, **Copy Entire Series (Formatted & Annotated)**, and **Export Markdown Storyboard Script**.

### 2. Objective, Literal & Step-by-Step Physical Motion Directives (v3.0.0)
- **Elimination of Flowery & Abstract Fluff**: Video diffusion models synthesize frames directly from text-to-pixel concepts. Flowery metaphors and emotional adjectives cause severe limb distortions and erratic movements.
- **Literal Step-by-Step Phrasing**:
  - *Bad*: "a ball bouncing around" ➔ *Good*: "A red ball moves to the right, bounces off the wall, and returns to the center"
  - *Bad*: "fluid pouring" ➔ *Good*: "Water flows from the left container through the connecting tube into the right container until both levels are equal"
- **Mandatory 3-State Physical Action Framework**:
  1. **Starting State**: Exact position, posture, held objects, and gaze before motion begins.
  2. **Action Sequence**: Literal chronological movements, trajectories, directions, and physical contacts.
  3. **End State**: Static resting positions, resulting postures, and environmental changes when movement stops.

### 3. Complete MiniMax-H3 Specification Compliance & Studio Layout
- **Studio Layout Polish & 3-Column Rebalancing**: Rebalanced studio grid to `31% / 33% / 36%` (`lg:grid-cols-[31fr_33fr_36fr]`), expanding the middle control column by ~32% to completely eliminate cramped controls and text clipping.
- **Redesigned Camera Motion Directives Panel**:
  - Intuitive category tabs (`Push & Zoom`, `Pan & Truck`, `Tilt & Pedestal`, `Arc & Track`, `Shake & Roll`) with live badge counters and an "Expand All" toggle.
  - Symmetrical 2x2 grid pairing every camera movement with Chinese intent descriptions, direction icons, and active checkmarks (no orphaned buttons).
  - Selected movement tag chips with one-click `✕` removal and quick clear all.
  - Segmented 3-button pill controls for Amplitude (`default`, `small`, `large`) and Speed (`default`, `slow`, `fast`).
  - Global 6px translucent dark micro-scrollbar replacing Windows native scrollbars.
- **Official 3-Dimension Camera Motion (Motion Type + Amplitude + Speed)**:
  - Supports all 12 official motion types: `Zoom In/Out`, `Push In/Pull Out`, `Pan Left/Right`, `Truck Left/Right`, `Tilt Up/Down`, `Pedestal Up/Down`, `Arc Shot`, `Tracking Shot`, `Static Shot`, `Shake Slightly/Strongly`, `POV`, `Roll Clockwise/Counterclockwise`.
  - Configurable amplitude (`with small/large amplitude`) and speed (`at slow/fast speed`), seamlessly composed as natural English actions inside shots without bracketed tag clutter.
- **Official Duration (4s–15s) & Long Video Continuation Architecture**:
  - Eliminates experimental durations and enforces official native 4s–15s single-generation durations.
  - Supports official long-video workflows via Ref2VA `[video continuation]` multi-shot chaining, binding preceding clips (`<Video 1>`) to extend narrative sequences seamlessly.
- **Verbatim Spoken Dialogue & Speaker IDs**:
  - Implements official `<d>[Language] ...</d>` dialogue tags with stable `(S1)`, `(S2)` speaker IDs, off-screen voiceover lip-closure conventions, and across-cut `<scenetrans>` / `<cutoff>` tags.
  - Double quotes `""` strictly reserved for visible on-screen text (signage, neon displays).
- **Base Modes (T2VA, I2VA, FL2VA, L2VA)**:
  - Implements exact header alignment instruction lines for First/Last Keyframes.
  - Generates the standard 3 core fields: `integrated_multimodal_description`, `overall_soundscape`, and `non_diegetic_music`.
- **Full-Reference Mode (Ref2VA)**:
  - Generates the complete 6-section structure: `subject_definitions`, `summary`, `retention_analysis`, `detailed_description`, `overall_soundscape`, and `non_diegetic_music`.
  - Strictly locks official relationship markers (`fully_preserved`, `attribute_transfer`, `fully_copy`, `reference`, etc.).
- **Strict No-Filename Standard**:
  - Automatically strips and filters all raw filenames and extensions from generated prompt output, ensuring prompts strictly adhere to MiniMax-H3 official semantic syntax.

### 4. Quad-Engine Operating Architecture & Native llama.cpp Integration (v3.0.0)
- **Four Distinct AI Engines**:
  - **🏢 AI Studio Cloud Engine (`ai_studio`, Priority 1)**: Engineered for Google AI Studio and Cloud Run subscription environments. Features selectable subscription quota tiers:
    - **🟢 AI Pro (Web UI Quota Optimized - Default)**: Smart model specialization (`gemini-3.5-flash-lite` for dialogues, `gemini-3.6-flash` for media assets, and `gemini-3.8-flash` for core prompts) to guarantee smooth execution without 429 quota exhaustion.
    - **🔵 AI Ultra 5x (Performance)**: 5x quota tier unlocking deeper multi-shot reasoning.
    - **🟣 AI Ultra 20x (Extreme Flagship)**: 20x quota tier with maximum thinking capacity and high-resolution asset retention analysis.
  - **🔑 Local Paid API Direct Engine (`paid_api`, Priority 2)**: Direct pay-as-you-go execution utilizing the user's paid Google Gemini API key. Unconstrained by subscription quota pools, directly unlocks full-core flagship `gemini-3.8-flash` deep reasoning across all tasks without downscaling to lite models.
  - **💻 Local Ollama Offline Engine (`ollama`, Priority 3)**: 100% private and offline on `http://127.0.0.1:11434`, with **dynamic local model discovery** (automatically scans all installed models like `Qwen3.8-27B-Uncensored` without hardcoding), multimodal reference image vision analysis, and reasoning token (`<think>...</think>`) cleansing.
  - **⚡ Local llama.cpp Offline Engine (`llamacpp`, Priority 4)**: Pure C/C++ ultra-high throughput offline inference connecting to `http://127.0.0.1:8080` (`llama-server`).
    - **Hardware-Level Acceleration**: Tailored for flagship consumer GPUs like NVIDIA RTX 5090 (32GB VRAM) with `-ngl 99` full GPU offloading, Flash Attention (`--flash-attn on`), and 32K context windows (`-c 32768`).
    - **Multimodal Projector (`mmproj`)**: 100% automated pairing with vision projectors (`mmproj-*.gguf`), unlocking zero-quota offline image inspection and video scene comprehension.
    - **Native Embedded MTP Acceleration (`--spec-type draft-mtp`)**: Activates Qwen3.8's built-in NextN multi-token prediction heads without third-party patches, providing an immediate **2.23x (+123.4%)** token generation speedup!
- **Priority-Based Auto-Detection & Selection**: Probes the runtime environment on startup and auto-selects the highest priority engine (**AI Studio > Paid API > Ollama > llama.cpp**), while preserving full freedom to manually switch anytime with `localStorage` persistence.
- **Exponential Backoff Retry with Jitter (1s ➔ 2s)**: Automatically catches transient `429 RESOURCE_EXHAUSTED` and `503 UNAVAILABLE` errors, retrying up to 2 times with randomized jitter before failover to smooth out burst rate limits.
- **Resilient Multi-Model Fallback**: Automatically switches to backup models (`gemini-3.8-flash` ➔ `gemini-3.6-flash` ➔ `gemini-3.5-flash-lite`) if a model's quota is exhausted. Automatically skips retries for permanent errors (e.g. 404).
- **Ultra-Relaxed Safety Policy (`HarmBlockThreshold.BLOCK_NONE`)**: Configured `BLOCK_NONE` across all core harm categories (harassment, hate speech, sexually explicit, dangerous content, civic integrity) to maximize creative storytelling freedom.
- **Real-Time Safety Block Notification System**: Dual-layer detection inspecting both prompt-level and candidate-level safety filters (`SAFETY`, `PROHIBITED_CONTENT`, `BLOCKLIST`, `IMAGE_SAFETY`), providing actionable guidance toasts in the UI when sensitive content is flagged.

### 3. Multimodal Reference Asset Manager (Zero-Quota Direct Vision)
- Upload character, scene, or prop reference assets directly in the browser.
- **Direct Multimodal Vision**: Attached reference images are bundled directly into the generation request, enabling Gemini, Ollama, and llama.cpp (via `mmproj`) to visually inspect faces, clothing, colors, and lighting with 0 extra API calls.
- **Ultra-Light Token Optimization**: Automatically downscales images to 512px (quality 0.75, ~35KB payload), consuming only ~258 tokens per image and completely eliminating 429 quota exhaustion.
- **Semantic Labeling**: Uploaded assets automatically receive clean semantic labels (e.g. `首幀開場畫面`, `主要角色 1`), keeping raw filenames completely decoupled from generated prompt text.

### 4. Cinematic Dialogue & Soundscape Configuration
- Intuitive on-screen dialogue and SFX ambient sound configuration designed for lip-sync and auditory immersion.
- Support for background music suppression (`non_diegetic_music: N/A`).

### 5. Production-Ready Studio UI (v1.5.0 Architecture)
- **Three-Column Widescreen Layout (`max-w-[1800px]`, 31% / 33% / 36%)**: Dedicated columns for Input Concept & References (Left 31%), Parameter Configuration & Generation (Middle 33%), and Output Inspector & One-Click Copy (Right 36%).
- **Dedicated Prompt Editor Toolbar**: Independent toolbar above the prompt viewer featuring live mode status indicators (`語法亮顯預覽` / `手動微調編輯`), character counter, and a one-click "還原初版" button.
- **Adaptive Generation Mode Grid**: Responsive `grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2` preventing text truncation across screen sizes.
- **Spacious & Adjustable Idea Input Canvas**: Substantially expanded textarea (`rows={8}`, `min-h-[240px]`) with 5-step font sizing (12px ~ 20px), stepper controls, and `localStorage` persistence.
- **AI Engine & Quota Switcher**: Instant switching between AI Studio, Ollama, llama.cpp, and Paid API engines with tooltip guides and `localStorage` persistence.
- **Unified Toast Notifications**: Non-blocking floating toasts across all workflows.
- **Preset Library & Temporal Timeline**: Curated scene presets and interactive visual shot timeline.
- **One-Click Export**: Copy the full prompt or individual blocks directly ready to paste into MiniMax-H3.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite 6, Lucide Icons, Motion
- **Styling**: Tailwind CSS v4
- **Backend / API**: Express 4, TypeScript, `tsx`, `esbuild`
- **AI Engines**:
  - **AI Studio Cloud Engine**: Google Gemini 3.8 Flash / 3.6 Flash / 3.5 Flash-Lite (Tiered Pro / Ultra 5x / Ultra 20x)
  - **Paid API Direct Engine**: Direct Google Gemini 3.8 Flash flagship execution
  - **Local Ollama Offline Engine**: Dynamic model scanning (native support for `Qwen3.8-27B-Uncensored` in `q8_0`, `q6_K`, `q5_K_M`)
  - **Local llama.cpp Offline Engine**: `llama-server` (RTX 5090 `-ngl 99`, Flash Attention, 32K context, `mmproj` vision, Native Embedded MTP)

---

## 🚀 Getting Started

### ⚡ Windows One-Click Launchers (Select by Engine)

Double-click the dedicated launcher for your target AI inference backend:

1. **🔑 Gemini Paid API Direct Studio**: Double-click **`start_paid_api.bat`**
   - Direct flagship Gemini 3.8 Flash execution with deep reasoning for API key owners.
2. **💻 Local Ollama Offline Studio**: Double-click **`start_ollama.bat`**
   - Automatically wakes the local Ollama service and scans all installed models.
3. **⚡ Local llama.cpp (RTX 5090) Offline Studio**: Double-click **`start_llamacpp.bat`**
   - 2-in-1 intelligent launcher! Scans `C:\llama.cpp\models` for GGUF models, auto-pairs `mmproj` vision projections, enables Embedded MTP 2.23x acceleration, and launches the web studio.
4. **📦 Google AI Studio Pure Packager**: Double-click **`pack_aistudio.bat`**
   - Filters all local dependencies and exports a clean, lightweight (~80KB) `minimax-h3-aistudio.zip` ready for instant upload to Google AI Studio!

### 💻 Manual Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Environment Variables:
   Create a `.env` file in the root directory (or copy from `.env.example`):
   ```env
   # Required for Gemini Cloud Mode
   GEMINI_API_KEY="your_actual_gemini_api_key_here"

   # Optional for Ollama Local Mode (Defaults to 127.0.0.1:11434)
   OLLAMA_BASE_URL="http://127.0.0.1:11434"
   DEFAULT_OLLAMA_MODEL="orcarouter/Qwen3.8-27B-Uncensored:q6_K"

   # Optional for llama.cpp Local Mode (Defaults to 127.0.0.1:8080)
   LLAMACPP_BASE_URL="http://127.0.0.1:8080"
   DEFAULT_LLAMACPP_MODEL="default"
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 📜 Available Scripts

### 🎛️ Windows Launchers
| Script | Description |
| :--- | :--- |
| `start_paid_api.bat` | **Gemini Paid API Direct**: Flagship 3.8 Flash direct execution |
| `start_ollama.bat` | **Local Ollama Studio**: Auto-starts Ollama service and web studio |
| `start_llamacpp.bat` | **Local llama.cpp Studio**: 2-in-1 launcher with RTX 5090 model scanner |
| `pack_aistudio.bat` | **AI Studio Pure Packager**: Generates `minimax-h3-aistudio.zip` for AI Studio |

### 💻 NPM Commands
| Command | Description |
| :--- | :--- |
| `npm test` | **Runs the automated behavior test suite** (40 tests across 5 domains) |
| `npm run dev` | Starts the multi-engine server in development mode |
| `npm run dev:paid-api` | Starts the dedicated Paid API server |
| `npm run dev:ollama` | Starts the dedicated Ollama server |
| `npm run dev:llamacpp` | Starts the dedicated llama.cpp server |
| `npm run dev:aistudio` | Starts the dedicated AI Studio cloud server |
| `npm run pack:aistudio` | Exports the pure AI Studio distribution (`dist-aistudio/`) |
| `npm run build` | Builds client bundle and compiles `server.ts` |
| `npm run build:aistudio`| Builds pure AI Studio distribution server bundle |
| `npm run lint` | Runs TypeScript static type checking (`tsc --noEmit`) |

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
├── package.json          # Project dependencies and metadata (v4.0.0)
└── tsconfig.json         # TypeScript configuration
```

---

## 📄 Versioning & Changelog

This project adheres to Semantic Versioning. For detailed release notes and migration guides, please refer to [CHANGELOG.md](CHANGELOG.md).

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
