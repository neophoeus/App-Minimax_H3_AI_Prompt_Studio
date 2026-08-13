import React, { useState } from 'react';
import { SavedPromptItem } from '../types';
import { X, History, Trash2, Copy, Check, Sparkles, Lightbulb, FileText } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedPrompts: SavedPromptItem[];
  onLoadPrompt: (item: SavedPromptItem) => void;
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
  onCopyText: (text: string, label: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  savedPrompts,
  onLoadPrompt,
  onClearHistory,
  onDeleteItem,
  onCopyText,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string, key: string) => {
    onCopyText(text, label);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between overflow-y-auto space-y-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">歷史記錄 (思路與提示詞)</h2>
          </div>
          <div className="flex items-center gap-2">
            {savedPrompts.length > 0 && (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/40 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清空記錄</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Confirmation Modal for Clear History */}
        {showConfirmClear && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-rose-400">
                <Trash2 className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold text-white">確認清空所有歷史記錄？</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                此動作將會清除所有備份的核心創意思路與最終提示詞，且無法復原。您確定要清空嗎？
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    onClearHistory();
                    setShowConfirmClear(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-medium text-white shadow-lg shadow-rose-900/30 transition-all"
                >
                  確認清空
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          {savedPrompts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm">尚未有產出的 MiniMax-H3 歷史記錄。</p>
              <p className="text-xs text-slate-600">
                每當您成功生成提示詞，系統會自動分開保存核心創意思路與最終提示詞。
              </p>
            </div>
          ) : (
            savedPrompts.map((item) => {
              const itemIdea = item.idea || item.config?.idea || '（無創意思路）';
              const itemPrompt = item.fullPrompt || item.output?.fullPrompt || '';
              const copyIdeaKey = `idea-${item.id}`;
              const copyPromptKey = `prompt-${item.id}`;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/90 hover:border-cyan-500/40 transition-all space-y-3 shadow-lg"
                >
                  {/* Item Header */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
                    <div>
                      <h3 className="text-sm font-bold text-white">{item.title || '未命名項目'}</h3>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {item.createdAt}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onLoadPrompt(item);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-xs font-medium text-cyan-200 flex items-center gap-1 transition-all"
                      >
                        <span>載入至編輯區</span>
                      </button>

                      <button
                        onClick={() => onDeleteItem(item.id)}
                        title="刪除此筆記錄"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:border-rose-800/60 border border-slate-700/50 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 核心創意思路 (Idea) Card */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-purple-900/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1">
                        <Lightbulb className="w-3.5 h-3.5 text-purple-400" />
                        核心創意思路
                      </span>
                      <button
                        onClick={() => handleCopy(itemIdea, '核心創意思路', copyIdeaKey)}
                        className="text-[11px] px-2 py-0.5 rounded bg-purple-950/50 hover:bg-purple-900/50 border border-purple-800/40 text-purple-200 flex items-center gap-1 transition-all"
                      >
                        {copiedKey === copyIdeaKey ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">已複製思路</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>複製思路</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed line-clamp-3">
                      {itemIdea}
                    </p>
                  </div>

                  {/* 最終提示詞 (Full Prompt) Card */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-900/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        最終提示詞 (MiniMax-H3)
                      </span>
                      <button
                        onClick={() => handleCopy(itemPrompt, '最終提示詞', copyPromptKey)}
                        className="text-[11px] px-2 py-0.5 rounded bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-800/40 text-cyan-200 flex items-center gap-1 transition-all"
                      >
                        {copiedKey === copyPromptKey ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">已複製提示詞</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>複製提示詞</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap line-clamp-4">
                      {itemPrompt}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
