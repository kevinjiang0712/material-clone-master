import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processBatchTask } from '@/services/batchProcessor';
import { CreateBatchTaskRequest } from '@/types';
import { DEFAULT_IMAGE_MODELS, MAX_SELECTED_MODELS, AVAILABLE_IMAGE_MODELS, DEFAULT_JIMEN_RESOLUTION } from '@/lib/constants';
import { getTemplateById } from '@/lib/petStyleTemplates';

/** 最大批量任务数量 */
const MAX_BATCH_SIZE = 10;

export async function POST(request: NextRequest) {
  try {
    const body: CreateBatchTaskRequest = await request.json();
    const {
      materials,
      generationMode = 'competitor',
      competitorImagePath,
      competitorInfo,
      styleTemplateId,
      productInfo,
      selectedImageModels,
      jimenResolution = DEFAULT_JIMEN_RESOLUTION,
    } = body;

    // 验证素材列表
    if (!materials || materials.length === 0) {
      return NextResponse.json(
        { error: '请选择至少一张实拍图' },
        { status: 400 }
      );
    }

    if (materials.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `最多支持 ${MAX_BATCH_SIZE} 张图片批量生成` },
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
    if (models.length > MAX_SELECTED_MODELS) {
      models = models.slice(0, MAX_SELECTED_MODELS);
    }
    const validModelIds = AVAILABLE_IMAGE_MODELS.map(m => m.id);
    models = models.filter(m => validModelIds.includes(m));
    if (models.length === 0) {
      models = DEFAULT_IMAGE_MODELS;
    }

    // 创建批量任务
    const batchTask = await prisma.batchTask.create({
      data: {
        status: 'pending',
        totalCount: materials.length,
        completedCount: 0,
        failedCount: 0,
        generationMode,
        competitorImagePath: generationMode === 'competitor' ? competitorImagePath : null,
        styleTemplateId: generationMode === 'template' ? styleTemplateId : null,
        competitorName: generationMode === 'competitor' ? (competitorInfo?.competitorName || null) : null,
        competitorCategory: generationMode === 'competitor' ? (competitorInfo?.competitorCategory || null) : null,
        productInfo: productInfo ? JSON.stringify(productInfo) : null,
        selectedImageModels: JSON.stringify(models),
        jimenResolution,
      },
    });

    // 创建子任务
    const taskIds: string[] = [];
    for (let i = 0; i < materials.length; i++) {
      const material = materials[i];
      const task = await prisma.task.create({
        data: {
          batchTaskId: batchTask.id,
          batchIndex: i,
          generationMode,
          styleTemplateId: generationMode === 'template' ? styleTemplateId : null,
          competitorImagePath: generationMode === 'competitor' ? competitorImagePath : null,
          productImagePath: material.path,
          status: 'pending',
          currentStep: 0,
          totalSteps: 4,
          selectedImageModels: JSON.stringify(models),
          jimenResolution,
          // 竞品信息
          competitorName: generationMode === 'competitor' ? (competitorInfo?.competitorName || null) : null,
          competitorCategory: generationMode === 'competitor' ? (competitorInfo?.competitorCategory || null) : null,
          // 商品信息：productName 取自素材名称，其他共享
          productName: material.name || null,
          productCategory: productInfo?.productCategory || null,
          sellingPoints: productInfo?.sellingPoints || null,
          targetAudience: productInfo?.targetAudience || null,
          brandTone: productInfo?.brandTone?.length ? JSON.stringify(productInfo.brandTone) : null,
        },
      });
      taskIds.push(task.id);
    }

    console.log(`[BatchTask ${batchTask.id}] Created with ${taskIds.length} sub-tasks`);

    // 异步处理批量任务
    processBatchTask(batchTask.id).catch((error) => {
      console.error(`[BatchTask ${batchTask.id}] Async processing error:`, error);
    });

    return NextResponse.json({
      batchTaskId: batchTask.id,
      taskIds,
      message: `批量任务创建成功，共 ${taskIds.length} 个子任务`,
    });
  } catch (error) {
    console.error('Batch task creation error:', error);
    return NextResponse.json(
      { error: '创建批量任务失败，请重试' },
      { status: 500 }
    );
  }
}
