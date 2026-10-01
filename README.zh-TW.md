<div align="center">

# 🎬 MiniMax-H3 AI 提示詞工作室 (MiniMax-H3 AI Prompt Studio)

**專為 MiniMax-H3 (海螺 3 / H3) 影音生成大模型量身打造的專業級 Prompt Engineering 工作站**

[![版本](https://img.shields.io/badge/版本-v3.2.0-blue.svg)](CHANGELOG.md)
[![AI 引擎](https://img.shields.io/badge/AI%20引擎-Gemini%203.8%20%7C%20Ollama%20%7C%20llama.cpp-orange.svg)](https://deepmind.google/technologies/gemini/)
[![前端框架](https://img.shields.io/badge/前端-React%2019%20%7C%20Vite-green.svg)](https://react.dev/)
[![樣式系統](https://img.shields.io/badge/樣式-Tailwind%20CSS%20v4-38bdf8.svg)](https://tailwindcss.com/)

[English](README.md) • [繁體中文](README.zh-TW.md)

</div>

---

## 📖 專案概述

**MiniMax-H3 AI Prompt Studio** 是一套專為 **MiniMax-H3（海螺 3 / H3）** 多模態視訊與音訊生成大模型打造的專業提示詞編排與優化工作站。

本工具 100% 嚴格遵循 MiniMax-H3 官方 [`h3-prompt-writing`](https://github.com/MiniMax-AI/MiniMax-H3/tree/main/skills/h3-prompt-writing) 技能規範，能將使用者的創意概念一鍵轉化為符合模型最佳理解結構的生產級提示詞，並提供一鍵複製功能。

具備全新 **四引擎架構與自動優先判定 (Quad-Engine Architecture)**，支援跨四大環境無縫協作：
1. **🏢 訂閱制度 AI Studio 雲端引擎 (`ai_studio`, 優先級 1)**：專為 Google AI Studio 或 Cloud Run 訂閱環境打造，具備可選配額階梯方案（**AI Pro 最佳化**、**AI Ultra 5x**、**AI Ultra 20x**），內建 Web UI 免額度最佳化分流策略，自動重試與降級。
2. **🔑 本地 Paid API 直通引擎 (`paid_api`, 優先級 2)**：本機運行搭配使用者自己的付費 Google Gemini API Key，採按量計費（Pay-as-you-go）直通模式，全核心直接調用旗艦級 `gemini-3.8-flash` 深度推理，不受訂閱額度限制。
3. **💻 本地 Ollama 離線引擎 (`ollama`, 優先級 3)**：連線至本機端點 `http://127.0.0.1:11434`，具備 **本地已安裝模型動態探索 (Dynamic Model Discovery)** 機制，不寫死任何模型，自動掃描並列出所有本機安裝模型（包含 `Qwen3.8-27B-Uncensored` 之 `q8_0`、`q6_K`、`q5_K_M` 等）。
4. **⚡ 本地 llama.cpp 離線引擎 (`llamacpp`, 優先級 4)**：連線至本機端點 `http://127.0.0.1:8080` (`llama-server`)。採用純 C/C++ 極致顯存加速，支援 Flash Attention (`-fa`)、32K 超大上下文長度與 `mmproj` 多模態視覺投影，原生深度適配 NVIDIA RTX 5090 等頂級硬體，完全離線 0 配額消耗。

系統啟動時主動探索本機與環境狀態，若同時偵測到多種引擎，嚴格依據 **AI Studio ＞ 本地 Paid API ＞ 本地 Ollama ＞ 本地 llama.cpp** 優先次序推薦預設引擎，同時保留使用者於導航列隨時手動點選切換的完全自由。

## ✨ 核心特色

### 0. 4 階創意自由度滑桿與導演思維架構 (v3.2.0)
- **解決提示詞刻板僵硬痛點**：針對視訊提示詞容易「太中規中矩、畫面呆板」的問題，首創 4 階創意滑桿系統，自由調度從嚴格直譯到前衛奇觀的自由度。
- **4 階精確檔位劃分**：
  - **Level 0 (保守忠實)**：規格轉譯官。100% 遵照原文字，零腦補，以專業電影格式規格化轉譯。
  - **Level 1 (邏輯補完 - 預設推薦)**：細節攝影指導。保持原意，補齊環境反饋與次生微動態（水汽、光斑、髮絲、景深分層），讓畫面充實飽滿。
  - **Level 2 (創意靈動)**：院線電影導演。導入電影級視覺變化：特殊運鏡角度（低角倒影、透視穿梭）、戲劇性光影橫掃與肢體反差。
  - **Level 3 (天馬行空)**：前衛先鋒藝術家。以構想為靈感原點釋放極致想像，導入超現實奇觀、重力或物理異變與戲劇性反轉，兼顧 H3 客觀動作語法。
- **統一採樣溫度 1.0 + 導演指令主導**：全引擎（Gemini、Ollama、llama.cpp）採樣溫度統一為 `1.0`，杜絕低溫死板與高溫語法崩潰，讓模型永遠在最豐富的詞彙庫下由明確的導演指示精準引導。
- **直觀互動與完整連動**：
  - 前端 0~3 步進式 Range Slider、色彩膠囊切換鈕與即時特色說明卡片。
  - 支援 `localStorage` 自動持久化保存、官方精選範本預設等級與系列 Markdown 匯出中繼資料連動。

### 1. 多圖實體槽位與主體雙軌映射架構 (v3.1.0)
- **海螺原生多圖物理槽位解耦**：海螺模型對所有上傳圖片強制按照物理順序編號為 `<Picture 1>` (`@image1`), `<Picture 2>` (`@image2`), `<Picture 3>` (`@image3`)。
- **雙重識別標籤與自動對齊**：
  - 當使用者上傳多張圖片（如 2 張角色圖 + 1 張場景圖）時，前台自動將角色 1 與角色 2 對齊為 **`<Subject 1 aka Picture 1> (@image1)`** 與 **`<Subject 2 aka Picture 2> (@image2)`**。
  - 開場首幀圖自動累計為 **`<Picture 3> (@image3)`**，徹底杜絕模型誤把角色外貌圖當作開場首幀畫面。
- **純文字主體宣告模式 (Text-Only Mode)**：支援一鍵切換「📝 純文字宣告」，文字角色不佔用實體 Picture 槽位，避免虛擬圖片序號浪費。
- **後端多模態契約 (System Protocol 2.1)**：在 `subject_definitions` 明確註記 `<Subject 1> is ... as depicted in <Picture 1>`，並在 `detailed_description` [Shot 1] 中嚴格對齊開場首幀 `<Picture 3>`。

### 1. 系列連續提示詞故事板工作室 (v3.0.0)
- **一次生成 2 至 10 段連續影片提示詞**：一鍵生成前後情節高度連貫的系列分鏡提示詞（推薦 5 段經典黃金敘事弧線：起／承／轉／合／尾聲）。
- **單一全域推理上下文 (Single Global Inference Context)**：透過統一的 `storyArcSummary` 協調整個系列，避免傳統逐段生成導致的情節偏離與邏輯斷裂。
- **角色道具與實體狀態長效記憶 (State & Inventory Memory)**：自動繼承角色容貌特徵（`<Subject 1>`）、手中與口袋物品（第 1 段放入口袋的鑰匙，第 4 段可自然掏出使用）、環境狀態變遷（雨水浸濕外套、晝夜推進）與前後因果目標。
- **純文字客觀物理承接橋樑 (Pure Physical Continuity Hand-off)**：徹底杜絕未生成之虛擬影片引用（例如拒絕虛假的「接續第 1 段影片」）。第 $K$ 段完全以客觀文字描述第 $K-1$ 段結束時角色的實體姿態、手中物件與站位，確保每段提示詞 **100% 獨立完整、語法合規，且可直接複製貼上海螺 3 生成**！
- **互動式系列故事板儀表板 (Series Storyboard Dashboard)**：
  - 分段快速切換分頁（`第 1 段 (Episode #1)`、`第 2 段 (Episode #2)`、... `第 N 段`）。
  - 客觀物理三態分析卡片（`起始狀態 Starting State` ➔ `動作過程 Action Sequence` ➔ `結束狀態 End State`）與運鏡／音效剖析。
  - 快捷操作工具列：**複製單段提示詞**、**複製全系列完整提示詞（含分段註解）**、**匯出 Markdown 分鏡劇本**。

### 2. 客觀具體動作三態論與純物理描述準則 (v3.0.0)
- **全面摒棄華麗抽象修辭**：影音擴散生成模型本質上是由文字直接轉化像素，抽象形容詞（如「悲傷地在雨中漫步」、「震撼人心的氛圍」）極易引發肢體變形與詭異抽搐。
- **簡易直白、按部就班的實體動作表述**：
  - *避免*："a ball bouncing around" ➔ *改為*："A red ball moves to the right, bounces off the wall, and returns to the center"
  - *避免*："fluid pouring" ➔ *改為*："Water flows from the left container through the connecting tube into the right container until both levels are equal"
- **強制執行動作三態架構 (3-State Physical Action Framework)**：
  1. **起始狀態 (Starting State)**：動作發生前的精確站位、肢體姿態、手持道具與視線方向。
  2. **動作過程 (Action Sequence)**：按時間嚴格排序的實體位移、軌跡、方向與物體接觸。
  3. **結束狀態 (End State)**：動作完成後的靜止落點、最終姿態與周遭環境變化。

### 3. 完整相容 MiniMax-H3 官方規範與版面視覺重構 (v2.0.1)
- **Studio 三欄版面空間重配比**：將三欄比例調整為 `31% / 33% / 36%`（`lg:grid-cols-[31fr_33fr_36fr]`），中央控制欄寬度實質增長約 32%，徹底解決按鈕擠壓與文字折行。
- **全新重構之官方運鏡控制面板 (Camera Motion Panel)**：
  - 直覺分類分頁標籤（`推拉縮放`、`搖移平移`、`俯仰升降`、`跟拍主觀`、`晃動旋轉`），搭配即時選取計數徽章與「展開全部 / 分頁檢視」切換。
  - 對齊對稱之雙欄網格（2x2 Grid），並陳英文指令、中文意圖註釋、動作箭頭圖示與勾選標記，完全杜絕單顆按鈕落單。
  - 已選運鏡標籤晶片列，支援隨時點擊 `✕` 一鍵移除與全量一鍵清空。
  - 幅度（`預設` / `小幅` / `大幅`）與速度（`預設` / `慢速` / `快速`）分段膠囊控制器，取代傳統下拉選單。
  - 全域 6px 半透明現代微型深色捲軸，告別 Windows 原生厚重灰捲軸。
- **官方三維度運鏡控制體系 (運動類型 + 幅度 + 速度)**：
  - 完整支援官方 12 類標準運動類型：`Zoom In/Out`（焦距縮放）、`Push In/Pull Out`（實體推拉）、`Pan Left/Right`（水平旋轉）、`Truck Left/Right`（水平平移）、`Tilt Up/Down`（垂直俯仰）、`Pedestal Up/Down`（垂直升降）、`Arc Shot`（環繞）、`Tracking Shot`（跟拍）、`Static Shot`（固定靜態）、`Shake Slightly/Strongly`（晃動）、`POV`（主觀視角）、`Roll Clockwise/Counterclockwise`（光軸旋轉）。
  - 支援幅度（`with small/large amplitude`）與速度（`at slow/fast speed`）微調，生成時嚴格組裝為自然英文動作融入分鏡敘述，徹底告別句末標籤堆疊。
- **時長標準化 (4s–15s) 與長影片續寫架構 (Video Continuation)**：
  - 全面移除實驗性時長，精準對齊官方原生單次 4–15 秒生成規格。
  - 支援官方長影片工作流：透過 Ref2VA 任務前綴 `[video continuation]` 綁定前置片段（`<Video 1>`），實現多鏡頭無縫續寫長影片。
- **官方語音對白與說話者 ID 規範**：
  - 角色台詞嚴格採用 `<d>[Language] ...</d>` 標籤，保留原始文字與標點 verbatim；指派穩定之說話者 ID（`(S1)`, `(S2)`）。
  - 畫外音遵循 `says in an off-screen voiceover: <d>...</d> while his lips remain completely closed.` 嘴唇閉合約定；跨鏡頭台詞支援 `<scenetrans>` 與 `<cutoff>`。
  - 雙引號 `""` 嚴格限定用於畫面上實際出現的文字看板（On-Screen Text），不與對白混淆。
- **基礎模式 (T2VA, I2VA, FL2VA, L2VA)**：
  - 嚴格遵守首尾關鍵影格（Keyframe）的標準首行對齊指令模板。
  - 自動生成 3 大核心欄位：`integrated_multimodal_description`、`overall_soundscape` 與 `non_diegetic_music`。
- **全參考模式 (Ref2VA)**：
  - 完整生成標準 6 大區塊：`subject_definitions`、`summary`、`retention_analysis`、`detailed_description`、`overall_soundscape` 與 `non_diegetic_music`。
  - 嚴格鎖定官方關係標記（`fully_preserved`、`attribute_transfer`、`fully_copy`、`reference` 等）。
- **嚴格零檔名洩漏標準 (Strict No-Filename Standard)**：
  - 徹底杜絕生成提示詞中出現任何本地檔案名稱與副檔名（`.png`, `.jpg`, `.mp4` 等），確保提示詞完全由純淨專業的影視語意細節構成。

### 4. 四引擎架構體系與本地 llama.cpp 深度整合 (v3.0.0)
- **四大專屬 AI 驅動引擎**：
  - **🏢 AI Studio 雲端引擎 (`ai_studio`，優先級 1)**：專為 Google AI Studio 與 Cloud Run 訂閱環境打造。提供彈性訂閱算力方案：
    - **🟢 AI Pro (Web UI 配額最佳化 - 預設)**：透過模型分流（對話使用 `gemini-3.5-flash-lite`、圖片使用 `gemini-3.6-flash`、提示詞使用 `gemini-3.8-flash`），徹底消弭 429 額度超限。
    - **🔵 AI Ultra 5x (進階效能)**：5x 訂閱額度階梯，釋放深層多樣本推理。
    - **🟣 AI Ultra 20x (極致旗艦)**：20x 訂閱額度階梯，具備頂級思考深度與高精參考素材保留分析。
  - **🔑 本地 Paid API 直通引擎 (`paid_api`，優先級 2)**：直接使用使用者自備的 Google Gemini Paid API Key 進行按量計費直通呼叫。不受限於訂閱額度池，全流程直接啟用旗艦級 `gemini-3.8-flash` 深度推理核心，無需降級分流。
  - **💻 本地 Ollama 離線引擎 (`ollama`，優先級 3)**：於 `http://127.0.0.1:11434` 實現 100% 本機離線隱私運作，具備**本地模型動態探索機制**（自動掃描已安裝的所有模型如 `Qwen3.8-27B-Uncensored`，絕不寫死清單）、多模態素材視覺審視與思考標記（`<think>...</think>`）自動清洗。
  - **⚡ 本地 llama.cpp 離線引擎 (`llamacpp`，優先級 4)**：純 C/C++ 極致吞吐離線推理，連線至 `http://127.0.0.1:8080` (`llama-server`)。
    - **硬體級極速加速**：針對 NVIDIA RTX 5090 (32GB VRAM) 頂級硬體優化，支援 `-ngl 99` 全層 GPU 卸載、Flash Attention (`--flash-attn on`) 與 32K 旗艦上下文 (`-c 32768`)。
    - **多模態視覺投影 (`mmproj`)**：100% 自動配對掛載 `mmproj-*.gguf`，實現零額度負擔的本機離線分鏡與參考圖片視覺分析。
    - **原生 Embedded MTP 雙倍極速 (`--spec-type draft-mtp`)**：無須第三方補丁，直接深度調用 Qwen3.8 原生 NextN 多 Token 預測架構，立即享有 **2.23x (+123.4%)** 極速生成提升！
- **優先級自動偵測與智慧判定**：啟動時自動偵測執行環境並優先選用最高層級架構（**AI Studio > Paid API > Ollama > llama.cpp**），同時保留完整自由手動切換能力，選擇自動保存於 `localStorage`。
- **指數退避重試與隨機抖動 (1s ➔ 2s)**：針對短暫的 `429 RESOURCE_EXHAUSTED` 或 `503 UNAVAILABLE` 暫態限流，自動執行最多 2 次指數退避重試（含隨機微小抖動），有效平抑瞬間爆發請求（Burst）。
- **無縫自動容錯降級**：重試耗盡或遇配額瓶頸時，後端自動切換至備援模型鏈（`gemini-3.8-flash` ➔ `gemini-3.6-flash` ➔ `gemini-3.5-flash-lite`）；若遇 404 等永久錯誤則自動快切跳過重試，保障 100% 請求成功率。
- **最寬鬆安全性門檻 (`HarmBlockThreshold.BLOCK_NONE`)**：全面解除五大危害類別（騷擾、仇恨、性暗示、危險內容、誠信）的常規過濾限制，極致釋放影視劇作、暗黑科幻、動作衝突的分鏡創作自由度。
- **即時安全性審查阻擋通知系統**：雙重安全攔截（檢查提示詞 `promptFeedback` 與生成結果 `finishReason`），一旦觸發不可避之敏感審查，前端即刻彈出 8 秒指引 Toast 告知創作者具體原因與調整建議。

### 5. 多模態參考素材管理 (零額度負擔直通看圖)
- 支援直接於瀏覽器上傳角色、場景、動作或音訊素材。
- **多模態直通看圖**：上傳圖片縮圖直接打包進生成請求，Gemini、Ollama 與 llama.cpp（透過 `mmproj`）視覺核心親自審視五官、穿著、光影，0 額外 API 呼叫。
- **極致輕量 Token 壓縮**：自動縮放至 512px（品質 0.75，約 35KB），每張圖僅佔 ~258 Tokens，徹底杜絕 429 額度耗盡。
- **語意標籤預設**：上傳時自動配置清晰語意名稱（如「首幀開場畫面」、「主要角色 1」），原始檔名僅作介面識別，徹底與 AI 提示詞解耦。

### 6. 電影級對白與音效配置 (Dialogue & Soundscape)
- 精簡直覺的對白與環境音效 (SFX) 手動配置，專為 MiniMax-H3 畫面人物嘴型口播同步設計。
- 支援一鍵靜音/抑制背景純音樂模式 (`non_diegetic_music: N/A`)。

### 7. 生產級 Studio 介面 (v1.5.0 架構)
- **三大欄寬版工作流 (`max-w-[1800px]`, 31% / 33% / 36%)**：精確配置左欄（輸入構想與素材 31%）、中欄（設定調整與主生成按鈕 33%）、右欄（提示詞輸出與一鍵複製 36%）。
- **專屬提示詞編輯工具列**：在檢視區上方增設獨立工具列，支援「語法亮顯 / 手動微調」雙態切換、即時字元計數與一鍵還原 AI 初版生成結果。
- **自適應生成模式網格**：自適應 `grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2`，確保各尺寸螢幕下按鈕文字清晰不截斷破折。
- **寬裕且可調字級之創意思路畫布**：大幅加高文字框（`rows={8}`、`min-h-[240px]`），支援 5 段字級調控（12px ~ 20px）、步進按鈕與 `localStorage` 記憶。
- **AI 驅動引擎與算力切換器**：頂部導覽列隨時切換 AI Studio、Ollama、llama.cpp 與 Paid API 引擎，具備氣泡提示指引，偏好自動保存於 `localStorage`。
- **全域 Toast 浮動通知**：現代化非阻塞式操作回饋。
- **場景預設庫與時序分鏡軸**：內建豐富場景預設與互動式可視化分鏡軸。
- **一鍵導出**：支援一鍵複製完整 Prompt 或分區塊複製，即貼即用。

---

## 🛠️ 技術架構

- **前端 (Frontend)**：React 19, TypeScript, Vite 6, Lucide Icons, Motion 動畫庫
- **樣式 (Styling)**：Tailwind CSS v4
- **後端服務 (Backend)**：Express 4, TypeScript, `tsx`, `esbuild`
- **AI 引擎架構**：
  - **AI Studio 雲端引擎**：Google Gemini 3.8 Flash / 3.6 Flash / 3.5 Flash-Lite（階梯算力 Pro / Ultra 5x / Ultra 20x）
  - **Paid API 直通引擎**：直通 Google Gemini 3.8 Flash 旗艦深度推理
  - **本地 Ollama 離線引擎**：動態模型掃描探索（原生支援 `Qwen3.8-27B-Uncensored` 之 `q8_0`, `q6_K`, `q5_K_M`）
  - **本地 llama.cpp 離線引擎**：`llama-server`（RTX 5090 `-ngl 99`, Flash Attention, 32K context, `mmproj` 視覺投影, 原生 Embedded MTP 2.23x 極速）

---

## 🚀 快速開始

### ⚡ Windows 一鍵快速啟動（推薦）

直接雙擊專案根目錄下的 **`start.bat`** 即可！
啟動腳本將全自動完成：
1. 自動檢查本機 Node.js 執行環境。
2. 若無 `.env` 自動由 `.env.example` 複製初始化。
3. 若無 `node_modules` 自動執行 `npm install`。
4. 探測本機 Ollama 與 llama.cpp 狀態；若離線則自動嘗試喚起服務並等待就緒（未啟動時會主動喚起專屬 `start_llama.bat` 供一鍵選取模型）。
5. 啟動工作室並在 3 秒後自動調用預設瀏覽器開啟 `http://localhost:3000`。

> **💡 專屬 llama.cpp 啟動器 (`start_llama.bat`)**：
> 您亦可隨時單獨雙擊 `start_llama.bat`，系統會自動掃描 `C:\llama.cpp\models`，自動配對 `mmproj` 視覺投影與 Embedded MTP 雙倍極速，直接敲 Enter 鍵即可瞬間啟動服務！

### 💻 手動安裝與啟動

1. 安裝依賴套件：
   ```bash
   npm install
   ```

2. 設定環境變數：
   在專案根目錄建立 `.env` 檔案（或由 `.env.example` 複製）：
   ```env
   # 雲端 Gemini 模式必備
   GEMINI_API_KEY="your_actual_gemini_api_key_here"

   # 本機 Ollama 模式選填（預設連線 127.0.0.1:11434）
   OLLAMA_BASE_URL="http://127.0.0.1:11434"
   DEFAULT_OLLAMA_MODEL="orcarouter/Qwen3.8-27B-Uncensored:q6_K"

   # 本機 llama.cpp 模式選填（預設連線 127.0.0.1:8080）
   LLAMACPP_BASE_URL="http://127.0.0.1:8080"
   DEFAULT_LLAMACPP_MODEL="default"
   ```

3. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

4. 開啟瀏覽器訪問：
   ```
   http://localhost:3000
   ```

---

## 📜 常用指令

| 指令 | 說明 |
| :--- | :--- |
| `start.bat` | **Windows 一鍵啟動器**：自動環境檢測、依賴安裝與啟動瀏覽器 |
| `npm run dev` | 以開發模式啟動 Express 伺服器與 Vite 中介層 |
| `npm run build` | 建置前端 SPA 產物並透過 esbuild 編譯 `server.ts` |
| `npm run start` | 執行正式環境打包產物 (`dist/server.cjs`) |
| `npm run lint` | 執行 TypeScript 靜態類型檢查 (`tsc --noEmit`) |
| `npm run preview` | 本地預覽 Vite 生產建置結果 |
| `npm run clean` | 清除建置產物目錄 (`dist/`) |

---

## 📁 專案目錄結構

```text
App-Minimax_H3_AI_Prompt_Studio/
├── src/
│   ├── components/       # UI 元件（頂部欄、模式選擇器、Prompt 輸出面板等）
│   ├── data/             # 預設範本與鏡頭運鏡設定資料
│   ├── types.ts          # TypeScript 類型定義
│   ├── App.tsx           # 主頁面狀態與佈局控制
│   ├── main.tsx          # React 入口程式
│   └── index.css         # Tailwind CSS 樣式
├── server.ts             # Express 後端與 Gemini 3.8 Flash 整合服務
├── CHANGELOG.md          # 版本更新紀錄與遷移日誌
├── README.md             # 英文說明文件
├── README.zh-TW.md       # 繁體中文說明文件
├── package.json          # 專案依賴與版本資訊 (v1.3.1)
└── tsconfig.json         # TypeScript 設定檔
```

---

## 📄 版本規範與紀錄

本專案遵循語意化版本（Semantic Versioning）。詳細的版本演進與更新紀錄請參考 [CHANGELOG.md](CHANGELOG.md)。

---

## 📄 授權條款

本專案採用 MIT 授權條款 - 詳見 LICENSE 檔案。
