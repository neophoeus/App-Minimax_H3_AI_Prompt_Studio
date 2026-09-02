import React, { useState } from 'react';
import { ReferenceItem, ReferenceRole, EngineTier } from '../types';
import { Plus, Trash2, Tag, Upload, Sparkles, Film, Image as ImageIcon, Music, Loader2, Check } from 'lucide-react';

interface ReferenceManagerProps {
  references: ReferenceItem[];
  onChange: (refs: ReferenceItem[]) => void;
  onToast?: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
  engineTier?: EngineTier;
}

const ROLE_OPTIONS: { role: ReferenceRole; labelZh: string; desc: string; icon: string }[] = [
  { role: 'character', labelZh: '角色鎖定 (Character Ref)', desc: '鎖定人物臉型、身材與服裝', icon: '👤' },
  { role: 'object', labelZh: '物件鎖定 (Object Ref)', desc: '鎖定產品、道具或指定物件', icon: '📦' },
  { role: 'scene', labelZh: '場景鎖定 (Scene Ref)', desc: '鎖定建築、環境或背景結構', icon: '🏙️' },
  { role: 'motion', labelZh: '動作鎖定 (Motion Ref)', desc: '從影片中綁定動作與物理軌跡', icon: '🏃' },
  { role: 'audio', labelZh: '音色/音效 (Voice/Audio Ref)', desc: '鎖定對話音色或直接復用音訊', icon: '🎙️' },
  { role: 'style', labelZh: '風格參考 (Style Ref)', desc: '鎖定美術畫風、色調與渲染感', icon: '🎨' },
  { role: 'composition', labelZh: '構圖參考 (Composition Ref)', desc: '鎖定畫面鏡頭佈局與透視', icon: '📐' },
  { role: 'first_keyframe', labelZh: '首幀關鍵幀 (First Keyframe)', desc: '指定影片開場的精確首幀圖片', icon: '🖼️' },
  { role: 'last_keyframe', labelZh: '尾幀關鍵幀 (Last Keyframe)', desc: '指定影片結尾收斂的精確尾幀圖片', icon: '🏁' },
];

// Resize uploaded image to max dimension (e.g. 768px) to optimize payload size, memory & Gemini TPM consumption
const resizeImageFile = (file: File, maxDimension = 768, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve('');
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        resolve('');
        return;
      }
      const img = new Image();
      img.onerror = () => resolve(src);
      img.onload = () => {
        let { width, height } = img;
        if (width <= maxDimension && height <= maxDimension) {
          resolve(src);
          return;
        }
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(resizedDataUrl);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
};

