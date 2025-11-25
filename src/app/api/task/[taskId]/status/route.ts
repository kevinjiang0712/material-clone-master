import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { STEP_DESCRIPTIONS } from '@/lib/constants';
import { TaskStatus, TaskStatusResponse } from '@/types';

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
        currentStep: true,
        totalSteps: true,
        failedStep: true,
        errorMessage: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      );
    }

    const status = task.status as TaskStatus;
    const progress = Math.round((task.currentStep / task.totalSteps) * 100);

    const response: TaskStatusResponse = {
      status,
      currentStep: task.currentStep,
      totalSteps: task.totalSteps,
      stepDescription: STEP_DESCRIPTIONS[status] || '处理中...',
      progress,
      failedStep: task.failedStep || undefined,
      errorMessage: task.errorMessage || undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get task status error:', error);
    return NextResponse.json(
      { error: '获取任务状态失败' },
      { status: 500 }
    );
  }
}
