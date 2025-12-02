import { sleep } from '@/lib/utils';
import { fetchWithRetry } from '@/lib/fetchWithTimeout';
import { GEMINI_MODELS } from '@/lib/constants';
import * as jimenImageGenerator from './jimenImageGenerator';

/**
 * 图像生成服务
 *
 * 支持多种图像生成模型：
 * - OpenRouter (默认)
 * - 即梦 (Doubao Seedream)
 */

// 获取配置的图像生成模型
const IMAGE_MODEL = process.env.OPENROUTER_IMAGE_MODEL || 'google/gemini-2.5-flash-image';

// 图像生成提供商类型
type ImageProvider = 'openrouter' | 'jimen';

// 获取当前配置的提供商
function getImageProvider(): ImageProvider {
  const provider = process.env.IMAGE_PROVIDER?.toLowerCase();
  if (provider === 'jimen') {
    return 'jimen';
  }
  return 'openrouter';
}

// 导出模型名称供外部使用
export function getImageModel(): string {
  const provider = getImageProvider();
  if (provider === 'jimen') {
    return jimenImageGenerator.getJimenModel();
  }
  return IMAGE_MODEL;
}

interface ImageGenerateOptions {
  sourceImageBase64: string;
  prompt: string;
  width?: number;
  height?: number;
}

interface ImageGenerationResponse {
  imageUrl: string;
  imageBase64?: string;
  generationId?: string;
  cost?: number;  // 本次调用成本（元）- 用于固定价格的服务如即梦
}

/**
 * Mock 实现：模拟图片生成过程
 * 返回原图路径作为结果
 */
async function mockGenerateImage(
  productImagePath: string
): Promise<ImageGenerationResponse> {
  // 模拟 AI 处理时间（2-3秒）
  await sleep(2000 + Math.random() * 1000);

  // Mock: 直接返回原图路径
  return {
    imageUrl: productImagePath,
  };
}

/**
 * 使用 OpenRouter 生成图像
 *
 * 调试版本：打印完整的 API 响应，用于确认正确的响应格式
 */
