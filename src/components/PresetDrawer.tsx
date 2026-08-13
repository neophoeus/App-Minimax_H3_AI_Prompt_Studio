import React from 'react';
import { PRESET_TEMPLATES } from '../data/presets';
import { PresetTemplate, H3PromptConfig } from '../types';
import { X, Sparkles, Film, ArrowRight, ShieldCheck } from 'lucide-react';

interface PresetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: PresetTemplate) => void;
}

export const PresetDrawer: React.FC<PresetDrawerProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', 'Cinematic', 'Anime', 'Commercial', 'Action'];

  const filteredPresets = PRESET_TEMPLATES.filter((p) =>
    selectedCategory === 'All' ? true : p.category === selectedCategory
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between overflow-y-auto space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">MiniMax-H3 官方預設模板庫</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {cat === 'All' ? '全部類別' : cat}
            </button>
          ))}
        </div>

        {/* Preset Cards List */}
        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          {filteredPresets.map((preset) => (
            <div
              key={preset.id}
              className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/50 transition-all space-y-3 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                      {preset.config.mode}
                    </span>
                    <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                      {preset.titleZh}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{preset.descriptionZh}</p>
                </div>

                <button
                  onClick={() => {
                    onSelectPreset(preset);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white flex items-center gap-1 shrink-0 transition-transform active:scale-95 shadow-md shadow-purple-600/20"
                >
                  <span>套用此模板</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Badges preview */}
              <div className="flex items-center flex-wrap gap-2 text-[11px] text-slate-400 font-mono">
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  ⏱️ {preset.config.duration}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  📐 {preset.config.aspectRatio}
                </span>
                {preset.config.references && preset.config.references.length > 0 && (
                  <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30">
                    📎 {preset.config.references.length} 個素材標籤
                  </span>
                )}
                {preset.config.suppressMusic && (
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    🔇 禁用純旁白音樂
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>模板均完全符合 MiniMax-H3 官方聲明規格，載入後可自由修改概念或參照檔標籤。</span>
        </div>
      </div>
    </div>
  );
};
