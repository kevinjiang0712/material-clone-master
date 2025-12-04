import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BatchTaskResultResponse, CompetitorAnalysis, ResultImage, TaskStatus, CostSummary } from '@/types';

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
          include: {
            apiCalls: true,
          },
        },
      },
    });

    if (!batchTask) {
      return NextResponse.json(
        { error: '批量任务不存在' },
        { status: 404 }
      );
    }

    // 解析竞品分析
    let competitorAnalysis: CompetitorAnalysis | null = null;
    if (batchTask.competitorAnalysis) {
      try {
        competitorAnalysis = JSON.parse(batchTask.competitorAnalysis);
      } catch {
        competitorAnalysis = null;
      }
    }

    // 处理子任务结果
    const tasks = batchTask.tasks.map(task => {
      let resultImages: ResultImage[] = [];
      if (task.resultImages) {
        try {
          resultImages = JSON.parse(task.resultImages);
        } catch {
          resultImages = [];
        }
      }

      return {
        id: task.id,
        batchIndex: task.batchIndex || 0,
        status: task.status as TaskStatus,
        productImagePath: task.productImagePath || '',
        productName: task.productName,
        resultImages,
        generatedPrompt: task.generatedPrompt,
        errorMessage: task.errorMessage,
      };
    });

    // 计算成本汇总
    let costSummary: CostSummary | null = null;
    let totalUsd = 0;
    let totalCny = 0;

    for (const task of batchTask.tasks) {
      for (const call of task.apiCalls) {
        // 假设 model 包含 'jimen' 的是人民币计费
        if (call.model.includes('jimen')) {
          totalCny += call.totalCost;
        } else {
          totalUsd += call.totalCost;
        }
      }
    }

    if (totalUsd > 0 || totalCny > 0) {
      costSummary = {
        usd: totalUsd,
        cny: totalCny,
        totalCny: totalUsd * 7.2 + totalCny,
      };
    }

    const response: BatchTaskResultResponse = {
      id: batchTask.id,
      status: batchTask.status as BatchTaskResultResponse['status'],
      totalCount: batchTask.totalCount,
      completedCount: batchTask.completedCount,
      failedCount: batchTask.failedCount,
      generationMode: batchTask.generationMode as BatchTaskResultResponse['generationMode'],
      competitorImagePath: batchTask.competitorImagePath,
      styleTemplateId: batchTask.styleTemplateId,
      competitorAnalysis,
      tasks,
      costSummary,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Batch result query error:', error);
    return NextResponse.json(
      { error: '查询批量任务结果失败' },
      { status: 500 }
    );
  }
}
