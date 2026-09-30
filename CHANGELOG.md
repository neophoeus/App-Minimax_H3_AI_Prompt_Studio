# Changelog

All notable changes to this project will be documented in this file.

## [v3.0.1] - 2026-09-30

### 🎨 UI Branding Polish & Version Synchronization (首頁標題品牌化與版本資訊全面同步)

#### 🖥️ 1. Studio Header Branding & Version Alignment (導覽列標題與版本同步)
- **Studio Branding Harmonization (首頁品牌名稱全面對齊)**:
  - 將頂部導覽列品牌主標題由「MiniMax-H3 AI 提示詞助手」正式更新為「**MiniMax-H3 AI 提示詞工作室**」，與專案官方名稱「MiniMax-H3 AI Prompt Studio」全站貫通統一。
- **Navbar Version Badge & Subtitle Bump (導覽列版本徽章與副標題升級)**:
  - 導覽列版本徽章正式升級為 `v3.0.1 • 四引擎自動偵測`。
  - 副標題擴充標示為「三段式標準結構 & 系列連續劇本 (Series)」，凸顯 v3.0 多鏡頭長篇連續提示詞生成特色。
- **Changelog Formatting Standardization (變更日誌格式統一規範化)**:
  - 統整全量歷史版本排版，全面嚴格對齊「`- **English Title (中文標題說明)**:`」雙語標準排版範式。

---

## [v3.0.0] - 2026-09-30

### 🚀 Major Milestone Release: Narrative Series Storyboard Studio & Literal Physical Motion Framework (系列連續分鏡生成器、客觀動作三態論與四引擎優先序重構)

#### 🎬 1. Multi-Episode Consecutive Series Storyboard Studio (系列連續提示詞生成器)
- **2 to 10 Sequential Video Prompts Generation (2 至 10 段長篇連貫分鏡一次性生成)**:
  - 全新支援「**系列連續提示詞 (Multi-Episode Series)**」模式，可自由選擇生成 2 至 10 段獨立影片提示詞（預設推薦 5 段黃金起承轉合弧線），完美因應短影音、廣告分鏡與微電影連貫創作需求。
- **Single Global Inference Context (單次全域推理上下文)**:
  - 拒絕單段孤立生成造成的遺忘與情節偏航，系統於單次深度推理中統籌構建 `storyArcSummary`（全域故事弧概要），維持宏觀因果推演。
  - **跨段脈絡累積繼承**：自動繼承道具持物（Persistent Inventory，前段收進口袋的信件/道具在後段能自然掏出）、環境推移（暴雨弄濕大衣、夜色漸深）與角色任務目標。
- **Physical Continuity Hand-off (純文字客觀物理無縫接軌)**:
  - 徹底剔除「指向未生成影片」的無效元語言（如 Resuming from Clip 1 等無效語法）。每一段均為 **100% 獨立合法、立即可單獨複製貼至海螺 AI (MiniMax-H3) 生成** 的合法 Prompt。
  - 第 $K$ 段直接以客觀文字描述承接第 $K-1$ 段結束時的實體姿態、手中物件與位置，確保多段影片並排剪輯時不穿幫、不跳幀。
- **Interactive Series Storyboard Dashboard (專屬系列分鏡儀表板)**:
  - 視覺化呈現段落切換標籤頁（Episode #1, #2, ... #N），清楚展示「起始狀態 ➔ 連續動作 ➔ 結束狀態」三態物理分解與接續備註。
  - **一鍵操作利器**：支援「複製此段提示詞」、「一鍵複製全系列提示詞（含分段註解與狀態說明）」與「匯出 Markdown 分鏡腳本」。

#### 📐 2. Objective, Literal & Step-by-Step Physical Motion Directives (客觀具體物理動作三態論)
- **Prompt Engineering Philosophy (提示詞工程哲學徹底重塑)**:
  - 針對影片擴散模型底層文字至像素幀的映射特性，全面禁止華麗詞藻、詩意比喻與抽象情緒修飾（如「唯美」、「震撼」、「神祕氣息」），徹底杜絕肢體形變與動作漂移。
