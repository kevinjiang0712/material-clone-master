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
  resultImagePath: string | null;  // 兼容旧数据
  resultImages: string | null;     // JSON 数组: ResultImage[]
  selectedImageModels: string | null;  // JSON 数组: string[]
  competitorAnalysis: string | null;
  contentAnalysis: string | null;
  generatedPrompt: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 图像生成结果
export interface ResultImage {
  provider: 'openrouter' | 'jimen';
  model: string;
  path?: string;
  error?: string;
  createdAt?: string;  // ISO 时间字符串，用于分组显示
  cost?: number;       // 该模型的成本（美元或人民币，根据 provider 判断）
  duration?: number;   // 该模型的耗时（毫秒）
}

// 可用的图像生成模型配置
export interface ImageModelConfig {
  id: string;           // 唯一标识: "jimen:doubao-seedream-4-0-250828"
  provider: 'openrouter' | 'jimen';
  model: string;        // 模型名称
  displayName: string;  // 显示名称
  description?: string; // 描述
}

// 文案与卖点分析
export interface CopywritingAnalysis {
  text_content: Array<{
    text: string;
    type: string;  // 主标题/副标题/卖点文案/标签/价格/促销信息
    emphasis: string;  // 高/中/低
  }>;
  selling_points: {
    main_selling_point: string;
    points: Array<{
      point: string;
      category: string;  // 功能/情感/价格/品质/场景
    }>;
    target_audience: string;
    emotional_appeal: string;
  };
}

// 竞品图分析（合并版式+风格+文案）
export interface CompetitorAnalysis {
  layout: LayoutAnalysis;
  style: StyleAnalysis;
  copywriting?: CopywritingAnalysis;  // 大模型分析的文案与卖点
  ocrTexts?: string[];  // 百度 OCR 识别的原始文字列表
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
  // 生成模式信息
  generationMode?: GenerationMode;
  styleTemplateId?: string;
}

// 记录每个步骤使用的模型
export interface UsedModels {
  step1_competitor: string;  // 分析竞品图（版式+风格）
  step2_content: string;     // 分析实拍图内容
  step3_prompt: string;      // 合成提示词（AI 动态生成）
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

// 分币种成本汇总
export interface CostSummary {
  usd: number;      // 美元成本（OpenRouter）
  cny: number;      // 人民币成本（即梦）
  totalCny: number; // 参考总计（人民币，按汇率换算）
}

// 步骤耗时信息
export interface StepTimingInfo {
  step: number;     // 步骤号 1/2/3/4
  duration: number; // 耗时（毫秒）
}

export interface TaskResultResponse {
  competitorImagePath: string;
  productImagePath: string;
  resultImagePath: string;       // 兼容旧数据，取第一张成功的图
  resultImages: ResultImage[];   // 多图结果
  selectedImageModels: string[]; // 选择的模型列表
  generationMode: GenerationMode; // 生成模式
  styleTemplateId?: string;       // 模板模式使用的模板 ID
  generatedPrompt: string;
  competitorAnalysis: CompetitorAnalysis | null;
  contentAnalysis: ContentAnalysis | null;
  usedModels: UsedModels | null;
  apiCalls: ApiCallInfo[];
  totalCost: number | null;      // 兼容旧字段
  costSummary: CostSummary | null; // 分币种成本汇总
  stepTimings: StepTimingInfo[]; // 步骤耗时统计
  promptInputData: PromptInputData | null; // AI 模型输入数据（调试用）
}

export interface UploadResponse {
  path: string;
}

// 竞品基础信息
export interface CompetitorInfo {
  competitorName: string;
  competitorCategory?: string;
}

// 商品基础信息
export interface ProductInfo {
  productName: string;
  productCategory?: string;
  sellingPoints?: string;
  targetAudience?: string;
  brandTone?: string[];
  usageScenario?: string;    // 使用场景描述
}

// 生成模式
export type GenerationMode = 'competitor' | 'template';

// 图像场景类型（AI 智能判断）
export type ImageSceneType =
  | 'product_display'    // 纯产品展示（默认）
  | 'human_usage'        // 人物使用场景（工具、厨具等）
  | 'pet_interaction'    // 宠物互动场景（宠物用品）
  | 'environment';       // 环境展示场景（家居装饰）

// 提示词合成结果（包含场景信息）
export interface PromptSynthesisResult {
  prompt: string;                    // 生成提示词
  sceneType: ImageSceneType;         // 场景类型
  sceneDescription?: string;         // 具体的场景描述
}

// AI 提示词生成输入数据（用于调试展示）
export interface PromptInputData {
  mode: 'competitor' | 'template';

  // 发送给 AI 的完整 prompt
  fullPrompt?: string;

