import { prisma } from '@/lib/prisma';
import * as openrouterService from './openrouter';
import * as imageGeneratorService from './imageGenerator';
import { recordApiCost } from './costTracker';
import {
  getImageBase64,
  saveImageFromUrl,
  saveImageFromBase64,
} from './imageProcessor';
import { TaskStatus, CompetitorAnalysis, ContentAnalysis, UsedModels } from '@/types';

/**
 * 更新任务状态
 */
async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  currentStep: number,
  extraData?: Record<string, unknown>
): Promise<void> {
  await prisma.task.update({
    where: { id: taskId },
    data: {
      status,
      currentStep,
      ...extraData,
    },
  });
}

/**
 * 设置任务失败状态，记录失败的步骤号
 */
async function setTaskFailed(taskId: string, error: Error, failedStep: number): Promise<void> {
  console.error(`[Task ${taskId}] Failed at step ${failedStep}:`, error);
  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: 'failed',
      errorMessage: error.message,
      failedStep,
    },
  });
}

/**
 * 清除失败状态，用于重试时
 */
async function clearFailedStatus(taskId: string): Promise<void> {
  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: 'pending',
      errorMessage: null,
      failedStep: null,
    },
  });
}

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
 * 处理任务的主函数
 *
 * 执行步骤：
 * 1. 分析竞品图（版式+风格）
 * 2. 分析实拍图内容
 * 3. 合成提示词
 * 4. 生成图片
 *
 * @param taskId - 任务 ID
 * @param startFromStep - 从第几步开始执行（默认为 1，用于断点重试）
 */
