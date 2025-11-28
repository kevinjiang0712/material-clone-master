import { API_TIMEOUT, API_RETRIES, RETRY_DELAY } from './constants';

/**
 * 带超时和重试的 fetch 选项
 */
export interface FetchWithRetryOptions extends RequestInit {
  /** 超时时间（毫秒），默认 120000 */
  timeout?: number;
  /** 重试次数，默认 1 */
  retries?: number;
  /** 重试间隔（毫秒），默认 1000 */
  retryDelay?: number;
}

/**
 * 带超时和重试的 fetch 封装
 *
 * @param url - 请求 URL
 * @param options - fetch 选项 + 超时/重试配置
 * @returns Response
 * @throws 超时或请求失败时抛出错误，包含尝试次数信息
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    timeout = API_TIMEOUT,
    retries = API_RETRIES,
    retryDelay = RETRY_DELAY,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;
  const maxAttempts = retries + 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      const isTimeout = error instanceof Error && error.name === 'AbortError';
      const errorMessage = isTimeout
        ? `Request timeout after ${timeout}ms`
        : `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`;

      lastError = new Error(`${errorMessage} (attempt ${attempt}/${maxAttempts})`);

      // 最后一次尝试失败，抛出错误
      if (attempt >= maxAttempts) {
        console.error(`[fetchWithRetry] All ${maxAttempts} attempts failed for ${url}`);
        throw lastError;
      }

      // 等待后重试
      console.log(`[fetchWithRetry] Attempt ${attempt}/${maxAttempts} failed: ${errorMessage}`);
      console.log(`[fetchWithRetry] Retrying in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  // 不应该到达这里，但为了类型安全
  throw lastError || new Error('Unknown error in fetchWithRetry');
}

/**
 * 仅带超时的 fetch 封装（不重试）
 *
 * @param url - 请求 URL
 * @param options - fetch 选项 + 超时配置
 * @returns Response
 */
export async function fetchWithTimeout(
  url: string,
  options: Omit<FetchWithRetryOptions, 'retries' | 'retryDelay'> = {}
): Promise<Response> {
  return fetchWithRetry(url, { ...options, retries: 0 });
}