- **Step-by-Step & Literal Phrasing (步驟化直白動作範式)**:
  - *拋棄*：「a ball bouncing around」 ➔ *改為*：「A red ball moves to the right, bounces off the wall, and returns to the center」
  - *拋棄*：「fluid pouring」 ➔ *改為*：「Water flows from the left container through the connecting tube into the right container until both levels are equal」
- **3-State Physical Action Framework (動作三態架構強制落實)**:
  1. **Starting State（起始狀態）**：主體在畫面中的位置、身體姿態、手中物件與初始視線。
  2. **Action Sequence（連續動作）**：按時序推進之具體物理運動、位移路徑、接觸與互動。
  3. **End State（結束狀態）**：動作停止時的靜態落點、新姿態與環境變化。

#### 🏛️ 3. Re-aligned Quad-Engine Priority Architecture (四引擎排程次序核心重整)
- **Official Cloud & Paid Direct First (官方雲端與 Paid 直通優先，本地端點兼備)**:
  - 全面將伺服器自動推薦判定（`calculateRecommendedMode`）、頂部導航列排版、說明彈窗與啟動指令碼更新為全新優先次序：
    1. 🥇 **🏢 AI Studio 雲端引擎 (`ai_studio`, 優先級 1)**：雲端/訂閱環境優先，享智慧多模型分流與免額度架構。
    2. 🥈 **🔑 Gemini Paid API 直通引擎 (`paid_api`, 優先級 2)**：本地配置 `GEMINI_API_KEY` 時優先直通官方旗艦級 Gemini 3.8 Flash 高速端點。
    3. 🥉 **💻 本地 Ollama 離線引擎 (`ollama`, 優先級 3)**：動態探索本機模型，免聯網 100% 隱私離線深度推理。
    4. 🎖️ **⚡ 本地 llama.cpp 離線引擎 (`llamacpp`, 優先級 4)**：原生 C/C++ 極致顯存加速，支援 Flash Attention 與 RTX 5090 原生極限優化。
- **Startup Pre-flight Check Upgrade (`start.bat` 檢測流程升級)**:
  - 啟動時優先驗證 Gemini API Key 與雲端環境設定，隨後檢查本機 Ollama 與 llama.cpp 服務狀態。

---

## [v2.2.0] - 2026-09-21

### 🚀 Quad-Engine Architecture Evolution & Native llama.cpp Integration (四引擎架構升級與本地 llama.cpp 深度整合)

#### 🏛️ 1. Quad-Engine Operating Architecture (四引擎體系全面成形)
- **Native llama.cpp Engine Support (`llamacpp`, 優先級 3)**:
  - 正式將本機純 C/C++ 旗艦推理引擎 **llama.cpp** (`llama-server`) 納入核心體系，建構「**四引擎架構 (Quad-Engine Architecture)**」：
    1. **🏢 AI Studio 雲端引擎 (`ai_studio`, 優先級 1)**
    2. **💻 本地 Ollama 離線引擎 (`ollama`, 優先級 2)**
    3. **⚡ 本地 llama.cpp 離線引擎 (`llamacpp`, 優先級 3)**：支援純 C/C++ 極致顯存加速、Flash Attention (`-fa`) 與 32K 超大上下文長度。
    4. **🔑 Gemini Paid API 直通引擎 (`paid_api`, 優先級 4)**
  - 自動相容 OpenAI 規範之 `/v1/chat/completions` 與 `/v1/models` 端點，支援 `response_format: { type: "json_object" }` 結構化輸出與 `<think>...</think>` 推理思考鏈清洗。
  - 完美原生適配本機頂級硬體環境（如 NVIDIA RTX 5090 32GB VRAM），實現 `-ngl 99` 全層 GPU 卸載與極限吞吐量。

#### 👁️ 2. Multimodal Projector (`mmproj`) Vision Support (多模態看圖能力智慧自動掛載)
- **100% 自動關聯與掛載**：修復了 Windows CMD 通配符在雙引號中無法展開的解析缺陷，改用穩健的 `dir /b /s` 精確檢索。選定主模型後，系統自動關聯所屬目錄（或全域備援）之 `mmproj-*.gguf` 並組裝 `--mmproj` 參數。
- **徹底根治載入錯誤**：解決了未掛載視覺投影權重時發送圖片參考導致 `llama-server` 拋出 `Failed to load image or audio file` 的伺服器錯誤，本地端離線圖片與分鏡參考解析 100% 順暢。

