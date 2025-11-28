import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processTask } from '@/services/taskProcessor';
import { CreateTaskRequest } from '@/types';
import { DEFAULT_IMAGE_MODELS, MAX_SELECTED_MODELS, AVAILABLE_IMAGE_MODELS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body: CreateTaskRequest = await request.json();
    const { competitorImagePath, productImagePath, competitorInfo, productInfo, selectedImageModels } = body;

    // 验证参数
    if (!competitorImagePath || !productImagePath) {
      return NextResponse.json(
        { error: '请先上传竞品图和实拍图' },
        { status: 400 }
      );
    }

    // 竞品名称和商品名称改为非必填

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
        competitorImagePath,
        productImagePath,
        status: 'pending',
        currentStep: 0,
        totalSteps: 5,
        selectedImageModels: JSON.stringify(models),
        // 竞品基础信息
        competitorName: competitorInfo?.competitorName || null,
        competitorCategory: competitorInfo?.competitorCategory || null,
        // 商品基础信息
        productName: productInfo?.productName || null,
        productCategory: productInfo?.productCategory || null,
        sellingPoints: productInfo?.sellingPoints || null,
        targetAudience: productInfo?.targetAudience || null,
        brandTone: productInfo?.brandTone?.length ? JSON.stringify(productInfo.brandTone) : null,
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
