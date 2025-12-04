import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BatchTaskStatusResponse, BatchSubTaskStatus, ResultImage, TaskStatus } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;

    const batchTask = await prisma.batchTask.findUnique({
      where: { id: batchId },
      include: {
        tasks: {
          orderBy: { batchIndex: 'asc' },
        },
      },
    });

    if (!batchTask) {
      return NextResponse.json(
        { error: '批量任务不存在' },
        { status: 404 }
      );
    }

    // 计算总体进度
    let totalProgress = 0;
    const tasksStatus: BatchSubTaskStatus[] = batchTask.tasks.map(task => {
      // 单任务进度计算
      let taskProgress = 0;
      if (task.status === 'completed') {
        taskProgress = 100;
      } else if (task.status === 'failed') {
        taskProgress = (task.currentStep / 4) * 100;
      } else {
        taskProgress = (task.currentStep / 4) * 100;
      }
      totalProgress += taskProgress;

      // 解析结果图片
      let resultImages: ResultImage[] | undefined;
      if (task.resultImages) {
        try {
          resultImages = JSON.parse(task.resultImages);
        } catch {
          resultImages = undefined;
        }
      }

      return {
        id: task.id,
        batchIndex: task.batchIndex || 0,
        status: task.status as TaskStatus,
        currentStep: task.currentStep,
        productImagePath: task.productImagePath || '',
        productName: task.productName,
        resultImages,
        errorMessage: task.errorMessage || undefined,
      };
    });

    // 计算平均进度
    const progress = batchTask.totalCount > 0
      ? Math.round(totalProgress / batchTask.totalCount)
      : 0;

    const response: BatchTaskStatusResponse = {
      id: batchTask.id,
      status: batchTask.status as BatchTaskStatusResponse['status'],
      totalCount: batchTask.totalCount,
      completedCount: batchTask.completedCount,
      failedCount: batchTask.failedCount,
      progress,
      generationMode: batchTask.generationMode as BatchTaskStatusResponse['generationMode'],
      competitorImagePath: batchTask.competitorImagePath,
      styleTemplateId: batchTask.styleTemplateId,
      tasks: tasksStatus,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Batch status query error:', error);
    return NextResponse.json(
      { error: '查询批量任务状态失败' },
      { status: 500 }
    );
  }
}
