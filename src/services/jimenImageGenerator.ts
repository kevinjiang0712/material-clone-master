/**
 * 即梦 (Doubao Seedream) 图像生成服务
 *
 * 使用火山引擎 Ark API 进行图像生成
 */

import { JIMEN_COST_PER_IMAGE, JIMEN_RESOLUTION_OPTIONS, DEFAULT_JIMEN_RESOLUTION } from '@/lib/constants';
import { fetchWithRetry } from '@/lib/fetchWithTimeout';

// 获取配置
const JIMEN_API_KEY = process.env.JIMEN_API_KEY;
const JIMEN_MODEL = process.env.JIMEN_MODEL || 'doubao-seedream-4-0-250828';
const JIMEN_API_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';

// 导出模型名称供外部使用
export function getJimenModel(): string {
  return JIMEN_MODEL;
}

interface JimenImageGenerateOptions {
  sourceImageBase64: string;
  styleImageBase64?: string;  // 风格参考图（模板图或竞品图）
  prompt: string;
  resolutionId?: string;  // "1k" | "2k" | "4k"
}

interface JimenImageGenerationResponse {
  imageUrl: string;
  imageBase64?: string;
  generationId?: string;
  cost?: number;  // 本次调用成本（元）
}

/**
 * 即梦 API 响应结构
 */
interface JimenApiResponse {
  created: number;
  data: Array<{
    url: string;
    index: number;
  }>;
  model: string;
  object: string;
}

/**
 * 使用即梦生成图像
 *
 * @param options - 生成选项
 * @returns 生成结果
 */
/**
 * 构建双图模式的 Prompt
 */
function buildDualImagePrompt(originalPrompt: string, hasStyleRef: boolean): string {
  if (!hasStyleRef) {
    // 单图模式：保持原有逻辑
    return `TASK: Create a stunning e-commerce product photo.

KEY PRINCIPLE:
- Product's PHYSICAL properties (shape, color, material) must stay IDENTICAL
- Everything else (background, scene, props, lighting, atmosphere) can be creatively enhanced

${originalPrompt}

Generate a high-quality product photo that looks professional and appealing for online sales.`;
  }

  // 双图模式：明确图1和图2的角色
  return `TASK: 生成电商产品图，严格按照以下规则：

【图1】是产品实拍图：
- 必须保持产品的形状、颜色、材质完全不变
- 产品外观是绝对约束，不可修改

【图2】是风格参考模板：
- 学习图2的背景风格（颜色、渐变、氛围）
- 学习图2的光影效果（光源方向、阴影柔和度）
- 学习图2的整体视觉氛围和调性
- 学习图2的构图方式

【重要禁止事项】
- 禁止复制图2中的任何文字、品牌名称、Logo
- 禁止复制图2中的任何文案内容
- 生成的图片应该是纯产品图，不包含任何文字

【生成要求】
将图1的产品放入图2的风格环境中，生成干净的专业电商产品图。

【附加信息】
${originalPrompt}`;
}

export async function generateImage(
  options: JimenImageGenerateOptions
): Promise<JimenImageGenerationResponse> {
  const { sourceImageBase64, styleImageBase64, prompt, resolutionId = DEFAULT_JIMEN_RESOLUTION } = options;

  // 根据 resolutionId 获取实际分辨率
  const resolution = JIMEN_RESOLUTION_OPTIONS.find(r => r.id === resolutionId)
    || JIMEN_RESOLUTION_OPTIONS.find(r => r.id === DEFAULT_JIMEN_RESOLUTION)!;
  const size = resolution.size;

  // 是否为双图模式
  const hasDualImage = !!styleImageBase64;

  console.log(`\n[JimenGenerator] ==================== START ====================`);
  console.log(`[JimenGenerator] Model: ${JIMEN_MODEL}`);
  console.log(`[JimenGenerator] Mode: ${hasDualImage ? '双图模式（产品图+风格参考图）' : '单图模式'}`);
  console.log(`[JimenGenerator] Resolution: ${resolution.name} (${size}x${size})`);
  console.log(`[JimenGenerator] Product image base64 length: ${sourceImageBase64.length}`);
  if (styleImageBase64) {
    console.log(`[JimenGenerator] Style image base64 length: ${styleImageBase64.length}`);
  }
  console.log(`[JimenGenerator] Prompt preview: ${prompt.substring(0, 200)}...`);

  if (!JIMEN_API_KEY) {
    throw new Error('即梦 API Key 未配置 (JIMEN_API_KEY)');
  }

  try {
    // 构建图片数组：图1是产品图，图2是风格参考图（如果有）
    const images = [`data:image/jpeg;base64,${sourceImageBase64}`];
    if (styleImageBase64) {
      images.push(`data:image/jpeg;base64,${styleImageBase64}`);
    }

    // 构建请求体 - 支持双图输入
    const requestBody = {
      model: JIMEN_MODEL,
      prompt: buildDualImagePrompt(prompt, hasDualImage),
      size: `${size}x${size}`,
      image: images,
      watermark: false,  // 关闭水印
    };

    console.log(`[JimenGenerator] Request body (without image):`, JSON.stringify({
      model: requestBody.model,
      prompt: requestBody.prompt.substring(0, 100) + '...',
      size: requestBody.size,
      image: images.map((_, i) => `[IMAGE_${i + 1}_BASE64]`),
    }, null, 2));

    const response = await fetchWithRetry(JIMEN_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JIMEN_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`[JimenGenerator] Response status: ${response.status} ${response.statusText}`);

    const responseText = await response.text();
    console.log(`[JimenGenerator] Raw response length: ${responseText.length}`);

    if (!response.ok) {
      console.error(`[JimenGenerator] API Error:`, responseText);
      throw new Error(`即梦 API 请求失败: ${response.status} ${response.statusText} - ${responseText}`);
    }

    // 解析 JSON
    let data: JimenApiResponse;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('[JimenGenerator] Failed to parse JSON:', e);
      throw new Error(`Failed to parse response as JSON: ${responseText.substring(0, 500)}`);
    }

    console.log(`[JimenGenerator] Parsed response:`, JSON.stringify(data, null, 2));

    // 提取图像 URL
    if (data.data && data.data.length > 0 && data.data[0].url) {
      const imageUrl = data.data[0].url;
      console.log(`[JimenGenerator] Successfully got image URL:`, imageUrl.substring(0, 100) + '...');
      console.log(`[JimenGenerator] Cost: ${JIMEN_COST_PER_IMAGE} 元`);
      console.log(`[JimenGenerator] ==================== END ====================\n`);

      return {
        imageUrl,
        generationId: `jimen-${data.created}`,
        cost: JIMEN_COST_PER_IMAGE,
      };
    }

    console.log(`[JimenGenerator] ==================== END ====================\n`);
    throw new Error(`Could not extract image from response. Response: ${JSON.stringify(data)}`);

  } catch (error) {
    console.error(`[JimenGenerator] ========== ERROR ==========`);
    console.error(`[JimenGenerator] Error:`, error);
    console.error(`[JimenGenerator] ==================== END ====================\n`);
    throw new Error(
      `即梦图像生成失败: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * 检查即梦 API 是否已配置
 */
export function isJimenConfigured(): boolean {
  return Boolean(JIMEN_API_KEY && JIMEN_API_KEY !== 'your-jimen-api-key');
}