export async function processTask(taskId: string, startFromStep: number = 1): Promise<void> {
  console.log(`[Task ${taskId}] Starting processing from step ${startFromStep}...`);

  // 当前执行的步骤号，用于记录失败步骤
  let currentExecutingStep = startFromStep;

  try {
    // 获取任务信息
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new Error('Task not found');
    }

    if (!task.competitorImagePath || !task.productImagePath) {
      throw new Error('Missing image paths');
    }

    // 如果是重试，清除之前的失败状态
    if (startFromStep > 1) {
      await clearFailedStatus(taskId);
    }

    // 用于存储各步骤的结果（可能从数据库加载或新生成）
    let competitorAnalysis: CompetitorAnalysis | null = null;
    let contentAnalysis: ContentAnalysis | null = null;
    let generatedPrompt: string | null = null;
    let competitorBase64: string | null = null;
    let productBase64: string | null = null;

    // 如果从步骤 2 及以后开始，需要加载步骤 1 的结果
    if (startFromStep > 1) {
      competitorAnalysis = parseJson<CompetitorAnalysis>(task.competitorAnalysis);
      if (!competitorAnalysis) {
        throw new Error('Cannot resume: competitorAnalysis not found');
      }
    }

    // 如果从步骤 3 及以后开始，需要加载步骤 2 的结果
    if (startFromStep > 2) {
      contentAnalysis = parseJson<ContentAnalysis>(task.contentAnalysis);
      if (!contentAnalysis) {
        throw new Error('Cannot resume: contentAnalysis not found');
      }
    }

    // 如果从步骤 4 开始，需要加载步骤 3 的结果
    if (startFromStep > 3) {
      generatedPrompt = task.generatedPrompt;
      if (!generatedPrompt) {
        throw new Error('Cannot resume: generatedPrompt not found');
      }
    }

    // 步骤 1: 分析竞品图（版式+风格）
    if (startFromStep <= 1) {
      currentExecutingStep = 1;
      console.log(`[Task ${taskId}] Step 1: Analyzing competitor image (layout + style)...`);
      await updateTaskStatus(taskId, 'analyzing_competitor', 1);

      competitorBase64 = await getImageBase64(task.competitorImagePath);
      const competitorResult = await openrouterService.analyzeCompetitor(competitorBase64);
      competitorAnalysis = competitorResult.data;

      await prisma.task.update({
        where: { id: taskId },
        data: { competitorAnalysis: JSON.stringify(competitorAnalysis) },
      });

      // 记录成本
      if (competitorResult.generationId) {
        await recordApiCost(taskId, 1, competitorResult.generationId);
      }

      console.log(`[Task ${taskId}] Competitor analysis completed`);
    }

    // 步骤 2: 分析实拍图内容
    if (startFromStep <= 2) {
      currentExecutingStep = 2;
      console.log(`[Task ${taskId}] Step 2: Analyzing content...`);
      await updateTaskStatus(taskId, 'analyzing_content', 2);

      productBase64 = await getImageBase64(task.productImagePath);
      console.log(`[Task ${taskId}] Product image loaded, base64 length:`, productBase64.length);

      const contentResult = await openrouterService.analyzeContent(productBase64);
      contentAnalysis = contentResult.data;
      console.log(`[Task ${taskId}] Content analysis result:`, JSON.stringify(contentAnalysis, null, 2));

      await prisma.task.update({
        where: { id: taskId },
        data: { contentAnalysis: JSON.stringify(contentAnalysis) },
      });

      // 记录成本
      if (contentResult.generationId) {
        await recordApiCost(taskId, 2, contentResult.generationId);
      }

      console.log(`[Task ${taskId}] Content analysis completed and saved`);
    }

    // 步骤 3: 合成提示词
    if (startFromStep <= 3) {
      currentExecutingStep = 3;
      console.log(`[Task ${taskId}] Step 3: Generating prompt...`);
      await updateTaskStatus(taskId, 'generating_prompt', 3);

      console.log(`[Task ${taskId}] Synthesizing prompt with:`);
      console.log(`[Task ${taskId}] - competitorAnalysis:`, JSON.stringify(competitorAnalysis, null, 2));
      console.log(`[Task ${taskId}] - contentAnalysis:`, JSON.stringify(contentAnalysis, null, 2));

      generatedPrompt = openrouterService.synthesizePrompt(
        competitorAnalysis!.layout,
        competitorAnalysis!.style,
        contentAnalysis!
      );

      console.log(`[Task ${taskId}] Generated prompt:\n${generatedPrompt}`);

      await prisma.task.update({
        where: { id: taskId },
        data: { generatedPrompt },
      });
      console.log(`[Task ${taskId}] Prompt generated and saved`);
    }

    // 步骤 4: 生成图片
    if (startFromStep <= 4) {
      currentExecutingStep = 4;
      console.log(`[Task ${taskId}] Step 4: Generating image...`);
      await updateTaskStatus(taskId, 'generating_image', 4);

      // 如果还没有加载产品图，现在加载
      if (!productBase64) {
        productBase64 = await getImageBase64(task.productImagePath);
      }

      console.log(`[Task ${taskId}] Calling image generator...`);
      const generationResult = await imageGeneratorService.generateImage(
        productBase64,
        generatedPrompt!,
        task.productImagePath
      );

      console.log(`[Task ${taskId}] Image generation completed`);
      console.log(`[Task ${taskId}] Result has imageBase64:`, !!generationResult.imageBase64);
      console.log(`[Task ${taskId}] Result has imageUrl:`, !!generationResult.imageUrl);

      // 保存生成的图片
      let resultPath: string;
      if (generationResult.imageBase64) {
        console.log(`[Task ${taskId}] Saving image from base64...`);
        resultPath = await saveImageFromBase64(generationResult.imageBase64, taskId);
        console.log(`[Task ${taskId}] Image saved to:`, resultPath);
      } else {
        console.log(`[Task ${taskId}] Saving image from URL:`, generationResult.imageUrl);
        resultPath = await saveImageFromUrl(generationResult.imageUrl, taskId);
        console.log(`[Task ${taskId}] Image saved to:`, resultPath);
      }

      // 记录成本
      if (generationResult.generationId) {
        await recordApiCost(taskId, 4, generationResult.generationId);
      }

      // 记录使用的模型
      const usedModels: UsedModels = {
        step1_competitor: openrouterService.getVisionModel(),
        step2_content: openrouterService.getVisionModel(),
        step3_prompt: '本地处理',
        step4_image: imageGeneratorService.getImageModel(),
      };

      // 完成
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          resultImagePath: resultPath,
          currentStep: 4,
          failedStep: null,
          errorMessage: null,
          usedModels: JSON.stringify(usedModels),
        },
      });

      console.log(`[Task ${taskId}] Processing completed successfully`);
      console.log(`[Task ${taskId}] Used models:`, usedModels);
    }
  } catch (error) {
    await setTaskFailed(
      taskId,
      error instanceof Error ? error : new Error('Unknown error'),
      currentExecutingStep
    );
  }
}
