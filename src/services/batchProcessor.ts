import { prisma } from '@/lib/prisma';
import * as openrouterService from './openrouter';
import { extractText as baiduOcrExtractText } from './baiduOcr';
import { getImageBase64 } from './imageProcessor';
import { recordApiCost } from './costTracker';
import { processTask } from './taskProcessor';
import { CompetitorAnalysis, BatchTaskStatus } from '@/types';

/** 最大并发处理子任务数 */
const MAX_CONCURRENT_TASKS = 3;

/**
 * 解析 JSON 字符串
 */
function parseJson<T>(str: string | null): T | null {
  if (!str) return null;
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}

/**
 * 更新批量任务状态
 */
async function updateBatchTaskStatus(batchTaskId: string): Promise<void> {
  const batchTask = await prisma.batchTask.findUnique({
    where: { id: batchTaskId },
    include: { tasks: true },
  });

  if (!batchTask) return;

  const completedCount = batchTask.tasks.filter(t => t.status === 'completed').length;
  const failedCount = batchTask.tasks.filter(t => t.status === 'failed').length;
  const totalCount = batchTask.totalCount;

  let status: BatchTaskStatus;
  if (completedCount + failedCount === totalCount) {
    // 所有任务都处理完毕
    if (failedCount === 0) {
      status = 'completed';
    } else if (completedCount === 0) {
      status = 'failed';
    } else {
      status = 'partial_failed';
    }
  } else {
    status = 'processing';
  }

  await prisma.batchTask.update({
    where: { id: batchTaskId },
    data: {
      status,
      completedCount,
      failedCount,
    },
  });

  console.log(`[BatchTask ${batchTaskId}] Status updated: ${status} (${completedCount}/${totalCount} completed, ${failedCount} failed)`);
}

/**
 * 执行竞品图分析（仅执行一次，结果共享给所有子任务）
 */
async function analyzeCompetitorForBatch(
  batchTaskId: string,
  competitorImagePath: string
): Promise<CompetitorAnalysis> {
  console.log(`[BatchTask ${batchTaskId}] Step 1: Analyzing competitor image (shared)...`);

  // 加载竞品图
  const competitorBase64 = await getImageBase64(competitorImagePath);

  // 执行 OCR
  console.log(`[BatchTask ${batchTaskId}] Running OCR...`);
  const ocrTexts = await baiduOcrExtractText(competitorBase64);
  console.log(`[BatchTask ${batchTaskId}] OCR completed, found ${ocrTexts.length} texts`);

  // 分析竞品图
  console.log(`[BatchTask ${batchTaskId}] Running competitor analysis...`);
  const competitorResult = await openrouterService.analyzeCompetitor(competitorBase64, ocrTexts);

  const competitorAnalysis: CompetitorAnalysis = {
    ...competitorResult.data,
    ocrTexts,
  };

  // 保存到批量任务记录
  await prisma.batchTask.update({
    where: { id: batchTaskId },
    data: { competitorAnalysis: JSON.stringify(competitorAnalysis) },
  });

  // 异步记录成本（使用第一个子任务的 ID）
  if (competitorResult.generationId) {
    const firstTask = await prisma.task.findFirst({
      where: { batchTaskId },
      orderBy: { batchIndex: 'asc' },
    });
    if (firstTask) {
      recordApiCost(firstTask.id, 1, competitorResult.generationId).catch(err =>
        console.error(`[BatchTask ${batchTaskId}] Failed to record competitor analysis cost:`, err)
      );
    }
  }

  console.log(`[BatchTask ${batchTaskId}] Competitor analysis completed and saved`);
  return competitorAnalysis;
}

/**
 * 并发控制器：限制同时执行的 Promise 数量
 */
async function runWithConcurrencyLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    const p = task().then(result => {
      results.push(result);
    });

    const e = p.then(() => {
      executing.splice(executing.indexOf(e), 1);
    });
    executing.push(e);

    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * 处理批量任务的主函数
 *
 * 执行流程：
 * 1. 共享分析：执行一次竞品图分析（竞品模式）或跳过（模板模式）
 * 2. 并行处理：每个子任务从步骤 2 开始执行
 * 3. 状态汇总：更新批量任务的完成状态
 */
