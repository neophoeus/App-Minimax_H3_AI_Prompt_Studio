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
  CameraAmplitude,
  CameraSpeed,
  GenerationMode,
  CreativityLevel,
  TemperatureMode,
  EngineTier,
  AiProvider,
  AppMode,
  SystemModeStatus,
  OllamaModelItem,
  OllamaStatus,
  LlamaCppModelItem,
  OutputContract,
  AuditResult,
} from './types';
import { auditPrompt, repairPrompt } from './utils/promptAudit';
import { Navbar } from './components/Navbar';
import { ReferenceManager } from './components/ReferenceManager';
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
  Edit3,
  HelpCircle,
  FileCode,
  ShieldCheck,
  Clock,
  LayoutGrid,
  Type,
  Thermometer,
  Minus,
  Plus,
  X,
  ListOrdered,
  Download,
  Flame,
  Compass,
  AlertTriangle,
  Wrench,
  RefreshCw,
} from 'lucide-react';

interface CameraMoveDetail {
  move: CameraMove;
  zh: string;
  hint: string;
}

interface CameraGroup {
  id: string;
  groupName: string;
  shortName: string;
  items: CameraMoveDetail[];
}

const CAMERA_PRESET_GROUPS: CameraGroup[] = [
  {
    id: 'push_zoom',
    groupName: '推進與縮放 (Push & Zoom)',
    shortName: '推拉縮放',
    items: [
      { move: 'Push In', zh: '推進 (聚焦前進)', hint: '↗' },
      { move: 'Pull Out', zh: '拉遠 (視角後退)', hint: '↘' },
      { move: 'Zoom In', zh: '變焦放大 (視角收窄)', hint: '⊕' },
      { move: 'Zoom Out', zh: '變焦縮小 (視角拓寬)', hint: '⊖' },
    ],
  },
  {
    id: 'pan_truck',
    groupName: '搖鏡與平移 (Pan & Truck)',
    shortName: '搖移平移',
    items: [
      { move: 'Pan Left', zh: '向左搖鏡 (軸心轉動)', hint: '↶' },
      { move: 'Pan Right', zh: '向右搖鏡 (軸心轉動)', hint: '↷' },
      { move: 'Truck Left', zh: '向左平移 (水平橫移)', hint: '←' },
      { move: 'Truck Right', zh: '向右平移 (水平橫移)', hint: '→' },
    ],
  },
  {
    id: 'tilt_pedestal',
    groupName: '俯仰與升降 (Tilt & Pedestal)',
    shortName: '俯仰升降',
    items: [
      { move: 'Tilt Up', zh: '向上俯仰 (仰角抬鏡)', hint: '↑' },
      { move: 'Tilt Down', zh: '向下俯仰 (俯角壓鏡)', hint: '↓' },
      { move: 'Pedestal Up', zh: '鏡頭垂直升 (機位升高)', hint: '⇈' },
      { move: 'Pedestal Down', zh: '鏡頭垂直降 (機位降低)', hint: '⇊' },
    ],
  },
  {
    id: 'arc_track',
    groupName: '環繞、跟拍與主觀 (Arc, Tracking & POV)',
    shortName: '跟拍主觀',
    items: [
      { move: 'Arc Shot', zh: '環繞運鏡 (360°弧形)', hint: '↻' },
      { move: 'Tracking Shot', zh: '跟隨拍攝 (動態追蹤)', hint: '🏃' },
      { move: 'Static Shot', zh: '固定鏡頭 (靜止穩定)', hint: '⏺' },
      { move: 'POV', zh: '主觀視角 (第一人稱)', hint: '👁' },
    ],
  },
  {
    id: 'shake_roll',
    groupName: '晃動與旋轉 (Shake & Roll)',
    shortName: '晃動旋轉',
    items: [
      { move: 'Shake Slightly', zh: '微幅手持 (呼吸感晃動)', hint: '〰️' },
      { move: 'Shake Strongly', zh: '劇烈震顫 (撞擊震撼感)', hint: '⚡' },
      { move: 'Roll Clockwise', zh: '順時針旋轉 (傾側滾轉)', hint: '↷' },
      { move: 'Roll Counterclockwise', zh: '逆時針旋轉 (傾側滾轉)', hint: '↶' },
    ],
  },
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
  cameraAmplitude: 'default',
  cameraSpeed: 'default',
  lightingMood: '',
  dialogueText: '',
  sfxText: '',
  suppressMusic: false,
  assistantDirector: true,
  outputContract: 'official',
  temperatureMode: 'auto',
  manualTemperature: 0.7,
  engineTier: 'pro',
  references: [],
  isSeriesMode: false,
  seriesCount: 5,
};

