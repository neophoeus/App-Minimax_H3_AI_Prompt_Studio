<div align="center">

# 🎬 MiniMax-H3 AI 提示詞工作室 (MiniMax-H3 AI Prompt Studio)

**專為 MiniMax-H3 (海螺 3 / H3) 影音生成大模型量身打造的專業級 Prompt Engineering 工作站**

[![版本](https://img.shields.io/badge/版本-v2.0.1-blue.svg)](CHANGELOG.md)
[![AI 引擎](https://img.shields.io/badge/AI%20引擎-Gemini%203.8%20%7C%203.6%20%7C%203.5-orange.svg)](https://deepmind.google/technologies/gemini/)
[![前端框架](https://img.shields.io/badge/前端-React%2019%20%7C%20Vite-green.svg)](https://react.dev/)
[![樣式系統](https://img.shields.io/badge/樣式-Tailwind%20CSS%20v4-38bdf8.svg)](https://tailwindcss.com/)

[English](README.md) • [繁體中文](README.zh-TW.md)

</div>

---

## 📖 專案概述

**MiniMax-H3 AI Prompt Studio** 是一套專為 **MiniMax-H3（海螺 3 / H3）** 多模態視訊與音訊生成大模型打造的專業提示詞編排與優化工作站。

本工具 100% 嚴格遵循 MiniMax-H3 官方 [`h3-prompt-writing`](https://github.com/MiniMax-AI/MiniMax-H3/tree/main/skills/h3-prompt-writing) 技能規範，能將使用者的創意概念一鍵轉化為符合模型最佳理解結構的生產級提示詞，並提供一鍵複製功能。

後端採用 Google 最新發布的 **Gemini 3.8 Flash (`gemini-3.8-flash`)**、**Gemini 3.6 Flash (`gemini-3.6-flash`)** 與 **Gemini 3.5 Flash-Lite (`gemini-3.5-flash-lite`)**，配合最新版 `@google/genai` SDK，具備強大的思考推理能力，可精準處理多鏡頭時序編排、多模態素材 Retention Analysis（特徵鎖定分析）以及影視級聲景構建，且徹底消除 429 額度超限問題。

---

## ✨ 核心特色

### 1. 完整相容 MiniMax-H3 官方規範與版面視覺重構 (v2.0.1)
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

### 2. 多層級 AI 引擎與指數退避重試 (Exponential Backoff with Jitter & Instant Fallback)
- **三種可選算力方案**：
  - **🟢 AI Pro (Web UI 配額最佳化 - 預設)**：專為 Google AI 訂閱與免費 API 打造的零成本模式，透過模型分流（對話使用 `gemini-3.5-flash-lite`、圖片使用 `gemini-3.6-flash`、提示詞使用 `gemini-3.8-flash`），徹底消弭 429 額度超限。
  - **🔵 AI Ultra 5x (進階效能)**：全核心啟用 `gemini-3.8-flash` 深入推理。
  - **🟣 AI Ultra 20x (極致旗艦)**：旗艦級思考深度與高精多模態鎖定。
- **指數退避重試與隨機抖動 (1s ➔ 2s)**：針對短暫的 `429 RESOURCE_EXHAUSTED` 或 `503 UNAVAILABLE` 暫態限流，自動執行最多 2 次指數退避重試（含隨機微小抖動），有效平抑瞬間爆發請求（Burst）。
- **無縫自動容錯降級**：重試耗盡或遇配額瓶頸時，後端自動切換至備援模型鏈（`gemini-3.8-flash` ➔ `gemini-3.6-flash` ➔ `gemini-3.5-flash-lite`）；若遇 404 等永久錯誤則自動快切跳過重試，保障 100% 請求成功率。
- **最寬鬆安全性門檻 (`HarmBlockThreshold.BLOCK_NONE`)**：全面解除五大危害類別（騷擾、仇恨、性暗示、危險內容、誠信）的常規過濾限制，極致釋放影視劇作、暗黑科幻、動作衝突的分鏡創作自由度。
- **即時安全性審查阻擋通知系統**：雙重安全攔截（檢查提示詞 `promptFeedback` 與生成結果 `finishReason`），一旦觸發不可避之敏感審查，前端即刻彈出 8 秒指引 Toast 告知創作者具體原因與調整建議。

### 3. 多模態參考素材管理 (零額度負擔直通看圖)
- 支援直接於瀏覽器上傳角色、場景、動作或音訊素材。
- **多模態直通看圖**：上傳圖片縮圖直接打包進生成請求，Gemini 視覺核心親自審視五官、穿著、光影，0 額外 API 呼叫。
- **極致輕量 Token 壓縮**：自動縮放至 512px（品質 0.75，約 35KB），每張圖僅佔 ~258 Tokens，徹底杜絕 429 額度耗盡。
- **語意標籤預設**：上傳時自動配置清晰語意名稱（如「首幀開場畫面」、「主要角色 1」），原始檔名僅作介面識別，徹底與 AI 提示詞解耦。

### 4. 電影級對白與音效配置 (Dialogue & Soundscape)
- 精簡直覺的對白與環境音效 (SFX) 手動配置，專為 MiniMax-H3 畫面人物嘴型口播同步設計。
- 支援一鍵靜音/抑制背景純音樂模式 (`non_diegetic_music: N/A`)。

### 5. 生產級 Studio 介面 (v1.5.0 架構)
- **三大欄寬版工作流 (`max-w-[1800px]`, 35% / 25% / 40%)**：精確配置左欄（輸入構想與素材 35%）、中欄（設定調整與主生成按鈕 25%）、右欄（提示詞輸出與一鍵複製 40%）。
- **專屬提示詞編輯工具列**：在檢視區上方增設獨立工具列，支援「語法亮顯 / 手動微調」雙態切換、即時字元計數與一鍵還原 AI 初版生成結果。
- **自適應生成模式網格**：自適應 `grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2`，確保各尺寸螢幕下按鈕文字清晰不截斷破折。
- **寬裕且可調字級之創意思路畫布**：大幅加高文字框（`rows={8}`、`min-h-[240px]`），支援 5 段字級調控（12px ~ 20px）、步進按鈕與 `localStorage` 記憶。
- **AI 算力方案選擇器**：頂部導覽列隨時切換 Pro 與 Ultra 模式，偏好自動保存於 `localStorage`。
- **全域 Toast 浮動通知**：現代化非阻塞式操作回饋。
- **場景預設庫與時序分鏡軸**：內建豐富場景預設與互動式可視化分鏡軸。
- **一鍵導出**：支援一鍵複製完整 Prompt 或分區塊複製，即貼即用。

---

## 🛠️ 技術架構

- **前端 (Frontend)**：React 19, TypeScript, Vite 6, Lucide Icons, Motion 動畫庫
- **樣式 (Styling)**：Tailwind CSS v4
- **後端服務 (Backend)**：Express 4, TypeScript, `tsx`
- **AI SDK**：`@google/genai` (v2.17.0+), Google Gemini 3.8 Flash

---

## 🚀 快速開始

### 環境需求

- **Node.js**：`v20.0.0` 或更高版本
- **Gemini API Key**：請至 [Google AI Studio](https://aistudio.google.com/apikey) 申請

### 安裝步驟

1. 複製專案庫：
   ```bash
   git clone https://github.com/your-org/App-Minimax_H3_AI_Prompt_Studio.git
   cd App-Minimax_H3_AI_Prompt_Studio
   ```

2. 安裝依賴套件：
   ```bash
   npm install
   ```

3. 設定環境變數：
   在專案根目錄建立 `.env` 檔案（或由 `.env.example` 複製）：
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   PORT=3000
   ```

4. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

5. 開啟瀏覽器訪問：
   ```
   http://localhost:3000
   ```

---

## 📜 常用指令

| 指令 | 說明 |
| :--- | :--- |
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
