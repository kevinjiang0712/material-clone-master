import { prisma } from '@/lib/prisma';
import * as openaiService from './openai';
import * as jimengService from './jimeng';
import {
  getImageBase64,
  saveImageFromUrl,
  saveImageFromBase64,
} from './imageProcessor';
import { TaskStatus } from '@/types';

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
 * 设置任务失败状态
 */
async function setTaskFailed(taskId: string, error: Error): Promise<void> {
  console.error(`[Task ${taskId}] Failed:`, error);
  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: 'failed',
      errorMessage: error.message,
    },
  });
}

/**
 * 处理任务的主函数
 *
 * 执行步骤：
 * 1. 分析竞品图版式
 * 2. 分析竞品图风格
 * 3. 分析实拍图内容
 * 4. 合成提示词
 * 5. 生成图片
 */
export async function processTask(taskId: string): Promise<void> {
  console.log(`[Task ${taskId}] Starting processing...`);

  try {
    // 获取任务信息
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new Error('Task not found');
    }

    if (!task.competitorImagePath || !task.productImagePath) {
      throw new Error('Missing image paths');
    }

    // 步骤 1: 分析竞品图版式
    console.log(`[Task ${taskId}] Step 1: Analyzing layout...`);
    await updateTaskStatus(taskId, 'analyzing_layout', 1);

    const competitorBase64 = await getImageBase64(task.competitorImagePath);
    const layoutAnalysis = await openaiService.analyzeLayout(competitorBase64);

    await prisma.task.update({
      where: { id: taskId },
      data: { layoutAnalysis: JSON.stringify(layoutAnalysis) },
    });
    console.log(`[Task ${taskId}] Layout analysis completed`);

    // 步骤 2: 分析竞品图风格
    console.log(`[Task ${taskId}] Step 2: Analyzing style...`);
    await updateTaskStatus(taskId, 'analyzing_style', 2);

    const styleAnalysis = await openaiService.analyzeStyle(competitorBase64);

    await prisma.task.update({
      where: { id: taskId },
      data: { styleAnalysis: JSON.stringify(styleAnalysis) },
    });
    console.log(`[Task ${taskId}] Style analysis completed`);

    // 步骤 3: 分析实拍图内容
    console.log(`[Task ${taskId}] Step 3: Analyzing content...`);
    await updateTaskStatus(taskId, 'analyzing_content', 3);

    const productBase64 = await getImageBase64(task.productImagePath);
    const contentAnalysis = await openaiService.analyzeContent(productBase64);

    await prisma.task.update({
      where: { id: taskId },
      data: { contentAnalysis: JSON.stringify(contentAnalysis) },
    });
    console.log(`[Task ${taskId}] Content analysis completed`);

    // 步骤 4: 合成提示词
    console.log(`[Task ${taskId}] Step 4: Generating prompt...`);
    await updateTaskStatus(taskId, 'generating_prompt', 4);

    const generatedPrompt = openaiService.synthesizePrompt(
      layoutAnalysis,
      styleAnalysis,
      contentAnalysis
    );

    await prisma.task.update({
      where: { id: taskId },
      data: { generatedPrompt },
    });
    console.log(`[Task ${taskId}] Prompt generated`);

    // 步骤 5: 生成图片
    console.log(`[Task ${taskId}] Step 5: Generating image...`);
    await updateTaskStatus(taskId, 'generating_image', 5);

    const jimengResult = await jimengService.generateImage(
      productBase64,
      generatedPrompt,
      task.productImagePath
    );

    // 保存生成的图片
    let resultPath: string;
    if (jimengResult.imageBase64) {
      resultPath = await saveImageFromBase64(jimengResult.imageBase64, taskId);
    } else {
      resultPath = await saveImageFromUrl(jimengResult.imageUrl, taskId);
    }

    // 完成
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        resultImagePath: resultPath,
        currentStep: 5,
      },
    });

    console.log(`[Task ${taskId}] Processing completed successfully`);
  } catch (error) {
    await setTaskFailed(
      taskId,
      error instanceof Error ? error : new Error('Unknown error')
    );
  }
}
