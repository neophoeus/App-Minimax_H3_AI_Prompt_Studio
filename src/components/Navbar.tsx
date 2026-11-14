import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  History,
  ExternalLink,
  Cpu,
  RotateCcw,
  Zap,
  HelpCircle,
  RefreshCw,
  Key,
  Terminal,
} from 'lucide-react';
import { AppMode, SystemModeStatus, OllamaModelItem, LlamaCppModelItem } from '../types';

interface NavbarProps {
  appMode: AppMode;
  systemStatus: SystemModeStatus | null;
  onRefreshStatus: () => void;
  ollamaModel: string;
  onChangeOllamaModel: (model: string) => void;
  ollamaModels: OllamaModelItem[];
  llamacppModel: string;
  onChangeLlamaCppModel: (model: string) => void;
  llamacppModels: LlamaCppModelItem[];
  onOpenPresets: () => void;
  onOpenHistory: () => void;
  onResetOptions: () => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  appMode,
  systemStatus,
  onRefreshStatus,
  ollamaModel,
  onChangeOllamaModel,
  ollamaModels,
  llamacppModel,
  onChangeLlamaCppModel,
  llamacppModels,
  onOpenPresets,
  onOpenHistory,
  onResetOptions,
  savedCount,
}) => {
  const [showGeminiApiInfo, setShowGeminiApiInfo] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-[1800px] mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Brand Logo & Skill Link */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                MiniMax-H3 AI 提示詞工作室
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-cyan-500/20 text-purple-200 border border-purple-400/40 shadow-sm shadow-purple-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                v6.3.0 • Gemini 4 Hydrogen 與 Interactions API 全面升級
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>MiniMax-H3 官方標準規格、語法審計自癒 & 系列劇本 (Series)</span>
              <span className="text-slate-600">•</span>
              <a
                href="https://github.com/MiniMax-AI/MiniMax-H3/tree/main/skills/h3-prompt-writing"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 text-cyan-400 hover:underline hover:text-cyan-300 transition-colors"
              >
                <span>Skill Specs</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>

        {/* Active Dedicated Engine Status & Controls */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
          {/* 1. Gemini API Direct Flagship Engine */}
          {appMode === 'gemini_api' && (
            <div className="relative flex items-center bg-slate-900/90 px-3 py-1.5 rounded-xl border border-teal-500/40 shadow-inner gap-2">
              <Key className="w-4 h-4 text-teal-400" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-teal-200">Gemini API 直通引擎</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-950/80 border border-teal-500/30 text-teal-300 font-mono">
                  4 Hydrogen 旗艦
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300 font-mono hidden sm:inline-flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5" /> High Thinking
                </span>
                {systemStatus?.detectedModes.gemini_api ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="已配置 GEMINI_API_KEY (線上就緒)" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-400" title="未設定 GEMINI_API_KEY" />
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowGeminiApiInfo(!showGeminiApiInfo)}
                aria-expanded={showGeminiApiInfo}
                aria-label="查看 Gemini API 直通引擎說明"
                className="p-1 rounded text-slate-400 hover:text-teal-300 focus-visible:outline-2 focus-visible:outline-teal-400 transition-colors"
                title="查看 Gemini API 直通引擎說明"
              >
                <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              {/* Gemini API Info Modal */}
              {showGeminiApiInfo && (
                <div className="absolute right-0 top-full mt-2 w-80 p-3.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 text-xs text-slate-300 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-teal-400" />
                      Gemini API 直通引擎說明
                    </span>
                    <button
                      onClick={() => setShowGeminiApiInfo(false)}
                      className="text-slate-500 hover:text-slate-300 text-[11px]"
                    >
                      關閉
                    </button>
                  </div>
                  <div className="space-y-1.5 leading-relaxed text-[11px]">
                    <p>
                      <strong className="text-teal-300">🔑 Pay-as-you-go 按量計費直通</strong>：直通 Google Gemini API 官方端點，全流程無額度回退降級，享受穩定低延遲之專業級影視推論。
                    </p>
                    <p>
                      <strong className="text-emerald-400">⚡ 旗艦 4 Hydrogen × Interactions API</strong>：提示詞生成全核心升級至 <code className="text-amber-300">gemini-4-hydrogen</code>（1M 統一上下文視窗），透過官方 <code className="text-cyan-300">Interactions API</code> 搭配任務自適應推理深度（<code className="text-slate-200">thinking_level</code>）、低功耗參考圖 Token 壓縮（<code className="text-slate-200">resolution: "low"</code>）與 <code className="text-teal-300">gemini-3.5-flash-lite</code> 超低延遲對白分流，兼顧極致品質與生成速度。
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Local Ollama Offline Engine */}
          {appMode === 'ollama' && (
            <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-amber-500/40 shadow-inner">
              <Cpu className="w-4 h-4 text-amber-400" />
              <div className="flex items-center gap-1.5 mr-0.5">
                <span className="text-xs font-semibold text-amber-200">本地 Ollama 離線引擎</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/30 text-amber-300 font-mono">
                  {ollamaModels.length > 0 ? `${ollamaModels.length} 模型在線` : '離線'}
                </span>
                {systemStatus?.details.ollamaOnline ? (
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                    title={`本機 Ollama 線上 (${systemStatus.details.ollamaModelCount} 個模型)`}
                  />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-rose-400" title="本機 Ollama 離線 (未偵測到 11434 端口)" />
                )}
              </div>
              <select
                value={ollamaModel}
                onChange={(e) => onChangeOllamaModel(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-amber-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500 max-w-[210px] sm:max-w-[260px] truncate"
                title="選擇本地 Ollama 模型"
              >
                {ollamaModels.length === 0 ? (
                  <option value="">
                    {systemStatus?.details.ollamaOnline ? '未發現已安裝模型' : 'Ollama 離線 (未偵測到服務)'}
                  </option>
                ) : (
                  ollamaModels.map((m) => {
                    const param = m.details?.parameter_size ? ` (${m.details.parameter_size})` : '';
                    const quant = m.details?.quantization_level ? ` [${m.details.quantization_level}]` : '';
                    return (
                      <option key={m.name} value={m.name}>
                        {m.name}{param}{quant}
                      </option>
                    );
                  })
                )}
              </select>
              <button
                type="button"
                onClick={onRefreshStatus}
                className="p-1 rounded text-slate-400 hover:text-amber-300 transition-colors"
                title="重新偵測本機 Ollama 服務與模型"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 3. Local llama.cpp Offline Engine */}
          {appMode === 'llamacpp' && (
            <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-sky-500/40 shadow-inner">
              <Terminal className="w-4 h-4 text-sky-400" />
              <div className="flex items-center gap-1.5 mr-0.5">
                <span className="text-xs font-semibold text-sky-200">本地 llama.cpp 離線引擎</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-500/30 text-sky-300 font-mono">
                  RTX 5090 • 32GB
                </span>
                {systemStatus?.details.llamacppOnline ? (
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                    title={`本機 llama.cpp 線上 (${systemStatus.details.llamacppModelCount} 個模型/插槽)`}
                  />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-rose-400" title="本機 llama.cpp 離線 (預設端口 8080)" />
                )}
              </div>
              <select
                value={llamacppModel}
                onChange={(e) => onChangeLlamaCppModel(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-sky-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-sky-500 max-w-[210px] sm:max-w-[260px] truncate"
                title="選擇本地 llama.cpp 載入模型"
              >
                {llamacppModels.length === 0 ? (
                  <option value="default">
                    {systemStatus?.details.llamacppOnline ? 'llama-server (活躍中)' : 'llama.cpp 離線 (未偵測到 8080 端口)'}
                  </option>
                ) : (
                  llamacppModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name || m.id}
                    </option>
                  ))
                )}
              </select>
              <button
                type="button"
                onClick={onRefreshStatus}
                className="p-1 rounded text-slate-400 hover:text-sky-300 transition-colors"
                title="重新偵測本機 llama.cpp 服務與模型"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Preset Gallery Trigger */}
          <button
            onClick={onOpenPresets}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 hover:text-white transition-all shadow-sm active:scale-95 shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>官方預設模板</span>
          </button>

          {/* Reset All Options Button */}
          <button
            onClick={onResetOptions}
            title="清空輸入並將所有拍攝參數恢復為預設值"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-950/40 border border-slate-700/80 hover:border-amber-700/50 text-xs font-medium text-amber-300 hover:text-amber-200 transition-all shadow-sm active:scale-95 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>重設設定</span>
          </button>

          {/* History Drawer Trigger */}
          <button
            onClick={onOpenHistory}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 hover:text-white transition-all shadow-sm active:scale-95 shrink-0"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>歷史記錄</span>
            {savedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-purple-500 text-[10px] font-bold text-white leading-none">
                {savedCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
