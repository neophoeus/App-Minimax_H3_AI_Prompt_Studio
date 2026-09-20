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
} from 'lucide-react';
import { EngineTier, AppMode, SystemModeStatus, OllamaModelItem } from '../types';

interface NavbarProps {
  appMode: AppMode;
  onChangeAppMode: (mode: AppMode) => void;
  systemStatus: SystemModeStatus | null;
  onRefreshStatus: () => void;
  engineTier: EngineTier;
  onChangeEngineTier: (tier: EngineTier) => void;
  ollamaModel: string;
  onChangeOllamaModel: (model: string) => void;
  ollamaModels: OllamaModelItem[];
  onOpenPresets: () => void;
  onOpenHistory: () => void;
  onResetOptions: () => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  appMode,
  onChangeAppMode,
  systemStatus,
  onRefreshStatus,
  engineTier,
  onChangeEngineTier,
  ollamaModel,
  onChangeOllamaModel,
  ollamaModels,
  onOpenPresets,
  onOpenHistory,
  onResetOptions,
  savedCount,
}) => {
  const [showModeInfo, setShowModeInfo] = useState(false);
  const [showTierInfo, setShowTierInfo] = useState(false);
  const [showPaidApiInfo, setShowPaidApiInfo] = useState(false);

  const modeLabels: Record<AppMode, string> = {
    ai_studio: 'AI Studio 訂閱版',
    ollama: '本地 Ollama 版',
    paid_api: '本地 Paid API 版',
  };

  const isAutoSelected = systemStatus?.recommendedMode === appMode;

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
                MiniMax-H3 AI 提示詞助手
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                v2.1.0 • 3模式自動偵測
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>三段式標準結構 (Ref + Core + Scene Timeline)</span>
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

        {/* Operating Mode Switcher & Controls */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
          {/* 3-Mode Primary Pill Switcher */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 shadow-inner">
            {/* Mode 1: AI Studio 內運行版 (Priority 1) */}
            <button
              type="button"
              onClick={() => onChangeAppMode('ai_studio')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                appMode === 'ai_studio'
                  ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-purple-200 border border-purple-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="模式一：AI Studio 訂閱制度/內運行版 (優先級 1，免額度最佳化路由)"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Studio 訂閱版</span>
              {systemStatus?.detectedModes.ai_studio ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="已偵測到 AI Studio 環境" />
              ) : null}
            </button>

            {/* Mode 2: 本地 Ollama 版 (Priority 2) */}
            <button
              type="button"
              onClick={() => onChangeAppMode('ollama')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                appMode === 'ollama'
                  ? 'bg-gradient-to-r from-amber-600/30 to-orange-600/30 text-amber-200 border border-amber-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="模式二：本地 Ollama 離線模型 (優先級 2，動態探索本地模型)"
            >
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>本地 Ollama 版</span>
              {systemStatus?.detectedModes.ollama ? (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
                  title={`本機 Ollama 線上 (${systemStatus.details.ollamaModelCount} 個模型)`}
                />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" title="本機 Ollama 離線或未偵測到模型" />
              )}
            </button>

            {/* Mode 3: 本地 Paid API 版 (Priority 3) */}
            <button
              type="button"
              onClick={() => onChangeAppMode('paid_api')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                appMode === 'paid_api'
                  ? 'bg-gradient-to-r from-emerald-600/30 to-teal-600/30 text-emerald-200 border border-emerald-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="模式三：本地 Paid API 版 (優先級 3，使用本機配置的 Gemini API Key)"
            >
              <Key className="w-3.5 h-3.5 text-teal-400" />
              <span>本地 Paid API 版</span>
              {systemStatus?.detectedModes.paid_api ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="已配置 Gemini API Key" />
              ) : null}
            </button>
          </div>

          {/* Sub-selector / Options per Mode */}
          {/* 1. If AI Studio Mode: Subscription Tier Selector (Pro, Ultra 5x, Ultra 20x) */}
          {appMode === 'ai_studio' && (
            <div className="relative flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 shadow-inner">
              <div className="flex items-center gap-1">
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

          {/* 2. If Ollama Mode: Dynamic Model Selector */}
          {appMode === 'ollama' && (
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 shadow-inner">
              <div className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-amber-400 ml-1.5" />
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

                <button
                  type="button"
                  onClick={() => setShowModeInfo(!showModeInfo)}
                  className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
                  title="查看本機模型說明"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* 3. If Paid API Mode: Direct Pay-As-You-Go Flagship Badge */}
          {appMode === 'paid_api' && (
            <div className="relative flex items-center bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-700/80 shadow-inner">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-teal-300 font-medium">Gemini 3.8 旗艦直通</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-950/80 border border-teal-500/30 text-teal-200">
                  按量計費 / 無訂閱配額限制
                </span>
                <button
                  type="button"
                  onClick={() => setShowPaidApiInfo(!showPaidApiInfo)}
                  className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
                  title="查看付費 API 模式說明"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Paid API Info Modal */}
              {showPaidApiInfo && (
                <div className="absolute right-0 top-full mt-2 w-80 p-3.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 text-xs text-slate-300 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-teal-400" />
                      本地 Paid API 付費直通說明
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
                      <strong className="text-teal-300">🔑 按量計費 (Pay-as-you-go)</strong>：使用您自行在 Google Cloud 綁定信用卡建立的 Paid API Key，具備高頻發配額。
                    </p>
                    <p>
                      <strong className="text-emerald-400">⚡ 旗艦全核心解鎖</strong>：不受 Google 訂閱制免費額度約束，對話、視覺分析與提示詞生成皆直接呼叫旗艦級 <code className="text-amber-300">gemini-3.8-flash</code> 進行深度推理，無需降級或進行 3.5-lite 分流。
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode Info Modal (Explains 3 modes & Auto-detection Priority) */}
          {showModeInfo && (
            <div className="absolute right-4 top-16 w-88 sm:w-96 p-4 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 text-xs text-slate-300 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  三模式自動偵測與優先次序機制
                </span>
                <button
                  onClick={() => setShowModeInfo(false)}
                  className="text-slate-500 hover:text-slate-300 text-[11px]"
                >
                  關閉
                </button>
              </div>

              <div className="space-y-2 text-[11px] leading-relaxed">
                <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="font-semibold text-slate-200">🏆 系統自動優先判定次序：</div>
                  <div className="text-slate-400">
                    <span className="text-purple-300 font-bold">1. AI Studio 訂閱版</span> ＞{' '}
                    <span className="text-amber-300 font-bold">2. 本地 Ollama 版</span> ＞{' '}
                    <span className="text-teal-300 font-bold">3. 本地 Paid API 版</span>
                  </div>
                  {systemStatus && (
                    <div className="mt-1 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                      <span>當前自動推薦：</span>
                      <span className="text-emerald-400 font-mono font-bold">
                        {modeLabels[systemStatus.recommendedMode]}
                        {isAutoSelected ? ' (正在使用)' : ' (已手動覆蓋)'}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <strong className="text-purple-300">1. AI Studio 訂閱制度內運行版</strong>
                  <p className="text-slate-400 mt-0.5">
                    運行於 Google AI Studio 或 Cloud Run 訂閱環境。支援 AI Pro、AI Ultra 5x、AI Ultra 20x 階梯方案，內建 Web UI 免額度最佳化分流策略。
                  </p>
                </div>

                <div>
                  <strong className="text-amber-300">2. 本地 Ollama 版</strong>
                  <p className="text-slate-400 mt-0.5">
                    連線至本機 <code className="text-amber-200">127.0.0.1:11434</code>。自動動態探索所有已下載模型（包含 Qwen3.8-27B 等），免聯網、100% 隱私離線生成。
                  </p>
                </div>

                <div>
                  <strong className="text-teal-300">3. 本地 Paid API 版</strong>
                  <p className="text-slate-400 mt-0.5">
                    本機端點連線搭配使用者自己的 Google Gemini Paid API Key，採按量計費，全模組直通旗艦級 Gemini 3.8 Flash 深度推理，不受訂閱額度限制。
                  </p>
                </div>
              </div>
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
