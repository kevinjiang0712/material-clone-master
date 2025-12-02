import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import path from 'path';

// DELETE /api/materials/[id] - 删除素材
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 查找素材
    const material = await prisma.material.findUnique({
      where: { id },
    });

    if (!material) {
      return NextResponse.json(
        { error: '素材不存在' },
        { status: 404 }
      );
    }

    // 删除文件
    try {
      const filePath = path.join(process.cwd(), 'public', material.path);
      await unlink(filePath);
    } catch (e) {
      console.warn('[Materials API] Failed to delete file:', e);
      // 文件不存在也继续删除数据库记录
    }

    // 删除数据库记录
    await prisma.material.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '素材已删除',
    });
  } catch (error) {
    console.error('[Materials API] DELETE error:', error);
    return NextResponse.json(
      { error: '删除素材失败' },
      { status: 500 }
    );
  }
}

// GET /api/materials/[id] - 获取单个素材详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const material = await prisma.material.findUnique({
      where: { id },
    });

    if (!material) {
      return NextResponse.json(
        { error: '素材不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ material });
  } catch (error) {
    console.error('[Materials API] GET error:', error);
    return NextResponse.json(
      { error: '获取素材详情失败' },
      { status: 500 }
    );
  }
}
