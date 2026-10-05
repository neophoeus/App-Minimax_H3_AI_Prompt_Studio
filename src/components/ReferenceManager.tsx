import React from 'react';
import { ReferenceItem, ReferenceRole, EngineTier } from '../types';
import { Plus, Trash2, Tag, Upload, Film, Image as ImageIcon, Music, Check } from 'lucide-react';

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
  { role: 'continuation', labelZh: '影片續寫接續 (Continuation Ref)', desc: '接續前置影片的結尾 (官方長影片工作流)', icon: '🎞️' },
];

// Resize uploaded image to max dimension (512px) to minimize payload size and Gemini token consumption (~258 tokens)
const resizeImageFile = (file: File, maxDimension = 512, quality = 0.75): Promise<string> => {
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

export type TagCategory = 'Subject' | 'Picture' | 'Video' | 'Audio';

export const getCategoryForRole = (role: ReferenceRole): TagCategory => {
  switch (role) {
    case 'first_keyframe':
    case 'last_keyframe':
    case 'keyframe':
    case 'composition':
      return 'Picture';
    case 'motion':
    case 'continuation':
      return 'Video';
    case 'audio':
      return 'Audio';
    case 'character':
    case 'object':
    case 'scene':
    case 'style':
    default:
      return 'Subject';
  }
};

export const defaultLabelForRole = (r: ReferenceRole, catIndex: number): string => {
  switch (r) {
    case 'first_keyframe':
      return `首幀開場畫面`;
    case 'last_keyframe':
      return `尾幀收斂畫面`;
    case 'continuation':
      return `接續前置影片 ${catIndex}`;
    case 'motion':
      return `動作參考 ${catIndex}`;
    case 'audio':
      return `聲音音色 ${catIndex}`;
    case 'scene':
      return `場景參考 ${catIndex}`;
    case 'object':
      return `物件參考 ${catIndex}`;
    case 'composition':
      return `構圖參考 ${catIndex}`;
    case 'style':
      return `風格參考 ${catIndex}`;
    case 'character':
    default:
      return `主要角色 ${catIndex}`;
  }
};

/**
 * Re-indexes all reference items with dual-track physical and semantic mapping:
 * 1. Physical slots: Picture 1..N (upload order), Video 1..N, Audio 1..N
 * 2. Semantic tags: Subject 1..N (characters/objects/scenes), Picture N (keyframes)
 */
export const reindexReferences = (refs: ReferenceItem[]): ReferenceItem[] => {
  let pictureCount = 0;
  let videoCount = 0;
  let audioCount = 0;
  let subjectCount = 0;

  return refs.map((ref) => {
    const isImageRole = ['first_keyframe', 'last_keyframe', 'keyframe', 'composition'].includes(ref.role);
    const isSubjectRole = ['character', 'object', 'scene', 'style'].includes(ref.role);
    const isVideoRole = ['motion', 'continuation'].includes(ref.role);
    const isAudioRole = ref.role === 'audio';

    let pictureIndex: number | undefined;
    let physicalTag: string | undefined;

    // Physical Picture Slot mapping:
    // Any reference that is a keyframe/composition, or a subject with image (not marked pure text)
    const isPhysicalImage = isImageRole || (isSubjectRole && ref.fileType === 'image' && !ref.isPureSubject);

    if (isPhysicalImage) {
      pictureCount += 1;
      pictureIndex = pictureCount;
      physicalTag = `<Picture ${pictureCount}>`;
    } else if (isVideoRole) {
      videoCount += 1;
      physicalTag = `<Video ${videoCount}>`;
    } else if (isAudioRole) {
      audioCount += 1;
      physicalTag = `<Audio ${audioCount}>`;
    }

    let defaultTag = '';
    let catIndex = 1;

    if (isSubjectRole) {
      subjectCount += 1;
      catIndex = subjectCount;
      defaultTag = `<Subject ${subjectCount}>`;
    } else if (isImageRole) {
      catIndex = pictureIndex || 1;
      defaultTag = `<Picture ${catIndex}>`;
    } else if (isVideoRole) {
      catIndex = videoCount;
      defaultTag = `<Video ${videoCount}>`;
    } else if (isAudioRole) {
      catIndex = audioCount;
      defaultTag = `<Audio ${audioCount}>`;
    }

    // Auto-update tag if empty or matches standard pattern <(Subject|Picture|Video|Audio) \d+>
    const isAutoTag = !ref.tag || /^<(Subject|Picture|Video|Audio)\s+\d+>$/i.test(ref.tag.trim());
    const newTag = isAutoTag ? defaultTag : ref.tag;

    // Auto-update name if it's default generic name or empty
    const isDefaultName =
      !ref.name ||
      /^(主要角色|動作參考|聲音音色|場景參考|物件參考|構圖參考|風格參考|參考素材|首幀開場畫面|尾幀收斂畫面|接續前置影片)\s*\d*$/.test(
        ref.name.trim()
      );
    const newName = isDefaultName ? defaultLabelForRole(ref.role, catIndex) : ref.name;

    return {
      ...ref,
      tag: newTag,
      name: newName,
      pictureIndex,
      physicalTag,
    };
  });
};

export const ReferenceManager: React.FC<ReferenceManagerProps> = ({
  references,
  onChange,
  onToast,
  engineTier = 'pro',
}) => {
  const addReference = () => {
    const role: ReferenceRole = 'character';
    const newItem: ReferenceItem = {
      id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      tag: '',
      role,
      name: '',
      description: '鎖定關鍵視覺特徵與外觀細節',
      fileType: 'image',
    };
    const updated = reindexReferences([...references, newItem]);
    onChange(updated);
  };

  const removeReference = (id: string) => {
    const remaining = references.filter((r) => r.id !== id);
    const updated = reindexReferences(remaining);
    onChange(updated);
  };

  const getAcceptFileType = (role: ReferenceRole): string => {
    switch (role) {
      case 'motion':
      case 'continuation':
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
    if (role === 'motion' || role === 'continuation') return 'video';
    if (role === 'audio') return 'audio';
    return 'image';
  };

  const getRoleUploadHint = (item: ReferenceItem): string => {
    const slotInfo = item.physicalTag && item.pictureIndex ? ` [海螺槽位: ${item.physicalTag} / @image${item.pictureIndex}]` : '';
    switch (item.role) {
      case 'continuation':
        return `僅限長影片接續來源 (MP4, MOV)${slotInfo}`;
      case 'motion':
        return `僅限影片動作參考檔 (MP4, MOV)${slotInfo}`;
      case 'audio':
        return `僅限音訊檔 (MP3, WAV, AAC)${slotInfo}`;
      case 'first_keyframe':
        return `僅限開場首幀圖片 (JPG, PNG, WebP)${slotInfo}`;
      case 'last_keyframe':
        return `僅限收斂尾幀圖片 (JPG, PNG, WebP)${slotInfo}`;
      default:
        return `僅限圖片檔 (JPG, PNG, WebP)${slotInfo}`;
    }
  };

  const updateReference = (id: string, updates: Partial<ReferenceItem>) => {
    const modified = references.map((r) => {
      if (r.id === id) {
        const roleChanged = updates.role && updates.role !== r.role;
        const updated = {
          ...r,
          ...updates,
        };
        if (roleChanged) {
          updated.fileType = getRoleDefaultFileType(updates.role!);
          // Clear tag and auto-name so reindexReferences assigns new category index and tag
          updated.tag = '';
          if (
            !r.name ||
            /^(主要角色|動作參考|聲音音色|場景參考|物件參考|構圖參考|風格參考|參考素材|首幀開場畫面|尾幀收斂畫面)\s*\d*$/.test(
              r.name.trim()
            )
          ) {
            updated.name = '';
          }
        }
        return updated;
      }
      return r;
    });
    const updated = reindexReferences(modified);
    onChange(updated);
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

    if (fileType === 'image') {
      // Auto-downscale uploaded images to ultra-light resolution (max 512px, ~258 tokens in Gemini)
      const dataUrl = await resizeImageFile(file, 512, 0.75);
      updateReference(id, {
        fileUrl: dataUrl,
        fileName: file.name,
        fileType,
        isPureSubject: false,
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        updateReference(id, {
          fileUrl: dataUrl,
          fileName: file.name,
          fileType,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              多模態參考素材與實體槽位 (Reference Assets)
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
              {references.length} 個素材
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            支援多圖實體槽位自動對齊：通用參考圖自動映射為 &lt;Subject 1 aka Picture 1&gt; (@image1)，開場首幀獨立標註，徹底杜絕模型序號錯位。
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
                <div className="flex items-center gap-2 flex-wrap">
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

                  {/* Dual-track Physical Slot Badges */}
                  {item.physicalTag && item.tag.startsWith('<Subject') && !item.isPureSubject && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-950/90 text-indigo-300 border border-indigo-500/50 text-[11px] font-mono font-semibold"
                      title={`對應海螺多圖實體上傳槽位：${item.physicalTag} / @image${item.pictureIndex}（通用視覺參考圖，非開場首幀）`}
                    >
                      <span className="text-indigo-400 font-bold">aka {item.physicalTag}</span>
                      <span className="text-indigo-400/80 font-normal">(@image{item.pictureIndex})</span>
                    </span>
                  )}

                  {item.physicalTag && item.tag.startsWith('<Picture') && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 text-[11px] font-mono font-semibold"
                      title={`海螺實體圖片槽位：${item.physicalTag} / @image${item.pictureIndex}`}
                    >
                      <span>@image{item.pictureIndex}</span>
                      <span className="text-[10px] text-cyan-400 font-sans font-normal">
                        {item.role === 'last_keyframe' ? '尾幀收斂' : '首幀畫面'}
                      </span>
                    </span>
                  )}

                  {item.isPureSubject && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[11px] font-sans">
                      純文字主體宣告
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Toggle pure subject for subject roles */}
                  {['character', 'object', 'scene', 'style'].includes(item.role) && (
                    <button
                      type="button"
                      onClick={() =>
                        updateReference(item.id, {
                          isPureSubject: !item.isPureSubject,
                          fileUrl: !item.isPureSubject ? undefined : item.fileUrl,
                          fileName: !item.isPureSubject ? undefined : item.fileName,
                        })
                      }
                      className={`px-2 py-1 rounded-lg text-[11px] transition-colors border ${
                        item.isPureSubject
                          ? 'bg-amber-950/40 text-amber-300 border-amber-500/40 hover:bg-amber-950/60'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                      title="切換為純文字主體宣告（無需上傳圖，不佔用 MiniMax Picture 實體槽位）"
                    >
                      {item.isPureSubject ? '📝 純文字宣告' : '🖼️ 附參考圖'}
                    </button>
                  )}

                  {/* Remove action */}
                  <button
                    type="button"
                    onClick={() => removeReference(item.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                    title="刪除標籤"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Upload Dropzone & Media Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <div className="sm:col-span-1">
                  {item.isPureSubject ? (
                    <div className="p-3 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 flex flex-col items-center justify-center text-center gap-1 h-24">
                      <Tag className="w-4 h-4 text-slate-500" />
                      <span className="text-xs text-slate-400 font-medium">純文字主體語意宣告</span>
                      <span className="text-[10px] text-slate-500">不佔用海螺 Picture 槽位</span>
                    </div>
                  ) : item.fileUrl ? (
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
                      <span className="text-[10px] text-slate-500">{getRoleUploadHint(item)}</span>
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
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateReference(item.id, { name: e.target.value })}
                      placeholder="素材名稱或主體語意 (例如: 賽博貓咪角色)"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500"
                    />
                    {item.fileName && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                        <span className="text-slate-500">📎 來源檔案:</span>
                        <span className="truncate max-w-[260px] text-purple-300/80 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {item.fileName}
                        </span>
                      </div>
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

