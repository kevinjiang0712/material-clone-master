import { TaskStatus } from '@/types';

export const STEP_DESCRIPTIONS: Record<TaskStatus, string> = {
  pending: '准备中...',
  analyzing_layout: '正在分析竞品图版式布局...',
  analyzing_style: '正在分析竞品图视觉风格...',
  analyzing_content: '正在分析实拍图产品内容...',
  generating_prompt: '正在合成生成提示词...',
  generating_image: '正在生成最终图片...',
  completed: '生成完成！',
  failed: '生成失败',
};

export const STEP_LABELS = [
  { id: 1, label: '分析版式', status: 'analyzing_layout' as TaskStatus },
  { id: 2, label: '分析风格', status: 'analyzing_style' as TaskStatus },
  { id: 3, label: '分析内容', status: 'analyzing_content' as TaskStatus },
  { id: 4, label: '合成提示词', status: 'generating_prompt' as TaskStatus },
  { id: 5, label: '生成图片', status: 'generating_image' as TaskStatus },
];

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const PROCESSED_IMAGE_SIZE = 1024;
export const POLLING_INTERVAL = 2000; // 2秒
