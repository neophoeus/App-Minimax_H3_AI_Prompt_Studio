export type GenerationMode = 'T2VA' | 'I2VA' | 'FL2VA' | 'L2VA' | 'Ref2VA';

export type AiProvider = 'gemini' | 'ollama' | 'llamacpp';

export type AppMode = 'ai_studio' | 'ollama' | 'llamacpp' | 'paid_api';

export type EngineTier = 'pro' | 'ultra_5x' | 'ultra_20x'; // AI Studio 訂閱制階梯方案 (AI Pro / Ultra 5x / Ultra 20x)

export interface OllamaModelItem {
  name: string;
  model: string;
  size?: number;
  details?: {
    parameter_size?: string;
    quantization_level?: string;
    context_length?: number;
    family?: string;
  };
  capabilities?: string[];
}

export interface OllamaStatus {
  online: boolean;
  baseUrl: string;
  models: OllamaModelItem[];
  error?: string;
}

export interface LlamaCppModelItem {
  id: string;
  name?: string;
  object?: string;
  size?: number;
}

export interface LlamaCppStatus {
  online: boolean;
  baseUrl: string;
  models: LlamaCppModelItem[];
  error?: string;
}

export interface SystemModeStatus {
  detectedModes: {
    ai_studio: boolean;
    ollama: boolean;
    llamacpp: boolean;
    paid_api: boolean;
  };
  details: {
    isAiStudioEnv: boolean;
    hasGeminiApiKey: boolean;
    ollamaOnline: boolean;
    ollamaBaseUrl: string;
    ollamaModelCount: number;
    llamacppOnline: boolean;
    llamacppBaseUrl: string;
    llamacppModelCount: number;
  };
  recommendedMode: AppMode;
  fixedMode?: AppMode;
  ollamaModels: OllamaModelItem[];
  defaultOllamaModel?: string;
  llamacppModels: LlamaCppModelItem[];
  defaultLlamaCppModel?: string;
  error?: string;
}

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
  pictureIndex?: number; // Physical image index (1, 2, 3...) in upload order
  physicalTag?: string; // e.g. "<Picture 1>" or "@image1" indicating the physical upload slot in MiniMax
  isPureSubject?: boolean; // True if declared purely in text without an uploaded image
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

export type OutputContract = 'official' | 'compact';

export type TemperatureMode = 'auto' | 'manual';
export type CreativityLevel = 0 | 1 | 2 | 3;

export interface AuditIssue {
  level: 'error' | 'warning' | 'info';
  code: string;
  messageZh: string;
  suggestionZh?: string;
}

export interface AuditResult {
  isValid: boolean;
  issues: AuditIssue[];
  hasLeakage: boolean;
  hasTimestampError: boolean;
  hasConstraintViolation: boolean;
  repairedPrompt?: string;
}

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
  assistantDirector?: boolean; // 輔助導演開關 (預設 true: 自動推理補全次生細節)
  outputContract?: OutputContract; // 'official' (預設 官方全量架構) | 'compact' (簡約精煉模式)
  temperatureMode?: TemperatureMode; // 'auto' (Gemini官方預設, 本機0.7) | 'manual'
  manualTemperature?: number; // 手動溫度 (0.0 ~ 1.5, 預設 0.7)
  creativityLevel?: number; // 向下相容歷史與預設集
  engineTier?: EngineTier;
  provider?: AiProvider;
  appMode?: AppMode;
  ollamaModel?: string;
  llamacppModel?: string;
  references: ReferenceItem[];
  isSeriesMode?: boolean;
  seriesCount?: number; // 2 ~ 10, default 5
}

export interface TemporalSegment {
  timeframe: string; // e.g. [Shot 1] or [Shot 2] At 00:03.500
  action: string;
  camera: string; // e.g. The camera pushes in with small amplitude at slow speed
  audio: string;
}

export interface SeriesEpisode {
  episodeIndex: number; // 1-indexed (e.g. 1, 2, 3, ...)
  title: string;        // 段落標題 (例如: 第 1 段：初始開場與主體錨定)
  fullPrompt: string;   // 100% 獨立合法、立即可貼入 MiniMax-H3 生成的完整提示詞
  duration?: string;     // 例如 5s 或 10s
  startingState?: string;// 起始狀態 (具體畫面位置、物件與初始姿態)
  actionSequence?: string;// 連續動作 (客觀步驟化物理位移與動作)
  endState?: string;     // 結束狀態 (動作停止時的畫面靜態落點)
  cameraMovement?: string;// 運鏡描述 (三維度自然英文動作)
  audioSoundscape?: string;// 音效與環境音
  continuityNotes?: string;// 承接說明 (如何純文字客觀承接上一段結束狀態)
}

export interface H3PromptOutput {
  fullPrompt: string;
  outputContract?: OutputContract;
  explanationZh?: string;
  suggestions?: string[];
  isSeries?: boolean;
  seriesTitle?: string;
  storyArcSummary?: string;
  episodes?: SeriesEpisode[];
  auditResult?: AuditResult;
  // 向下相容歷史存檔欄位
  block1?: string;
  block2?: string;
  block3?: string;
  temporalTimeline?: TemporalSegment[];
  audioNotes?: string;
}

export interface RefineSeriesEpisodeRequest {
  seriesTitle?: string;
  storyArcSummary?: string;
  targetEpisodeIndex: number;
  currentEpisode: SeriesEpisode;
  previousEpisode?: SeriesEpisode;
  nextEpisode?: SeriesEpisode;
  refineInstruction: string;
  config: Partial<H3PromptConfig>;
}

export interface RefineSeriesEpisodeResponse {
  success: boolean;
  refinedEpisode?: SeriesEpisode;
  error?: string;
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
