import { sleep } from '@/lib/utils';

/**
 * 即梦 AI 图片生成服务
 *
 * MVP 阶段使用 Mock 实现，后续接入真实 API 时只需修改此文件
 *
 * 即梦 AI 文档: https://www.volcengine.com/docs/85621/1820192?lang=zh
 */

interface JimengGenerateOptions {
  sourceImageBase64: string;
  prompt: string;
  width?: number;
  height?: number;
}

interface JimengResponse {
  imageUrl: string;
  imageBase64?: string;
}

/**
 * Mock 实现：模拟图片生成过程
 * 返回原图路径作为结果（真实 API 会返回生成的新图）
 */
async function mockGenerateImage(
  productImagePath: string
): Promise<JimengResponse> {
  // 模拟 AI 处理时间（2-3秒）
  await sleep(2000 + Math.random() * 1000);

  // Mock: 直接返回原图路径
  // 真实 API 会返回生成的新图 URL
  return {
    imageUrl: productImagePath,
  };
}

/**
 * 真实 API 实现（待接入）
 */
async function realGenerateImage(
  options: JimengGenerateOptions
): Promise<JimengResponse> {
  const { sourceImageBase64, prompt } = options;

  const response = await fetch(process.env.JIMENG_API_URL!, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.JIMENG_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'jimeng-2.1-pro', // 根据实际 API 调整
      mode: 'img2img',
      image: sourceImageBase64,
      prompt: prompt,
      strength: 0.7, // 图生图强度，根据需要调整
      // 其他参数根据 API 文档添加
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Jimeng API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
    );
  }

  const result = await response.json();

  // 根据实际 API 响应结构调整
  return {
    imageUrl: result.data?.url || result.data?.image_url || result.url,
    imageBase64: result.data?.base64,
  };
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
): Promise<JimengResponse> {
  // 检查是否配置了真实 API
  const useMock =
    !process.env.JIMENG_API_KEY ||
    process.env.JIMENG_API_KEY === 'your-jimeng-api-key' ||
    process.env.USE_MOCK_JIMENG === 'true';

  if (useMock) {
    console.log('[Jimeng] Using mock implementation');
    return mockGenerateImage(productImagePath);
  }

  console.log('[Jimeng] Using real API');
  return realGenerateImage({
    sourceImageBase64,
    prompt,
  });
}

/**
 * 检查即梦 API 是否可用
 */
export function isJimengConfigured(): boolean {
  return Boolean(
    process.env.JIMENG_API_KEY &&
    process.env.JIMENG_API_KEY !== 'your-jimeng-api-key'
  );
}
