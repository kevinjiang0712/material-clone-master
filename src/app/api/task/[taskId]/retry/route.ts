import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processTask } from '@/services/taskProcessor';

/**
 * POST /api/task/[taskId]/retry
 * 从失败步骤重试任务
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    // 获取任务信息
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        status: true,
        failedStep: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      );
    }

    // 只允许重试失败的任务
    if (task.status !== 'failed') {
      return NextResponse.json(
        { error: '只能重试失败的任务' },
        { status: 400 }
      );
    }

    // 获取失败的步骤号
    const failedStep = task.failedStep || 1;

    console.log(`[API /api/task/${taskId}/retry] Retrying from step ${failedStep}`);

    // 异步启动任务处理（不等待完成）
    processTask(taskId, failedStep).catch((error) => {
      console.error(`[API /api/task/${taskId}/retry] Background task error:`, error);
    });

    return NextResponse.json({
      success: true,
      message: `任务已从步骤 ${failedStep} 开始重试`,
      taskId,
      retryFromStep: failedStep,
    });
  } catch (error) {
    console.error('Retry task error:', error);
    return NextResponse.json(
      { error: '重试任务失败' },
      { status: 500 }
    );
  }
}
