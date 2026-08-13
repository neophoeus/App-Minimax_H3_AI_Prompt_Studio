import React from 'react';
import { TemporalSegment } from '../types';
import { Camera, Clock, Volume2, Film, Copy, Check } from 'lucide-react';

interface TimelineVisualizerProps {
  timeline: TemporalSegment[];
  onCopyText: (text: string, label: string) => void;
}

export const TimelineVisualizer: React.FC<TimelineVisualizerProps> = ({
  timeline,
  onCopyText,
}) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const handleCopySegment = (segment: TemporalSegment, index: number) => {
    const text = `${segment.timeframe} ${segment.camera} ${segment.action} (Audio: ${segment.audio})`;
    onCopyText(text, `時間軸片段 ${segment.timeframe}`);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!timeline || timeline.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-500">
        點擊「生成 MiniMax-H3 提示詞」後，將在此呈現分鏡時間軸與鏡頭軌跡分析。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            Block 3: 分鏡時間軸故事板 (Temporal Timeline)
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          共 {timeline.length} 段分鏡
        </span>
      </div>

      <div className="relative pl-4 sm:pl-6 border-l-2 border-slate-800 space-y-4">
        {timeline.map((segment, idx) => (
          <div key={idx} className="relative group">
            {/* Timeline Dot */}
            <div className="absolute -left-[21px] sm:-left-[29px] top-3 w-3 h-3 rounded-full bg-cyan-500 ring-4 ring-slate-950 group-hover:scale-125 transition-transform" />

            {/* Storyboard Card */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-cyan-500/40 transition-all space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {segment.timeframe}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-mono text-xs font-bold flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    {segment.camera}
                  </span>
                </div>

                <button
                  onClick={() => handleCopySegment(segment, idx)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white transition-colors"
                  title="複製此片段"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">已複製</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>複製段落</span>
                    </>
                  )}
                </button>
              </div>

              {/* Action */}
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {segment.action}
              </p>

              {/* Audio & Dialogue */}
              {segment.audio && (
                <div className="flex items-start gap-1.5 pt-1 text-xs text-emerald-300/90 bg-emerald-950/30 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="font-mono">{segment.audio}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
