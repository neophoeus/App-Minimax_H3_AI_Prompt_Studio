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
  Layers,
  Key,
  Terminal,
} from 'lucide-react';
import { EngineTier, AppMode, SystemModeStatus, OllamaModelItem, LlamaCppModelItem } from '../types';

interface NavbarProps {
  appMode: AppMode;
  systemStatus: SystemModeStatus | null;
  onRefreshStatus: () => void;
  engineTier: EngineTier;
  onChangeEngineTier: (tier: EngineTier) => void;
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
  engineTier,
  onChangeEngineTier,
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
  const [showTierInfo, setShowTierInfo] = useState(false);
  const [showPaidApiInfo, setShowPaidApiInfo] = useState(false);

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
                v5.0.1 • 四大獨立引擎架構、語法審計自癒與系列故事板旗艦
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
          {/* 1. Paid API Direct Flagship Engine */}
          {appMode === 'paid_api' && (
            <div className="relative flex items-center bg-slate-900/90 px-3 py-1.5 rounded-xl border border-teal-500/40 shadow-inner gap-2">
              <Key className="w-4 h-4 text-teal-400" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-teal-200">Gemini Paid API 直通引擎</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-950/80 border border-teal-500/30 text-teal-300 font-mono">
                  3.8 Flash 旗艦
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300 font-mono hidden sm:inline-flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5" /> High Thinking
                </span>
                {systemStatus?.detectedModes.paid_api ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="已配置 GEMINI_API_KEY (線上就緒)" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-400" title="未設定 GEMINI_API_KEY" />
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowPaidApiInfo(!showPaidApiInfo)}
                className="p-1 rounded text-slate-400 hover:text-teal-300 transition-colors"
                title="查看 Paid API 直通引擎說明"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>

              {/* Paid API Info Modal */}
              {showPaidApiInfo && (
                <div className="absolute right-0 top-full mt-2 w-80 p-3.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 text-xs text-slate-300 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-teal-400" />
                      Gemini Paid API 直通引擎說明
                    </span>
                    <button
                      onClick={() => setShowPaidApiInfo(false)}
                      className="text-slate-500 hover:text-slate-300 text-[11px]"
                    >
                      關閉
                    </button>
                  </div>
                  <div className="space-y-1.5 leading-relaxed text-[11px]">
                    <p>
                      <strong className="text-teal-300">🔑 按量計費 (Pay-as-you-go)</strong>：使用您自行在 Google Cloud 綁定信用卡建立的 Paid API Key，具備高並發配額。
                    </p>
                    <p>
                      <strong className="text-emerald-400">⚡ 旗艦全核心解鎖</strong>：不受 Google 訂閱制免費額度約束，對話、視覺分析與提示詞生成皆直接呼叫旗艦級 <code className="text-amber-300">gemini-3.8-flash</code> 進行深度推理，無需降級或進行 3.5-lite 分流。
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

          {/* 4. Google AI Studio Cloud Engine */}
          {appMode === 'ai_studio' && (
            <div className="relative flex items-center bg-slate-900/90 px-3 py-1.5 rounded-xl border border-purple-500/40 shadow-inner gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <div className="flex items-center gap-1.5 mr-1">
                <span className="text-xs font-semibold text-purple-200">AI Studio 雲端引擎</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-mono hidden sm:inline-block">
                  Google AI Studio
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="AI Studio 雲端環境就緒" />
              </div>
              <div className="flex items-center gap-1 border-l border-slate-700/80 pl-2">
                <button
                  type="button"
                  onClick={() => onChangeEngineTier('pro')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    engineTier === 'pro'
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="AI Pro (訂閱配額最佳化)：智慧多模型分流，極速響應且零 429 報錯"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Pro 最佳化</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeEngineTier('ultra_5x')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    engineTier === 'ultra_5x'
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="AI Ultra 5x (5倍訂閱配額)：全核心 gemini-3.8-flash 深度推理"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Ultra 5x</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeEngineTier('ultra_20x')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    engineTier === 'ultra_20x'
                      ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="AI Ultra 20x (20倍訂閱配額)：極致深度推理與高精多模態鎖定"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>Ultra 20x</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowTierInfo(!showTierInfo)}
                  className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
                  title="查看訂閱算力方案說明"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tier Info Modal for AI Studio Subscription */}
              {showTierInfo && (
                <div className="absolute right-0 top-full mt-2 w-80 p-3.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 text-xs text-slate-300 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      AI Studio 訂閱制配額階梯說明
                    </span>
                    <button
                      onClick={() => setShowTierInfo(false)}
                      className="text-slate-500 hover:text-slate-300 text-[11px]"
                    >
                      關閉
                    </button>
                  </div>
                  <div className="space-y-1.5 leading-relaxed text-[11px]">
                    <p>
                      <strong className="text-emerald-400">🟢 AI Pro (最佳化分流 - 推薦)</strong>：專為使用 Google AI 訂閱免費配額打造，對話使用極速 <code className="text-cyan-300">gemini-3.5-flash-lite</code>，圖片使用 <code className="text-purple-300">gemini-3.6-flash</code>，核心生成使用 <code className="text-amber-300">gemini-3.8-flash</code>，零超額且具備自動降級保護。
                    </p>
                    <p>
                      <strong className="text-blue-400">🔵 AI Ultra 5x / 20x</strong>：適合已訂閱 Google One AI Premium / Ultra 方案的用戶，享有更高並發配額，全模組開啟旗艦深度思考。
                    </p>
                  </div>
                </div>
              )}
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
