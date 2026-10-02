<div align="center">

# 🎬 MiniMax-H3 AI 提示詞工作室 (MiniMax-H3 AI Prompt Studio)

**專為 MiniMax-H3 (海螺 3 / H3) 影音生成大模型量身打造的專業級 Prompt Engineering 工作站**

[![版本](https://img.shields.io/badge/版本-v5.0.0-blue.svg)](CHANGELOG.md)
[![AI 引擎](https://img.shields.io/badge/AI%20引擎-Gemini%203.8%20%7C%20Ollama%20%7C%20llama.cpp-orange.svg)](https://deepmind.google/technologies/gemini/)
[![前端框架](https://img.shields.io/badge/前端-React%2019%20%7C%20Vite-green.svg)](https://react.dev/)
[![樣式系統](https://img.shields.io/badge/樣式-Tailwind%20CSS%20v4-38bdf8.svg)](https://tailwindcss.com/)

[English](README.md) • [繁體中文](README.zh-TW.md)

</div>

---

## 📖 專案概述

**MiniMax-H3 AI Prompt Studio** 是一套專為 **MiniMax-H3（海螺 3 / H3）** 多模態視訊與音訊生成大模型打造的專業提示詞編排與優化工作站。

本工具 100% 嚴格遵循 MiniMax-H3 官方 [`h3-prompt-writing`](https://github.com/MiniMax-AI/MiniMax-H3/tree/main/skills/h3-prompt-writing) 技能規範，能將使用者的創意概念一鍵轉化為符合模型最佳理解結構的生產級提示詞，並提供一鍵複製功能。

具備全新 **四大獨立引擎架構與專屬入口 (Quad-Engine Independent Architecture)**：
1. **🏢 訂閱制度 AI Studio 雲端引擎 (`server-aistudio.ts`)**：專為 Google AI Studio 雲端打造，提供一鍵打包工具 (`pack_aistudio.bat`) 產出純淨 Zip 包。支援配額階梯方案（**AI Pro 最佳化**、**AI Ultra 5x**、**AI Ultra 20x**）。
2. **🔑 本地 Paid API 直通引擎 (`start_paid_api.bat` / `server-paid-api.ts`)**：本機運行搭配使用者自己的付費 Google Gemini API Key，採按量計費（Pay-as-you-go）直通模式，全核心直接調用旗艦級 `gemini-3.8-flash` 深度推理。
3. **💻 本地 Ollama 離線引擎 (`start_ollama.bat` / `server-ollama.ts`)**：連線至本機端點 `http://127.0.0.1:11434`，具備 **本地已安裝模型動態探索機制**，自動掃描並列出所有本機安裝模型（包含 `Qwen3.8-27B-Uncensored` 等）。
4. **⚡ 本地 llama.cpp 離線引擎 (`start_llamacpp.bat` / `server-llamacpp.ts`)**：專為 NVIDIA RTX 5090 (32GB VRAM) 打造。自動掃描 `C:\llama.cpp\models` 內的 GGUF、配對 `mmproj` 視覺投影器，並啟用 MTP (Multi-Token Prediction) 2.23x 加速。

前端介面與後端完全解耦獨立化，介面自動依據當前啟動之專屬引擎展示狀態徽章與控制欄，杜絕跨進程切換的混淆。

## ✨ 核心特色

### 0. 四大獨立引擎全面解耦、介面專屬化與純淨打包工具 (v5.0.0)
- **四大專屬服務入口解耦**：徹底移除單體四合一路由相容層，全面採用獨立單引擎入口（`server-paid-api.ts`、`server-ollama.ts`、`server-llamacpp.ts`、`server-aistudio.ts`），架構精簡純淨。
- **介面專屬化無干擾控制列**：頂部導覽列依據當前啟動之獨立後端呈現專屬面板（Paid API 3.8 旗艦思考鏈標記、Ollama 動態模型探測計數、llama.cpp RTX 5090 32GB 顯存標記、AI Studio 雲端階梯高亮），並增設全域 Studio 狀態底欄。
- **Google AI Studio 純淨導出工具 (`pack_aistudio.bat`)**：一鍵過濾離線依賴與 Windows 腳本，產出標準純淨 Zip 包。
- **Windows Pure ASCII 批次檔可靠性**：100% 杜絕 Windows `cmd.exe` 字節偏移截斷與開檔閃退問題。
- **40+ 端到端自動化測試套件 (`npm test`)**：全面鎖定官方提示詞語法、輸出清洗與純淨打包隔離性。

### 1. 語法審計自癒、單集精修、雙契約與 ComfyUI 整合 (v4.1.0)
- **語法審計與無損自癒修復引擎 (Audit & Auto-Repair)**：內建靜態正則分析引擎 (`promptAudit.ts`)，嚴格校驗時間標籤（`MM:SS.mmm`）、修剪超時分鏡、無損清除多模態除錯標記（`contact sheet`、`sampled frame` 等）、並校正相機固定語法。提供即時介面狀態徽章與一鍵修復按鈕。
- **系列連續劇單集獨立局部精修 (Series Refinement)**：針對連續劇提供專屬單集局部精修面板，可單獨微調某一集之運鏡或情節，並強制鎖定前集終態實體動作與相機位置以確保連貫。
- **雙輸出契約架構 (Official vs Compact)**：支援官方 6 區塊/3 區塊結構與緊湊高密度敘事雙契約無縫切換。
- **ComfyUI 工作流格式匯出 (ComfyUI Format)**：連續劇支援一鍵以章節分隔線匯出格式化提示詞，直接無縫對接 ComfyUI 節點。

### 1. 輔助導演開關、雙軌制溫度調控與全量提示詞旗艦架構 (v4.0.0)
- **輔助導演開關 (Assistant Director Toggle)**：以直覺開關取代舊版 0~3 滑桿，預設開啟。開啟時忠實維持核心構想，自動推理豐富周邊物理與微動態（水汽、光斑、髮絲、景深分層）；關閉時切換為保守忠實模式，零腦補嚴格轉譯。
- **雙軌制溫度調控策略 (Dual-Mode Temperature Strategy)**：
  - **Google Gemini**：在「自動模式」下不傳遞溫度參數，採用 Gemini 原廠原生最佳採樣設定。
  - **本地引擎 (Ollama / llama.cpp)**：自動模式預設為 `0.7`，兼顧語法精確與詞彙豐富度。
  - **手動模式 (Manual)**：提供滑桿允許使用者在 `0.0` 至 `1.5` 之間自由微調數值。
- **畫風與渲染條件化 (Style & Rendering Conditioning)**：嚴格遵循官方規範（`base-en.txt` 第 86 行），文生影片 (T2VA) 支援文字風格與光影設定，圖生影片模式（I2VA, FL2VA, L2VA, Ref2VA）畫風則自動錨定自參考圖片，避免文字描述衝突。
- **輸出架構極致精簡 (Direct Full Prompt Generation)**：移除冗餘的 Block 1/2/3 與 Timeline JSON 輸出，直出完整合法且一鍵複製的 `fullPrompt`，單次生成 Token 消耗降低 >70%，推論提速 3~4 倍。
- **本機長推論超時配置 (LLAMACPP_TIMEOUT_MS)**：延長超時至預設 600 秒（10 分鐘，支援 `.env` 自訂），徹底消除本機模型思考時被中斷的問題。

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
- **專屬獨立服務與狀態自動鎖定**：後端服務採用完全獨立之單引擎實例啟動，前端自動依當前連線之獨立後端鎖定運作模式，免去跨引擎設定衝突。
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
- **專屬獨立引擎狀態與控制面板**：頂部導覽列依據當前啟動之引擎呈現專屬控制欄（Paid API 旗艦標籤、Ollama 模型探索、llama.cpp 狀態、AI Studio 算力階梯），專注無干擾。
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

### ⚡ Windows 一鍵快速啟動（依需求選擇）

依據您欲使用的 AI 引擎，直接雙擊專案根目錄下對應的啟動腳本：

1. **🔑 Gemini Paid API 直通工作室**：雙擊 **`start_paid_api.bat`**
   - 適合擁有 Google Gemini API 金鑰之使用者，直接調用旗艦 3.8 Flash 深度推理。
2. **💻 本地 Ollama 離線推論工作室**：雙擊 **`start_ollama.bat`**
   - 自動檢測並喚起本機 Ollama 服務，動態探索並載入本機所有已安裝模型。
3. **⚡ 本地 llama.cpp (RTX 5090) 離線推論工作室**：雙擊 **`start_llamacpp.bat`**
   - 二合一智慧啟動器！若 llama-server 未啟動，自動掃描 `C:\llama.cpp\models` 並提供編號選擇，自動精準配對 `mmproj` 視覺投影與 Embedded MTP 2.23x 加速，隨後無縫喚起工作室與瀏覽器。
4. **📦 Google AI Studio 純淨打包器**：雙擊 **`pack_aistudio.bat`**
   - 自動過濾本機離線依賴與 Windows 腳本，產出輕量化（約 80KB）的 `minimax-h3-aistudio.zip`，可直接上傳 Google AI Studio！

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

## 📜 常用指令與獨立引擎啟動

### 🎛️ 本地啟動腳本 (Windows Batch)
| 腳本 | 說明 |
| :--- | :--- |
| `start_paid_api.bat` | **Gemini Paid API 直通專用啟動器**：直接運行 Flagship 3.8 Flash，高推理深度 |
| `start_ollama.bat` | **本地 Ollama 專用啟動器**：自動喚醒本機 Ollama 服務並啟動專用離線環境 |
| `start_llamacpp.bat` | **本地 llama.cpp 專用啟動器**：二合一智慧啟動（含 RTX 5090 模型掃描與 Web 服務） |
| `pack_aistudio.bat` | **Google AI Studio 純淨打包器**：一鍵過濾本機檔案並產出純淨上傳包 `minimax-h3-aistudio.zip` |

### 💻 NPM 開發與驗證指令
| 指令 | 說明 |
| :--- | :--- |
| `npm test` | **執行自動化行為鎖定測試套件**（覆蓋 5 大面向 40 個測試） |
| `npm run dev` | 以開發模式啟動四合一多引擎伺服器 |
| `npm run dev:paid-api` | 啟動獨立 Paid API 伺服器 (`server-paid-api.ts`) |
| `npm run dev:ollama` | 啟動獨立 Ollama 伺服器 (`server-ollama.ts`) |
| `npm run dev:llamacpp` | 啟動獨立 llama.cpp 伺服器 (`server-llamacpp.ts`) |
| `npm run dev:aistudio` | 啟動獨立 AI Studio 雲端伺服器 (`server-aistudio.ts`) |
| `npm run pack:aistudio` | 導出純淨 AI Studio 雲端目錄 (`dist-aistudio/`) |
| `npm run build` | 建置前端 SPA 產物並透過 esbuild 編譯四合一 `server.ts` |
| `npm run build:aistudio`| 編譯純淨 AI Studio 輕量化伺服器產物 |
| `npm run lint` | 執行 TypeScript 靜態類型檢查 (`tsc --noEmit`) |

---

## 📁 專案目錄結構

```text
App-Minimax_H3_AI_Prompt_Studio/
├── server/
│   ├── core/             # 共用核心（提示詞規範、輸出淨化、Express/Vite 工廠、型別）
│   └── engines/          # 獨立推論引擎（AI Studio、Paid API、Ollama、llama.cpp、Gemini Core）
├── tests/                # 行為鎖定測試套件（提示詞規格、淨化、稽核、引擎調度、導出包驗證）
├── scripts/
│   └── pack-aistudio.ts  # Google AI Studio 純淨導出腳本
├── src/                  # React 19 + Vite 前端使用者介面
├── server.ts             # 四合一多引擎整合入口
├── server-aistudio.ts    # AI Studio 獨立入口（上傳包預設核心）
├── server-paid-api.ts    # Paid API 直通獨立入口
├── server-ollama.ts      # 本機 Ollama 獨立入口
├── server-llamacpp.ts    # 本機 llama.cpp 獨立入口
├── pack_aistudio.bat     # AI Studio 一鍵打包批次檔 (產出 minimax-h3-aistudio.zip)
├── start.bat             # 四合一多引擎啟動檔
├── start_paid_api.bat    # Paid API 直通啟動檔
├── start_ollama.bat      # 本機 Ollama 啟動檔
├── start_llamacpp.bat    # 本機 llama.cpp 啟動檔
├── package.json          # 專案依賴與腳本定義
└── metadata.json         # Google AI Studio Web Applet 元資料宣告
```

---

## 📄 版本規範與紀錄

本專案遵循語意化版本（Semantic Versioning）。詳細的版本演進與更新紀錄請參考 [CHANGELOG.md](CHANGELOG.md)。

---

## 📄 授權條款

本專案採用 MIT 授權條款 - 詳見 LICENSE 檔案。
