import { sleep } from '@/lib/utils';

/**
 * OpenRouter 图像生成服务
 *
 * 使用 OpenRouter API 进行图像生成
 */

// 获取配置的图像生成模型
const IMAGE_MODEL = process.env.OPENROUTER_IMAGE_MODEL || 'google/gemini-2.5-flash-image';

interface ImageGenerateOptions {
  sourceImageBase64: string;
  prompt: string;
  width?: number;
  height?: number;
}

interface ImageGenerationResponse {
  imageUrl: string;
  imageBase64?: string;
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
 * 重要: OpenRouter 图像生成需要:
 * 1. 使用支持图像输出的模型 (如 google/gemini-2.5-flash-preview-05-20)
 * 2. 添加 modalities: ["text", "image"] 参数
 * 3. 从响应的 images 字段或 content 中提取图像
 */
async function realGenerateImage(
  options: ImageGenerateOptions
): Promise<ImageGenerationResponse> {
  const { sourceImageBase64, prompt } = options;

  console.log(`[ImageGenerator] ========== Starting Image Generation ==========`);
  console.log(`[ImageGenerator] Using model: ${IMAGE_MODEL}`);
  console.log(`[ImageGenerator] Source image base64 length: ${sourceImageBase64.length}`);
  console.log(`[ImageGenerator] Full prompt:\n${prompt}`);

  try {
    // 构建请求体 - 关键是添加 modalities 参数
    const requestBody = {
      model: IMAGE_MODEL,
      messages: [
        {
          role: 'user' as const,
          content: [
            {
              type: 'text' as const,
              text: `Based on this reference product image, create a new professional e-commerce product photo. ${prompt}`,
            },
            {
              type: 'image_url' as const,
              image_url: { url: `data:image/jpeg;base64,${sourceImageBase64}` },
            },
          ],
        },
      ],
      // 关键参数: 启用图像输出模态
      modalities: ['text', 'image'],
      max_tokens: 4000,
    };

    console.log(`[ImageGenerator] Request payload (without full image):`, JSON.stringify({
      model: requestBody.model,
      messagesCount: requestBody.messages.length,
      modalities: requestBody.modalities,
      maxTokens: requestBody.max_tokens
    }));

    // 使用 fetch 直接调用 API，因为 OpenAI SDK 可能不支持 modalities 参数
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ImageGenerator] API error response:', errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[ImageGenerator] Response received`);
    console.log(`[ImageGenerator] Response keys:`, Object.keys(data));

    // 方式1: 检查响应中的 images 字段 (OpenRouter 图像生成的标准格式)
    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      const imageItem = data.images[0];
      if (imageItem.image_url?.url) {
        const imageUrl = imageItem.image_url.url;
        console.log(`[ImageGenerator] Found image in images array`);

        // 检查是否是 base64 data URL
        if (imageUrl.startsWith('data:image')) {
          const base64Match = imageUrl.match(/data:image\/[^;]+;base64,(.+)/);
          if (base64Match) {
            console.log(`[ImageGenerator] Extracted base64 from images array, length: ${base64Match[1].length}`);
            return {
              imageUrl: '',
              imageBase64: base64Match[1],
            };
          }
        }

        // 否则当作 URL 返回
        return {
          imageUrl: imageUrl,
        };
      }
    }

    // 方式2: 检查 choices[0].message.content 中的内容
    const choice = data.choices?.[0];
    if (!choice) {
      console.error('[ImageGenerator] No choices in response:', JSON.stringify(data, null, 2));
      throw new Error('No choices in API response');
    }

    console.log(`[ImageGenerator] Finish reason: ${choice.finish_reason}`);

    // 检查 message.content 是否是数组格式 (多模态响应)
    const messageContent = choice.message?.content;

    if (Array.isArray(messageContent)) {
      console.log(`[ImageGenerator] Content is array with ${messageContent.length} items`);
      for (const item of messageContent) {
        if (item.type === 'image_url' && item.image_url?.url) {
          const imageUrl = item.image_url.url;
          if (imageUrl.startsWith('data:image')) {
            const base64Match = imageUrl.match(/data:image\/[^;]+;base64,(.+)/);
            if (base64Match) {
              console.log(`[ImageGenerator] Extracted base64 from content array, length: ${base64Match[1].length}`);
              return {
                imageUrl: '',
                imageBase64: base64Match[1],
              };
            }
          }
          return { imageUrl: imageUrl };
        }
      }
    }

    // 方式3: content 是字符串，尝试从中提取图像
    const content = typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent);
    console.log(`[ImageGenerator] Content type: ${typeof messageContent}`);
    console.log(`[ImageGenerator] Content length: ${content?.length || 0}`);

    if (!content || content === 'null' || content === '""') {
      console.error('[ImageGenerator] No content received from model');
      console.error('[ImageGenerator] Full response:', JSON.stringify(data, null, 2));
      throw new Error('No content received from image generation model. Please check if the model supports image generation with modalities parameter.');
    }

    console.log(`[ImageGenerator] Raw content preview: ${content.substring(0, 500)}...`);

    // 检查是否是 base64 格式
    if (content.includes('data:image')) {
      console.log('[ImageGenerator] Found data:image in content');
      const base64Match = content.match(/data:image\/[^;]+;base64,([^\s"']+)/);
      if (base64Match) {
        console.log(`[ImageGenerator] Extracted base64 image, length: ${base64Match[1].length}`);
        return {
          imageUrl: '',
          imageBase64: base64Match[1],
        };
      }
    }

    // 检查是否是 URL 格式
    const urlMatch = content.match(/https?:\/\/[^\s"']+\.(jpg|jpeg|png|webp)/i);
    if (urlMatch) {
      console.log(`[ImageGenerator] Found image URL: ${urlMatch[0]}`);
      return {
        imageUrl: urlMatch[0],
      };
    }

    // 如果都没有匹配到，记录完整响应用于调试
    console.warn('[ImageGenerator] Could not extract image from response');
    console.warn('[ImageGenerator] Full response data:', JSON.stringify(data, null, 2));
    throw new Error('Could not extract image from model response. The model may not support image generation.');

  } catch (error) {
    console.error('[ImageGenerator] ========== Image Generation Error ==========');
    console.error('[ImageGenerator] Error type:', error?.constructor?.name);
    console.error('[ImageGenerator] Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[ImageGenerator] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    if (error && typeof error === 'object') {
      console.error('[ImageGenerator] Error details:', JSON.stringify(error, null, 2));
    }
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
