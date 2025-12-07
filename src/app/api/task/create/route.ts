import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processTask } from '@/services/taskProcessor';
import { CreateTaskRequest } from '@/types';
import { DEFAULT_IMAGE_MODELS, MAX_SELECTED_MODELS, AVAILABLE_IMAGE_MODELS, DEFAULT_JIMEN_RESOLUTION } from '@/lib/constants';
import { getTemplateById } from '@/lib/petStyleTemplates';

export async function POST(request: NextRequest) {
  try {
    const body: CreateTaskRequest = await request.json();
    const {
      productImagePath,
      generationMode = 'competitor',  // 默认竞品模式，兼容旧请求
      competitorImagePath,
      competitorInfo,
      styleTemplateId,
      productInfo,
      selectedImageModels,
      jimenResolution = DEFAULT_JIMEN_RESOLUTION,
    } = body;

    // 验证实拍图（必须）
    if (!productImagePath) {
      return NextResponse.json(
        { error: '请先上传实拍图' },
        { status: 400 }
      );
    }

    // 根据模式验证参数
    if (generationMode === 'competitor') {
      if (!competitorImagePath) {
        return NextResponse.json(
          { error: '竞品参考模式需要上传竞品图' },
          { status: 400 }
        );
      }
    } else if (generationMode === 'template') {
      if (!styleTemplateId) {
        return NextResponse.json(
          { error: '风格模板模式需要选择模板' },
          { status: 400 }
        );
      }
      // 验证模板是否存在
      const template = getTemplateById(styleTemplateId);
      if (!template) {
        return NextResponse.json(
          { error: '选择的模板不存在' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: '无效的生成模式' },
        { status: 400 }
      );
    }

    // 处理选择的模型列表
    let models = selectedImageModels || DEFAULT_IMAGE_MODELS;

    // 验证模型数量不超过限制
    if (models.length > MAX_SELECTED_MODELS) {
      models = models.slice(0, MAX_SELECTED_MODELS);
    }

    // 验证模型 ID 有效性
    const validModelIds = AVAILABLE_IMAGE_MODELS.map(m => m.id);
    models = models.filter(m => validModelIds.includes(m));

    // 如果没有有效模型，使用默认
    if (models.length === 0) {
      models = DEFAULT_IMAGE_MODELS;
    }

    // 创建任务
    const task = await prisma.task.create({
      data: {
        // 生成模式
        generationMode,
        styleTemplateId: generationMode === 'template' ? styleTemplateId : null,
        // 图片路径
        competitorImagePath: generationMode === 'competitor' ? competitorImagePath : null,
        productImagePath,
        // 任务状态
        status: 'pending',
        currentStep: 0,
        totalSteps: 4,
        selectedImageModels: JSON.stringify(models),
        jimenResolution,
        // 竞品基础信息（仅竞品模式）
        competitorName: generationMode === 'competitor' ? (competitorInfo?.competitorName || null) : null,
        competitorCategory: generationMode === 'competitor' ? (competitorInfo?.competitorCategory || null) : null,
        // 商品基础信息
        productName: productInfo?.productName || null,
        productCategory: productInfo?.productCategory || null,
        sellingPoints: productInfo?.sellingPoints || null,
        targetAudience: productInfo?.targetAudience || null,
        brandTone: productInfo?.brandTone?.length ? JSON.stringify(productInfo.brandTone) : null,
        usageScenario: productInfo?.usageScenario || null,
      },
    });

    // 异步处理任务（不阻塞响应）
    processTask(task.id).catch((error) => {
      console.error(`[Task ${task.id}] Async processing error:`, error);
    });

    return NextResponse.json({
      taskId: task.id,
      message: '任务创建成功',
    });
  } catch (error) {
    console.error('Task creation error:', error);
    return NextResponse.json(
      { error: '创建任务失败，请重试' },
      { status: 500 }
    );
  }
}
