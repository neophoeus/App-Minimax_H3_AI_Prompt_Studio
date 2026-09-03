import React, { useState } from 'react';
import { Sparkles, BookOpen, History, ExternalLink, Cpu, Volume2, Video, RotateCcw, Zap, HelpCircle } from 'lucide-react';
import { EngineTier } from '../types';

interface NavbarProps {
  engineTier: EngineTier;
  onChangeEngineTier: (tier: EngineTier) => void;
  onOpenPresets: () => void;
  onOpenHistory: () => void;
  onResetOptions: () => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  engineTier,
  onChangeEngineTier,
  onOpenPresets,
  onOpenHistory,
  onResetOptions,
  savedCount,
}) => {
  const [showTierInfo, setShowTierInfo] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                h3-prompt-writing skill
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

        {/* Engine Tier Selector & Actions */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* AI Quota Tier Switcher */}
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
                title="AI Pro (Web UI 配額最佳化)：智慧多模型分流，極速響應且零 429 報錯"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>AI Pro 最佳化</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeEngineTier('ultra_5x')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  engineTier === 'ultra_5x'
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="AI Ultra 5x (進階效能)：全核心 gemini-3.8-flash 深度推理"
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
                title="AI Ultra 20x (極致旗艦)：頂級深度推理與高精多模態鎖定"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>Ultra 20x</span>
              </button>

              {/* Info popup button */}
              <button
                type="button"
                onClick={() => setShowTierInfo(!showTierInfo)}
                className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
                title="查看算力方案說明"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tier Info Dropdown Modal */}
            {showTierInfo && (
              <div className="absolute right-0 top-full mt-2 w-80 p-3.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 text-xs text-slate-300 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    AI 算力與配額方案說明
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
                    <strong className="text-emerald-400">🟢 AI Pro (Web UI 最佳化 - 推薦)</strong>：專為使用 Google AI 訂閱與免費 API 打造，對話使用極速 <code className="text-cyan-300">gemini-3.5-flash-lite</code>，圖片使用 <code className="text-purple-300">gemini-2.5-flash</code>，核心生成使用 <code className="text-amber-300">gemini-3.8-flash</code>，零超額且具備自動降級保護。
                  </p>
                  <p>
                    <strong className="text-blue-400">🔵 AI Ultra 5x / 20x</strong>：適合已在 Google Cloud 綁定 Ultra 附贈 US$100 抵免額的進階用戶，全模組開啟旗艦深度思考與高精特徵分析。
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Preset Gallery Trigger */}
          <button
            onClick={onOpenPresets}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 hover:text-white transition-all shadow-sm active:scale-95"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>官方預設模板</span>
          </button>

          {/* Reset All Options Button */}
          <button
            onClick={onResetOptions}
            title="清空輸入並將所有拍攝參數恢復為預設值"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-950/40 border border-slate-700/80 hover:border-amber-700/50 text-xs font-medium text-amber-300 hover:text-amber-200 transition-all shadow-sm active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>重設所有設定</span>
          </button>

          {/* History Drawer Trigger */}
          <button
            onClick={onOpenHistory}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 hover:text-white transition-all shadow-sm active:scale-95"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>歷史記錄</span>
            {savedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-500 text-[10px] font-bold text-white">
                {savedCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
