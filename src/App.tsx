/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  H3PromptConfig,
  H3PromptOutput,
  SavedPromptItem,
  PresetTemplate,
  CameraMove,
  GenerationMode,
} from './types';
import { Navbar } from './components/Navbar';
import { ReferenceManager } from './components/ReferenceManager';
import { TimelineVisualizer } from './components/TimelineVisualizer';
import { PromptSyntaxHighlighter } from './components/PromptSyntaxHighlighter';
import { PresetDrawer } from './components/PresetDrawer';
import { HistoryDrawer } from './components/HistoryDrawer';
import { Toast, ToastProps } from './components/Toast';
import {
  Sparkles,
  Copy,
  Check,
  Zap,
  Wand2,
  Film,
  Camera,
  Volume2,
  Sliders,
  RotateCcw,
  Layers,
  Edit3,
  HelpCircle,
  FileCode,
  ShieldCheck,
  Clock,
  LayoutGrid,
} from 'lucide-react';

const CAMERA_PRESETS: CameraMove[] = [
  'Push in',
  'Pull out',
  'Pan left',
  'Pan right',
  'Tilt up',
  'Tilt down',
  'Arc shot',
  'FPV drone',
  'Tracking shot',
  'Static',
];

const STYLE_PRESETS = [
  'Cinematic 8K Photorealistic, Anamorphic Lens',
  'Japanese Anime Style, Ufotable Quality, Fluid Animation',
  'Unreal Engine 5 Render, Volumetric Particles, High Detail',
  'Vintage 35mm Film Grain, Kodachrome Color Grading',
  'Cyberpunk Neon Noir, Rainy Reflections, Blade Runner',
  'High-End Luxury Commercial, Studio Macro 100mm',
  'Dark Fantasy Concept Art, Atmospheric Fog',
];

const LIGHTING_PRESETS = [
  'Volumetric ray lighting with subtle atmospheric dust particles',
  'Dramatic golden hour sunset with high-contrast warm rims',
  'Moody neon magenta & cyan neon reflections on wet surface',
  'Soft studio key light with clean rim lights',
  'Cinematic dark shadows with directional moonlight',
];

const DEFAULT_CONFIG: H3PromptConfig = {
  idea: '',
  mode: 'T2VA',
  duration: '10s',
  aspectRatio: '16:9',
  style: 'Cinematic 8K Photorealistic, Anamorphic Lens',
  cameraMoves: [],
  lightingMood: '',
  dialogueText: '',
  sfxText: '',
  suppressMusic: false,
  references: [],
};