  // 结构化输入数据
  layoutAnalysis?: LayoutAnalysis;
  styleAnalysis?: StyleAnalysis;
  copywritingAnalysis?: CopywritingAnalysis | Record<string, unknown>;  // 支持多种格式
  contentAnalysis?: ContentAnalysis;
  competitorInfo?: CompetitorInfo | null;
  productInfo?: ProductInfo | null;

  // 模板模式特有
  stylePrompt?: string;
  usageSceneInference?: {
    systemPrompt: string;
    result: PromptSynthesisResult;
  };
}

export interface CreateTaskRequest {
  // 必须
  productImagePath: string;
  generationMode: GenerationMode;

  // 竞品模式必须
  competitorImagePath?: string;
  competitorInfo?: CompetitorInfo;

  // 模板模式必须
  styleTemplateId?: string;

  // 可选（两种模式都支持）
  productInfo?: ProductInfo;
  selectedImageModels?: string[];  // 选择的模型列表，最多3个
  jimenResolution?: string;        // 即梦输出分辨率: "1k" | "2k" | "4k"
}

export interface CreateTaskResponse {
  taskId: string;
  message: string;
}

// ============ 评分系统相关类型 ============

// 任务评分
export interface TaskRating {
  id: string;
  taskId: string;
  overallRating: number;
  imageQuality: number | null;
  styleMatch: number | null;
  productFidelity: number | null;
  creativity: number | null;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 图片评分
export interface ImageRating {
  id: string;
  taskId: string;
  imagePath: string;
  modelId: string;
  provider: string;
  overallRating: number;
  imageQuality: number | null;
  styleMatch: number | null;
  productFidelity: number | null;
  creativity: number | null;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 评分统计
export interface RatingStatistics {
  avgOverallRating: number;
  avgImageQuality: number;
  avgStyleMatch: number;
  avgProductFidelity: number;
  avgCreativity: number;
  ratedImagesCount: number;
  totalImagesCount: number;
}

// 任务评分响应
export interface TaskRatingsResponse {
  taskRating: TaskRating | null;
  imageRatings: ImageRating[];
  statistics: RatingStatistics;
}

// ============ 批量任务相关类型 ============

export type BatchTaskStatus = 'pending' | 'processing' | 'completed' | 'partial_failed' | 'failed';

export interface BatchTask {
  id: string;
  status: BatchTaskStatus;
  totalCount: number;
  completedCount: number;
  failedCount: number;
  generationMode: GenerationMode;
  competitorImagePath: string | null;
  styleTemplateId: string | null;
  competitorName: string | null;
  competitorCategory: string | null;
  productInfo: string | null;         // JSON: ProductInfo (不含 productName)
  selectedImageModels: string;        // JSON: string[]
  jimenResolution: string;
  competitorAnalysis: string | null;  // JSON: CompetitorAnalysis
  createdAt: Date;
  updatedAt: Date;
}

// 素材信息（用于批量选择）
export interface MaterialInfo {
  id: string;
  name: string | null;
  path: string;
}

// 创建批量任务请求
export interface CreateBatchTaskRequest {
  materials: MaterialInfo[];           // 多张实拍图的素材信息
  generationMode: GenerationMode;
  competitorImagePath?: string;
  competitorInfo?: CompetitorInfo;
  styleTemplateId?: string;
  productInfo?: Omit<ProductInfo, 'productName'>; // 不含 productName
  selectedImageModels?: string[];
  jimenResolution?: string;
}

// 创建批量任务响应
export interface CreateBatchTaskResponse {
  batchTaskId: string;
  taskIds: string[];
  message: string;
}

// 批量任务中的子任务状态
export interface BatchSubTaskStatus {
  id: string;
  batchIndex: number;
  status: TaskStatus;
  currentStep: number;
  productImagePath: string;
  productName: string | null;
  resultImages?: ResultImage[];
  errorMessage?: string;
}

// 批量任务状态响应
export interface BatchTaskStatusResponse {
  id: string;
  status: BatchTaskStatus;
  totalCount: number;
  completedCount: number;
  failedCount: number;
  progress: number;                    // 0-100
  generationMode: GenerationMode;
  competitorImagePath: string | null;
  styleTemplateId: string | null;
  tasks: BatchSubTaskStatus[];
}

// 批量任务结果响应
export interface BatchTaskResultResponse {
  id: string;
  status: BatchTaskStatus;
  totalCount: number;
  completedCount: number;
  failedCount: number;
  generationMode: GenerationMode;
  competitorImagePath: string | null;
  styleTemplateId: string | null;
  competitorAnalysis: CompetitorAnalysis | null;
  tasks: Array<{
    id: string;
    batchIndex: number;
    status: TaskStatus;
    productImagePath: string;
    productName: string | null;
    resultImages: ResultImage[];
    generatedPrompt: string | null;
    errorMessage: string | null;
  }>;
  costSummary: CostSummary | null;
}