export default function App() {
  const [engineTier, setEngineTier] = useState<EngineTier>('pro');
  const [appMode, setAppMode] = useState<AppMode>(() => {
    try {
      const saved = localStorage.getItem('minimax_h3_app_mode') as AppMode;
      if (saved && ['ai_studio', 'ollama', 'llamacpp', 'paid_api'].includes(saved)) {
        return saved;
      }
      const legacy = localStorage.getItem('minimax_h3_ai_provider');
      if (legacy === 'ollama') return 'ollama';
      if (legacy === 'llamacpp') return 'llamacpp';
      return 'ai_studio';
    } catch {
      return 'ai_studio';
    }
  });
  const [ollamaModel, setOllamaModel] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('minimax_h3_ollama_model');
      return saved || 'orcarouter/Qwen3.8-27B-Uncensored:q6_K';
    } catch {
      return 'orcarouter/Qwen3.8-27B-Uncensored:q6_K';
    }
  });
  const [llamacppModel, setLlamaCppModel] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('minimax_h3_llamacpp_model');
      return saved || 'default';
    } catch {
      return 'default';
    }
  });
  const [systemStatus, setSystemStatus] = useState<SystemModeStatus | null>(null);
  const [ollamaModels, setOllamaModels] = useState<OllamaModelItem[]>([]);
  const [llamacppModels, setLlamaCppModels] = useState<LlamaCppModelItem[]>([]);
  const [config, setConfig] = useState<H3PromptConfig>(DEFAULT_CONFIG);
  const [output, setOutput] = useState<H3PromptOutput | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'full' | 'guide' | 'series'>('full');
  const [selectedEpisodeIdx, setSelectedEpisodeIdx] = useState<number>(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedPrompt, setEditedPrompt] = useState<string>('');

  // Toast & Drawers state
  const [toast, setToast] = useState<ToastProps | null>(null);
  const [isPresetOpen, setIsPresetOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [savedPrompts, setSavedPrompts] = useState<SavedPromptItem[]>([]);
  const [copiedFull, setCopiedFull] = useState<boolean>(false);
  const [copiedSeries, setCopiedSeries] = useState<boolean>(false);
  const [copiedComfy, setCopiedComfy] = useState<boolean>(false);
  const [copiedEpisodeIdx, setCopiedEpisodeIdx] = useState<number | null>(null);

  // Single Episode Refine State
  const [refineTargetIdx, setRefineTargetIdx] = useState<number | null>(null);
  const [refineInstruction, setRefineInstruction] = useState<string>('');
  const [refining, setRefining] = useState<boolean>(false);

  // Prompt Audit State
  const [showAuditDetails, setShowAuditDetails] = useState<boolean>(false);

  const activePrompt = isEditing ? editedPrompt : output?.fullPrompt || '';
  const currentAudit = React.useMemo(() => {
    if (!activePrompt) return null;
    return auditPrompt(activePrompt, {
      duration: config.duration,
      cameraMoves: config.cameraMoves,
      mode: config.mode,
    });
  }, [activePrompt, config.duration, config.cameraMoves, config.mode]);

  // Camera Motion tabs & view mode state
  const [cameraTabIdx, setCameraTabIdx] = useState<number>(0);
  const [cameraViewMode, setCameraViewMode] = useState<'tabs' | 'all'>('tabs');

  // Idea input font size state with localStorage persistence (12px ~ 20px)
  const FONT_SIZE_STEPS = [12, 14, 16, 18, 20];
  const [ideaFontSize, setIdeaFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('minimax_h3_idea_font_size');
      return saved ? parseInt(saved, 10) || 14 : 14;
    } catch {
      return 14;
    }
  });

  const handleFontSizeChange = (delta: number) => {
    const currentIndex = FONT_SIZE_STEPS.indexOf(ideaFontSize);
    const validIndex = currentIndex !== -1 ? currentIndex : 1;
    const nextIndex = Math.max(0, Math.min(FONT_SIZE_STEPS.length - 1, validIndex + delta));
    const newSize = FONT_SIZE_STEPS[nextIndex];
    setIdeaFontSize(newSize);
    try {
      localStorage.setItem('minimax_h3_idea_font_size', String(newSize));
    } catch (e) {
      console.error('Failed to save font size', e);
    }
  };

  // Helper to format rate limit / quota exceeded / safety block / high demand 503 error cleanly
  const formatErrorMessage = (rawMsg: string) => {
    if (
      rawMsg.includes('安全性阻擋') ||
      rawMsg.includes('SAFETY') ||
      rawMsg.includes('PROHIBITED_CONTENT') ||
      rawMsg.includes('BLOCKLIST')
    ) {
      return rawMsg;
    }
    if (
      rawMsg.includes('429') ||
      rawMsg.includes('額度') ||
      rawMsg.includes('RESOURCE_EXHAUSTED') ||
      rawMsg.includes('Quota') ||
      rawMsg.includes('Rate limit')
    ) {
      return rawMsg.includes('冷卻')
        ? rawMsg
        : '⚠️ Gemini API 額度限制 (429 Rate Limit)，系統已自動執行同模型退避重試與跨模型降級備援，請稍等片刻後重試！';
    }
    if (
      rawMsg.includes('503') ||
      rawMsg.includes('UNAVAILABLE') ||
      rawMsg.includes('high demand') ||
      rawMsg.includes('Spikes in demand') ||
      rawMsg.includes('負載') ||
      rawMsg.includes('overloaded')
    ) {
      return rawMsg.includes('多次退避')
        ? rawMsg
        : '⚠️ Gemini 模型目前負載較高 (503)，系統已嘗試退避重試，請稍候 3~5 秒後再試！';
    }
    if (rawMsg.includes('GEMINI_API_KEY')) {
      return '⚠️ 未設定 GEMINI_API_KEY 環境變數，請確認後端 .env 設定！';
    }
    if (rawMsg.includes('Ollama') || rawMsg.includes('本機')) {
      return rawMsg;
    }
    if (rawMsg.includes('Failed to fetch') || rawMsg.includes('NetworkError')) {
      return '⚠️ 網路連線中斷或伺服器未啟動，請檢查連線狀態！';
    }
    return rawMsg;
  };

  const checkSystemStatus = async (notify = false) => {
    try {
      const res = await fetch('/api/system/mode-status');
      const data: SystemModeStatus = await res.json();
      setSystemStatus(data);

      if (data.ollamaModels && Array.isArray(data.ollamaModels)) {
        setOllamaModels(data.ollamaModels);

        // Auto-reconcile or set default model
        setOllamaModel((curr) => {
          const exists = data.ollamaModels.some((m) => m.name === curr);
          if (!exists && data.defaultOllamaModel) {
            try {
              localStorage.setItem('minimax_h3_ollama_model', data.defaultOllamaModel);
            } catch (e) {}
            return data.defaultOllamaModel;
          }
          return curr;
        });
      }

      if (data.llamacppModels && Array.isArray(data.llamacppModels)) {
        setLlamaCppModels(data.llamacppModels);

        // Auto-reconcile or set default llama.cpp model
        setLlamaCppModel((curr) => {
          const exists = data.llamacppModels.some((m) => (m.id || m.name) === curr);
          if (!exists && data.defaultLlamaCppModel) {
            try {
              localStorage.setItem('minimax_h3_llamacpp_model', data.defaultLlamaCppModel);
            } catch (e) {}
            return data.defaultLlamaCppModel;
          }
          return curr;
        });
      }

      const activeMode = data.fixedMode || data.recommendedMode || 'paid_api';
      setAppMode(activeMode);
      const provider: AiProvider = activeMode === 'ollama' ? 'ollama' : activeMode === 'llamacpp' ? 'llamacpp' : 'gemini';
      setConfig((prev) => ({
        ...prev,
        appMode: activeMode,
        provider,
      }));

      if (notify) {
        const modeLabels: Record<AppMode, string> = {
          ai_studio: 'AI Studio 雲端引擎',
          paid_api: 'Gemini Paid API 直通引擎',
          ollama: '本地 Ollama 離線引擎',
          llamacpp: '本地 llama.cpp 離線引擎',
        };
        const currentLabel = modeLabels[activeMode] || '獨立引擎';
        if (activeMode === 'ollama') {
          showToast(`已重新整理本地 Ollama 狀態 (探測到 ${data.ollamaModels?.length || 0} 個模型)`, 'success');
        } else if (activeMode === 'llamacpp') {
          showToast(`已重新整理本地 llama.cpp 狀態 (8080 端口: ${data.details.llamacppOnline ? '線上' : '離線'})`, 'success');
        } else {
          showToast(`已更新引擎狀態【${currentLabel}】`, 'success');
        }
      }
    } catch (e: any) {
      console.error('Failed to check system status:', e);
      if (notify) {
        showToast('無法取得系統引擎狀態，請確認伺服器已啟動', 'error');
      }
    }
  };

  const handleOllamaModelChange = (model: string) => {
    setOllamaModel(model);
    setConfig((prev) => ({ ...prev, ollamaModel: model }));
    try {
      localStorage.setItem('minimax_h3_ollama_model', model);
    } catch (e) {
      console.error('Failed to save ollama model to localStorage', e);
    }
    const tag = model.includes(':') ? model.split(':')[1] : model;
    showToast(`已切換本機 Ollama 模型：${tag || model}`, 'info');
  };

  const handleLlamaCppModelChange = (model: string) => {
    setLlamaCppModel(model);
    setConfig((prev) => ({ ...prev, llamacppModel: model }));
    try {
      localStorage.setItem('minimax_h3_llamacpp_model', model);
    } catch (e) {
      console.error('Failed to save llamacpp model to localStorage', e);
    }
    const tag = model.includes('/') ? model.split('/').pop() : model.includes('\\') ? model.split('\\').pop() : model;
    showToast(`已切換本機 llama.cpp 模型：${tag || model}`, 'info');
  };

  const handleEngineTierChange = (tier: EngineTier) => {
    setEngineTier(tier);
    setConfig((prev) => ({ ...prev, engineTier: tier }));
    try {
      localStorage.setItem('minimax_h3_engine_tier', tier);
    } catch (e) {
      console.error('Failed to save engine tier to localStorage', e);
    }
    const label = tier === 'pro' ? 'AI Pro (訂閱配額最佳化)' : tier === 'ultra_5x' ? 'AI Ultra 5x (5倍訂閱配額)' : 'AI Ultra 20x (20倍訂閱配額)';
    showToast(`已切換 AI Studio 訂閱算力方案：${label}`, 'info');
  };

  // Load saved options and history from localStorage on startup
  useEffect(() => {
    checkSystemStatus(false);

    try {
      const savedTier = localStorage.getItem('minimax_h3_engine_tier') as EngineTier;
      if (savedTier && ['pro', 'ultra_5x', 'ultra_20x'].includes(savedTier)) {
        setEngineTier(savedTier);
      }
    } catch (e) {
      console.error('Failed to load engine tier from localStorage', e);
    }

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

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success', duration = 4500) => {
    setToast({
      message,
      type,
      duration,
      onClose: () => setToast(null),
    });
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
      // Include compressed image base64 data (~35KB) for image references to enable direct multimodal vision
      const sanitizedConfig: H3PromptConfig = {
        ...config,
        appMode,
        engineTier,
        provider: appMode === 'ollama' ? 'ollama' : appMode === 'llamacpp' ? 'llamacpp' : 'gemini',
        ollamaModel,
        llamacppModel,
        references: config.references.map((r) => ({
          id: r.id,
          tag: r.tag,
          role: r.role,
          name: r.name,
          description: r.description,
          fileType: r.fileType,
          fileName: r.fileName,
          pictureIndex: r.pictureIndex,
          physicalTag: r.physicalTag,
          isPureSubject: r.isPureSubject,
          fileUrl: r.fileType === 'image' && r.fileUrl && r.fileUrl.startsWith('data:image/') ? r.fileUrl : undefined,
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

        if (result.isSeries && result.episodes && result.episodes.length > 0) {
          setActiveTab('series');
          setSelectedEpisodeIdx(0);
          showToast(`已成功為您生成 ${result.episodes.length} 段系列連續提示詞！`, 'success');
        } else {
          setActiveTab('full');
          showToast('已成功為您生成 MiniMax-H3 完整提示詞！', 'success');
        }

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
      } else {
        const errStr = formatErrorMessage(data.error || '生成失敗');
        const toastDuration = errStr.includes('安全性阻擋') ? 8000 : 6000;
        showToast(errStr, 'error', toastDuration);
      }
    } catch (err: any) {
      console.error('Generation Error:', err);
      const errStr = formatErrorMessage(err.message || '請稍後再試');
      const toastDuration = errStr.includes('安全性阻擋') ? 8000 : 6000;
      showToast(errStr, 'error', toastDuration);
    } finally {
      setLoading(false);
    }
  };

  const copyAllEpisodes = () => {
    if (!output?.episodes || output.episodes.length === 0) return;
    const fullSeriesText = output.episodes
      .map((ep) => {
        return `/* ===================================================
   [MiniMax-H3 Series Clip #${ep.episodeIndex}]
   標題: ${ep.title} | 時長: ${ep.duration}
   起始狀態: ${ep.startingState}
   連續動作: ${ep.actionSequence}
   結束狀態: ${ep.endState}
   鏡頭運鏡: ${ep.cameraMovement}
   接續備註: ${ep.continuityNotes}
   =================================================== */

${ep.fullPrompt}`;
      })
      .join('\n\n\n');

    copyToClipboard(fullSeriesText, `全系列 ${output.episodes.length} 段提示詞`);
    setCopiedSeries(true);
    setTimeout(() => setCopiedSeries(false), 2500);
  };

  const exportSeriesMarkdown = () => {
    if (!output?.episodes || output.episodes.length === 0) return;
    const mdLines = [
      `# MiniMax-H3 系列連續提示詞專案: ${output.seriesTitle || config.idea || '未命名系列'}`,
      `> 故事弧概要: ${output.storyArcSummary || '無'}`,
      `> 生成模式: ${config.mode} | 時長: ${config.duration} | 比例: ${config.aspectRatio} | 輔助導演: ${config.assistantDirector !== false ? '已啟用' : '關閉'} | 採樣溫度: ${config.temperatureMode === 'manual' ? (config.manualTemperature ?? 0.7) : '自動預設'}`,
      `> 建立時間: ${new Date().toLocaleString('zh-TW')}`,
      '',
      '---',
      '',
    ];

    output.episodes.forEach((ep) => {
      mdLines.push(`## ${ep.title} (時長: ${ep.duration})`);
      mdLines.push(`- **起始狀態**: ${ep.startingState}`);
      mdLines.push(`- **連續動作**: ${ep.actionSequence}`);
      mdLines.push(`- **結束狀態**: ${ep.endState}`);
      mdLines.push(`- **鏡頭運鏡**: ${ep.cameraMovement}`);
      mdLines.push(`- **環境音效**: ${ep.audioSoundscape}`);
      mdLines.push(`- **接續說明**: ${ep.continuityNotes}`);
      mdLines.push('');
      mdLines.push('```text');
      mdLines.push(ep.fullPrompt);
      mdLines.push('```');
      mdLines.push('');
      mdLines.push('---');
      mdLines.push('');
    });

    const blob = new Blob([mdLines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minimax_h3_series_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('已匯出全系列分鏡 Markdown 檔案', 'success');
  };

  const copyComfyUIFormat = () => {
    if (!output) return;
    if (output.episodes && output.episodes.length > 0) {
      const text = output.episodes
        .map((ep) => {
          return `# --- [Episode ${ep.episodeIndex}: ${ep.title}] (Duration: ${ep.duration || config.duration}) ---\n${ep.fullPrompt}`;
        })
        .join('\n\n---\n\n');
      copyToClipboard(text, 'ComfyUI 序列工作流格式');
    } else {
      copyToClipboard(activePrompt, 'ComfyUI 提示詞');
    }
    setCopiedComfy(true);
    setTimeout(() => setCopiedComfy(false), 2500);
  };

  const handleRefineEpisode = async (episodeIndex: number) => {
    if (!output?.episodes || !refineInstruction.trim()) {
      showToast('請輸入此段分鏡的微調指引', 'info');
      return;
    }
    const targetIdx = output.episodes.findIndex((e) => e.episodeIndex === episodeIndex);
    if (targetIdx === -1) return;
    const currentEp = output.episodes[targetIdx];
    const prevEp = targetIdx > 0 ? output.episodes[targetIdx - 1] : undefined;
    const nextEp = targetIdx < output.episodes.length - 1 ? output.episodes[targetIdx + 1] : undefined;

    setRefining(true);
    try {
      const res = await fetch('/api/refine-series-episode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seriesTitle: output.seriesTitle,
          storyArcSummary: output.storyArcSummary,
          targetEpisodeIndex: episodeIndex,
          currentEpisode: currentEp,
          previousEpisode: prevEp,
          nextEpisode: nextEp,
          refineInstruction: refineInstruction.trim(),
          config: {
            ...config,
            engineTier,
            appMode,
            ollamaModel,
            llamacppModel,
          },
        }),
      });
      const data = await res.json();
      if (!data.success || !data.refinedEpisode) {
        throw new Error(data.error || '局部精修失敗');
      }
      const updatedEpisodes = [...output.episodes];
      updatedEpisodes[targetIdx] = data.refinedEpisode;
      setOutput({
        ...output,
        episodes: updatedEpisodes,
      });
      setRefineTargetIdx(null);
      setRefineInstruction('');
      showToast(`第 ${episodeIndex} 段已依據您的指引完成局部精修！`, 'success');
    } catch (err: any) {
      showToast(formatErrorMessage(err.message || '局部精修失敗'), 'error');
    } finally {
      setRefining(false);
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
        appMode={appMode}
        systemStatus={systemStatus}
        onRefreshStatus={() => checkSystemStatus(true)}
        engineTier={engineTier}
        onChangeEngineTier={handleEngineTierChange}
        ollamaModel={ollamaModel}
        onChangeOllamaModel={handleOllamaModelChange}
        ollamaModels={ollamaModels}
        llamacppModel={llamacppModel}
        onChangeLlamaCppModel={handleLlamaCppModelChange}
        llamacppModels={llamacppModels}
        onOpenPresets={() => setIsPresetOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onResetOptions={handleResetOptions}
        savedCount={savedPrompts.length}
      />

      {/* Main Studio Grid Layout - 3 大欄寬版佈局 (31% / 33% / 36%) */}
      <main className="flex-1 max-w-[1800px] w-full mx-auto p-4 sm:p-5 lg:p-6 xl:p-8 grid grid-cols-1 lg:grid-cols-[31fr_33fr_36fr] gap-6 items-start">
        {/* Column 1: 左邊輸入構想與素材 (Left: Input Concept & References) */}
        <section className="space-y-5 flex flex-col">
          {/* Quick Idea Input Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-bold text-white">核心創意思路 (Core Idea)</h2>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Font Size Adjuster Controls */}
                <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 text-xs shadow-inner">
                  <Type className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[11px] text-slate-400">字級:</span>
                  <button
                    type="button"
                    onClick={() => handleFontSizeChange(-1)}
                    disabled={ideaFontSize <= FONT_SIZE_STEPS[0]}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="縮小文字大小"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-[11px] font-bold text-purple-300 min-w-[28px] text-center">
                    {ideaFontSize}px
                  </span>
                  <button
                    type="button"
                    onClick={() => handleFontSizeChange(1)}
                    disabled={ideaFontSize >= FONT_SIZE_STEPS[FONT_SIZE_STEPS.length - 1]}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="放大文字大小"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-slate-700 hidden sm:inline">|</span>
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
              rows={8}
              style={{ fontSize: `${ideaFontSize}px`, lineHeight: 1.6 }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-all resize-y min-h-[240px]"
            />

            {/* Assistant Director & Temperature Configurator */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-3.5 shadow-inner">
              {/* Assistant Director Toggle */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                    <label className="text-xs font-semibold text-slate-200">
                      輔助導演開關 (Assistant Director)
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {config.assistantDirector !== false
                      ? '已啟用：AI 自動推理補充周邊環境動態、光影、次生物理細節（髮絲、水氣、景深分層）與運鏡流暢度。'
                      : '已關閉：規格直譯模式，100% 嚴格忠於原始輸入，零額外腦補與情節增添。'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, assistantDirector: config.assistantDirector === false })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.assistantDirector !== false ? 'bg-purple-600' : 'bg-slate-800'
                  }`}
                  role="switch"
                  aria-checked={config.assistantDirector !== false}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      config.assistantDirector !== false ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Sampling Temperature Control */}
              <div className="pt-2.5 border-t border-slate-800/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                    <label className="text-xs font-semibold text-slate-300">
                      採樣溫度 (Temperature)
                    </label>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {config.temperatureMode === 'manual' && (
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, temperatureMode: 'auto', manualTemperature: 0.7 })}
                        className="text-[10px] text-slate-400 hover:text-cyan-300 transition-colors underline decoration-dotted"
                        title="恢復自動推薦預設值"
                      >
                        恢復預設
                      </button>
                    )}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-cyan-800/60 bg-cyan-950/70 text-cyan-300 font-bold">
                      {config.temperatureMode === 'manual'
                        ? `${(config.manualTemperature ?? 0.7).toFixed(2)} (手動)`
                        : appMode === 'ai_studio' || appMode === 'paid_api'
                        ? 'Gemini 官方預設'
                        : '0.70 (本地推薦)'}
                    </span>
                  </div>
                </div>

                {/* Mode Selector Tabs: Auto vs Manual */}
                <div className="grid grid-cols-2 gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, temperatureMode: 'auto' })}
                    className={`py-1 text-[11px] font-medium rounded-md transition-all ${
                      config.temperatureMode !== 'manual'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    自動模式 (Auto)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, temperatureMode: 'manual' })}
                    className={`py-1 text-[11px] font-medium rounded-md transition-all ${
                      config.temperatureMode === 'manual'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    手動自訂 (Manual)
                  </button>
                </div>

                {/* Manual Slider (only shown when manual mode is active) */}
                {config.temperatureMode === 'manual' && (
                  <div className="space-y-1 pt-1">
                    <input
                      type="range"
                      min="0.0"
                      max="1.5"
                      step="0.05"
                      value={config.manualTemperature ?? 0.7}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          manualTemperature: parseFloat(e.target.value),
                        })
                      }
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>0.0 (精準收斂)</span>
                      <span className="text-cyan-400 font-bold">0.7 (平衡)</span>
                      <span>1.5 (高發散度)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

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
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2">
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
                      className={`p-2.5 rounded-xl text-left transition-all border flex flex-col justify-between min-h-[58px] ${
                        active
                          ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-950/50'
                          : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-mono font-bold text-xs flex items-center justify-between">
                        {item.title}
                        {active && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                      </span>
                      <span className="text-[10px] leading-snug text-slate-400 mt-1">
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

              {/* Single Clip vs Multi-Episode Series Mode Toggle */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <ListOrdered className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs font-semibold text-slate-200">生成架構策略</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, isSeriesMode: false })}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                        !config.isSeriesMode
                          ? 'bg-purple-600 text-white font-bold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      單段獨立生成
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, isSeriesMode: true })}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                        config.isSeriesMode
                          ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>系列連續生成</span>
                      <span className="px-1.5 py-0.2 bg-cyan-400/20 text-cyan-300 text-[10px] rounded-full font-mono">
                        {config.seriesCount || 5} 段
                      </span>
                    </button>
                  </div>
                </div>

                {config.isSeriesMode && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium flex items-center gap-1">
                        <span>系列段數 (Episodes)：</span>
                        <span className="font-mono text-cyan-400 font-bold">{config.seriesCount || 5} 段獨立提示詞</span>
                      </span>
                      <span className="text-[10px] text-slate-400">推薦 5 段（經典起承轉合）</span>
                    </div>

                    {/* Episode Count Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[2, 3, 4, 5, 6, 8, 10].map((num) => {
                        const active = (config.seriesCount || 5) === num;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setConfig({ ...config, seriesCount: num })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                              active
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-sm'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {num} 段
                          </button>
                        );
                      })}
                    </div>

                    <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                      💡 <strong className="text-slate-200">客觀物理連貫保障</strong>：一次生成 {config.seriesCount || 5} 段自包含、100% 獨立合法可貼之 MiniMax-H3 提示詞。全系列鎖定一致的主體定義（&lt;Subject 1&gt;）與畫風，第 K 段文字直接客觀承接第 K-1 段結束時的具體動作與姿態。
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Multi-Modal Reference Asset Manager */}
          <ReferenceManager
            references={config.references}
            onChange={(refs) => setConfig({ ...config, references: refs })}
            onToast={showToast}
            engineTier={engineTier}
          />
        </section>

        {/* Column 2: 中間調整設定與生成操作 (Middle: Adjust Settings & Action) */}
        <section className="space-y-5 flex flex-col">
          {/* Style & Atmosphere Configurator */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">視聽拍攝參數配置 (Parameters)</h3>
              </div>
              <button
                type="button"
                onClick={handleResetOptions}
                title="將所有拍攝選項與設定恢復為預設值"
                className="text-xs text-amber-400/90 hover:text-amber-300 transition-colors flex items-center gap-1 shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>重設設定</span>
              </button>
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
                  <option value="4s">4 秒 (4s) [精煉特寫]</option>
                  <option value="5s">5 秒 (5s) [快速鏡頭]</option>
                  <option value="6s">6 秒 (6s) [標準短片]</option>
                  <option value="8s">8 秒 (8s) [敘事展開]</option>
                  <option value="10s">10 秒 (10s) [官方標準推薦]</option>
                  <option value="12s">12 秒 (12s) [多鏡切換]</option>
                  <option value="15s">15 秒 (15s) [官方原生上限]</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  💡 官方支援 4~15s。超過 15 秒請切換至 Ref2VA 綁定前段影片使用「影片續寫 (Video Continuation)」。
                </p>
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

            {/* Style Selector: T2VA Only */}
            {config.mode === 'T2VA' ? (
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  視覺畫風與渲染 (Style & Rendering - T2VA 專用)
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
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] flex items-center gap-2 text-slate-400">
                <span className="text-base shrink-0">🖼️</span>
                <span>
                  <strong className="text-slate-300">視覺畫風由參考圖片自動錨定</strong>：依官方 H3 規範，圖片模式（{config.mode}）風格直接繼承參考素材，無須手動指定。
                </span>
              </div>
            )}

            {/* Output Contract Selector: Official vs Compact */}
            <div className="pt-2 border-t border-slate-800/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  輸出契約規格 (Output Contract)
                </span>
                <span className="text-[10px] text-purple-400 font-mono">
                  {config.outputContract === 'compact' ? '⚡ 簡約精煉 (Compact)' : '🏛️ 官方全量 (Official)'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, outputContract: 'official' })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                    config.outputContract !== 'compact'
                      ? 'bg-purple-950/80 border border-purple-500/60 text-purple-200 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>🏛️ 官方全量 (Official)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, outputContract: 'compact' })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                    config.outputContract === 'compact'
                      ? 'bg-cyan-950/80 border border-cyan-500/60 text-cyan-200 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>⚡ 簡約精煉 (Compact)</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {config.outputContract === 'compact'
                  ? '💡 Compact 模式：輸出稠密自然語言描繪與獨立聲音欄位，極致精簡且相容簡約工作流。'
                  : '💡 Official 模式：輸出 100% 官方標準六段式/三段式完整規格提示詞。'}
              </p>
            </div>

            {/* Camera Motion Three-Dimension System */}
            <div className="space-y-3 pt-2 border-t border-slate-800/60">
              {/* Header: Title + Counter + Quick Clear */}
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 min-w-0">
                  <Camera className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">運鏡指令控制 (Camera Motion)</span>
                </label>
                <div className="flex items-center gap-2 shrink-0">
                  {config.cameraMoves.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, cameraMoves: [] })}
                      className="text-[10px] text-slate-400 hover:text-red-400 transition-colors underline decoration-dotted"
                      title="清除所有已選運鏡"
                    >
                      清空
                    </button>
                  )}
                  <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded-md whitespace-nowrap shrink-0">
                    {config.cameraMoves.length} 項已選
                  </span>
                </div>
              </div>

              {/* Dimension 1: Category Tabs / View Mode Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1 pb-1 border-b border-slate-800/50">
                  {/* Category Pill Tabs */}
                  <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full flex-1 min-w-0">
                    {CAMERA_PRESET_GROUPS.map((grp, gIdx) => {
                      const selectedCount = grp.items.filter((item) => config.cameraMoves.includes(item.move)).length;
                      const isCurrentTab = cameraViewMode === 'tabs' && cameraTabIdx === gIdx;
                      return (
                        <button
                          key={grp.id}
                          type="button"
                          onClick={() => {
                            setCameraTabIdx(gIdx);
                            setCameraViewMode('tabs');
                          }}
                          className={`px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                            isCurrentTab
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/60 shadow-sm font-bold'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                          }`}
                        >
                          <span>{grp.shortName}</span>
                          {selectedCount > 0 && (
                            <span className="w-3.5 h-3.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[9px] font-mono font-bold flex items-center justify-center">
                              {selectedCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Toggle between Tabs and All */}
                  <button
                    type="button"
                    onClick={() => setCameraViewMode(cameraViewMode === 'tabs' ? 'all' : 'tabs')}
                    className="text-[10px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 shrink-0 whitespace-nowrap transition-colors"
                    title={cameraViewMode === 'tabs' ? '展開全部 20 種運鏡一覽' : '切換為分類分頁標籤'}
                  >
                    {cameraViewMode === 'tabs' ? '展開全部' : '分頁檢視'}
                  </button>
                </div>

                {/* Motion Type Presets: Tabbed Mode or All Mode */}
                {cameraViewMode === 'tabs' ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    {CAMERA_PRESET_GROUPS[cameraTabIdx]?.items.map((item) => {
                      const active = config.cameraMoves.includes(item.move);
                      return (
                        <button
                          key={item.move}
                          type="button"
                          onClick={() => toggleCameraMove(item.move)}
                          className={`p-2 rounded-xl text-left transition-all border flex items-center justify-between ${
                            active
                              ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-sm shadow-cyan-950/50'
                              : 'bg-slate-950/70 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-mono font-bold flex items-center gap-1.5">
                              <span className="text-cyan-400 text-sm leading-none shrink-0 font-sans">{item.hint}</span>
                              <span className="truncate">{item.move}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.zh}</div>
                          </div>
                          {active && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-1.5" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                    {CAMERA_PRESET_GROUPS.map((grp) => (
                      <div key={grp.id} className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-medium">{grp.groupName}</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {grp.items.map((item) => {
                            const active = config.cameraMoves.includes(item.move);
                            return (
                              <button
                                key={item.move}
                                type="button"
                                onClick={() => toggleCameraMove(item.move)}
                                className={`px-2 py-1.5 rounded-lg text-left transition-all border flex items-center justify-between ${
                                  active
                                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-sm'
                                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-mono font-bold flex items-center gap-1">
                                    <span className="text-cyan-400 text-xs leading-none shrink-0 font-sans">{item.hint}</span>
                                    <span className="truncate">{item.move}</span>
                                  </div>
                                  <div className="text-[9px] text-slate-400 truncate">{item.zh}</div>
                                </div>
                                {active && <Check className="w-3 h-3 text-cyan-400 shrink-0 ml-1" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Camera Moves Tag Chips (Click to remove) */}
                {config.cameraMoves.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-slate-400 font-medium">已啟用運鏡指令 (點擊移除)：</span>
                    <div className="flex flex-wrap gap-1.5">
                      {config.cameraMoves.map((cam) => (
                        <span
                          key={cam}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 text-xs font-mono"
                        >
                          <span>{cam}</span>
                          <button
                            type="button"
                            onClick={() => toggleCameraMove(cam)}
                            className="text-cyan-400 hover:text-white transition-colors p-0.5"
                            title="移除此運鏡"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Dimensions 2 & 3: Amplitude & Speed Segmented Button Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-slate-800/40">
                {/* Dimension 2: Amplitude Control */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-slate-300">運鏡幅度 (Amplitude)</span>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      {config.cameraAmplitude === 'with small amplitude'
                        ? '小幅度'
                        : config.cameraAmplitude === 'with large amplitude'
                        ? '大幅度'
                        : '預設 (省略)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/90 text-xs">
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, cameraAmplitude: 'default' })}
                      className={`py-1 rounded-lg text-[11px] font-medium transition-all ${
                        !config.cameraAmplitude || config.cameraAmplitude === 'default'
                          ? 'bg-slate-800 text-white shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      預設
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, cameraAmplitude: 'with small amplitude' })}
                      className={`py-1 rounded-lg text-[11px] font-medium transition-all ${
                        config.cameraAmplitude === 'with small amplitude'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      小幅
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, cameraAmplitude: 'with large amplitude' })}
                      className={`py-1 rounded-lg text-[11px] font-medium transition-all ${
                        config.cameraAmplitude === 'with large amplitude'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      大幅
                    </button>
                  </div>
                </div>

                {/* Dimension 3: Speed Control */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-slate-300">運鏡速度 (Speed)</span>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      {config.cameraSpeed === 'at slow speed'
                        ? '慢速移動'
                        : config.cameraSpeed === 'at fast speed'
                        ? '快速移動'
                        : '預設 (省略)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/90 text-xs">
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, cameraSpeed: 'default' })}
                      className={`py-1 rounded-lg text-[11px] font-medium transition-all ${
                        !config.cameraSpeed || config.cameraSpeed === 'default'
                          ? 'bg-slate-800 text-white shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      預設
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, cameraSpeed: 'at slow speed' })}
                      className={`py-1 rounded-lg text-[11px] font-medium transition-all ${
                        config.cameraSpeed === 'at slow speed'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      慢速
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, cameraSpeed: 'at fast speed' })}
                      className={`py-1 rounded-lg text-[11px] font-medium transition-all ${
                        config.cameraSpeed === 'at fast speed'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      快速
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-500">
                💡 官方語法規範：運鏡將被組裝為自然英文動作（如 "The camera pushes in with small amplitude at slow speed toward..."），禁止句末堆疊標籤。
              </p>
            </div>

            {/* Audio & Dialogue controls */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  對白台詞與音效設定 (Dialogue & SFX)
                </span>
              </div>

              <div className="space-y-1">
                <input
                  type="text"
                  value={config.dialogueText}
                  onChange={(e) => setConfig({ ...config, dialogueText: e.target.value })}
                  placeholder="角色台詞 (例如: We must reach the safehouse before dawn.)"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
                <p className="text-[10px] text-slate-500">
                  💡 官方規範：對白嚴格格式化為 <code className="text-emerald-400 font-mono">&lt;d&gt;[Language] ...&lt;/d&gt;</code>，由發聲主體 (S1) 嘴唇同步開口；雙引號 "" 僅保留於畫面上看板文字。
                </p>
              </div>

              <input
                type="text"
                value={config.sfxText}
                onChange={(e) => setConfig({ ...config, sfxText: e.target.value })}
                placeholder="環境音效 (例如: 暴雨傾盆、機械運轉聲、遠處雷鳴)"
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
                  禁用背景音樂 (附加 <code className="text-amber-400 font-mono">non_diegetic_music: N/A</code>)
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

        {/* Column 3: 右邊提示詞輸出與檢視 (Right: Output Results & Inspector) */}
        <section className="space-y-5 flex flex-col">
          {/* Master Output Header Banner with One-Click Copy */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/40 border border-purple-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="space-y-1.5 flex-1 min-w-[280px]">
                <div className="flex items-center gap-2 flex-wrap">
                  {currentAudit && currentAudit.isValid && currentAudit.issues.length === 0 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      H3 官方語法審計通過
                    </span>
                  ) : currentAudit && currentAudit.issues.length > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setShowAuditDetails(!showAuditDetails)}
                        className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                        title="點擊查看審計建議詳情"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>審計建議 ({currentAudit.issues.length} 項)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const repaired = repairPrompt(activePrompt, parseFloat(config.duration) || 10);
                          if (isEditing) {
                            setEditedPrompt(repaired);
                          } else if (output) {
                            setOutput({ ...output, fullPrompt: repaired });
                          }
                          showToast('已完成時間戳與洩漏術語一鍵自動修復！', 'success');
                        }}
                        className="px-2.5 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1 active:scale-95 cursor-pointer"
                        title="自動執行時間戳標準化、時長截斷與多模態洩漏術語清理"
                      >
                        <Wrench className="w-3 h-3" />
                        <span>一鍵修復</span>
                      </button>
                    </div>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      H3 規格完全相符
                    </span>
                  )}
                  {config.outputContract === 'compact' && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                      ⚡ Compact 契約
                    </span>
                  )}
                  <h2 className="text-lg font-bold text-white">生成的 MiniMax-H3 最終提示詞</h2>
                </div>
                <p className="text-xs text-slate-400">
                  {config.outputContract === 'compact'
                    ? '簡約精煉模式：稠密自然語言動作描繪（含三態物理動作）與獨立聲音欄位，支援一鍵複製貼入 MiniMax 或 ComfyUI 工作流。'
                    : '100% 符合 MiniMax-H3 官方標準規格之全量提示詞（含實體主體鎖定、運鏡三維度與完整音訊音效），支援一鍵複製貼上至 MiniMax 海螺 / Hailuo 3 AI 視訊生成器。'}
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

            {/* Expandable Audit Suggestions & Issues Panel */}
            {showAuditDetails && currentAudit && currentAudit.issues.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-2 text-xs">
                <div className="flex items-center justify-between text-amber-300 font-bold border-b border-amber-800/50 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    MiniMax-H3 官方語法審計報告 ({currentAudit.issues.length} 項建議)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAuditDetails(false)}
                    className="text-slate-400 hover:text-white p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {currentAudit.issues.map((issue, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-black/50 border border-amber-900/60 space-y-1">
                      <div className="flex items-center gap-1.5 font-medium text-amber-200">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                            issue.level === 'error'
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : 'bg-amber-900/60 text-amber-300'
                          }`}
                        >
                          {issue.level}
                        </span>
                        <span>{issue.messageZh}</span>
                      </div>
                      {issue.suggestionZh && (
                        <p className="text-[11px] text-slate-300 leading-normal pl-2 border-l border-amber-700/50">
                          {issue.suggestionZh}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Output Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 pt-2 gap-2 overflow-x-auto scrollbar-none">
              <div className="flex items-center gap-1">
                {[
                  ...(output?.episodes && output.episodes.length > 0
                    ? [{ id: 'series', label: `🎬 系列分鏡 (${output.episodes.length} 段)`, icon: Film }]
                    : []),
                  { id: 'full', label: '全量提示詞 (Full Prompt)', icon: FileCode },
                  { id: 'guide', label: '設計備註 (Notes)', icon: HelpCircle },
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
                  <p className="text-sm font-medium">請點擊中間欄「調用 Skill 生成」按鈕</p>
                </div>
              ) : activeTab === 'series' && output?.episodes && output.episodes.length > 0 ? (
                /* Tab 0: Multi-Episode Series Storyboard */
                <div className="space-y-4">
                  {/* Series Header Bar */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold">
                          系列故事弧
                        </span>
                        <h3 className="text-sm font-bold text-white">
                          {output.seriesTitle || config.idea?.slice(0, 30) || 'MiniMax-H3 系列連續提示詞'}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={exportSeriesMarkdown}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs transition-colors"
                          title="匯出 Markdown 分鏡檔"
                        >
                          <Download className="w-3.5 h-3.5 text-cyan-400" />
                          <span>匯出 MD</span>
                        </button>

                        <button
                          type="button"
                          onClick={copyComfyUIFormat}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs transition-colors"
                          title="複製為 ComfyUI 工作流相容格式"
                        >
                          {copiedComfy ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">已複製 Comfy 格式！</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-purple-400" />
                              <span>ComfyUI 格式</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={copyAllEpisodes}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-sm transition-all active:scale-95"
                          title="複製全系列所有段落提示詞"
                        >
                          {copiedSeries ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>已複製全系列！</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>一鍵複製全系列 ({output.episodes.length} 段)</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {output.storyArcSummary && (
                      <p className="text-xs text-slate-400 leading-relaxed pt-1 border-t border-slate-900">
                        {output.storyArcSummary}
                      </p>
                    )}
                  </div>

                  {/* Episode Navigation Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {output.episodes.map((ep, idx) => {
                      const isCurrent = selectedEpisodeIdx === idx;
                      return (
                        <button
                          key={ep.episodeIndex || idx}
                          type="button"
                          onClick={() => setSelectedEpisodeIdx(idx)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                            isCurrent
                              ? 'bg-purple-600 text-white font-bold border-purple-500 shadow-md shadow-purple-950'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                          }`}
                        >
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-black/40">
                            #{ep.episodeIndex}
                          </span>
                          <span>{ep.title.replace(/^第\s*\d+\s*段[：:]\s*/, '').slice(0, 10)}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Current Selected Episode Details Card */}
                  {(() => {
                    const currentEp = output.episodes[selectedEpisodeIdx] || output.episodes[0];
                    if (!currentEp) return null;

                    return (
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3.5">
                        {/* Episode Title & Metadata */}
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800/80">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono text-xs font-bold">
                                Episode #{currentEp.episodeIndex}
                              </span>
                              <h4 className="text-sm font-bold text-white">{currentEp.title}</h4>
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                              時長: {currentEp.duration} · 運鏡: {currentEp.cameraMovement}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                if (refineTargetIdx === currentEp.episodeIndex) {
                                  setRefineTargetIdx(null);
                                } else {
                                  setRefineTargetIdx(currentEp.episodeIndex);
                                  setRefineInstruction('');
                                }
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-sm transition-all cursor-pointer ${
                                refineTargetIdx === currentEp.episodeIndex
                                  ? 'bg-purple-950 text-purple-200 border-purple-500 shadow-purple-950/60'
                                  : 'bg-slate-900 hover:bg-slate-800 text-purple-300 border-purple-500/50 hover:border-purple-400'
                              }`}
                              title="局部微調精修本段分鏡 (保留前鏡結束姿態)"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                              <span>{refineTargetIdx === currentEp.episodeIndex ? '收合精修' : '✨ 局部精修'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                copyToClipboard(currentEp.fullPrompt, `第 ${currentEp.episodeIndex} 段提示詞`);
                                setCopiedEpisodeIdx(currentEp.episodeIndex);
                                setTimeout(() => setCopiedEpisodeIdx(null), 2000);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                            >
                              {copiedEpisodeIdx === currentEp.episodeIndex ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">已複製此段！</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>複製此段提示詞</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Inline Surgical Refinement Panel */}
                        {refineTargetIdx === currentEp.episodeIndex && (
                          <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/50 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                第 {currentEp.episodeIndex} 段分鏡局部微調 (In-Place Refinement)
                              </span>
                              <span className="text-[10px] text-purple-300 font-mono">
                                🔗 嚴格鎖定前鏡結束姿態
                              </span>
                            </div>
                            <textarea
                              value={refineInstruction}
                              onChange={(e) => setRefineInstruction(e.target.value)}
                              placeholder="輸入您對此段分鏡的具體修改指令（例如：讓主角改從右手拿出藍光鑰匙卡、將雨勢加劇成暴雨、運鏡改為特寫推進...）"
                              rows={2}
                              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-purple-500/40 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-400"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setRefineTargetIdx(null)}
                                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs cursor-pointer"
                              >
                                取消
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRefineEpisode(currentEp.episodeIndex)}
                                disabled={refining || !refineInstruction.trim()}
                                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              >
                                {refining ? (
                                  <>
                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>AI 精修推理中...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                    <span>確認精修重算</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Continuity Note Banner */}
                        {currentEp.continuityNotes && (
                          <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-300 flex items-start gap-2">
                            <span className="text-indigo-400 font-bold shrink-0">🔗 承接邏輯:</span>
                            <span className="leading-relaxed">{currentEp.continuityNotes}</span>
                          </div>
                        )}

                        {/* Physical Motion Breakdown: Starting State -> Action -> End State */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                          {/* Starting State */}
                          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                            <span className="font-bold text-amber-300 font-mono text-[11px] flex items-center gap-1">
                              <span>🏁 起始狀態 (Starting)</span>
                            </span>
                            <p className="text-slate-300 leading-relaxed text-[11px]">
                              {currentEp.startingState}
                            </p>
                          </div>

                          {/* Action Sequence */}
                          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                            <span className="font-bold text-cyan-300 font-mono text-[11px] flex items-center gap-1">
                              <span>🏃 連續動作 (Action)</span>
                            </span>
                            <p className="text-slate-300 leading-relaxed text-[11px]">
                              {currentEp.actionSequence}
                            </p>
                          </div>

                          {/* End State */}
                          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                            <span className="font-bold text-emerald-300 font-mono text-[11px] flex items-center gap-1">
                              <span>🎯 結束狀態 (End State)</span>
                            </span>
                            <p className="text-slate-300 leading-relaxed text-[11px]">
                              {currentEp.endState}
                            </p>
                          </div>
                        </div>

                        {/* Full Prompt Display for this episode */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className="font-mono">MiniMax-H3 獨立生成提示詞：</span>
                            <span className="text-[10px] text-slate-500">100% 獨立合法可貼</span>
                          </div>
                          <div className="p-3.5 rounded-xl bg-slate-900/95 border border-slate-800 text-xs font-mono text-slate-200 max-h-[300px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                            <PromptSyntaxHighlighter text={currentEp.fullPrompt} />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : activeTab === 'full' ? (
                /* Tab 1: Full Prompt syntax highlight or editable textarea */
                <div className="space-y-3">
                  {/* Dedicated Prompt Viewer & Editor Toolbar */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isEditing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                        <span>{isEditing ? '手動微調編輯模式' : '語法亮顯預覽'}</span>
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {editedPrompt ? `${editedPrompt.length} 字元` : '0 字元'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => {
                            if (output?.fullPrompt) {
                              setEditedPrompt(output.fullPrompt);
                              showToast('已還原為 AI 生成的初版提示詞', 'info');
                            }
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                          title="還原為剛才 AI 生成的提示詞"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                          <span>還原初版</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsEditing(!isEditing)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                          isEditing
                            ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white border border-purple-500/30'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isEditing ? '完成編輯並亮顯' : '手動微調編輯'}</span>
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <textarea
                      value={editedPrompt}
                      onChange={(e) => {
                        setEditedPrompt(e.target.value);
                        if (output) setOutput({ ...output, fullPrompt: e.target.value });
                      }}
                      rows={14}
                      className="w-full p-4 rounded-xl bg-slate-950 border border-purple-500/40 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-400 leading-relaxed min-h-[300px]"
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
                        { label: '+ 慢速微推', text: 'The camera pushes in with small amplitude at slow speed toward the subject.' },
                        { label: '+ 快速橫移', text: 'The camera trucks right with large amplitude at fast speed, revealing the environment.' },
                        { label: '+ 環繞鏡頭', text: 'The camera moves in an arc shot around the subject.' },
                        { label: '+ 畫外音閉嘴約定', text: 'says in an off-screen voiceover: <d>[English] ...</d> while his lips remain completely closed.' },
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
              ) : activeTab === 'guide' ? (
                /* Tab: H3 Skill Guide & Traditional Chinese Explanations */
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 text-xs leading-relaxed">
                  <div>
                    <h4 className="font-bold text-purple-300 text-sm mb-1">
                      💡 MiniMax-H3 Prompt 結構設計解析
                    </h4>
                    <p className="text-slate-300 whitespace-pre-wrap">{output.explanationZh || '已為您依 MiniMax-H3 官方標準格式生成最優提示詞。'}</p>
                  </div>

                  {output.suggestions && output.suggestions.length > 0 && (
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
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      {/* Studio Global Footer (v5.0.0) */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/90 backdrop-blur-md px-4 lg:px-8 py-3.5 text-xs text-slate-500">
        <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left: Brand, Version & Verification */}
          <div className="flex items-center flex-wrap gap-2.5">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              MiniMax-H3 AI Prompt Studio
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-purple-300">
              v5.0.0 Flagship
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-md">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              100% 官方標準語法對齊認證
            </span>
          </div>

          {/* Center: Active Engine Indicator */}
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-400">當前獨立引擎：</span>
            <span className="font-mono font-semibold text-slate-200">
              {appMode === 'paid_api'
                ? 'Gemini Paid API Direct (旗艦 3.8 Flash)'
                : appMode === 'ollama'
                ? `本地 Ollama (${ollamaModel || '未選擇模型'})`
                : appMode === 'llamacpp'
                ? `本地 llama.cpp RTX 5090 (${llamacppModel || '活躍端口 8080'})`
                : 'Google AI Studio 雲端引擎'}
            </span>
          </div>

          {/* Right: Spec Links & Audit Info */}
          <div className="flex items-center gap-3 text-[11px]">
            <a
              href="https://github.com/MiniMax-AI/MiniMax-H3/tree/main/skills/h3-prompt-writing"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-cyan-300 transition-colors"
            >
              MiniMax-H3 Skill 規格
            </a>
            <span className="text-slate-700">•</span>
            <a
              href="https://github.com/MiniMax-AI/MiniMax-H3"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-purple-300 transition-colors"
            >
              MiniMax-H3 官方倉庫
            </a>
            <span className="text-slate-700">•</span>
            <span className="text-slate-500 font-mono text-[10px]">
              Prompt Audit Engine Ready
            </span>
          </div>
        </div>
      </footer>

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
