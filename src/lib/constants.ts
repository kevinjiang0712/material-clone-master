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
export const DEFAULT_IMAGE_MODELS = ['jimen:doubao-seedream-4-0-250828'];

// 最大可选模型数量
export const MAX_SELECTED_MODELS = 3;

// 单个任务最大图片数量
export const MAX_IMAGES_PER_TASK = 10;

// 即梦 API 固定价格（元/张）
export const JIMEN_COST_PER_IMAGE = 0.2;

// 美元兑人民币汇率（用于参考汇总显示）
export const USD_TO_CNY_RATE = 7.2;

// API 超时与重试配置
export const API_TIMEOUT = 120_000;  // 统一超时时间：2分钟
export const API_RETRIES = 1;        // 统一重试次数：1次
export const RETRY_DELAY = 1000;     // 重试间隔：1秒
