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
        competitorAnalysis: true,
        contentAnalysis: true,
        usedModels: true,
        errorMessage: true,
        totalCost: true,
        apiCalls: {
          select: {
            step: true,
            model: true,
            totalCost: true,
            tokensPrompt: true,
            tokensCompletion: true,
            latency: true,
          },
          orderBy: { step: 'asc' },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      );
    }

    // 允许 completed 和 failed 状态都返回数据（失败任务也需要展示已完成的分析步骤）
    if (task.status !== 'completed' && task.status !== 'failed') {
      return NextResponse.json(
        { error: '任务尚未完成' },
        { status: 400 }
      );
    }

    // 解析 JSON 字符串为对象
    const parseJson = (str: string | null) => {
      if (!str) return null;
      try {
        return JSON.parse(str);
      } catch {
        return null;
      }
    };

    const response: TaskResultResponse = {
      competitorImagePath: task.competitorImagePath || '',
      productImagePath: task.productImagePath || '',
      resultImagePath: task.resultImagePath || '',
      generatedPrompt: task.generatedPrompt || '',
      competitorAnalysis: parseJson(task.competitorAnalysis),
      contentAnalysis: parseJson(task.contentAnalysis),
      usedModels: parseJson(task.usedModels),
      apiCalls: task.apiCalls,
      totalCost: task.totalCost,
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
