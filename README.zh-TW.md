<div align="center">

# 🎬 MiniMax-H3 AI 提示詞工作室 (MiniMax-H3 AI Prompt Studio)

**專為 MiniMax-H3 (海螺 3 / H3) 影音生成大模型量身打造的專業級 Prompt Engineering 工作站**

[![版本](https://img.shields.io/badge/版本-v1.2.0-blue.svg)](CHANGELOG.md)
[![AI 引擎](https://img.shields.io/badge/AI%20引擎-Gemini%203.7%20Flash-orange.svg)](https://deepmind.google/technologies/gemini/)
[![前端框架](https://img.shields.io/badge/前端-React%2019%20%7C%20Vite-green.svg)](https://react.dev/)
[![樣式系統](https://img.shields.io/badge/樣式-Tailwind%20CSS%20v4-38bdf8.svg)](https://tailwindcss.com/)

[English](README.md) • [繁體中文](README.zh-TW.md)

</div>

---

## 📖 專案概述

**MiniMax-H3 AI Prompt Studio** 是一套專為 **MiniMax-H3（海螺 3 / H3）** 多模態視訊與音訊生成大模型打造的專業提示詞編排與優化工作站。

本工具 100% 嚴格遵循 MiniMax-H3 官方 [`h3-prompt-writing`](https://github.com/MiniMax-AI/MiniMax-H3/tree/main/skills/h3-prompt-writing) 技能規範，能將使用者的創意概念一鍵轉化為符合模型最佳理解結構的生產級提示詞，並提供一鍵複製功能。

後端採用 Google 最新發布的 **Gemini 3.7 Flash (`gemini-3.7-flash`)** 與最新版 `@google/genai` SDK，具備強大的思考推理能力，可精準處理多鏡頭時序編排、多模態素材 Retention Analysis（特徵鎖定分析）以及影視級聲景構建。

---

## ✨ 核心特色

### 1. 完整相容 MiniMax-H3 官方規範
- **基礎模式 (T2VA, I2VA, FL2VA, L2VA)**：
  - 嚴格遵守首尾關鍵影格（Keyframe）的標準首行對齊指令模板。
  - 自動生成 3 大核心欄位：`integrated_multimodal_description`（整合多模態描述）、`overall_soundscape`（整體聲景）與 `non_diegetic_music`（非敘事音樂）。
- **全參考模式 (Ref2VA)**：
  - 完整生成標準 6 大區塊：`subject_definitions`、`summary`、`retention_analysis`、`detailed_description`、`overall_soundscape` 與 `non_diegetic_music`。
  - 精準管理角括號素材標籤（`<Subject N>`、`<Picture N>`、`<Video N>`、`<Audio N>`）。

### 2. 搭載 Gemini 3.7 Flash 核心
- 升級至 Google 最新一代 `gemini-3.7-flash` 模型。
- 透過 `ThinkingLevel` 自適應調節推理深度：
  - `ThinkingLevel.LOW`：極致低延遲，適用於即時電影級對白生成與素材標籤解析。
  - `ThinkingLevel.MEDIUM`：深度平衡推理，專門處理多鏡頭時序分鏡與 Retention Analysis。
- 全面符合 Google GenAI SDK 最新規範（移除舊版採樣與預算參數）。

### 3. 多模態參考素材視覺分析器
- 支援於瀏覽器直接上傳角色、場景或道具圖片。
- 自動辨識並提煉外觀特徵（光影、五官細節、材質與色彩），直接填入 Block 1 主體定義與 Retention Analysis 鎖定清單。

### 4. 電影級對白與音效導演
- 自動生成符合影視與動漫風格的人物台詞，並附帶環境音效 (SFX) 與音色建議。
- 支援一鍵靜音/抑制背景音樂模式 (`non_diegetic_music: N/A`)。

### 5. 生產級 Studio 介面
- **場景預設庫**：內建賽博龐克、日系動漫、暗黑奇幻、電影史詩等多種風格範本。
- **動態時序分鏡軸 (Temporal Timeline)**：可視化呈現各鏡頭時間碼、鏡頭運鏡、畫面動作與音效節奏。
- **一鍵導出**：支援一鍵複製完整 Prompt 或分區塊複製，即貼即用。

---

## 🛠️ 技術架構

- **前端 (Frontend)**：React 19, TypeScript, Vite 6, Lucide Icons, Motion 動畫庫
- **樣式 (Styling)**：Tailwind CSS v4
- **後端服務 (Backend)**：Express 4, TypeScript, `tsx`
- **AI SDK**：`@google/genai` (v2.17.0+), Google Gemini 3.7 Flash

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
├── server.ts             # Express 後端與 Gemini 3.7 Flash 整合服務
├── CHANGELOG.md          # 版本更新紀錄與遷移日誌
├── README.md             # 英文說明文件
├── README.zh-TW.md       # 繁體中文說明文件
├── package.json          # 專案依賴與版本資訊 (v1.2.0)
└── tsconfig.json         # TypeScript 設定檔
```

---

## 📄 版本規範與紀錄

本專案遵循語意化版本（Semantic Versioning）。詳細的版本演進與更新紀錄請參考 [CHANGELOG.md](CHANGELOG.md)。

---

## 📄 授權條款

本專案採用 MIT 授權條款 - 詳見 LICENSE 檔案。
