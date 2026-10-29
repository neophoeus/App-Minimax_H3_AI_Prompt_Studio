<div align="center">

# 🎬 MiniMax-H3 AI Prompt Studio

**Professional Prompt Engineering Platform Tailored for MiniMax-H3 (Hailuo 3) Video & Audio Generation Models**

[![Version](https://img.shields.io/badge/version-v6.1.0-blue.svg)](CHANGELOG.md)
[![Model](https://img.shields.io/badge/AI%20Engine-Gemini%203.8%20%7C%20Ollama%20%7C%20llama.cpp-orange.svg)](https://deepmind.google/technologies/gemini/)
[![Framework](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite-green.svg)](https://react.dev/)
[![Styling](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38bdf8.svg)](https://tailwindcss.com/)

[English](README.md) • [繁體中文](README.zh-TW.md)

</div>

---

## 📖 Overview

**MiniMax-H3 AI Prompt Studio** is a state-of-the-art prompt creation and optimization studio engineered specifically for the **MiniMax-H3 (Hailuo 3 / H3)** multimodal video and audio generation model series.

Adhering 100% to the official MiniMax-H3 [`h3-prompt-writing`](https://github.com/MiniMax-AI/MiniMax-H3/tree/main/skills/h3-prompt-writing) skill specification, the studio transforms high-level creative concepts into production-ready, perfectly formatted prompts with one-click copy functionality.

Featuring a **Tri-Engine Independent Architecture with Dedicated UI Panels**:
1. **🔑 Local Gemini API Direct Engine (`start_gemini_api.bat` / `server-gemini-api.ts`)**: Direct Pay-as-you-go execution utilizing Google Gemini API, aligned with official default Off safety policies, featuring task-adaptive thinking budgets, 75% image token reduction (`MediaResolution.MEDIA_RESOLUTION_LOW`), and dynamic schema pruning.
2. **💻 Local Ollama Offline Engine (`start_ollama.bat` / `server-ollama.ts`)**: 100% private and offline on `http://127.0.0.1:11434`, with **dynamic local model discovery** (automatically scans all installed models like `Qwen3.8-27B-Uncensored`).
3. **⚡ Local llama.cpp Offline Engine (`start_llamacpp.bat` / `server-llamacpp.ts`)**: Pure C/C++ ultra-low latency offline inference for the NVIDIA RTX 5090 (32GB VRAM), with Flash Attention, 32K context windows, and `mmproj` multimodal vision support.

## ✨ Key Features

### 0. Default Safety Alignment, Pure Pay-as-you-go & Deep Token Optimization (v6.1.0)
- **Official Safety Settings Default Off Alignment**: Per official Gemini API documentation, safety filters are Off by default in Gemini 2.5 / 3.x / 4 models. All manual `safetySettings` configurations have been removed, relying strictly on native default Off behavior while retaining passive system block detection.
- **Pure Pay-as-you-go Architecture**: Completely eliminated quota fallback loops, multi-model downgrade chains (`fallbackModels`), exponential backoff retries, and legacy Free Tier UI copy for ultra-low latency direct calls.
- **Deep Token Optimization Matrix**:
  - **75% Image Token Reduction**: Native `MediaResolution.MEDIA_RESOLUTION_LOW` compresses multimodal input to 280 tokens/image (down from 1,120 tokens/image).
  - **Task-Adaptive Thinking Budgets**: Explicit `ThinkingLevel` per task (`HIGH` for prompt generation, `LOW` for optimization and media analysis, `MINIMAL` with `gemini-3.5-flash-lite` for dialogue) with `includeThoughts: false`.
  - **Dynamic Schema Pruning**: Automatically strips series and episode definitions in single-shot mode to eliminate output token overhead.
  - **Mode-Specific Prompt Injection**: Prunes irrelevant keyframe alignment rules outside active modes (T2VA, I2VA, Ref2VA).

### 1. Tri-Engine Unification & AI Studio Preview Decommissioning (v6.0.0)
- **AI Studio Preview Decommissioned**: Google AI Studio deprecated browser front-end subscription quota injection, standardizing exclusively on direct API key access. Dedicated preview servers (`server-aistudio.ts`), pure packaging scripts (`pack-aistudio.ts`, `pack_aistudio.bat`), and subscription tier selectors have been completely removed with zero residual dead code.
- **Gemini API Direct Engine (`gemini_api`)**: Renamed and unified Paid API to Gemini API Direct, delivering full-core `gemini-3.8-flash` reasoning with native support for both Google AI Studio Free Tier (15 RPM) and Google Cloud Pay-as-you-go keys.
- **Enhanced Placeholder & Rate Limit Protection**: Built-in interception for unconfigured `MY_GEMINI_API_KEY` placeholders and automatic downward compatibility for legacy browser `localStorage`.

### 1. Observable Physical State Principles, 3-in-1 AI Assistants & MiniMax-H3 Full Spec Alignment (v5.3.0)
- **Relaxation of Physical State Descriptions**: Shifted from rigid 3-state formulas and mandatory 120-250 word count quotas to a flexible, objective physical principle: "Focus on concrete, visually observable physical states and actions without abstract adjectives or poetic metaphors."
- **MiniMax-H3 Official Spec Gaps Filled**:
  - **L2VA Dynamic Alignment Header**: Integrates dynamic ending timecode headers (`How the reference pictures align with the target video — <Picture 1> (from [Shot N]) aligns with the S.SS-second mark...`).
  - **Full Official Tag Support**: Added lyrics `<l>[Language] ...</l>`, cross-shot dialogue continuation `<scenetrans>`, and truncation `<cutoff>` syntax highlighting and audit rules.
  - **Image-Free Ref2VA Style Customization**: Freely customize styles and lighting when Ref2VA has no uploaded image references.
- **3-in-1 AI Assistant Buttons in UI**:
  - **🔍 AI Media Analysis (`/api/analyze-reference-media`)**: One-click visual feature and material extraction into `Retention Analysis`.
  - **✨ AI Dialogue Generator (`/api/generate-dialogue`)**: Context-aware spoken line (`<d>[Language] ...</d>`) and soundscape suggestions.
  - **🪄 AI Spec Optimizer (`/api/optimize-existing-prompt`)**: Reformat rough drafts or manual edits into compliant MiniMax-H3 prompts.
- **Modernized Gemini 3.8 Router**: Flagship `gemini-3.8-flash` for generation and media analysis, high-speed `gemini-3.5-flash-lite` for dialogue, using `@google/genai` `ThinkingLevel.MINIMAL`.
- **Expanded Test Suite**: 49 automated tests covering syntax audit, auto-repair, and engine routing (100% pass).

### 1. Deep Director Reasoning & Multi-Dimensional Rich Context Enrichment (v5.2.0)
- **4-Dimensional Cinematic Deduction Framework**:
  - **Preceding Context & Causality**: Autonomously extrapolates immediate historical events (5–15 seconds prior) and grounds psychological tension into concrete physiological symptoms (rapid shallow breathing, beaded sweat reflections on temples, white-knuckled grips, frayed seams, and subsequent physical consequences).
  - **Surrounding World Dynamics & Ambient Life**: Eliminates empty stage syndrome by injecting living world events: foreground obstruction layers (out-of-focus railings, rain streaks), background micro-events (passing headlights, flickering buzzing neon, windblown debris), and realistic environmental reactions.
  - **Tactile, Material & Sensory Grounding**: Fills in unstated textures (distressed leather, brushed aluminum, pitted concrete, oil-stained timber), precise light color temperatures, and multi-phase physical mechanics.
  - **Substantial Narrative Density & Text Volume**: Explicitly aims for 120–250 English words per shot of dense, cinema-grade literal physical prose. Clarifies that strict objectivity does not mean sparse minimalism.
- **Structured Chinese Explanations (`explanationZh`)**: Transparently lists deduced antecedents, surrounding background dynamics, and added physical materials.
- **Enhanced UI Controls**: "深度推演增強" dynamic badge on the Assistant Director toggle.

### 1. Universal Visual Reference Decoupling & MiniMax-H3 Spec Alignment (v5.1.0)
- **Subject General Reference Decoupling**: Completely decoupled `<Subject N>` general reference images from opening keyframes (`<Picture N>`). Unless explicitly assigned a keyframe role (`first_keyframe`, `keyframe`, `composition`), uploaded images are never erroneously declared as first keyframes.
- **Strict MiniMax-H3 Official Spec Compliance (`ref-en.txt`)**: In `Ref2VA`, visual reference images are cleanly cited inside `<Subject K>` definitions; suppresses redundant standalone picture declarations, mandates `[reference generation]` task types, and ensures `[Shot 1]` unfolds freely based on story action.
- **Universal Format-Neutral Support**: General visual referencing across characters, objects, vehicles, scenes, and styles without restrictive layout or turnaround assumptions.
- **Automated Regression Suite**: 42 automated tests ensuring specification compliance and packaging isolation.

### 1. Independent Dedicated Architecture & UI (v5.0.0)
- **Independent Dedicated Entrypoints**: Fully decoupled monolithic routers into standalone server entrypoints (`server-gemini-api.ts`, `server-ollama.ts`, `server-llamacpp.ts`).
- **Dedicated UI Status & Controls**: Frontend UI dynamically locks to the active independent backend with custom indicator panels and a global studio footer.
- **Pure ASCII Batch Scripts**: 100% immune to Windows cmd.exe byte-offset drift and crash bugs.
- **End-to-End Test Suite**: Automated tests covering official prompt specifications, syntax auto-repair, and engine isolation.

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

### 4. Tri-Engine Operating Architecture & Native llama.cpp Integration (v3.0.0)
- **Three Distinct AI Engines**:
  - **🔑 Local Gemini API Direct Engine (`gemini_api`, Priority 1)**: Direct execution utilizing Google Gemini API keys (supporting both Google AI Studio Free Tier and Google Cloud Pay-as-you-go). Directly unlocks full-core flagship `gemini-3.8-flash` deep reasoning across all tasks.
  - **💻 Local Ollama Offline Engine (`ollama`, Priority 2)**: 100% private and offline on `http://127.0.0.1:11434`, with **dynamic local model discovery** (automatically scans all installed models like `Qwen3.8-27B-Uncensored` without hardcoding), multimodal reference image vision analysis, and reasoning token (`<think>...</think>`) cleansing.
  - **⚡ Local llama.cpp Offline Engine (`llamacpp`, Priority 3)**: Pure C/C++ ultra-high throughput offline inference connecting to `http://127.0.0.1:8080` (`llama-server`).
    - **Hardware-Level Acceleration**: Tailored for flagship consumer GPUs like NVIDIA RTX 5090 (32GB VRAM) with `-ngl 99` full GPU offloading, Flash Attention (`--flash-attn on`), and 32K context windows (`-c 32768`).
    - **Multimodal Projector (`mmproj`)**: 100% automated pairing with vision projectors (`mmproj-*.gguf`), unlocking zero-quota offline image inspection and video scene comprehension.
    - **Native Embedded MTP Acceleration (`--spec-type draft-mtp`)**: Activates Qwen3.8's built-in NextN multi-token prediction heads without third-party patches, providing an immediate **2.23x (+123.4%)** token generation speedup!
- **Priority-Based Auto-Detection & Selection**: Probes the runtime environment on startup and auto-selects the highest priority engine (**Gemini API > Ollama > llama.cpp**), while preserving full freedom to manually switch anytime with `localStorage` persistence.
- **Exponential Backoff Retry with Jitter (1s ➔ 2s)**: Automatically catches transient `429 RESOURCE_EXHAUSTED` and `503 UNAVAILABLE` errors, retrying up to 2 times with randomized jitter before failover to smooth out burst rate limits.
- **Resilient Multi-Model Fallback**: Automatically switches to backup models (`gemini-3.8-flash` ➔ `gemini-3.5-flash-lite`) if a model's quota is exhausted. Automatically skips retries for permanent errors (e.g. 404).
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
- **AI Engine & Quota Switcher**: Instant switching between Gemini API, Ollama, and llama.cpp engines with tooltip guides and `localStorage` persistence.
- **Unified Toast Notifications**: Non-blocking floating toasts across all workflows.
- **Preset Library & Temporal Timeline**: Curated scene presets and interactive visual shot timeline.
- **One-Click Export**: Copy the full prompt or individual blocks directly ready to paste into MiniMax-H3.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite 6, Lucide Icons, Motion
- **Styling**: Tailwind CSS v4
- **Backend / API**: Express 4, TypeScript, `tsx`, `esbuild`
- **AI Engines**:
  - **Gemini API Direct Engine**: Direct Google Gemini 3.8 Flash flagship execution (Free Tier & Pay-as-you-go)
  - **Local Ollama Offline Engine**: Dynamic model scanning (native support for `Qwen3.8-27B-Uncensored` in `q8_0`, `q6_K`, `q5_K_M`)
  - **Local llama.cpp Offline Engine**: `llama-server` (RTX 5090 `-ngl 99`, Flash Attention, 32K context, `mmproj` vision, Native Embedded MTP)

---

## 🚀 Getting Started

### ⚡ Windows One-Click Launchers (Select by Engine)

Double-click the dedicated launcher for your target AI inference backend:

1. **🔑 Gemini API Direct Studio**: Double-click **`start_gemini_api.bat`**
   - Direct flagship Gemini 3.8 Flash execution with deep reasoning for API key owners (Free Tier & Pay-as-you-go).
2. **💻 Local Ollama Offline Studio**: Double-click **`start_ollama.bat`**
   - Automatically wakes the local Ollama service and scans all installed models.
3. **⚡ Local llama.cpp (RTX 5090) Offline Studio**: Double-click **`start_llamacpp.bat`**
   - 2-in-1 intelligent launcher! Scans `C:\llama.cpp\models` for GGUF models, auto-pairs `mmproj` vision projections, enables Embedded MTP 2.23x acceleration, and launches the web studio.

### 💻 Manual Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Environment Variables:
   Create a `.env` file in the root directory (or copy from `.env.example`):
   ```env
   # Required for Gemini Cloud Mode (Free Tier or Pay-as-you-go)
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
| `start_gemini_api.bat` | **Gemini API Direct**: Flagship 3.8 Flash direct execution (Free Tier / Pay-as-you-go) |
| `start_ollama.bat` | **Local Ollama Studio**: Auto-starts Ollama service and web studio |
| `start_llamacpp.bat` | **Local llama.cpp Studio**: 2-in-1 launcher with RTX 5090 model scanner |

### 💻 NPM Commands
| Command | Description |
| :--- | :--- |
| `npm test` | **Runs the automated behavior test suite** |
| `npm run dev` | Starts the server in development mode (`server-gemini-api.ts`) |
| `npm run dev:gemini-api` | Starts the dedicated Gemini API server |
| `npm run dev:ollama` | Starts the dedicated Ollama server |
| `npm run dev:llamacpp` | Starts the dedicated llama.cpp server |
| `npm run build` | Builds client bundle and compiles `server-gemini-api.ts` |
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
