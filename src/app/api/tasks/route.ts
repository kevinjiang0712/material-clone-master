import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/tasks
 * 获取任务列表
 *
 * Query params:
 * - limit: 返回的任务数量，默认 10
 * - offset: 跳过的任务数量，默认 0
 * - status: 筛选状态 (pending|analyzing_layout|analyzing_style|analyzing_content|generating_prompt|generating_image|completed|failed)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    // 构建查询条件
    const where = status ? { status } : {};

    // 获取任务列表
    const tasks = await prisma.task.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
      select: {
        id: true,
        status: true,
        currentStep: true,
        totalSteps: true,
        competitorImagePath: true,
        productImagePath: true,
        resultImagePath: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 获取总数
    const total = await prisma.task.count({ where });

    return NextResponse.json({
      tasks,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[API /api/tasks] Error:', error);
    return NextResponse.json(
      { error: '获取任务列表失败' },
      { status: 500 }
    );
  }
}
