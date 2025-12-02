import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ResultImage } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;

    // 获取任务整体评分
    const taskRating = await prisma.taskRating.findUnique({
      where: { taskId },
    });

    // 获取所有图片评分
    const imageRatings = await prisma.imageRating.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });

    // 获取任务信息（用于计算总图片数）
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { resultImages: true },
    });

    // 计算统计信息
    let totalImagesCount = 0;
    if (task?.resultImages) {
      try {
        const resultImages: ResultImage[] = JSON.parse(task.resultImages);
        // 只统计成功生成的图片（有 path 字段）
        totalImagesCount = resultImages.filter((img) => img.path).length;
      } catch (e) {
        console.error('解析 resultImages 失败:', e);
      }
    }

    const ratedImagesCount = imageRatings.length;

    // 计算各维度平均分
    const avgOverallRating =
      ratedImagesCount > 0
        ? imageRatings.reduce((sum, r) => sum + r.overallRating, 0) / ratedImagesCount
        : 0;

    const avgImageQuality =
      imageRatings.filter((r) => r.imageQuality !== null).length > 0
        ? imageRatings
            .filter((r) => r.imageQuality !== null)
            .reduce((sum, r) => sum + (r.imageQuality || 0), 0) /
          imageRatings.filter((r) => r.imageQuality !== null).length
        : 0;

    const avgStyleMatch =
      imageRatings.filter((r) => r.styleMatch !== null).length > 0
        ? imageRatings
            .filter((r) => r.styleMatch !== null)
            .reduce((sum, r) => sum + (r.styleMatch || 0), 0) /
          imageRatings.filter((r) => r.styleMatch !== null).length
        : 0;

    const avgProductFidelity =
      imageRatings.filter((r) => r.productFidelity !== null).length > 0
        ? imageRatings
            .filter((r) => r.productFidelity !== null)
            .reduce((sum, r) => sum + (r.productFidelity || 0), 0) /
          imageRatings.filter((r) => r.productFidelity !== null).length
        : 0;

    const avgCreativity =
      imageRatings.filter((r) => r.creativity !== null).length > 0
        ? imageRatings
            .filter((r) => r.creativity !== null)
            .reduce((sum, r) => sum + (r.creativity || 0), 0) /
          imageRatings.filter((r) => r.creativity !== null).length
        : 0;

    return NextResponse.json({
      taskRating,
      imageRatings,
      statistics: {
        avgOverallRating: Math.round(avgOverallRating * 10) / 10,
        avgImageQuality: Math.round(avgImageQuality * 10) / 10,
        avgStyleMatch: Math.round(avgStyleMatch * 10) / 10,
        avgProductFidelity: Math.round(avgProductFidelity * 10) / 10,
        avgCreativity: Math.round(avgCreativity * 10) / 10,
        ratedImagesCount,
        totalImagesCount,
      },
    });
  } catch (error) {
    console.error('[GET /api/ratings/task/[taskId]] Error:', error);
    return NextResponse.json(
      { error: '获取评分失败' },
      { status: 500 }
    );
  }
}
