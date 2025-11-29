/**
 * 即梦 (Doubao Seedream) 图像生成服务
 *
 * 使用火山引擎 Ark API 进行图像生成
 */

import { JIMEN_COST_PER_IMAGE } from '@/lib/constants';
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
  prompt: string;
  width?: number;
  height?: number;
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
export async function generateImage(
  options: JimenImageGenerateOptions
): Promise<JimenImageGenerationResponse> {
  const { sourceImageBase64, prompt, width = 2048, height = 2048 } = options;

  console.log(`\n[JimenGenerator] ==================== START ====================`);
  console.log(`[JimenGenerator] Model: ${JIMEN_MODEL}`);
  console.log(`[JimenGenerator] Image base64 length: ${sourceImageBase64.length}`);
  console.log(`[JimenGenerator] Prompt preview: ${prompt.substring(0, 200)}...`);

  if (!JIMEN_API_KEY) {
    throw new Error('即梦 API Key 未配置 (JIMEN_API_KEY)');
  }

  try {
    // 构建请求体 - 图生图模式
    const requestBody = {
      model: JIMEN_MODEL,
      prompt: `TASK: Create a stunning e-commerce product photo inspired by competitor's style.

KEY PRINCIPLE:
- Product's PHYSICAL properties (shape, color, material) must stay IDENTICAL
- Everything else (background, scene, props, lighting, atmosphere) can be creatively enhanced

${prompt}

Generate a high-quality product photo that looks professional and appealing for online sales.`,
      size: `${width}x${height}`,
      image: [`data:image/jpeg;base64,${sourceImageBase64}`],
      watermark: false,  // 关闭水印
    };

    console.log(`[JimenGenerator] Request body (without image):`, JSON.stringify({
      model: requestBody.model,
      prompt: requestBody.prompt.substring(0, 100) + '...',
      size: requestBody.size,
      image: ['[BASE64_DATA]'],
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