export default function App() {
  const [config, setConfig] = useState<H3PromptConfig>(DEFAULT_CONFIG);
  const [output, setOutput] = useState<H3PromptOutput | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'full' | 'blocks' | 'timeline' | 'guide'>('full');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedPrompt, setEditedPrompt] = useState<string>('');

  // Toast & Drawers state
  const [toast, setToast] = useState<ToastProps | null>(null);
  const [isPresetOpen, setIsPresetOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [savedPrompts, setSavedPrompts] = useState<SavedPromptItem[]>([]);
  const [copiedFull, setCopiedFull] = useState<boolean>(false);

  // Helper to format rate limit / quota exceeded error cleanly
  const formatErrorMessage = (rawMsg: string) => {
    if (
      rawMsg.includes('429') ||
      rawMsg.includes('額度') ||
      rawMsg.includes('RESOURCE_EXHAUSTED') ||
      rawMsg.includes('Quota') ||
      rawMsg.includes('Rate limit')
    ) {
      return '⚠️ Gemini API 額度已用完，請稍等 1~2 分鐘後重試';
    }
    return rawMsg;
  };

  // Load saved options and history from localStorage on startup
  useEffect(() => {
    try {
      const savedOptions = localStorage.getItem('minimax_h3_saved_options');
      if (savedOptions) {
        const parsedOptions = JSON.parse(savedOptions);
        setConfig((prev) => ({
          ...prev,
          ...parsedOptions,
          idea: prev.idea || '',
        }));
      }
    } catch (e) {
      console.error('Failed to load saved options from localStorage', e);
    }

    try {
      const stored = localStorage.getItem('minimax_h3_saved_prompts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const migrated: SavedPromptItem[] = parsed.map((item: any) => ({
            id: item.id || `saved-${Date.now()}-${Math.random()}`,
            createdAt: item.createdAt || '',
            title: item.title || item.idea || '未命名項目',
            idea: item.idea || item.config?.idea || '',
            fullPrompt: item.fullPrompt || item.output?.fullPrompt || '',
            config: item.config,
            output: item.output,
          }));
          setSavedPrompts(migrated);
        }
      }
    } catch (e) {
      console.error('Failed to load history from localStorage', e);
    }
  }, []);

  // Save option changes to localStorage (excluding heavy media fileUrl data)
  useEffect(() => {
    try {
      const { idea, references, ...optionsToSave } = config;
      const cleanOptions = {
        ...optionsToSave,
        references: (references || []).map(({ fileUrl, ...rest }) => rest),
      };
      localStorage.setItem('minimax_h3_saved_options', JSON.stringify(cleanOptions));
    } catch (e) {
      console.error('Failed to save options to localStorage', e);
    }
  }, [config]);


  const [isGeneratingDialogue, setIsGeneratingDialogue] = useState<boolean>(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success', duration = 4500) => {
    setToast({
      message,
      type,
      duration,
      onClose: () => setToast(null),
    });
  };

  const handleAutoGenerateDialogue = async () => {
    setIsGeneratingDialogue(true);
    try {
      const res = await fetch('/api/generate-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: config.idea,
          style: config.style,
          mode: config.mode,
          duration: config.duration,
        }),
      });
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textErr = await res.text();
        throw new Error(`伺服器錯誤: ${textErr.slice(0, 100)}`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        const dialogueEn = json.data.dialogueEn || '';
        const sfxSuggestion = json.data.sfxSuggestion || '';
        setConfig((prev) => ({
          ...prev,
          dialogueText: dialogueEn,
          sfxText: prev.sfxText ? prev.sfxText : sfxSuggestion,
        }));
        showToast('已成功自動生成電影感台詞！', 'success');
      } else {
        const errStr = formatErrorMessage(json.error || '台詞生成失敗，請再試一次');
        showToast(errStr, 'error', 6000);
      }
    } catch (err: any) {
      console.error('Failed to generate dialogue:', err);
      const errStr = formatErrorMessage(err.message || '請再試一次');
      showToast(errStr, 'error', 6000);
    } finally {
      setIsGeneratingDialogue(false);
    }
  };

  // Helper to copy text to clipboard
  const copyToClipboard = async (text: string, label: string = '提示詞') => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast(`已一鍵複製 ${label} 至剪貼簿！`, 'success');
    } catch (err) {
      showToast('複製失敗，請手動複製', 'error');
    }
  };

  // Trigger Gemini API to call h3-prompt-writing skill
  const handleGenerate = async () => {
    if (!config.idea.trim()) {
      showToast('請先輸入創意思路或主題構想', 'info');
      return;
    }

    setLoading(true);
    setIsEditing(false);

    try {
      // Omit base64 fileUrl data from references before sending to reduce payload size
      const sanitizedConfig = {
        ...config,
        references: config.references.map((r) => ({
          id: r.id,
          tag: r.tag,
          role: r.role,
          name: r.name,
          description: r.description,
          fileType: r.fileType,
          fileName: r.fileName,
        })),
      };

      const res = await fetch('/api/generate-h3-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedConfig),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textErr = await res.text();
        throw new Error(`伺服器錯誤 (${res.status}): ${textErr.slice(0, 120)}`);
      }

      const data = await res.json();
      if (data.success && data.data) {
        const result: H3PromptOutput = data.data;
        setOutput(result);
        setEditedPrompt(result.fullPrompt);

        // Auto save to local history (saving idea & fullPrompt separately)
        const newItem: SavedPromptItem = {
          id: `saved-${Date.now()}`,
          createdAt: new Date().toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          title: (config.idea || '未命名項目').slice(0, 24) + ((config.idea || '').length > 24 ? '...' : ''),
          idea: config.idea,
          fullPrompt: result.fullPrompt,
          config: {
            ...config,
            references: config.references.map(({ fileUrl, ...rest }) => rest),
          },
          output: result,
        };

        const updatedHistory = [newItem, ...savedPrompts.slice(0, 29)];
        setSavedPrompts(updatedHistory);

        // Safely attempt localStorage write
        try {
          localStorage.setItem('minimax_h3_saved_prompts', JSON.stringify(updatedHistory));
        } catch (storageErr) {
          console.warn('LocalStorage quota exceeded, saving lightweight items:', storageErr);
          try {
            const lightweightHistory = updatedHistory.map(({ id, createdAt, title, idea, fullPrompt }) => ({
              id,
              createdAt,
              title,
              idea,
              fullPrompt,
            }));
            localStorage.setItem('minimax_h3_saved_prompts', JSON.stringify(lightweightHistory));
          } catch (e) {
            console.error('LocalStorage save failed completely:', e);
          }
        }

        showToast('已成功為您生成 MiniMax-H3 完整三段式提示詞！', 'success');
      } else {
        const errStr = formatErrorMessage(data.error || '生成失敗');
        showToast(errStr, 'error', 6000);
      }
    } catch (err: any) {
      console.error('Generation Error:', err);
      const errStr = formatErrorMessage(err.message || '請稍後再試');
      showToast(errStr, 'error', 6000);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (preset: PresetTemplate) => {
    const updated = { ...config, ...preset.config };
    setConfig(updated);
    showToast(`已載入預設模板：「${preset.titleZh}」`, 'info');
  };

  const handleLoadHistory = (item: SavedPromptItem) => {
    const loadedIdea = item.idea || item.config?.idea || '';
    const loadedPrompt = item.fullPrompt || item.output?.fullPrompt || '';

    if (item.config) {
      setConfig(item.config);
    } else if (loadedIdea) {
      setConfig((prev) => ({ ...prev, idea: loadedIdea }));
    }

    setEditedPrompt(loadedPrompt);
    if (item.output) {
      setOutput(item.output);
    } else {
      setOutput({
        fullPrompt: loadedPrompt,
        block1: '',
        block2: '',
        block3: '',
        temporalTimeline: [],
        audioNotes: '',
        explanationZh: '已載入歷史保存的核心創意思路與最終提示詞。',
        suggestions: [],
      });
    }
    showToast(`已載入歷史記錄：「${item.title}」`, 'info');
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = savedPrompts.filter((item) => item.id !== id);
    setSavedPrompts(updated);
    try {
      localStorage.setItem('minimax_h3_saved_prompts', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update localStorage on item deletion', e);
    }
    showToast('已刪除該筆歷史記錄', 'info');
  };

  const handleClearHistory = () => {
    setSavedPrompts([]);
    localStorage.removeItem('minimax_h3_saved_prompts');
    showToast('已清空所有歷史記錄', 'info');
  };

  const handleResetOptions = () => {
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem('minimax_h3_saved_options');
    showToast('已恢復所有選項設定為預設值', 'info');
  };

  const toggleCameraMove = (cam: CameraMove) => {
    const exists = config.cameraMoves.includes(cam);
    if (exists) {
      setConfig({
        ...config,
        cameraMoves: config.cameraMoves.filter((c) => c !== cam),
      });
    } else {
      setConfig({
        ...config,
        cameraMoves: [...config.cameraMoves, cam],
      });
    }
  };

  // Quick prompt modifiers to enhance prompt directly
  const applyModifier = (tagText: string) => {
    if (!editedPrompt) return;
    const newText = `${editedPrompt}\n${tagText}`;
    setEditedPrompt(newText);
    if (output) {
      setOutput({ ...output, fullPrompt: newText });
    }
    showToast(`已添加修飾語: ${tagText}`, 'success');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500/30">
      {/* Top Navigation Bar */}
      <Navbar
        onOpenPresets={() => setIsPresetOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onResetOptions={handleResetOptions}
        savedCount={savedPrompts.length}
      />

      {/* Main Studio Grid Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Control Panel: MiniMax-H3 Configurator (Col 5) */}
        <section className="lg:col-span-5 space-y-5">
          {/* Quick Idea Input Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-bold text-white">核心創意思路 (Core Idea)</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetOptions}
                  title="將所有拍攝選項與設定恢復為預設值"
                  className="text-xs text-amber-400/90 hover:text-amber-300 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>重設所有設定</span>
                </button>
                <span className="text-slate-700">|</span>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, idea: '' })}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  清空文字
                </button>
              </div>
            </div>

            <textarea
              value={config.idea}
              onChange={(e) => setConfig({ ...config, idea: e.target.value })}
              placeholder="請輸入您的創意思路或初步文字描述 (例如: 賽博朋克雨夜咖啡館，貓咪咖啡師為顧客調製發光咖啡...)"
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-all resize-none"
            />

            {/* Mode Selectors */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  生成模式 (MiniMax Generation Mode)
                </label>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30 font-bold">
                  {config.mode}
                </span>
              </div>

              {/* Mode Button Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {[
                  {
                    mode: 'T2VA',
                    title: 'T2VA',
                    desc: '純文字生成 (Text-to-Video)',
                  },
                  {
                    mode: 'I2VA',
                    title: 'I2VA',
                    desc: '首幀生成 (First Frame)',
                  },
                  {
                    mode: 'FL2VA',
                    title: 'FL2VA',
                    desc: '首尾雙幀 (First & Last Frame)',
                  },
                  {
                    mode: 'L2VA',
                    title: 'L2VA',
                    desc: '尾幀推導 (Last Frame)',
                  },
                  {
                    mode: 'Ref2VA',
                    title: 'Ref2VA',
                    desc: '全參考多模態 (Full-Ref)',
                  },
                ].map((item) => {
                  const active = config.mode === item.mode;
                  return (
                    <button
                      key={item.mode}
                      type="button"
                      onClick={() => setConfig({ ...config, mode: item.mode as GenerationMode })}
                      className={`p-2 rounded-xl text-left transition-all border flex flex-col justify-between ${
                        active
                          ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-950/50'
                          : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-mono font-bold text-xs flex items-center justify-between">
                        {item.title}
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                      </span>
                      <span className="text-[10px] leading-tight text-slate-400 mt-1 line-clamp-1">
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Mode Helper Box */}
              <div className="p-2.5 rounded-xl bg-slate-950/90 border border-purple-500/20 text-[11px] text-slate-300 flex items-start gap-2">
                <span className="text-purple-400 font-mono font-bold shrink-0">💡 功能解析:</span>
                <span className="leading-normal">
                  {config.mode === 'T2VA' && 'T2VA (Text-to-Video Audio)：無參考圖，從純文字建立完整視聽時間軸、分鏡與音效。'}
                  {config.mode === 'I2VA' && 'I2VA (First-Frame Image)：從上傳的第 1 幀圖片 (@image1) 開場，向後發展順暢動態與視覺故事。'}
                  {config.mode === 'FL2VA' && 'FL2VA (First & Last Frame)：提供首幀 (@image1) 與尾幀 (@image2)，描述兩幀之間連貫的運動軌跡與轉變。'}
                  {config.mode === 'L2VA' && 'L2VA (Last-Frame Image)：上傳結尾圖片 (@image1)，往前推導合理的開場鏡頭並收斂至該尾幀。'}
                  {config.mode === 'Ref2VA' && 'Ref2VA (Full-Reference Rewrites)：包含 subject_definitions, summary, retention_analysis, detailed_description, overall_soundscape, non_diegetic_music 六大區段。'}
                </span>
              </div>
            </div>
          </div>

          {/* Block 1: Reference Asset Manager */}
          <ReferenceManager
            references={config.references}
            onChange={(refs) => setConfig({ ...config, references: refs })}
          />

          {/* Style & Atmosphere Configurator */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Film className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">視聽視覺參數配置 (Visual & Audio)</h3>
            </div>

            {/* Aspect Ratio & Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  影片長度 (Duration)
                </label>
                <select
                  value={config.duration}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      duration: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="5s">5 秒 (5s)</option>
                  <option value="10s">10 秒 (10s) [推薦]</option>
                  <option value="15s">15 秒 (15s) [極限]</option>
                  <option value="20s">20 秒 (20s) [實驗性 - 非官方建議]</option>
                  <option value="25s">25 秒 (25s) [實驗性 - 非官方建議]</option>
                  <option value="30s">30 秒 (30s) [實驗性 - 非官方建議]</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  畫幅比例 (Aspect Ratio)
                </label>
                <select
                  value={config.aspectRatio}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      aspectRatio: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="16:9">16:9 (橫屏電影)</option>
                  <option value="9:16">9:16 (豎屏短影音)</option>
                  <option value="1:1">1:1 (正方形)</option>
                  <option value="21:9">21:9 (寬螢幕銀幕)</option>
                  <option value="4:3">4:3 (復古膠捲)</option>
                </select>
              </div>
            </div>

            {/* Style Selector */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                視覺畫風與渲染 (Style & Rendering)
              </label>
              <select
                value={config.style}
                onChange={(e) => setConfig({ ...config, style: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500 mb-1.5"
              >
                {STYLE_PRESETS.map((st, i) => (
                  <option key={i} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={config.style}
                onChange={(e) => setConfig({ ...config, style: e.target.value })}
                placeholder="自訂畫風描述..."
                className="w-full px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Camera Movement Multi-selector */}
            <div>
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  鏡頭運動語言 (Camera Directives)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {config.cameraMoves.length} 選取
                </span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CAMERA_PRESETS.map((cam) => {
                  const active = config.cameraMoves.includes(cam);
                  return (
                    <button
                      key={cam}
                      type="button"
                      onClick={() => toggleCameraMove(cam)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                        active
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      [{cam}]
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Audio & Dialogue controls */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  對話與音效設定 (Dialogue & Soundscape)
                </span>
                <button
                  type="button"
                  onClick={handleAutoGenerateDialogue}
                  disabled={isGeneratingDialogue}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-[11px] font-medium text-purple-300 hover:text-white transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-3 h-3 text-purple-400 ${isGeneratingDialogue ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingDialogue ? 'AI 靈感構思中...' : 'AI 自動撰寫對話'}</span>
                </button>
              </div>

              <div className="space-y-1">
                <input
                  type="text"
                  value={config.dialogueText}
                  onChange={(e) => setConfig({ ...config, dialogueText: e.target.value })}
                  placeholder='對話台詞 (可手動輸入或點擊右上角 AI 自動生成)'
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
                <p className="text-[10px] text-slate-500">
                  💡 對話台詞支援使用者手動自行輸入或利用 AI 依創意思路自動創作
                </p>
              </div>

              <input
                type="text"
                value={config.sfxText}
                onChange={(e) => setConfig({ ...config, sfxText: e.target.value })}
                placeholder="環境音效 (如: 咖啡機蒸氣聲、雨聲、機械purr)"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />

              {/* Suppress Music Toggle */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={config.suppressMusic}
                  onChange={(e) => setConfig({ ...config, suppressMusic: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-xs text-slate-300">
                  禁用背景純音樂 (自動附加 <code className="text-amber-400 font-mono">non_diegetic_music: N/A</code>)
                </span>
              </label>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:via-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-purple-900/30 flex items-center justify-center gap-2.5 transition-all transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>MiniMax-H3 AI 正在解析寫入技能標準...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 text-amber-300 animate-bounce" />
                <span>調用 Skill 生成 MiniMax-H3 完整提示詞</span>
              </>
            )}
          </button>
        </section>

        {/* Right Output Panel: One-Click Copy Hub & Inspector (Col 7) */}
        <section className="lg:col-span-7 space-y-5 flex flex-col">
          {/* Master Output Header Banner with One-Click Copy */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/40 border border-purple-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    H3 規格完全相符
                  </span>
                  <h2 className="text-lg font-bold text-white">生成的 MiniMax-H3 最終提示詞</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  包含 Block 1 素材標籤、Block 2 核心主題與 Block 3 鏡頭時間軸，支援一鍵複製貼上至 MiniMax 海螺 / Hailuo 3 AI 視訊生成器。
                </p>
              </div>

              {/* Big ONE-CLICK COPY Button */}
              <button
                type="button"
                onClick={() => {
                  const targetText = isEditing ? editedPrompt : output?.fullPrompt || '';
                  copyToClipboard(targetText, '完整提示詞');
                  setCopiedFull(true);
                  setTimeout(() => setCopiedFull(false), 2500);
                }}
                disabled={!output}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95 disabled:opacity-40 shrink-0"
              >
                {copiedFull ? (
                  <>
                    <Check className="w-5 h-5 text-slate-950 stroke-[3]" />
                    <span>已成功複製至剪貼簿！</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                    <span>一鍵複製完整生成提示詞</span>
                  </>
                )}
              </button>
            </div>

            {/* Output Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 pt-2 gap-2 overflow-x-auto scrollbar-none">
              <div className="flex items-center gap-1">
                {[
                  { id: 'full', label: '全量提示詞 (Full Prompt)', icon: FileCode },
                  { id: 'blocks', label: '三段式拆解 (Blocks)', icon: Layers },
                  { id: 'timeline', label: '分鏡故事板 (Timeline)', icon: Clock },
                  { id: 'guide', label: 'Skill 解析 (Guide)', icon: HelpCircle },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-medium transition-all border-b-2 whitespace-nowrap ${
                        active
                          ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                          : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Editing Switch */}
              {activeTab === 'full' && (
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? '返回語法亮顯' : '手動微調編輯'}</span>
                </button>
              )}
            </div>

            {/* Main Content Viewer based on Active Tab */}
            <div className="min-h-[300px]">
              {loading ? (
                <div className="p-12 text-center text-slate-500 space-y-3">
                  <div className="w-8 h-8 border-3 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-mono">正在自動計算寫入 MiniMax-H3 時間軸與鏡頭語法...</p>
                </div>
              ) : !output ? (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <Sparkles className="w-8 h-8 text-slate-700 mx-auto" />
                  <p className="text-sm font-medium">請點擊左側「調用 Skill 生成」按鈕</p>
                </div>
              ) : activeTab === 'full' ? (
                /* Tab 1: Full Prompt syntax highlight or editable textarea */
                <div className="space-y-3">
                  {isEditing ? (
                    <textarea
                      value={editedPrompt}
                      onChange={(e) => {
                        setEditedPrompt(e.target.value);
                        if (output) setOutput({ ...output, fullPrompt: e.target.value });
                      }}
                      rows={12}
                      className="w-full p-4 rounded-xl bg-slate-950 border border-purple-500/40 text-xs font-mono text-slate-200 focus:outline-none leading-relaxed"
                    />
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 max-h-[420px] overflow-y-auto">
                      <PromptSyntaxHighlighter text={output.fullPrompt} />
                    </div>
                  )}

                  {/* Quick Modifiers Toolbar */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <span className="text-slate-400">⚡ 一鍵附加修飾詞:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: '+ 立體氛圍光', text: '[Cinematic volumetric ray light, 8k anamorphic flare]' },
                        { label: '+ 環繞鏡頭', text: '[Arc shot revolving around subject]' },
                        { label: '+ 雙耳 3D 音效', text: 'audio_mix: 3D binaural spatial stereo soundscape' },
                        { label: '+ 禁用純音樂', text: 'non_diegetic_music: N/A' },
                      ].map((m, idx) => (
                        <button
                          key={idx}
                          onClick={() => applyModifier(m.text)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-purple-300 border border-slate-700 transition-colors"
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : activeTab === 'blocks' ? (
                /* Tab 2: 3-Block Inspector */
                <div className="space-y-4 text-xs">
                  {/* Block 1 */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-300 font-mono">
                        Block 1: Reference Material Notes
                      </span>
                      <button
                        onClick={() => copyToClipboard(output.block1, 'Block 1 素材聲明')}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
                      >
                        複製 Block 1
                      </button>
                    </div>
                    <p className="font-mono text-slate-300 whitespace-pre-wrap">{output.block1}</p>
                  </div>

                  {/* Block 2 */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-300 font-mono">
                        Block 2: Core Idea
                      </span>
                      <button
                        onClick={() => copyToClipboard(output.block2, 'Block 2 核心主題')}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
                      >
                        複製 Block 2
                      </button>
                    </div>
                    <p className="font-mono text-slate-300 whitespace-pre-wrap">{output.block2}</p>
                  </div>

                  {/* Block 3 */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-300 font-mono">
                        Block 3: Scene-by-Scene Description
                      </span>
                      <button
                        onClick={() => copyToClipboard(output.block3, 'Block 3 時間軸分鏡')}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
                      >
                        複製 Block 3
                      </button>
                    </div>
                    <p className="font-mono text-slate-300 whitespace-pre-wrap">{output.block3}</p>
                  </div>
                </div>
              ) : activeTab === 'timeline' ? (
                /* Tab 3: Timeline Visualizer */
                <TimelineVisualizer
                  timeline={output.temporalTimeline}
                  onCopyText={copyToClipboard}
                />
              ) : (
                /* Tab 4: H3 Skill Guide & Traditional Chinese Explanations */
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 text-xs leading-relaxed">
                  <div>
                    <h4 className="font-bold text-purple-300 text-sm mb-1">
                      💡 MiniMax-H3 Prompt 結構設計解析
                    </h4>
                    <p className="text-slate-300 whitespace-pre-wrap">{output.explanationZh}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <h4 className="font-bold text-cyan-300">
                      🚀 提示詞生成建議與 H3 最佳實踐 Tips:
                    </h4>
                    <ul className="list-disc pl-4 space-y-1 text-slate-300">
                      {output.suggestions.map((sug, i) => (
                        <li key={i}>{sug}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Drawers */}
      <PresetDrawer
        isOpen={isPresetOpen}
        onClose={() => setIsPresetOpen(false)}
        onSelectPreset={handleSelectPreset}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedPrompts={savedPrompts}
        onLoadPrompt={handleLoadHistory}
        onClearHistory={handleClearHistory}
        onDeleteItem={handleDeleteHistoryItem}
        onCopyText={copyToClipboard}
      />

      {/* Toast Notification */}
      {toast && <Toast {...toast} />}
    </div>
  );
}