async function realGenerateImage(
  options: ImageGenerateOptions
): Promise<ImageGenerationResponse> {
  const { sourceImageBase64, prompt } = options;

  console.log(`\n[ImageGenerator] ==================== START ====================`);
  console.log(`[ImageGenerator] Model: ${IMAGE_MODEL}`);
  console.log(`[ImageGenerator] Image base64 length: ${sourceImageBase64.length}`);
  console.log(`[ImageGenerator] Prompt preview: ${prompt.substring(0, 200)}...`);

  try {
    // 构建基础请求体
    const requestBody: Record<string, unknown> = {
      model: IMAGE_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `TASK: Create a stunning e-commerce product photo inspired by competitor's style.

KEY PRINCIPLE:
- Product's PHYSICAL properties (shape, color, material) must stay IDENTICAL
- Everything else (background, scene, props, lighting, atmosphere) can be creatively enhanced

${prompt}

Generate a high-quality product photo that looks professional and appealing for online sales.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${sourceImageBase64}`
              },
            },
          ],
        },
      ],
    };

    // Gemini 模型添加 HIGH 分辨率参数以获取最佳图像质量
    if (GEMINI_MODELS.includes(IMAGE_MODEL)) {
      requestBody.generation_config = {
        media_resolution: 'HIGH',
      };
      console.log(`[ImageGenerator] Added media_resolution: HIGH for Gemini model`);
    }

    const messages = requestBody.messages as Array<{ role: string; content: Array<{ type: string; text?: string }> }>;
    const firstContent = messages[0].content[0];
    const textPreview = 'text' in firstContent && firstContent.text ? firstContent.text.substring(0, 100) + '...' : '';
    console.log(`[ImageGenerator] Request body (without image):`, JSON.stringify({
      model: requestBody.model,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: textPreview },
          { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,[BASE64_DATA]' } }
        ]
      }]
    }, null, 2));

    const response = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || '',
        'X-Title': process.env.OPENROUTER_SITE_NAME || '',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`[ImageGenerator] Response status: ${response.status} ${response.statusText}`);
    console.log(`[ImageGenerator] Response headers:`, Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log(`[ImageGenerator] Raw response length: ${responseText.length}`);
    console.log(`[ImageGenerator] ========== FULL RAW RESPONSE ==========`);
    console.log(responseText);
    console.log(`[ImageGenerator] ========== END RAW RESPONSE ==========`);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${responseText}`);
    }

    // 解析 JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('[ImageGenerator] Failed to parse JSON:', e);
      throw new Error(`Failed to parse response as JSON: ${responseText.substring(0, 500)}`);
    }

    console.log(`[ImageGenerator] ========== PARSED RESPONSE ==========`);
    console.log(JSON.stringify(data, null, 2));
    console.log(`[ImageGenerator] ========== END PARSED RESPONSE ==========`);

    // 提取 generationId
    const generationId = data.id || '';

    // 提取图像 - 根据实际 API 响应格式
    // 响应结构: choices[0].message.images[0].image_url.url
    const choice = data.choices?.[0];
    const message = choice?.message;

    // 检查 message.images 数组（实际的响应格式）
    if (message?.images && Array.isArray(message.images) && message.images.length > 0) {
      const img = message.images[0];
      const url = img.image_url?.url || img.url;
      if (url) {
        console.log(`[ImageGenerator] Found image in message.images, url starts with:`, url.substring(0, 50));
        console.log(`[ImageGenerator] generationId:`, generationId);
        if (url.startsWith('data:image')) {
          const base64Match = url.match(/data:image\/[^;]+;base64,(.+)/);
          if (base64Match) {
            console.log(`[ImageGenerator] Successfully extracted base64 image, length:`, base64Match[1].length);
            console.log(`[ImageGenerator] ==================== END ====================\n`);
            return { imageUrl: '', imageBase64: base64Match[1], generationId };
          }
        }
        console.log(`[ImageGenerator] ==================== END ====================\n`);
        return { imageUrl: url, generationId };
      }
    }

    // 备用：检查 content 是否是数组（其他可能的格式）
    const messageContent = message?.content;
    if (Array.isArray(messageContent)) {
      for (const item of messageContent) {
        if (item.type === 'image_url' || item.type === 'image') {
          const url = item.image_url?.url || item.url || item.image;
          if (url) {
            console.log(`[ImageGenerator] Found image in content array, url starts with:`, url.substring(0, 50));
            console.log(`[ImageGenerator] generationId:`, generationId);
            if (url.startsWith('data:image')) {
              const base64Match = url.match(/data:image\/[^;]+;base64,(.+)/);
              if (base64Match) {
                console.log(`[ImageGenerator] ==================== END ====================\n`);
                return { imageUrl: '', imageBase64: base64Match[1], generationId };
              }
            }
            console.log(`[ImageGenerator] ==================== END ====================\n`);
            return { imageUrl: url, generationId };
          }
        }
      }
    }

    console.log(`[ImageGenerator] ==================== END ====================\n`);
    throw new Error(`Could not extract image from response. Response structure: ${JSON.stringify(Object.keys(data))}`);

  } catch (error) {
    console.error(`[ImageGenerator] ========== ERROR ==========`);
    console.error(`[ImageGenerator] Error:`, error);
    console.error(`[ImageGenerator] ==================== END ====================\n`);
    throw new Error(
      `Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * 生成图片的统一入口
 *
 * @param sourceImageBase64 - 实拍图的 base64 编码
 * @param prompt - 合成的生成提示词
 * @param productImagePath - 实拍图路径（Mock 模式使用）
 * @returns 生成图片的 URL 或 base64
 */
export async function generateImage(
  sourceImageBase64: string,
  prompt: string,
  productImagePath: string
): Promise<ImageGenerationResponse> {
  // 检查是否使用 Mock
  const useMock = process.env.USE_MOCK_GENERATION === 'true';

  if (useMock) {
    console.log('[ImageGenerator] Using mock implementation');
    return mockGenerateImage(productImagePath);
  }

  // 根据配置选择提供商
  const provider = getImageProvider();

  if (provider === 'jimen') {
    console.log('[ImageGenerator] Using 即梦 (Doubao Seedream) API');
    return jimenImageGenerator.generateImage({
      sourceImageBase64,
      prompt,
    });
  }

  console.log('[ImageGenerator] Using OpenRouter API');
  return realGenerateImage({
    sourceImageBase64,
    prompt,
  });
}

/**
 * 检查图像生成 API 是否可用
 */
export function isImageGeneratorConfigured(): boolean {
  const provider = getImageProvider();

  if (provider === 'jimen') {
    return jimenImageGenerator.isJimenConfigured();
  }

  return Boolean(
    process.env.OPENROUTER_API_KEY &&
    process.env.OPENROUTER_API_KEY !== 'your-openrouter-api-key'
  );
}

/**
 * 使用指定模型生成图像
 *
 * @param modelId - 模型 ID，格式: "provider:model"，如 "jimen:doubao-seedream-4-0-250828"
 * @param sourceImageBase64 - 实拍图的 base64 编码
 * @param prompt - 生成提示词
 * @param productImagePath - 产品图路径（Mock 模式用）
 * @param jimenResolution - 即梦模型输出分辨率: "1k" | "2k" | "4k"
 * @param styleImageBase64 - 风格参考图的 base64 编码（模板图或竞品图）
 * @returns 生成结果
 */
export async function generateImageWithModel(
  modelId: string,
  sourceImageBase64: string,
  prompt: string,
  productImagePath: string,
  jimenResolution?: string,
  styleImageBase64?: string
): Promise<ImageGenerationResponse> {
  // 检查是否使用 Mock
  const useMock = process.env.USE_MOCK_GENERATION === 'true';
  if (useMock) {
    console.log(`[ImageGenerator] Mock mode for model: ${modelId}`);
    return mockGenerateImage(productImagePath);
  }

  // 解析 provider 和 model
  const [provider, ...modelParts] = modelId.split(':');
  const model = modelParts.join(':');  // 处理 model 名称中可能包含冒号的情况

  console.log(`[ImageGenerator] Generating with provider=${provider}, model=${model}`);
  if (styleImageBase64) {
    console.log(`[ImageGenerator] Dual-image mode: product + style reference`);
  }

  if (provider === 'jimen') {
    return jimenImageGenerator.generateImage({
      sourceImageBase64,
      styleImageBase64,
      prompt,
      resolutionId: jimenResolution,
    });
  }

  // OpenRouter - 使用指定模型
  return realGenerateImageWithModel(model, {
    sourceImageBase64,
    prompt,
  }, styleImageBase64);
}

/**
 * 构建 OpenRouter 双图模式的 Prompt
 */
function buildOpenRouterDualImagePrompt(originalPrompt: string, hasStyleRef: boolean): string {
  if (!hasStyleRef) {
    return `TASK: Create a stunning e-commerce product photo.

KEY PRINCIPLE:
- Product's PHYSICAL properties (shape, color, material) must stay IDENTICAL
- Everything else (background, scene, props, lighting, atmosphere) can be creatively enhanced

${originalPrompt}

Generate a high-quality product photo that looks professional and appealing for online sales.`;
  }

  return `TASK: 生成电商产品图，严格按照以下规则：

【图1】是产品实拍图：
- 必须保持产品的形状、颜色、材质完全不变
- 产品外观是绝对约束，不可修改

【图2】是风格参考模板：
- 学习图2的背景风格（颜色、渐变、氛围）
- 学习图2的光影效果（光源方向、阴影柔和度）
- 学习图2的整体视觉氛围和调性
- 学习图2的构图方式

【生成要求】
将图1的产品放入图2的风格环境中，生成专业电商产品图。

【附加信息】
${originalPrompt}`;
}

/**
 * 使用 OpenRouter 指定模型生成图像
 */
async function realGenerateImageWithModel(
  model: string,
  options: ImageGenerateOptions,
  styleImageBase64?: string
): Promise<ImageGenerationResponse> {
  const { sourceImageBase64, prompt } = options;
  const hasDualImage = !!styleImageBase64;

  console.log(`\n[ImageGenerator] ==================== START ====================`);
  console.log(`[ImageGenerator] Model: ${model}`);
  console.log(`[ImageGenerator] Mode: ${hasDualImage ? '双图模式（产品图+风格参考图）' : '单图模式'}`);
  console.log(`[ImageGenerator] Product image base64 length: ${sourceImageBase64.length}`);
  if (styleImageBase64) {
    console.log(`[ImageGenerator] Style image base64 length: ${styleImageBase64.length}`);
  }
  console.log(`[ImageGenerator] Prompt preview: ${prompt.substring(0, 200)}...`);

  try {
    // 构建内容数组：文本 + 产品图 + 风格图（如果有）
    const contentArray: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      {
        type: 'text',
        text: buildOpenRouterDualImagePrompt(prompt, hasDualImage),
      },
      {
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${sourceImageBase64}`
        },
      },
    ];

    // 如果有风格参考图，添加第二张图片
    if (styleImageBase64) {
      contentArray.push({
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${styleImageBase64}`
        },
      });
    }

    // 构建请求体
    const requestBody: Record<string, unknown> = {
      model: model,
      messages: [
        {
          role: 'user',
          content: contentArray,
        },
      ],
    };

    // Gemini 模型添加 HIGH 分辨率参数以获取最佳图像质量
    if (GEMINI_MODELS.includes(model)) {
      requestBody.generation_config = {
        media_resolution: 'HIGH',
      };
      console.log(`[ImageGenerator] Added media_resolution: HIGH for Gemini model`);
    }

    const response = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || '',
        'X-Title': process.env.OPENROUTER_SITE_NAME || '',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`[ImageGenerator] Response status: ${response.status} ${response.statusText}`);

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${responseText}`);
    }

    const data = JSON.parse(responseText);
    const generationId = data.id || '';
    const choice = data.choices?.[0];
    const message = choice?.message;

    // 检查 message.images 数组
    if (message?.images && Array.isArray(message.images) && message.images.length > 0) {
      const img = message.images[0];
      const url = img.image_url?.url || img.url;
      if (url) {
        if (url.startsWith('data:image')) {
          const base64Match = url.match(/data:image\/[^;]+;base64,(.+)/);
          if (base64Match) {
            console.log(`[ImageGenerator] ==================== END ====================\n`);
            return { imageUrl: '', imageBase64: base64Match[1], generationId };
          }
        }
        console.log(`[ImageGenerator] ==================== END ====================\n`);
        return { imageUrl: url, generationId };
      }
    }

    // 备用：检查 content 数组
    const messageContent = message?.content;
    if (Array.isArray(messageContent)) {
      for (const item of messageContent) {
        if (item.type === 'image_url' || item.type === 'image') {
          const url = item.image_url?.url || item.url || item.image;
          if (url) {
            if (url.startsWith('data:image')) {
              const base64Match = url.match(/data:image\/[^;]+;base64,(.+)/);
              if (base64Match) {
                console.log(`[ImageGenerator] ==================== END ====================\n`);
                return { imageUrl: '', imageBase64: base64Match[1], generationId };
              }
            }
            console.log(`[ImageGenerator] ==================== END ====================\n`);
            return { imageUrl: url, generationId };
          }
        }
      }
    }

    console.log(`[ImageGenerator] ==================== END ====================\n`);
    throw new Error(`Could not extract image from response`);

  } catch (error) {
    console.error(`[ImageGenerator] Error with model ${model}:`, error);
    throw new Error(
      `Image generation failed (${model}): ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