export async function processBatchTask(batchTaskId: string): Promise<void> {
  console.log(`[BatchTask ${batchTaskId}] Starting batch processing...`);

  try {
    // 获取批量任务信息
    const batchTask = await prisma.batchTask.findUnique({
      where: { id: batchTaskId },
      include: { tasks: true },
    });

    if (!batchTask) {
      throw new Error('BatchTask not found');
    }

    // 更新状态为处理中
    await prisma.batchTask.update({
      where: { id: batchTaskId },
      data: { status: 'processing' },
    });

    const isTemplateMode = batchTask.generationMode === 'template';
    let competitorAnalysis: CompetitorAnalysis | null = null;

    // 步骤 1: 共享分析（仅竞品模式需要）
    if (!isTemplateMode && batchTask.competitorImagePath) {
      // 检查是否已有分析结果（重试时可能已有）
      if (batchTask.competitorAnalysis) {
        competitorAnalysis = parseJson<CompetitorAnalysis>(batchTask.competitorAnalysis);
        console.log(`[BatchTask ${batchTaskId}] Using existing competitor analysis`);
      } else {
        competitorAnalysis = await analyzeCompetitorForBatch(
          batchTaskId,
          batchTask.competitorImagePath
        );
      }
    } else if (isTemplateMode) {
      console.log(`[BatchTask ${batchTaskId}] Template mode: skipping competitor analysis`);
    }

    // 步骤 2-4: 并行处理所有子任务
    console.log(`[BatchTask ${batchTaskId}] Processing ${batchTask.tasks.length} sub-tasks with concurrency ${MAX_CONCURRENT_TASKS}...`);

    const taskFunctions = batchTask.tasks.map(task => async () => {
      console.log(`[BatchTask ${batchTaskId}] Starting sub-task ${task.id} (index: ${task.batchIndex})`);

      try {
        // 从步骤 2 开始执行（步骤 1 已共享完成或跳过）
        const startStep = isTemplateMode ? 1 : 2;

        await processTask(task.id, startStep, {
          preloadedCompetitorAnalysis: competitorAnalysis || undefined,
          isBatchSubTask: true,
        });

        console.log(`[BatchTask ${batchTaskId}] Sub-task ${task.id} completed successfully`);
      } catch (error) {
        console.error(`[BatchTask ${batchTaskId}] Sub-task ${task.id} failed:`, error);
        // 子任务失败不抛出错误，继续处理其他任务
      }

      // 每个子任务完成后更新批量任务状态
      await updateBatchTaskStatus(batchTaskId);
    });

    // 使用并发限制执行所有子任务
    await runWithConcurrencyLimit(taskFunctions, MAX_CONCURRENT_TASKS);

    // 最终状态更新
    await updateBatchTaskStatus(batchTaskId);

    console.log(`[BatchTask ${batchTaskId}] Batch processing completed`);
  } catch (error) {
    console.error(`[BatchTask ${batchTaskId}] Batch processing failed:`, error);

    // 更新批量任务状态为失败
    await prisma.batchTask.update({
      where: { id: batchTaskId },
      data: { status: 'failed' },
    });

    throw error;
  }
}

/**
 * 重试批量任务中失败的子任务
 */
export async function retryFailedBatchTasks(batchTaskId: string): Promise<void> {
  console.log(`[BatchTask ${batchTaskId}] Retrying failed sub-tasks...`);

  const batchTask = await prisma.batchTask.findUnique({
    where: { id: batchTaskId },
    include: {
      tasks: {
        where: { status: 'failed' },
      },
    },
  });

  if (!batchTask) {
    throw new Error('BatchTask not found');
  }

  if (batchTask.tasks.length === 0) {
    console.log(`[BatchTask ${batchTaskId}] No failed tasks to retry`);
    return;
  }

  // 更新批量任务状态为处理中
  await prisma.batchTask.update({
    where: { id: batchTaskId },
    data: { status: 'processing' },
  });

  const isTemplateMode = batchTask.generationMode === 'template';
  let competitorAnalysis: CompetitorAnalysis | null = null;

  // 加载共享的竞品分析
  if (!isTemplateMode && batchTask.competitorAnalysis) {
    competitorAnalysis = parseJson<CompetitorAnalysis>(batchTask.competitorAnalysis);
  }

  console.log(`[BatchTask ${batchTaskId}] Retrying ${batchTask.tasks.length} failed tasks...`);

  const taskFunctions = batchTask.tasks.map(task => async () => {
    console.log(`[BatchTask ${batchTaskId}] Retrying sub-task ${task.id}`);

    try {
      // 从失败的步骤重新开始
      const startStep = task.failedStep || (isTemplateMode ? 1 : 2);

      await processTask(task.id, startStep, {
        preloadedCompetitorAnalysis: competitorAnalysis || undefined,
        isBatchSubTask: true,
      });

      console.log(`[BatchTask ${batchTaskId}] Sub-task ${task.id} retry succeeded`);
    } catch (error) {
      console.error(`[BatchTask ${batchTaskId}] Sub-task ${task.id} retry failed:`, error);
    }

    await updateBatchTaskStatus(batchTaskId);
  });

  await runWithConcurrencyLimit(taskFunctions, MAX_CONCURRENT_TASKS);
  await updateBatchTaskStatus(batchTaskId);

  console.log(`[BatchTask ${batchTaskId}] Retry completed`);
}
