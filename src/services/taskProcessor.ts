import { prisma } from '@/lib/prisma';
import * as openrouterService from './openrouter';
import * as imageGeneratorService from './imageGenerator';
import { extractText as baiduOcrExtractText } from './baiduOcr';
import { recordApiCost, recordFixedCost } from './costTracker';
import {
  getImageBase64,
  saveImageFromUrl,
  saveImageFromBase64,
} from './imageProcessor';
import { TaskStatus, CompetitorAnalysis, ContentAnalysis, UsedModels, CompetitorInfo, ProductInfo, ResultImage } from '@/types';
import { DEFAULT_IMAGE_MODELS, AVAILABLE_IMAGE_MODELS } from '@/lib/constants';

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
 * 记录步骤耗时
 */
async function recordStepTiming(taskId: string, step: number, duration: number): Promise<void> {
  try {
    await prisma.stepTiming.upsert({
      where: {
        taskId_step: { taskId, step },
      },
      update: { duration },
      create: { taskId, step, duration },
    });
    console.log(`[Task ${taskId}] Step ${step} timing recorded: ${duration}ms`);
  } catch (error) {
    console.error(`[Task ${taskId}] Failed to record step timing:`, error);
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

    // 步骤 1 + 2: 并行执行竞品图分析和产品图分析（优化：减少 3-8 秒）
    if (startFromStep <= 2) {
      const parallelStart = Date.now();
      console.log(`[Task ${taskId}] Step 1+2: Starting parallel analysis...`);

      // 预加载所有图片（并行）
      const [competitorBase64Loaded, productBase64Loaded] = await Promise.all([
        startFromStep <= 1 ? getImageBase64(task.competitorImagePath) : Promise.resolve(null),
        startFromStep <= 2 ? getImageBase64(task.productImagePath) : Promise.resolve(null),
      ]);
      competitorBase64 = competitorBase64Loaded;
      productBase64 = productBase64Loaded;

      console.log(`[Task ${taskId}] Images preloaded in ${Date.now() - parallelStart}ms`);

      // 并行执行 Step 1 和 Step 2
      const analysisPromises: Promise<void>[] = [];

      // Step 1: 分析竞品图（版式+风格）+ 百度 OCR
      if (startFromStep <= 1) {
        analysisPromises.push((async () => {
          currentExecutingStep = 1;
          const step1Start = Date.now();
          console.log(`[Task ${taskId}] Step 1: Analyzing competitor image (layout + style) + OCR...`);
          await updateTaskStatus(taskId, 'analyzing_competitor', 1);

          // 并行调用：大模型分析 + 百度 OCR
          const [competitorResult, ocrTexts] = await Promise.all([
            openrouterService.analyzeCompetitor(competitorBase64!),
            baiduOcrExtractText(competitorBase64!),
          ]);

          // 合并结果：大模型分析 + OCR 文字
          competitorAnalysis = {
            ...competitorResult.data,
            ocrTexts,
          };

          await prisma.task.update({
            where: { id: taskId },
            data: { competitorAnalysis: JSON.stringify(competitorAnalysis) },
          });

          // 异步记录成本（不阻塞主流程）
          if (competitorResult.generationId) {
            recordApiCost(taskId, 1, competitorResult.generationId).catch(err =>
              console.error(`[Task ${taskId}] Failed to record step 1 cost:`, err)
            );
          }

          // 异步记录步骤耗时（不阻塞主流程）
          recordStepTiming(taskId, 1, Date.now() - step1Start).catch(err =>
            console.error(`[Task ${taskId}] Failed to record step 1 timing:`, err)
          );

          console.log(`[Task ${taskId}] Step 1 completed in ${Date.now() - step1Start}ms, OCR found ${ocrTexts.length} texts`);
        })());
      }

      // Step 2: 分析实拍图内容
      if (startFromStep <= 2 && productBase64) {
        analysisPromises.push((async () => {
          // 如果 Step 1 也在执行，等待一小会让状态更新有序
          if (startFromStep <= 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          currentExecutingStep = 2;
          const step2Start = Date.now();
          console.log(`[Task ${taskId}] Step 2: Analyzing content...`);

          // 只有当 Step 1 不在本次执行时才更新状态（避免状态跳跃）
          if (startFromStep > 1) {
            await updateTaskStatus(taskId, 'analyzing_content', 2);
          }

          const contentResult = await openrouterService.analyzeContent(productBase64!);
          contentAnalysis = contentResult.data;
          console.log(`[Task ${taskId}] Content analysis result:`, JSON.stringify(contentAnalysis, null, 2));

          await prisma.task.update({
            where: { id: taskId },
            data: { contentAnalysis: JSON.stringify(contentAnalysis) },
          });

          // 异步记录成本（不阻塞主流程）
          if (contentResult.generationId) {
            recordApiCost(taskId, 2, contentResult.generationId).catch(err =>
              console.error(`[Task ${taskId}] Failed to record step 2 cost:`, err)
            );
          }

          // 异步记录步骤耗时（不阻塞主流程）
          recordStepTiming(taskId, 2, Date.now() - step2Start).catch(err =>
            console.error(`[Task ${taskId}] Failed to record step 2 timing:`, err)
          );

          console.log(`[Task ${taskId}] Step 2 completed in ${Date.now() - step2Start}ms`);
        })());
      }

      // 等待所有分析完成
      await Promise.all(analysisPromises);

      console.log(`[Task ${taskId}] Parallel analysis completed in ${Date.now() - parallelStart}ms`);
    }

    // 步骤 3: 合成提示词
    if (startFromStep <= 3) {
      currentExecutingStep = 3;
      const step3Start = Date.now();
      console.log(`[Task ${taskId}] Step 3: Generating prompt...`);
      await updateTaskStatus(taskId, 'generating_prompt', 3);

      console.log(`[Task ${taskId}] Synthesizing prompt with:`);
      console.log(`[Task ${taskId}] - competitorAnalysis:`, JSON.stringify(competitorAnalysis, null, 2));
      console.log(`[Task ${taskId}] - contentAnalysis:`, JSON.stringify(contentAnalysis, null, 2));

      // 构建竞品信息
      const competitorInfo: CompetitorInfo | null = task.competitorName
        ? {
            competitorName: task.competitorName,
            competitorCategory: task.competitorCategory || undefined,
          }
        : null;

      // 构建商品信息
      const productInfo: ProductInfo | null = task.productName
        ? {
            productName: task.productName,
            productCategory: task.productCategory || undefined,
            sellingPoints: task.sellingPoints || undefined,
            targetAudience: task.targetAudience || undefined,
            brandTone: task.brandTone ? JSON.parse(task.brandTone) : undefined,
          }
        : null;

      console.log(`[Task ${taskId}] - competitorInfo:`, JSON.stringify(competitorInfo, null, 2));
      console.log(`[Task ${taskId}] - productInfo:`, JSON.stringify(productInfo, null, 2));

      generatedPrompt = openrouterService.synthesizePrompt(
        competitorAnalysis!.layout,
        competitorAnalysis!.style,
        contentAnalysis!,
        competitorInfo,
        productInfo
      );

      console.log(`[Task ${taskId}] Generated prompt:\n${generatedPrompt}`);

      await prisma.task.update({
        where: { id: taskId },
        data: { generatedPrompt },
      });

      // 异步记录步骤耗时（不阻塞主流程）
      recordStepTiming(taskId, 3, Date.now() - step3Start).catch(err =>
        console.error(`[Task ${taskId}] Failed to record step 3 timing:`, err)
      );

      console.log(`[Task ${taskId}] Prompt generated and saved`);
    }

    // 步骤 4: 生成图片（支持多模型并行）
    if (startFromStep <= 4) {
      currentExecutingStep = 4;
      const step4Start = Date.now();
      console.log(`[Task ${taskId}] Step 4: Generating image...`);
      await updateTaskStatus(taskId, 'generating_image', 4);

      // 如果还没有加载产品图，现在加载
      if (!productBase64) {
        productBase64 = await getImageBase64(task.productImagePath);
      }

      // 获取选择的模型列表
      let selectedModels: string[] = DEFAULT_IMAGE_MODELS;
      if (task.selectedImageModels) {
        try {
          selectedModels = JSON.parse(task.selectedImageModels);
        } catch {
          console.warn(`[Task ${taskId}] Failed to parse selectedImageModels, using default`);
        }
      }

      console.log(`[Task ${taskId}] Selected models:`, selectedModels);

      // 当前时间戳（用于分组显示）
      const createdAt = new Date().toISOString();

      // 并行调用所有选中的模型
      const generationPromises = selectedModels.map(async (modelId): Promise<ResultImage> => {
        const [provider] = modelId.split(':') as ['openrouter' | 'jimen'];
        const modelConfig = AVAILABLE_IMAGE_MODELS.find(m => m.id === modelId);
        const modelName = modelConfig?.model || modelId;

        console.log(`[Task ${taskId}] Starting generation with model: ${modelId}`);
        const modelStart = Date.now();

        try {
          const result = await imageGeneratorService.generateImageWithModel(
            modelId,
            productBase64!,
            generatedPrompt!,
            task.productImagePath!
          );

          const modelDuration = Date.now() - modelStart;

          // 保存图片
          let path: string;
          const suffix = modelId.replace(/[:/]/g, '_');  // 文件名安全的后缀
          if (result.imageBase64) {
            path = await saveImageFromBase64(result.imageBase64, `${taskId}_${suffix}`);
          } else {
            path = await saveImageFromUrl(result.imageUrl, `${taskId}_${suffix}`);
          }

          console.log(`[Task ${taskId}] Model ${modelId} succeeded in ${modelDuration}ms, saved to: ${path}`);

          // 获取成本
          const modelCost = result.cost;

          // 异步记录成本到 ApiCall 表（不阻塞主流程）
          if (result.cost !== undefined) {
            // 固定价格服务（如即梦）：直接记录返回的成本
            recordFixedCost(taskId, 4, result.cost, modelId, result.generationId).catch(err =>
              console.error(`[Task ${taskId}] Failed to record step 4 cost for ${modelId}:`, err)
            );
          } else if (result.generationId) {
            // OpenRouter：通过 API 查询成本
            recordApiCost(taskId, 4, result.generationId).catch(err =>
              console.error(`[Task ${taskId}] Failed to record step 4 cost for ${modelId}:`, err)
            );
          }

          return {
            provider,
            model: modelName,
            path,
            createdAt,
            cost: modelCost,
            duration: modelDuration,
          };
        } catch (error) {
          const modelDuration = Date.now() - modelStart;
          console.error(`[Task ${taskId}] Model ${modelId} failed in ${modelDuration}ms:`, error);
          return {
            provider,
            model: modelName,
            error: error instanceof Error ? error.message : 'Unknown error',
            createdAt,
            duration: modelDuration,
          };
        }
      });

      // 等待所有生成完成
      const resultImages = await Promise.all(generationPromises);

      console.log(`[Task ${taskId}] All generations completed:`, resultImages);

      // 检查是否至少有一张成功
      const successfulImages = resultImages.filter(r => r.path && !r.error);
      const hasAnySuccess = successfulImages.length > 0;

      if (!hasAnySuccess) {
        // 所有模型都失败
        const errors = resultImages.map(r => `${r.model}: ${r.error}`).join('; ');
        throw new Error(`All image generation models failed: ${errors}`);
      }

      // 记录使用的模型（取第一个成功的作为主模型）
      const primaryModel = successfulImages[0];
      const usedModels: UsedModels = {
        step1_competitor: openrouterService.getVisionModel(),
        step2_content: openrouterService.getVisionModel(),
        step3_prompt: '本地处理',
        step4_image: selectedModels.join(', '),
      };

      // 异步记录步骤耗时（不阻塞主流程）
      recordStepTiming(taskId, 4, Date.now() - step4Start).catch(err =>
        console.error(`[Task ${taskId}] Failed to record step 4 timing:`, err)
      );

      // 完成
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          resultImagePath: primaryModel.path,  // 兼容旧字段，取第一张成功的
          resultImages: JSON.stringify(resultImages),
          currentStep: 4,
          failedStep: null,
          errorMessage: null,
          usedModels: JSON.stringify(usedModels),
        },
      });

      console.log(`[Task ${taskId}] Processing completed successfully`);
      console.log(`[Task ${taskId}] Successful images: ${successfulImages.length}/${resultImages.length}`);
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
