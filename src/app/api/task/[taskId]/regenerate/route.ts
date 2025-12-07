import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateImageWithModel } from '@/services/imageGenerator';
import { ResultImage } from '@/types';
import { MAX_IMAGES_PER_TASK, AVAILABLE_IMAGE_MODELS, JIMEN_MODEL_COSTS, JIMEN_DEFAULT_COST_PER_IMAGE } from '@/lib/constants';
import * as fs from 'fs';
import * as path from 'path';

interface RegenerateRequest {
  selectedModels: string[];  // 选择的模型 ID 列表
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const body: RegenerateRequest = await request.json();
    const { selectedModels } = body;

    // 验证参数
    if (!selectedModels || !Array.isArray(selectedModels) || selectedModels.length === 0) {
      return NextResponse.json(
        { error: '请选择至少一个模型' },
        { status: 400 }
      );
    }

    // 验证选择的模型是否有效
    const validModelIds = AVAILABLE_IMAGE_MODELS.map(m => m.id);
    const invalidModels = selectedModels.filter(m => !validModelIds.includes(m));
    if (invalidModels.length > 0) {
      return NextResponse.json(
        { error: `无效的模型: ${invalidModels.join(', ')}` },
        { status: 400 }
      );
    }

    // 获取任务
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        status: true,
        productImagePath: true,
        resultImages: true,
        generatedPrompt: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      );
    }

    // 只允许已完成或失败的任务重新生成
    if (task.status !== 'completed' && task.status !== 'failed') {
      return NextResponse.json(
        { error: '只有已完成或失败的任务才能重新生成' },
        { status: 400 }
      );
    }

    // 检查是否有生成提示词
    if (!task.generatedPrompt) {
      return NextResponse.json(
        { error: '任务缺少生成提示词，无法重新生成' },
        { status: 400 }
      );
    }

    // 解析现有结果
    let existingResults: ResultImage[] = [];
    if (task.resultImages) {
      try {
        existingResults = JSON.parse(task.resultImages);
      } catch {
        existingResults = [];
      }
    }

    // 统计成功的图片数量
    const successfulCount = existingResults.filter(r => r.path && !r.error).length;
    const availableSlots = MAX_IMAGES_PER_TASK - successfulCount;

    if (availableSlots <= 0) {
      return NextResponse.json(
        { error: `已达到单个任务最大图片数量限制 (${MAX_IMAGES_PER_TASK} 张)` },
        { status: 400 }
      );
    }

    // 限制本次生成的模型数量
    const modelsToGenerate = selectedModels.slice(0, availableSlots);
    if (modelsToGenerate.length < selectedModels.length) {
      console.log(`[Regenerate] 只能生成 ${modelsToGenerate.length} 个模型的图片，已达数量限制`);
    }

    // 读取产品图片
    const productImagePath = task.productImagePath;
    if (!productImagePath) {
      return NextResponse.json(
        { error: '任务缺少产品图片' },
        { status: 400 }
      );
    }

    const productImageFullPath = path.join(process.cwd(), 'public', productImagePath);
    if (!fs.existsSync(productImageFullPath)) {
      return NextResponse.json(
        { error: '产品图片不存在' },
        { status: 400 }
      );
    }

    const productImageBuffer = fs.readFileSync(productImageFullPath);
    const productImageBase64 = productImageBuffer.toString('base64');

    // 当前时间戳（用于分组）
    const createdAt = new Date().toISOString();

    // 并行生成图片
    console.log(`[Regenerate] 开始生成 ${modelsToGenerate.length} 个模型的图片`);

    const generatePromises = modelsToGenerate.map(async (modelId): Promise<ResultImage> => {
      const modelConfig = AVAILABLE_IMAGE_MODELS.find(m => m.id === modelId);
      if (!modelConfig) {
        return {
          provider: 'openrouter',
          model: modelId,
          error: '模型配置不存在',
          createdAt,
        };
      }

      const startTime = Date.now();
      try {
        console.log(`[Regenerate] 生成模型: ${modelId}`);

        const result = await generateImageWithModel(
          modelId,
          productImageBase64,
          task.generatedPrompt!,
          productImagePath
        );

        const latency = Date.now() - startTime;
        console.log(`[Regenerate] 模型 ${modelId} 生成完成，耗时 ${latency}ms`);

        // 保存图片到本地
        let savedPath = '';
        if (result.imageBase64) {
          const fileName = `${taskId}_${Date.now()}_${modelConfig.model.replace(/[/:]/g, '_')}.png`;
          const resultDir = path.join(process.cwd(), 'public', 'uploads', 'result');

          if (!fs.existsSync(resultDir)) {
            fs.mkdirSync(resultDir, { recursive: true });
          }

          const filePath = path.join(resultDir, fileName);
          fs.writeFileSync(filePath, Buffer.from(result.imageBase64, 'base64'));
          savedPath = `/uploads/result/${fileName}`;
        } else if (result.imageUrl) {
          // 下载远程图片
          const response = await fetch(result.imageUrl);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          const fileName = `${taskId}_${Date.now()}_${modelConfig.model.replace(/[/:]/g, '_')}.png`;
          const resultDir = path.join(process.cwd(), 'public', 'uploads', 'result');

          if (!fs.existsSync(resultDir)) {
            fs.mkdirSync(resultDir, { recursive: true });
          }

          const filePath = path.join(resultDir, fileName);
          fs.writeFileSync(filePath, buffer);
          savedPath = `/uploads/result/${fileName}`;
        }

        // 记录 API 调用成本（根据具体模型获取价格）
        const cost = modelConfig.provider === 'jimen'
          ? (JIMEN_MODEL_COSTS[modelConfig.model] || JIMEN_DEFAULT_COST_PER_IMAGE)
          : 0;

        await prisma.apiCall.create({
          data: {
            taskId: task.id,
            step: 5,  // 重新生成步骤
            generationId: `regen-${Date.now()}-${modelConfig.model}`,
            model: modelConfig.model,
            totalCost: cost,
            latency,
          },
        });

        return {
          provider: modelConfig.provider,
          model: modelConfig.model,
          path: savedPath,
          createdAt,
          cost,
          duration: latency,
        };
      } catch (error) {
        const errorDuration = Date.now() - startTime;
        console.error(`[Regenerate] 模型 ${modelId} 生成失败，耗时 ${errorDuration}ms:`, error);
        return {
          provider: modelConfig.provider,
          model: modelConfig.model,
          error: error instanceof Error ? error.message : '生成失败',
          createdAt,
          duration: errorDuration,
        };
      }
    });

    const newResults = await Promise.all(generatePromises);

    // 合并结果（新结果在前）
    const allResults = [...newResults, ...existingResults];

    // 更新任务
    const firstSuccessPath = newResults.find(r => r.path)?.path ||
                            existingResults.find(r => r.path)?.path || '';

    await prisma.task.update({
      where: { id: taskId },
      data: {
        resultImages: JSON.stringify(allResults),
        resultImagePath: firstSuccessPath,
        status: 'completed',  // 重新生成后标记为完成
      },
    });

    // 返回新生成的结果
    return NextResponse.json({
      success: true,
      newResults,
      totalImages: allResults.filter(r => r.path && !r.error).length,
      maxImages: MAX_IMAGES_PER_TASK,
    });

  } catch (error) {
    console.error('[Regenerate] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '重新生成失败' },
      { status: 500 }
    );
  }
}
