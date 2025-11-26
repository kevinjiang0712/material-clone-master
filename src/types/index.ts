export type TaskStatus =
  | 'pending'
  | 'analyzing_competitor'
  | 'analyzing_content'
  | 'generating_prompt'
  | 'generating_image'
  | 'completed'
  | 'failed';

export interface Task {
  id: string;
  status: TaskStatus;
  currentStep: number;
  totalSteps: number;
  competitorImagePath: string | null;
  productImagePath: string | null;
  resultImagePath: string | null;
  competitorAnalysis: string | null;
  contentAnalysis: string | null;
  generatedPrompt: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 竞品图分析（合并版式+风格）
export interface CompetitorAnalysis {
  layout: LayoutAnalysis;
  style: StyleAnalysis;
}

export interface LayoutAnalysis {
  main_object: {
    position: string;
    horizontal_offset: string;
    vertical_offset: string;
    size: string;
    view_angle: string;
    rotation: string;
    edge_crop: boolean;
  };
  background_structure: {
    type: string;
    layers: string[];
    decorations: string[];
  };
  text_blocks: Array<{
    type: string;
    position: string;
    alignment: string;
    has_mask: boolean;
  }>;
  decors: {
    light_effects: string[];
    shadows: string[];
    shapes: string[];
  };
  layer_sequence: string[];
}

export interface StyleAnalysis {
  color_style: {
    primary_color: string;
    secondary_colors: string[];
    saturation: string;
    brightness: string;
  };
  lighting: {
    direction: string;
    type: string;
    shadow_intensity: string;
    shadow_blur: string;
  };
  texture: {
    surface: string;
    grain: string;
    reflection: string;
  };
  background_style: {
    gradient_direction: string;
    blur_level: string;
    floating_effects: boolean;
  };
  vibe: string;
  style_prompt: string;
}

export interface ContentAnalysis {
  product_shape: {
    category: string;
    proportions: string;
    outline_features: string;
  };
  product_orientation: {
    view_angle: string;
    facing: string;
    tilt: boolean;
  };
  product_regions: {
    main_bounding_box: string;
    key_regions: string[];
  };
  product_surface: {
    material: string;
    glossiness: string;
  };
  product_texture: {
    smoothness: string;
    pattern_direction: string;
    transparency: string;
  };
  color_profile: {
    primary_color: string;
    secondary_color: string;
    brightness: string;
    saturation: string;
  };
  defects: string[];
}

export interface TaskStatusResponse {
  status: TaskStatus;
  currentStep: number;
  totalSteps: number;
  stepDescription: string;
  progress: number;
  failedStep?: number;
  errorMessage?: string;
  // 已完成步骤的分析数据（实时展示用）
  competitorAnalysis?: CompetitorAnalysis | null;
  contentAnalysis?: ContentAnalysis | null;
  generatedPrompt?: string | null;
  usedModels?: UsedModels | null;
}

// 记录每个步骤使用的模型
export interface UsedModels {
  step1_competitor: string;  // 分析竞品图（版式+风格）
  step2_content: string;     // 分析实拍图内容
  step3_prompt: string;      // 合成提示词（本地处理）
  step4_image: string;       // 生成图片
}

// API 调用成本记录
export interface ApiCallInfo {
  step: number;
  model: string;
  totalCost: number;
  tokensPrompt?: number | null;
  tokensCompletion?: number | null;
  latency?: number | null;
}

export interface TaskResultResponse {
  competitorImagePath: string;
  productImagePath: string;
  resultImagePath: string;
  generatedPrompt: string;
  competitorAnalysis: CompetitorAnalysis | null;
  contentAnalysis: ContentAnalysis | null;
  usedModels: UsedModels | null;
  apiCalls: ApiCallInfo[];
  totalCost: number | null;
}

export interface UploadResponse {
  path: string;
}

export interface CreateTaskRequest {
  competitorImagePath: string;
  productImagePath: string;
}

export interface CreateTaskResponse {
  taskId: string;
  message: string;
}
