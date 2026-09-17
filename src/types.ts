export type GenerationMode = 'T2VA' | 'I2VA' | 'FL2VA' | 'L2VA' | 'Ref2VA';

export type EngineTier = 'pro' | 'ultra_5x' | 'ultra_20x';

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
  | 'keyframe'
  | 'continuation';

export interface ReferenceItem {
  id: string;
  tag: string; // e.g. <Subject 1>, <Picture 1>, <Video 1>, <Audio 1>
  role: ReferenceRole;
  name: string;
  description: string;
  fileType: 'image' | 'video' | 'audio';
  fileUrl?: string; // object URL or data URL for local preview
  fileName?: string;
}

export type CameraMotionType =
  | 'Zoom In'
  | 'Zoom Out'
  | 'Push In'
  | 'Pull Out'
  | 'Pan Left'
  | 'Pan Right'
  | 'Truck Left'
  | 'Truck Right'
  | 'Tilt Up'
  | 'Tilt Down'
  | 'Pedestal Up'
  | 'Pedestal Down'
  | 'Arc Shot'
  | 'Tracking Shot'
  | 'Static Shot'
  | 'Shake Slightly'
  | 'Shake Strongly'
  | 'POV'
  | 'Roll Clockwise'
  | 'Roll Counterclockwise';

export type CameraMove = CameraMotionType;

export type CameraAmplitude = 'default' | 'with small amplitude' | 'with large amplitude';
export type CameraSpeed = 'default' | 'at slow speed' | 'at fast speed';

export interface H3PromptConfig {
  idea: string;
  mode: GenerationMode;
  duration: '4s' | '5s' | '6s' | '8s' | '10s' | '12s' | '15s';
  aspectRatio: '16:9' | '9:16' | '1:1' | '21:9' | '4:3';
  style: string;
  cameraMoves: CameraMove[];
  cameraAmplitude?: CameraAmplitude;
  cameraSpeed?: CameraSpeed;
  lightingMood: string;
  dialogueText: string;
  sfxText: string;
  suppressMusic: boolean; // non_diegetic_music: N/A
  engineTier?: EngineTier;
  references: ReferenceItem[];
}

export interface TemporalSegment {
  timeframe: string; // e.g. [Shot 1] or [Shot 2] At 00:03.500
  action: string;
  camera: string; // e.g. The camera pushes in with small amplitude at slow speed
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
