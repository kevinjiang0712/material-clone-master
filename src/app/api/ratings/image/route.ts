import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      taskId,
      imagePath,
      modelId,
      provider,
      overallRating,
      imageQuality,
      styleMatch,
      productFidelity,
      creativity,
      comment,
    } = body;

    // 验证必填字段
    if (!taskId || !imagePath || !modelId || !provider || !overallRating) {
      return NextResponse.json(
        { error: '缺少必填字段：taskId, imagePath, modelId, provider, overallRating' },
        { status: 400 }
      );
    }

    // 验证评分范围
    if (overallRating < 1 || overallRating > 5) {
      return NextResponse.json(
        { error: '整体评分必须在 1-5 之间' },
        { status: 400 }
      );
    }

    // 验证可选维度评分范围
    const dimensions = [imageQuality, styleMatch, productFidelity, creativity];
    for (const dim of dimensions) {
      if (dim !== null && dim !== undefined && (dim < 1 || dim > 5)) {
        return NextResponse.json(
          { error: '维度评分必须在 1-5 之间' },
          { status: 400 }
        );
      }
    }

    // 检查任务是否存在
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      );
    }

    // 使用 upsert 创建或更新评分
    const rating = await prisma.imageRating.upsert({
      where: {
        taskId_imagePath: {
          taskId,
          imagePath,
        },
      },
      update: {
        modelId,
        provider,
        overallRating,
        imageQuality: imageQuality ?? null,
        styleMatch: styleMatch ?? null,
        productFidelity: productFidelity ?? null,
        creativity: creativity ?? null,
        comment: comment ?? null,
        updatedAt: new Date(),
      },
      create: {
        taskId,
        imagePath,
        modelId,
        provider,
        overallRating,
        imageQuality: imageQuality ?? null,
        styleMatch: styleMatch ?? null,
        productFidelity: productFidelity ?? null,
        creativity: creativity ?? null,
        comment: comment ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      rating,
    });
  } catch (error) {
    console.error('[POST /api/ratings/image] Error:', error);
    return NextResponse.json(
      { error: '保存评分失败' },
      { status: 500 }
    );
  }
}
