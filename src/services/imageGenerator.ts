import { sleep } from '@/lib/utils';

/**
 * OpenRouter 图像生成服务
 *
 * 使用 OpenRouter API 进行图像生成
 */

// 获取配置的图像生成模型
const IMAGE_MODEL = process.env.OPENROUTER_IMAGE_MODEL || 'google/gemini-2.5-flash-image';

// 导出模型名称供外部使用
export function getImageModel(): string {
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
    // 简化的请求体 - 按照官方文档格式
    const requestBody = {
      model: IMAGE_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Based on this reference product image, generate a new professional e-commerce product photo with similar style. ${prompt}`,
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

    const firstContent = requestBody.messages[0].content[0];
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

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
  return Boolean(
    process.env.OPENROUTER_API_KEY &&
    process.env.OPENROUTER_API_KEY !== 'your-openrouter-api-key'
  );
}
