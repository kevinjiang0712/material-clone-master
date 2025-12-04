import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { retryFailedBatchTasks } from '@/services/batchProcessor';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;

    const batchTask = await prisma.batchTask.findUnique({
      where: { id: batchId },
      include: {
        tasks: {
          where: { status: 'failed' },
        },
      },
    });

    if (!batchTask) {
      return NextResponse.json(
        { error: '批量任务不存在' },
        { status: 404 }
      );
    }

    if (batchTask.tasks.length === 0) {
      return NextResponse.json(
        { error: '没有失败的子任务需要重试' },
        { status: 400 }
      );
    }

    // 异步执行重试
    retryFailedBatchTasks(batchId).catch((error) => {
      console.error(`[BatchTask ${batchId}] Retry error:`, error);
    });

    return NextResponse.json({
      message: `开始重试 ${batchTask.tasks.length} 个失败的任务`,
      retryCount: batchTask.tasks.length,
    });
  } catch (error) {
    console.error('Batch retry error:', error);
    return NextResponse.json(
      { error: '重试批量任务失败' },
      { status: 500 }
    );
  }
}
