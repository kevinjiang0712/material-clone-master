import { prisma } from '@/lib/prisma';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

/**
 * 成本信息接口
 */
export interface CostInfo {
  totalCost: number;
  tokensPrompt: number | null;
  tokensCompletion: number | null;
  latency: number | null;
  model: string;
}

/**
 * 从 OpenRouter API 获取生成成本信息
 *
 * @param generationId - OpenRouter 返回的 generation ID (gen-xxx)
 * @returns 成本信息
 */
export async function fetchGenerationCost(generationId: string): Promise<CostInfo> {
  console.log(`[CostTracker] Fetching cost for generation: ${generationId}`);

  try {
    const response = await fetchWithTimeout(
      `https://openrouter.ai/api/v1/generation?id=${generationId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        timeout: 10_000,  // 成本查询使用较短的超时时间
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch generation info: ${response.status}`);
    }

    const json = await response.json();
    const data = json.data;

    console.log(`[CostTracker] Cost info retrieved:`, {
      model: data.model,
      totalCost: data.total_cost,
      tokensPrompt: data.tokens_prompt,
      tokensCompletion: data.tokens_completion,
      latency: data.latency,
    });

    return {
      totalCost: data.total_cost || 0,
      tokensPrompt: data.tokens_prompt || null,
      tokensCompletion: data.tokens_completion || null,
      latency: data.latency || null,
      model: data.model || 'unknown',
    };
  } catch (error) {
    console.error(`[CostTracker] Error fetching cost:`, error);
    // 返回默认值，不阻塞主流程
    return {
      totalCost: 0,
      tokensPrompt: null,
      tokensCompletion: null,
      latency: null,
      model: 'unknown',
    };
  }
}

/**
 * 直接记录已知成本（用于固定价格的服务如即梦）
 *
 * @param taskId - 任务 ID
 * @param step - 步骤号 (1, 2, 4)
 * @param cost - 本次调用成本（元）
 * @param model - 模型名称
 * @param generationId - 可选的生成 ID
 */
export async function recordFixedCost(
  taskId: string,
  step: number,
  cost: number,
  model: string,
  generationId?: string
): Promise<void> {
  console.log(`[CostTracker] Recording fixed cost for task ${taskId}, step ${step}: ${cost} 元`);

  try {
    await prisma.apiCall.create({
      data: {
        taskId,
        step,
        generationId: generationId || `fixed-${Date.now()}`,
        model,
        totalCost: cost,
        tokensPrompt: null,
        tokensCompletion: null,
        latency: null,
      },
    });

    // 更新任务总成本
    const allCosts = await prisma.apiCall.findMany({
      where: { taskId },
      select: { totalCost: true },
    });

    const totalCost = allCosts.reduce((sum, call) => sum + call.totalCost, 0);

    await prisma.task.update({
      where: { id: taskId },
      data: { totalCost },
    });

    console.log(`[CostTracker] Fixed cost recorded: ${cost} 元, total: ${totalCost} 元`);
  } catch (error) {
    console.error(`[CostTracker] Error recording fixed cost:`, error);
    // 不抛出错误，避免影响主流程
  }
}

/**
 * 记录 API 调用成本到数据库（通过查询 OpenRouter API）
 *
 * @param taskId - 任务 ID
 * @param step - 步骤号 (1, 2, 4)
 * @param generationId - OpenRouter 返回的 generation ID
 */
export async function recordApiCost(
  taskId: string,
  step: number,
  generationId: string
): Promise<void> {
  console.log(`[CostTracker] Recording cost for task ${taskId}, step ${step}`);

  try {
    // 获取成本信息
    const costInfo = await fetchGenerationCost(generationId);

    // 创建 ApiCall 记录
    await prisma.apiCall.create({
      data: {
        taskId,
        step,
        generationId,
        model: costInfo.model,
        totalCost: costInfo.totalCost,
        tokensPrompt: costInfo.tokensPrompt,
        tokensCompletion: costInfo.tokensCompletion,
        latency: costInfo.latency,
      },
    });

    // 更新任务的总成本
    const allCosts = await prisma.apiCall.findMany({
      where: { taskId },
      select: { totalCost: true },
    });

    const totalCost = allCosts.reduce((sum, call) => sum + call.totalCost, 0);

    await prisma.task.update({
      where: { id: taskId },
      data: { totalCost },
    });

    console.log(`[CostTracker] Cost recorded: $${costInfo.totalCost}, total: $${totalCost}`);
  } catch (error) {
    console.error(`[CostTracker] Error recording cost:`, error);
    // 不抛出错误，避免影响主流程
  }
}