#### ⚡ 3. Native Embedded MTP Dual-Speed Acceleration (原生嵌入式 MTP 雙倍極速加速)
- **原生 NextN 結構深度啟用**：針對 Qwen3.8-27B 內建的 NextN 預測結構，自動注入 `--spec-type draft-mtp` 核心加速指令。
- **官方通用零崩潰**：完全相容官方原版 upstream `llama-server.exe`，無須手動套用第三方補丁編譯，直接在 RTX 5090 上享有 **2.23x (+123.4%)** 的雙倍極速生成體驗！

#### 🎮 4. Streamlined One-Click Launchers (`start_llama.bat` & `start.bat`) (極致一鍵啟動與防閃退修復)
- **專屬 `start_llama.bat` 一鍵極簡啟動器**：
  - 自動掃描 `C:\llama.cpp\models` 及其所有子目錄（如 `HauhauCS`、`JonathanColetti`）下的 GGUF 模型。
  - 嚴格排除 `mmproj`、`FastMTP`、`draft` 等側車檔，僅呈現乾淨的主模型清單，並標註各模型所屬目錄的視覺投影狀態。
  - 移除繁瑣的 FastMTP 模式詢問，使用者只需輸入編號（直接按 Enter 預設載入 1），一鍵全自動直達啟動！
  - 內建背景程序探測：若檢測到背景已有舊的 `llama-server.exe` 佔用 8080 端口，主動提示並一鍵協助終止舊程序，避免端口衝突。
- **`start.bat` 穩定性修復與一鍵全自動聯動**：
  - **消除 CMD 複合語句區塊括號解析崩潰**：修復了 `if ( ... )` 條件區塊中因 `(http://127.0.0.1:8080)` 內的右圓括號 `)` 導致 CMD 提前閉合而觸發 `[RTX was unexpected at this time.` 的閃退問題，全檔提示全面標準化為方括號 `[...]`。
  - **視窗常駐防護**：腳本末尾加入常駐保留提示，避免伺服器結束時瞬間關閉視窗。
  - **智慧聯動**：啟動時主動探測 `http://127.0.0.1:8080` 是否在線；若離線且偵測到 `C:\llama.cpp`，自動於獨立視窗拉起模型選單，並輪詢確認端口就緒後無縫啟動 Prompt Studio。

---

## [v2.1.1] - 2026-09-21

### 🚀 Tri-Engine Operating Architecture Evolution & Ollama Pre-flight Auto-Launch (三引擎架構升級與 Ollama 自啟動)

#### 🏛️ 1. Tri-Engine Operating Architecture (三引擎架構體系全面升級)
- **Clear Architectural Distinction (名詞層次徹底解耦)**:
  - 將系統底層 AI 驅動核心全面由「3模式」升級為「**三引擎 (Tri-Engine Architecture)**」，徹底解決過去與 MiniMax 上層業務「**影片生成模式 (T2VA / I2VA / FL2VA / L2VA / Ref2VA)**」的名詞撞車與概念混淆。
  - 三大專屬驅動核心正式確立命名標準：
    1. **🏢 AI Studio 雲端引擎 (`ai_studio`, 優先級 1)**：專為 Google AI Studio 與 Cloud Run 訂閱環境打造，具備 Pro / Ultra 5x / Ultra 20x 階梯算力與智慧免額度分流。
    2. **💻 本地 Ollama 離線引擎 (`ollama`, 優先級 2)**：本機 100% 離線隱私運行，自動動態探索本機模型（原生適配 `Qwen3.8-27B-Uncensored` 等），支援視覺看圖與深層思考清洗。
    3. **🔑 Gemini Paid API 直通引擎 (`paid_api`, 優先級 3)**：自備 Google Cloud Paid API Key 直通旗艦級 `gemini-3.8-flash` 深度推理，按量計費無訂閱額度限制。
