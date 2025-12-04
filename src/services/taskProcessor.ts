import { prisma } from '@/lib/prisma';
import * as openrouterService from './openrouter';
import * as imageGeneratorService from './imageGenerator';
import { extractText as baiduOcrExtractText } from './baiduOcr';
import { recordApiCost, recordFixedCost } from './costTracker';
import {
  getImageBase64,
  getImageBase64ForModel,
  saveImageFromUrl,
  saveImageFromBase64,
} from './imageProcessor';
import { TaskStatus, CompetitorAnalysis, ContentAnalysis, UsedModels, CompetitorInfo, ProductInfo, ResultImage } from '@/types';
import { DEFAULT_IMAGE_MODELS, AVAILABLE_IMAGE_MODELS } from '@/lib/constants';
import { getTemplateById } from '@/lib/petStyleTemplates';

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
 * 处理任务的配置选项
 */
export interface ProcessTaskOptions {
  /** 预加载的竞品分析结果（批量任务时使用，避免重复分析） */
  preloadedCompetitorAnalysis?: CompetitorAnalysis;
  /** 是否为批量任务的子任务（影响日志和状态更新） */
  isBatchSubTask?: boolean;
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
 * @param options - 处理配置选项
 */
export async function processTask(
  taskId: string,
  startFromStep: number = 1,
  options?: ProcessTaskOptions
): Promise<void> {
  console.log(`[Task ${taskId}] Starting processing from step ${startFromStep}...`);

  // 当前执行的步骤号，用于记录失败步骤
  let currentExecutingStep = startFromStep;

  try {
    // 获取任务信息
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new Error('Task not found');
    }

    // 判断生成模式
    const generationMode = task.generationMode || 'competitor';
    const isTemplateMode = generationMode === 'template';

    // 竞品模式需要竞品图，模板模式不需要
    if (!isTemplateMode && !task.competitorImagePath) {
      throw new Error('Missing competitor image path');
    }
    if (!task.productImagePath) {
      throw new Error('Missing product image path');
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

    // 如果从步骤 2 及以后开始，需要加载步骤 1 的结果（仅竞品模式需要）
    // 批量任务时可以使用预加载的竞品分析结果
    if (!isTemplateMode) {
      if (options?.preloadedCompetitorAnalysis) {
        // 使用预加载的竞品分析（批量任务共享）
        competitorAnalysis = options.preloadedCompetitorAnalysis;
        console.log(`[Task ${taskId}] Using preloaded competitor analysis from batch task`);
      } else if (startFromStep > 1) {
        // 从数据库加载
        competitorAnalysis = parseJson<CompetitorAnalysis>(task.competitorAnalysis);
        if (!competitorAnalysis) {
          throw new Error('Cannot resume: competitorAnalysis not found');
        }
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
      console.log(`[Task ${taskId}] Step 1+2: Starting parallel analysis (mode: ${generationMode})...`);

      // 预加载所有图片（并行）
      // 模板模式下不需要加载竞品图
      const [competitorBase64Loaded, productBase64Loaded] = await Promise.all([
        startFromStep <= 1 && !isTemplateMode && task.competitorImagePath
          ? getImageBase64(task.competitorImagePath)
          : Promise.resolve(null),
        startFromStep <= 2 ? getImageBase64(task.productImagePath) : Promise.resolve(null),
      ]);
      competitorBase64 = competitorBase64Loaded;
      productBase64 = productBase64Loaded;

      console.log(`[Task ${taskId}] Images preloaded in ${Date.now() - parallelStart}ms`);

      // 并行执行 Step 1 和 Step 2
      const analysisPromises: Promise<void>[] = [];

      // Step 1: 获取风格分析数据（仅竞品模式需要）
      // - 竞品模式：分析竞品图（版式+风格）+ 百度 OCR
      // - 模板模式：跳过此步骤，直接进入步骤2
      // - 批量任务：如果有预加载的分析结果，跳过此步骤
      const hasPreloadedAnalysis = !!options?.preloadedCompetitorAnalysis;
      if (startFromStep <= 1 && !isTemplateMode && !hasPreloadedAnalysis) {
        analysisPromises.push((async () => {
          currentExecutingStep = 1;
          const step1Start = Date.now();

          // ========== 竞品模式：分析竞品图 ==========
          console.log(`[Task ${taskId}] Step 1: Analyzing competitor image (layout + style) + OCR...`);
          await updateTaskStatus(taskId, 'analyzing_competitor', 1);

          // Step 1.1: 先执行百度 OCR 获取准确文字
          console.log(`[Task ${taskId}] Step 1.1: Running OCR first...`);
          const ocrTexts = await baiduOcrExtractText(competitorBase64!);
          console.log(`[Task ${taskId}] OCR completed, found ${ocrTexts.length} texts:`, ocrTexts);

          // Step 1.2: 将 OCR 结果传给大模型，辅助文案卖点分析
          console.log(`[Task ${taskId}] Step 1.2: Running competitor analysis with OCR results...`);
          const competitorResult = await openrouterService.analyzeCompetitor(competitorBase64!, ocrTexts);

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
      } else if (startFromStep <= 1 && isTemplateMode) {
        // 模板模式：跳过步骤1，直接记录日志
        console.log(`[Task ${taskId}] Step 1: Skipped (template mode - ${task.styleTemplateId})`);
      } else if (hasPreloadedAnalysis) {
        // 批量任务：使用预加载的分析结果，跳过步骤1
        console.log(`[Task ${taskId}] Step 1: Skipped (using preloaded analysis from batch task)`);
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
      console.log(`[Task ${taskId}] Step 3: Generating prompt (mode: ${generationMode})...`);
      await updateTaskStatus(taskId, 'generating_prompt', 3);

      if (isTemplateMode) {
        // ========== 模板模式：使用预设style_prompt + 实拍图分析 ==========
        const template = getTemplateById(task.styleTemplateId || '');
        const stylePrompt = template?.presetAnalysis?.style?.style_prompt || '';

        console.log(`[Task ${taskId}] Template mode - using preset style_prompt`);
        console.log(`[Task ${taskId}] - stylePrompt: ${stylePrompt}`);
        console.log(`[Task ${taskId}] - contentAnalysis:`, JSON.stringify(contentAnalysis, null, 2));

        // 直接组合预设风格提示词和实拍图分析结果（中文输出）
        generatedPrompt = `${stylePrompt}

实拍商品图分析结果：
- 产品形状：${contentAnalysis?.product_shape?.category || '未知'}，${contentAnalysis?.product_shape?.proportions || ''}
- 外观特征：${contentAnalysis?.product_shape?.outline_features || ''}
- 拍摄角度：${contentAnalysis?.product_orientation?.view_angle || ''}，${contentAnalysis?.product_orientation?.facing || ''}
- 产品材质：${contentAnalysis?.product_surface?.material || ''}，${contentAnalysis?.product_surface?.glossiness || ''}
- 主色调：${contentAnalysis?.color_profile?.primary_color || ''}
- 辅色调：${contentAnalysis?.color_profile?.secondary_color || ''}
- 表面纹理：${contentAnalysis?.product_texture?.smoothness || ''}

生成要求：保持产品的形状、颜色、材质与上述分析完全一致，生成专业电商产品图。`;

        console.log(`[Task ${taskId}] Generated prompt (template mode):\n${generatedPrompt}`);
      } else {
        // ========== 竞品模式：使用 AI 动态合成提示词 ==========
        console.log(`[Task ${taskId}] Competitor mode - using AI synthesis`);
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

        // 提取竞品图的 copywriting 信息（卖点分析）
        const copywriting = competitorAnalysis?.copywriting || null;
        console.log(`[Task ${taskId}] - copywriting:`, JSON.stringify(copywriting, null, 2));

        // 使用 AI 动态合成提示词
        const promptResult = await openrouterService.synthesizePromptWithAI(
          competitorAnalysis!.layout,
          competitorAnalysis!.style,
          contentAnalysis!,
          competitorInfo,
          productInfo,
          copywriting
        );
        generatedPrompt = promptResult.data;

        // 异步记录成本（不阻塞主流程）
        if (promptResult.generationId) {
          recordApiCost(taskId, 3, promptResult.generationId).catch(err =>
            console.error(`[Task ${taskId}] Failed to record step 3 cost:`, err)
          );
        }

        console.log(`[Task ${taskId}] Generated prompt (competitor mode):\n${generatedPrompt}`);
      }

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

      // 加载风格参考图（仅竞品模式需要）
      // 模板模式：不传风格参考图，完全依靠 style_prompt 文字描述控制风格
      // 原因：模板图上的文字会被即梦模型"学习"并复制到生成结果中
      let styleImageBase64: string | undefined;

      if (!isTemplateMode && task.competitorImagePath) {
        // 竞品模式：加载竞品图作为风格参考
        console.log(`[Task ${taskId}] Loading competitor image: ${task.competitorImagePath}`);
        styleImageBase64 = await getImageBase64(task.competitorImagePath);
        console.log(`[Task ${taskId}] Competitor image loaded, base64 length: ${styleImageBase64.length}`);
      } else if (isTemplateMode) {
        // 模板模式：不传风格参考图，使用单图模式 + style_prompt
        console.log(`[Task ${taskId}] Template mode: NOT loading style reference image (using style_prompt only)`);
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
      console.log(`[Task ${taskId}] Dual-image mode: ${styleImageBase64 ? 'YES' : 'NO'}`);

      // 当前时间戳（用于分组显示）
      const createdAt = new Date().toISOString();

      // 并行调用所有选中的模型（每个模型使用最优分辨率的输入图片）
      const generationPromises = selectedModels.map(async (modelId): Promise<ResultImage> => {
        const [provider] = modelId.split(':') as ['openrouter' | 'jimen'];
        const modelConfig = AVAILABLE_IMAGE_MODELS.find(m => m.id === modelId);
        const modelName = modelConfig?.model || modelId;

        console.log(`[Task ${taskId}] Starting generation with model: ${modelId}`);
        const modelStart = Date.now();

        try {
          // 为当前模型获取最优分辨率的图片
          const modelOptimizedBase64 = await getImageBase64ForModel(task.productImagePath!, modelId);

          const result = await imageGeneratorService.generateImageWithModel(
            modelId,
            modelOptimizedBase64,
            generatedPrompt!,
            task.productImagePath!,
            task.jimenResolution || undefined,
            styleImageBase64  // 传入风格参考图
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

      // 根据生成模式设置 step1 的模型信息
      let step1Model: string;
      if (isTemplateMode) {
        const template = getTemplateById(task.styleTemplateId || '');
        step1Model = `模板: ${template?.name || task.styleTemplateId}`;
      } else {
        step1Model = openrouterService.getVisionModel();
      }

      const usedModels: UsedModels = {
        step1_competitor: step1Model,
        step2_content: openrouterService.getVisionModel(),
        step3_prompt: openrouterService.getVisionModel(),  // 现在使用 AI 动态合成
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
