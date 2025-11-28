/**
 * 百度 OCR 服务
 * 使用通用文字识别（高精度版）接口
 */

import { fetchWithRetry } from '@/lib/fetchWithTimeout';

const BAIDU_OCR_API_KEY = process.env.BAIDU_OCR_API_KEY;
const BAIDU_OCR_SECRET_KEY = process.env.BAIDU_OCR_SECRET_KEY;

// Access Token 缓存
let cachedAccessToken: string | null = null;
let tokenExpireTime: number = 0;

/**
 * 获取百度 API Access Token
 * Token 有效期 30 天，带缓存
 */
async function getAccessToken(): Promise<string> {
  // 检查缓存是否有效（提前 1 小时刷新）
  if (cachedAccessToken && Date.now() < tokenExpireTime - 3600000) {
    return cachedAccessToken;
  }

  if (!BAIDU_OCR_API_KEY || !BAIDU_OCR_SECRET_KEY) {
    throw new Error('百度 OCR API Key 或 Secret Key 未配置');
  }

  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_OCR_API_KEY}&client_secret=${BAIDU_OCR_SECRET_KEY}`;

  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) {
    throw new Error(`获取百度 Access Token 失败: ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`百度 API 错误: ${data.error_description || data.error}`);
  }

  cachedAccessToken = data.access_token;
  // Token 有效期 30 天
  tokenExpireTime = Date.now() + data.expires_in * 1000;

  console.log('[BaiduOCR] Access Token 获取成功');
  return cachedAccessToken!;
}

/**
 * 百度 OCR 响应结构
 */
interface BaiduOcrResponse {
  words_result: Array<{
    words: string;
  }>;
  words_result_num: number;
  log_id: number;
  error_code?: number;
  error_msg?: string;
}

/**
 * 调用百度 OCR 高精度接口提取图片文字
 * @param imageBase64 图片的 base64 编码（不含 data:image 前缀）
 * @returns 识别到的文字数组
 */
export async function extractText(imageBase64: string): Promise<string[]> {
  console.log('[BaiduOCR] 开始识别图片文字...');

  try {
    const accessToken = await getAccessToken();

    const url = `https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic?access_token=${accessToken}`;

    // URL 编码 base64 数据
    const body = `image=${encodeURIComponent(imageBase64)}`;

    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`百度 OCR 请求失败: ${response.status}`);
    }

    const data: BaiduOcrResponse = await response.json();

    // 检查 API 错误
    if (data.error_code) {
      throw new Error(`百度 OCR 错误 ${data.error_code}: ${data.error_msg}`);
    }

    // 提取文字列表
    const texts = data.words_result.map((item) => item.words);

    console.log(`[BaiduOCR] 识别完成，共 ${texts.length} 条文字`);
    return texts;
  } catch (error) {
    console.error('[BaiduOCR] 识别失败:', error);
    // OCR 失败不应该阻断主流程，返回空数组
    return [];
  }
}
