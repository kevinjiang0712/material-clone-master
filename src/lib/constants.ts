import { TaskStatus, ImageModelConfig } from '@/types';

export const STEP_DESCRIPTIONS: Record<TaskStatus, string> = {
  pending: '准备中...',
  analyzing_competitor: '正在分析竞品图（版式+风格）...',
  analyzing_content: '正在分析实拍图产品内容...',
  generating_prompt: '正在合成生成提示词...',
  generating_image: '正在生成最终图片...',
  completed: '生成完成！',
  failed: '生成失败',
};

export const STEP_LABELS = [
  { id: 1, label: '分析竞品图', status: 'analyzing_competitor' as TaskStatus },
  { id: 2, label: '分析实拍图', status: 'analyzing_content' as TaskStatus },
  { id: 3, label: '合成提示词', status: 'generating_prompt' as TaskStatus },
  { id: 4, label: '生成图片', status: 'generating_image' as TaskStatus },
];

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const PROCESSED_IMAGE_SIZE = 1024;
export const POLLING_INTERVAL = 2000; // 2秒

// 可用的图像生成模型配置
export const AVAILABLE_IMAGE_MODELS: ImageModelConfig[] = [
  // 即梦 (Doubao)
  {
    id: 'jimen:doubao-seedream-4-5-251128',
    provider: 'jimen',
    model: 'doubao-seedream-4-5-251128',
    displayName: '即梦 Seedream 4.5',
    description: '火山引擎即梦图像生成模型 v4.5（增强版）',
  },
  {
    id: 'jimen:doubao-seedream-4-0-250828',
    provider: 'jimen',
    model: 'doubao-seedream-4-0-250828',
    displayName: '即梦 Seedream 4.0',
    description: '火山引擎即梦图像生成模型',
  },
  // OpenRouter
  {
    id: 'openrouter:google/gemini-2.5-flash-image',
    provider: 'openrouter',
    model: 'google/gemini-2.5-flash-image',
    displayName: 'Gemini 2.5 Flash Image',
    description: 'Google Gemini 图像生成',
  },
  {
    id: 'openrouter:google/gemini-3-pro-image-preview',
    provider: 'openrouter',
    model: 'google/gemini-3-pro-image-preview',
    displayName: 'Gemini 3 Pro Image',
    description: 'Google Gemini 3 Pro 预览版',
  },
  {
    id: 'openrouter:black-forest-labs/flux.2-pro',
    provider: 'openrouter',
    model: 'black-forest-labs/flux.2-pro',
    displayName: 'Flux 2 Pro',
    description: 'Black Forest Labs Flux 模型',
  },
  {
    id: 'openrouter:openai/gpt-5-image-mini',
    provider: 'openrouter',
    model: 'openai/gpt-5-image-mini',
    displayName: 'GPT-5 Image Mini',
    description: 'OpenAI GPT-5 图像生成 Mini 版',
  },
  {
    id: 'openrouter:openai/gpt-5-image',
    provider: 'openrouter',
    model: 'openai/gpt-5-image',
    displayName: 'GPT-5 Image',
    description: 'OpenAI GPT-5 图像生成',
  },
];

// 默认选中的模型
export const DEFAULT_IMAGE_MODELS = ['jimen:doubao-seedream-4-5-251128'];

// 最大可选模型数量
export const MAX_SELECTED_MODELS = 3;

// 单个任务最大图片数量
export const MAX_IMAGES_PER_TASK = 10;

// 即梦各模型价格（元/张）
export const JIMEN_MODEL_COSTS: Record<string, number> = {
  'doubao-seedream-4-5-251128': 0.25,  // 4.5版本
  'doubao-seedream-4-0-250828': 0.22,  // 4.0版本
};

// 默认价格（未配置的模型使用）
export const JIMEN_DEFAULT_COST_PER_IMAGE = 0.22;

// 即梦分辨率选项
export interface JimenResolutionOption {
  id: string;
  name: string;
  size: number;  // 正方形边长
  description: string;
}

export const JIMEN_RESOLUTION_OPTIONS: JimenResolutionOption[] = [
  { id: '1k', name: '1K', size: 1024, description: '1024×1024 快速预览' },
  { id: '2k', name: '2K', size: 2048, description: '2048×2048 推荐' },
  { id: '4k', name: '4K', size: 4096, description: '4096×4096 超高清' },
];

export const DEFAULT_JIMEN_RESOLUTION = '4k';

// 美元兑人民币汇率（用于参考汇总显示）
export const USD_TO_CNY_RATE = 7.2;

// API 超时与重试配置
export const API_TIMEOUT = 120_000;  // 统一超时时间：2分钟
export const API_RETRIES = 1;        // 统一重试次数：1次
export const RETRY_DELAY = 1000;     // 重试间隔：1秒

// 各模型最优输入分辨率配置
export const MODEL_INPUT_RESOLUTION: Record<string, { width: number; height: number; align?: number }> = {
  // Flux 2 Pro - 官方推荐 ≤2MP，尺寸需为 16 的倍数
  'openrouter:black-forest-labs/flux.2-pro': { width: 2048, height: 2048, align: 16 },

  // 即梦 - 支持 4K 输出，高分辨率输入有益
  'jimen:doubao-seedream-4-5-251128': { width: 2048, height: 2048 },
  'jimen:doubao-seedream-4-0-250828': { width: 2048, height: 2048 },

  // Gemini 系列 - 配合 HIGH 分辨率模式
  'openrouter:google/gemini-2.5-flash-image': { width: 2048, height: 2048 },
  'openrouter:google/gemini-3-pro-image-preview': { width: 2048, height: 2048 },

  // GPT-5 Image 系列
  'openrouter:openai/gpt-5-image-mini': { width: 2048, height: 2048 },
  'openrouter:openai/gpt-5-image': { width: 2048, height: 2048 },
};

// 默认输入分辨率（未配置的模型使用）
export const DEFAULT_INPUT_RESOLUTION = { width: 2048, height: 2048 };

// Gemini 模型列表（需要添加 media_resolution: HIGH 参数）
export const GEMINI_MODELS = [
  'google/gemini-2.5-flash-image',
  'google/gemini-3-pro-image-preview',
];

// 品牌水印配置
export const BRAND_WATERMARK_CONFIG = {
  brandName: '黄白豆宠物',
  slogan: '简单美观实用',
  logoPath: 'brand/logo.png',  // 相对于 public 目录
  style: {
    fontSize: 36,           // 品牌名和 SLOGAN 字号（基于 2048px 图片）
    fontFamily: 'sans-serif',
    color: '#FFFFFF',
    shadowColor: 'rgba(0,0,0,0.6)',
    shadowBlur: 4,
    padding: 40,            // 距离边缘的内边距
    logoSize: 48,           // Logo 高度
    logoGap: 12,            // Logo 与品牌名之间的间距
  },
};