export const ReferenceManager: React.FC<ReferenceManagerProps> = ({
  references,
  onChange,
  onToast,
  engineTier = 'pro',
}) => {
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const getDefaultTagForRole = (role: ReferenceRole, index: number): string => {
    switch (role) {
      case 'first_keyframe':
      case 'last_keyframe':
      case 'keyframe':
      case 'composition':
        return `<Picture ${index}>`;
      case 'motion':
        return `<Video ${index}>`;
      case 'audio':
        return `<Audio ${index}>`;
      case 'character':
      case 'object':
      case 'scene':
      case 'style':
      default:
        return `<Subject ${index}>`;
    }
  };

  const addReference = () => {
    const nextIndex = references.length + 1;
    const role: ReferenceRole = 'character';
    const tag = getDefaultTagForRole(role, nextIndex);
    const newItem: ReferenceItem = {
      id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      tag,
      role,
      name: `參考素材 ${nextIndex}`,
      description: '鎖定關鍵視覺特徵與細節',
      fileType: 'image',
    };
    onChange([...references, newItem]);
  };

  const removeReference = (id: string) => {
    onChange(references.filter((r) => r.id !== id));
  };

  const getAcceptFileType = (role: ReferenceRole): string => {
    switch (role) {
      case 'motion':
        return 'video/*,video/mp4,video/quicktime,video/webm';
      case 'audio':
        return 'audio/*,audio/mpeg,audio/wav,audio/mp3,audio/aac,audio/m4a';
      case 'first_keyframe':
      case 'last_keyframe':
      case 'keyframe':
      case 'character':
      case 'object':
      case 'scene':
      case 'style':
      case 'composition':
      default:
        return 'image/*,image/png,image/jpeg,image/webp,image/jpg';
    }
  };

  const getRoleDefaultFileType = (role: ReferenceRole): 'image' | 'video' | 'audio' => {
    if (role === 'motion') return 'video';
    if (role === 'audio') return 'audio';
    return 'image';
  };

  const getRoleUploadHint = (role: ReferenceRole): string => {
    switch (role) {
      case 'motion':
        return '僅限上傳影片檔 (MP4, MOV, WebM)';
      case 'audio':
        return '僅限上傳音訊檔 (MP3, WAV, AAC)';
      case 'first_keyframe':
        return '僅限上傳開場首幀圖片 (JPG, PNG, WebP)';
      case 'last_keyframe':
        return '僅限上傳收斂尾幀圖片 (JPG, PNG, WebP)';
      default:
        return '僅限上傳圖片檔 (JPG, PNG, WebP)';
    }
  };

  const updateReference = (id: string, updates: Partial<ReferenceItem>) => {
    onChange(
      references.map((r, idx) => {
        if (r.id === id) {
          const newRole = updates.role || r.role;
          const defaultTag = getDefaultTagForRole(newRole, idx + 1);
          const updated = {
            ...r,
            ...updates,
            tag: updates.role ? defaultTag : updates.tag || r.tag,
          };
          if (updates.role) {
            updated.fileType = getRoleDefaultFileType(updates.role);
          }
          return updated;
        }
        return r;
      })
    );
  };

  const handleFileUpload = async (id: string, file: File, role: ReferenceRole) => {
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    const fileType = isVideo ? 'video' : isAudio ? 'audio' : 'image';

    const expectedFileType = getRoleDefaultFileType(role);
    if (fileType !== expectedFileType) {
      alert(`此項目角色 [${role}] 僅支援 ${expectedFileType === 'video' ? '影片' : expectedFileType === 'audio' ? '音訊' : '圖片'} 檔案格式！`);
      return;
    }

    const refIndex = references.findIndex((r) => r.id === id);
    const autoTag = getDefaultTagForRole(role, refIndex >= 0 ? refIndex + 1 : references.length + 1);

    if (fileType === 'image') {
      // Auto-downscale uploaded images to a reasonable resolution (max 1024px)
      const dataUrl = await resizeImageFile(file, 1024, 0.85);
      updateReference(id, {
        fileUrl: dataUrl,
        fileName: file.name,
        fileType,
        tag: autoTag,
        name: file.name.replace(/\.[^/.]+$/, ''),
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        updateReference(id, {
          fileUrl: dataUrl,
          fileName: file.name,
          fileType,
          tag: autoTag,
          name: file.name.replace(/\.[^/.]+$/, ''),
        });
      };
    }
  };

  const formatMediaErrorMessage = (rawMsg: string) => {
    if (
      rawMsg.includes('429') ||
      rawMsg.includes('額度') ||
      rawMsg.includes('RESOURCE_EXHAUSTED') ||
      rawMsg.includes('Quota') ||
      rawMsg.includes('Rate limit')
    ) {
      return '⚠️ Gemini API 額度已用完 (429)，請稍等 1~2 分鐘後重試！';
    }
    if (
      rawMsg.includes('503') ||
      rawMsg.includes('UNAVAILABLE') ||
      rawMsg.includes('high demand') ||
      rawMsg.includes('Spikes in demand') ||
      rawMsg.includes('負載') ||
      rawMsg.includes('overloaded')
    ) {
      return '⚠️ AI 模型目前負載較高 (503)，請稍候 3~5 秒後重試！';
    }
    if (rawMsg.includes('GEMINI_API_KEY')) {
      return '⚠️ 未設定 GEMINI_API_KEY，請於後端環境變數中設定！';
    }
    if (rawMsg.includes('Failed to fetch') || rawMsg.includes('NetworkError')) {
      return '⚠️ 網路連線中斷或伺服器未啟動，請檢查連線狀態！';
    }
    return rawMsg || '分析素材失敗，請檢查檔案格式或網路連線';
  };

  const analyzeReferenceMediaWithAI = async (item: ReferenceItem) => {
    setAnalyzingId(item.id);
    try {
      const res = await fetch('/api/analyze-reference-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: item.fileUrl && item.fileType === 'image' ? item.fileUrl : undefined,
          role: item.role,
          fileName: item.fileName || item.name,
          engineTier,
        }),
      });
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textErr = await res.text();
        throw new Error(`伺服器回應錯誤: ${textErr.slice(0, 100)}`);
      }
      const json = await res.json();
      if (json.success && json.description) {
        updateReference(item.id, {
          description: json.description,
        });
        if (onToast) {
          onToast('已成功透過 AI 分析素材特徵並填入說明！', 'success');
        }
      } else {
        const friendlyErr = formatMediaErrorMessage(json.error || '分析素材失敗');
        if (onToast) {
          onToast(friendlyErr, 'error', 6000);
        } else {
          alert(friendlyErr);
        }
      }
    } catch (err: any) {
      console.error('Failed to analyze media:', err);
      const friendlyErr = formatMediaErrorMessage(err.message || '');
      if (onToast) {
        onToast(friendlyErr, 'error', 6000);
      } else {
        alert(friendlyErr);
      }
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Block 1: 參考素材上傳與聲明 (Ref Notes)
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
              {references.length} 個素材
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            可選擇直接上傳圖片或影片，MiniMax-H3 會根據 Role (如 @image1: 角色鎖定, @video1: 動作鎖定) 進行 Retention Analysis 鎖定
          </p>
        </div>

        <button
          type="button"
          onClick={addReference}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-xs font-medium text-purple-200 hover:text-white transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>新增參考標籤/上傳</span>
        </button>
      </div>

      {references.length === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <Upload className="w-5 h-5 text-slate-600" />
          <span>尚未新增參考素材標籤。支援上傳圖片 (PNG/JPG) 或影片 (MP4/MOV)，或直接手動設定標籤。</span>
        </div>
      ) : (
        <div className="space-y-3 mt-2">
          {references.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-3 transition-all hover:border-slate-700"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                {/* Tag & Role */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.tag}
                    onChange={(e) => updateReference(item.id, { tag: e.target.value })}
                    className="w-24 px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/40 text-xs font-mono font-bold text-purple-300 focus:outline-none focus:border-purple-400"
                    placeholder="@image1"
                  />
                  <select
                    value={item.role}
                    onChange={(e) =>
                      updateReference(item.id, { role: e.target.value as ReferenceRole })
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.role} value={opt.role}>
                        {opt.icon} {opt.labelZh}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {/* AI Analyze Button */}
                  <button
                    type="button"
                    onClick={() => analyzeReferenceMediaWithAI(item)}
                    disabled={analyzingId === item.id}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-[11px] font-medium text-indigo-300 hover:bg-indigo-900/50 hover:text-white transition-all disabled:opacity-50"
                  >
                    {analyzingId === item.id ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>AI 分析中...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span>AI 分析特徵</span>
                      </>
                    )}
                  </button>

                  {/* Remove action */}
                  <button
                    type="button"
                    onClick={() => removeReference(item.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                    title="刪除標籤"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Upload Dropzone & Media Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div className="sm:col-span-1">
                  {item.fileUrl ? (
                    <div className="relative rounded-lg overflow-hidden border border-purple-500/30 bg-slate-900 group aspect-video flex items-center justify-center">
                      {item.fileType === 'image' && (
                        <img
                          src={item.fileUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {item.fileType === 'video' && (
                        <video
                          src={item.fileUrl}
                          controls
                          className="w-full h-full object-cover"
                        />
                      )}
                      {item.fileType === 'audio' && (
                        <div className="p-2 text-center text-xs text-purple-300 flex flex-col items-center gap-1">
                          <Music className="w-6 h-6 text-purple-400" />
                          <span className="truncate max-w-[120px]">{item.fileName}</span>
                        </div>
                      )}

                      {/* Replace File Overlay Button */}
                      <label className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-xs text-white gap-1">
                        <Upload className="w-4 h-4 text-purple-400" />
                        <span>更換素材</span>
                        <input
                          type="file"
                          accept={getAcceptFileType(item.role)}
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFileUpload(item.id, e.target.files[0], item.role);
                            }
                          }}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="p-3 rounded-xl border border-dashed border-slate-800 hover:border-purple-500/50 bg-slate-900/40 hover:bg-slate-900 transition-all flex flex-col items-center justify-center cursor-pointer text-center gap-1">
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <Upload className="w-3.5 h-3.5 text-purple-400" />
                        <span className="font-medium text-slate-300">
                          {item.role === 'motion'
                            ? '上傳參考影片'
                            : item.role === 'audio'
                            ? '上傳參考音訊'
                            : '上傳參考圖片'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">{getRoleUploadHint(item.role)}</span>
                      <input
                        type="file"
                        accept={getAcceptFileType(item.role)}
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleFileUpload(item.id, e.target.files[0], item.role);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Text fields for Name and Description */}
                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateReference(item.id, { name: e.target.value })}
                      placeholder="素材名稱 (例如: 賽博貓咪角色)"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500"
                    />
                    {item.fileName && (
                      <span className="shrink-0 text-[10px] font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 truncate max-w-[100px]">
                        {item.fileName}
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    value={item.description}
                    onChange={(e) => updateReference(item.id, { description: e.target.value })}
                    placeholder="Retention Analysis 鎖定細節 (例如: 鎖定黑貓臉型、發光右眼與皮衣質感)"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

