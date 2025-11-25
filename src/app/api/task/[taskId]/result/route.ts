import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TaskResultResponse } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        status: true,
        competitorImagePath: true,
        productImagePath: true,
        resultImagePath: true,
        generatedPrompt: true,
        errorMessage: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      );
    }

    if (task.status !== 'completed') {
      return NextResponse.json(
        { error: '任务尚未完成' },
        { status: 400 }
      );
    }

    if (!task.resultImagePath) {
      return NextResponse.json(
        { error: '结果图片不存在' },
        { status: 404 }
      );
    }

    const response: TaskResultResponse = {
      competitorImagePath: task.competitorImagePath!,
      productImagePath: task.productImagePath!,
      resultImagePath: task.resultImagePath,
      generatedPrompt: task.generatedPrompt || '',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get task result error:', error);
    return NextResponse.json(
      { error: '获取任务结果失败' },
      { status: 500 }
    );
  }
}