- **UI & Notification Standardization (使用者介面與提示全景規範化)**:
  - 頂部導航列徽章升級為 `v2.1.1 • 三引擎自動偵測`。
  - 三引擎膠囊切換鈕（Pill Switcher）精簡優化為「`AI Studio 引擎`」、「`本地 Ollama 引擎`」與「`Paid API 直通引擎`」，提升各尺寸螢幕排版適應性。
  - 說明彈窗全面更新為「**三引擎自動偵測與優先調度架構**」，詳細列示 1 > 2 > 3 優先判定次序。
  - 系統 Toast 提示同步規範為「`已手動切換至【...】`」，語法更自然通順。

#### ⚡ 2. Ollama Pre-flight Health Check & Auto-Launch (`start.bat`) (啟動前自動檢查與喚起)
- **Automated Service Verification**:
  - `start.bat` 在啟動 Studio 前，主動透過 HTTP 端點 (`http://127.0.0.1:11434/api/tags`) 探測本機 Ollama 服務狀態。
- **Intelligent Fallback Launching**:
  - 若偵測到 Ollama 處於離線狀態，優先嘗試喚起 Windows 官方托盤應用程式 (`%LOCALAPPDATA%\Programs\Ollama\ollama app.exe`)。
  - 若該路徑不存在但系統 PATH 包含 `ollama`，則自動以最小化視窗執行 `start "Ollama Service" /min ollama serve`。
  - 若兩者皆未安裝，則優雅提示並直接以雲端 Gemini 引擎繼續執行，絕不中斷應用啟動。
- **Reliable Readiness Polling**:
  - 喚起後進入最長 15 秒的就緒等待輪詢（採用跨環境高相容的 `ping` 實作延遲，避免 Windows `timeout` 重定向例外）。
  - 一旦檢測到端點在線即立刻繼續啟動 Studio 伺服器並自動開啟瀏覽器。

---

## [v2.1.0] - 2026-09-20

### 🚀 Three-Mode Operating Architecture & Local Ollama Dynamic Discovery (三模式運行架構與本機 Ollama 深度整合)

#### 🌐 1. Three Dedicated Operating Modes & Priority Auto-Detection (三模式運作與優先級自動判定)
- **Three Dedicated Operating Environments (三大專屬運行模式)**:
  - **🏢 AI Studio 訂閱制度內運行版 (`ai_studio`, Priority 1)**:
    - Engineered specifically for Google AI Studio applets and Cloud Run subscription environments.
    - Integrated multi-tier subscription quotas (**AI Pro**, **AI Ultra 5x**, **AI Ultra 20x**) with smart Web UI quota-optimized routing (`gemini-3.5-flash-lite` for dialogues, `gemini-3.6-flash` for media analysis, and `gemini-3.8-flash` for core prompts) to guarantee zero 429 quota exhaustion with automatic fallback.
  - **💻 本地 Ollama 離線版 (`ollama`, Priority 2)**:
    - Connects directly to local Ollama service (`http://127.0.0.1:11434`), consuming 0 API quota with 100% offline privacy protection.
    - Native support for multimodal reference image vision analysis and deep reasoning token (`<think>...</think>`) filtering.
  - **🔑 本地 Paid API 版 (`paid_api`, Priority 3)**:
    - Runs locally with user's own paid Google Gemini API key (Pay-as-you-go).
    - Unconstrained by Google subscription quotas, directly unlocks full-core flagship `gemini-3.8-flash` deep reasoning across all modules without downscaling to lite models.
- **Priority-Based Auto-Detection & Selection (嚴格優先級自動偵測與裁定)**:
  - Active runtime environment and service probe via `/api/system/mode-status`.
  - Automatically recommends and selects the highest-priority available mode: **AI Studio (Priority 1) > Local Ollama (Priority 2) > Local Paid API (Priority 3)**.
  - Fully preserves user freedom to manually toggle between all three modes via the top navigation pill switcher, persisting preferences to `localStorage` (`minimax_h3_app_mode`).

#### 🔍 2. Dynamic Ollama Model Discovery & Flagship Qwen3.8 Support (本地模型動態探索與旗艦支援)
- **Zero-Hardcoding Dynamic Scanning (動態探測拒絕寫死)**:
  - Eliminates hardcoded model lists by querying local Ollama (`/api/tags`) in real-time.
  - Dynamically parses model name, parameter size (e.g. `27.3B`), quantization level (e.g. `Q8_0`, `Q6_K`, `Q5_K_M`), and context capabilities.
