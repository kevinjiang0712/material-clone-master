import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processTask } from '@/services/taskProcessor';
import { CreateTaskRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: CreateTaskRequest = await request.json();
    const { competitorImagePath, productImagePath } = body;

    // 验证参数
    if (!competitorImagePath || !productImagePath) {
      return NextResponse.json(
        { error: '请先上传竞品图和实拍图' },
        { status: 400 }
      );
    }

    // 创建任务
    const task = await prisma.task.create({
      data: {
        competitorImagePath,
        productImagePath,
        status: 'pending',
        currentStep: 0,
        totalSteps: 5,
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
