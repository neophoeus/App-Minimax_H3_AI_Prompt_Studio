export type GenerationMode = 'T2VA' | 'I2VA' | 'FL2VA' | 'L2VA' | 'Ref2VA';

export type ReferenceRole = 
  | 'character' 
  | 'object' 
  | 'scene' 
  | 'motion' 
  | 'audio' 
  | 'style' 
  | 'composition' 
  | 'first_keyframe'
  | 'last_keyframe'
  | 'keyframe';

export interface ReferenceItem {
  id: string;
  tag: string; // e.g. @image1, @video1, @audio1
  role: ReferenceRole;
  name: string;
  description: string;
  fileType: 'image' | 'video' | 'audio';
  fileUrl?: string; // object URL or data URL for local preview
  fileName?: string;
}

export type CameraMove = 
  | 'Push in' 
  | 'Pull out' 
  | 'Pan left' 
  | 'Pan right' 
  | 'Tilt up' 
  | 'Tilt down' 
  | 'Arc shot' 
  | 'FPV drone' 
  | 'Tracking shot' 
  | 'Static';

export interface H3PromptConfig {
  idea: string;
  mode: GenerationMode;
  duration: '5s' | '10s' | '15s' | '20s' | '25s' | '30s';
  aspectRatio: '16:9' | '9:16' | '1:1' | '21:9' | '4:3';
  style: string;
  cameraMoves: CameraMove[];
  lightingMood: string;
  dialogueText: string;
  sfxText: string;
  suppressMusic: boolean; // non_diegetic_music: N/A
  references: ReferenceItem[];
}

export interface TemporalSegment {
  timeframe: string; // e.g. [0s-3s]
  action: string;
  camera: string; // e.g. [Push in]
  audio: string;
}

export interface H3PromptOutput {
  fullPrompt: string;
  block1: string;
  block2: string;
  block3: string;
  temporalTimeline: TemporalSegment[];
  audioNotes: string;
  explanationZh: string;
  suggestions: string[];
}

export interface SavedPromptItem {
  id: string;
  createdAt: string;
  title: string;
  idea: string;       // 核心創意思路
  fullPrompt: string; // 最終提示詞
  config?: H3PromptConfig;
  output?: H3PromptOutput;
}

export interface PresetTemplate {
  id: string;
  titleZh: string;
  titleEn: string;
  category: 'Cinematic' | 'Anime' | 'Commercial' | 'Action' | 'Multimodal Ref';
  descriptionZh: string;
  config: Partial<H3PromptConfig>;
}