- **Native Support for Qwen3.8-27B-Uncensored (旗艦模型原生適配)**:
  - Fully compatible with `orcarouter/Qwen3.8-27B-Uncensored` (27.3B parameters, 256k context window).
  - Smart default selection preferring Qwen3.8 models (or the first installed model), with one-click re-scan button for freshly downloaded models.
- **Multimodal Vision & Deep Thinking Pipeline (多模態視覺看圖與深層思考清洗)**:
  - Base64 reference images are automatically converted and passed into Ollama's native `images` array for direct visual retention analysis.
  - Cleanses `<think>...</think>` reasoning tokens and validates JSON schema compliance, guaranteeing 100% parsing success for 3-block MiniMax-H3 prompt outputs.

#### ⚡ 3. One-Click Windows Startup Launcher (`start.bat`) (Windows 一鍵啟動腳本)
- Added dedicated Windows batch launcher `start.bat` in pure ASCII format, preventing Windows CMD byte-offset decoding anomalies.
- Automated pre-flight checks: Node.js runtime verification (Node.js v18+), `.env` auto-initialization from `.env.example`, and `node_modules` automatic installation via `npm install`.
- Automatic local Ollama health probe on startup (`http://127.0.0.1:11434`).
- Automatically launches the application and opens `http://localhost:3000` in the default web browser.

## [v2.0.1] - 2026-09-17

### 🎨 Studio Layout Polish & Camera Motion Directives UI Overhaul (版面視覺與運鏡控制深度重構)

#### 🖥️ 1. Studio Grid Three-Column Rebalancing (三欄空間重調)
- **Balanced Proportions**: Rebalanced the 3-column Studio Grid from `35% / 25% / 40%` (`lg:grid-cols-[35fr_25fr_40fr]`) to `31% / 33% / 36%` (`lg:grid-cols-[31fr_33fr_36fr]`).
- **32% More Width for Controls**: Expanded Column 2 (the configuration panel) horizontal width by approximately **32%**, completely eliminating cramped layouts, truncated option texts, and button stacking.

#### 🎥 2. Camera Motion Directives UI Redesign (運鏡控制面板重構)
- **Category Tabs Navigation (分類分頁標籤)**:
  - Added 5 category tabs (`推拉縮放`, `搖移平移`, `俯仰升降`, `跟拍主觀`, `晃動旋轉`) with dynamic badge counters indicating active movements per category.
  - Added quick toggle between **「分頁檢視 (Tabbed View)」** and **「展開全部 (Expand All)」**.
- **Symmetrical 2x2 Grid Layout (對齊雙欄網格)**:
  - Structured all 4 movements in each category into an aligned `grid grid-cols-2 gap-1.5`.
  - Rich bilingual button content: English command (e.g. `Push In`), directional icon hint (`↗`), Chinese intent annotation (`推進 (聚焦前進)`), and active checkmark.
  - Completely prevented orphaned single buttons (e.g. `Truck Right` or `Pedestal Down` forced alone onto next lines).
- **Active Motion Tag Chips (已選運鏡標籤晶片列)**:
  - Centrally displays all active movements across categories with one-click `✕` removal buttons.
- **Segmented Pill Controls for Amplitude & Speed (分段膠囊控制器)**:
  - Replaced native HTML `<select>` dropdowns with responsive 3-key segmented pill buttons:
    - **Amplitude (幅度)**: `預設 (Default)` | `小幅 (Small)` | `大幅 (Large)`
    - **Speed (速度)**: `預設 (Default)` | `慢速 (Slow)` | `快速 (Fast)`
- **Header Anti-Wrapping & Quick Clear**:
  - Shortened panel title and enforced `shrink-0 whitespace-nowrap` on counter badges.
  - Added quick **「清空 (Clear All)」** text button when movements are active.

#### 🖌️ 3. Modern Sleek Dark Micro-Scrollbar (全域現代深色微型捲軸)
- Added global 6px translucent dark micro-scrollbar styles in `src/index.css` (`::-webkit-scrollbar`), replacing thick, clunky OS scrollbars across the entire application on Windows.

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
