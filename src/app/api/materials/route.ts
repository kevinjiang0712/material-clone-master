import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

// GET /api/materials - 获取素材列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'product';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        where: { type },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.material.count({ where: { type } }),
    ]);

    return NextResponse.json({
      materials,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Materials API] GET error:', error);
    return NextResponse.json(
      { error: '获取素材列表失败' },
      { status: 500 }
    );
  }
}

// POST /api/materials - 上传素材
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = (formData.get('type') as string) || 'product';
    const name = formData.get('name') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: '请选择要上传的文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '仅支持 JPG、PNG、WebP 格式的图片' },
        { status: 400 }
      );
    }

    // 创建上传目录
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'material');
    await mkdir(uploadDir, { recursive: true });

    // 生成文件名
    const fileId = uuidv4();
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${fileId}.${extension}`;
    const filePath = path.join(uploadDir, fileName);

    // 保存文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 获取图片尺寸
    let width: number | undefined;
    let height: number | undefined;
    try {
      const metadata = await sharp(buffer).metadata();
      width = metadata.width;
      height = metadata.height;
    } catch (e) {
      console.warn('[Materials API] Failed to get image dimensions:', e);
    }

    // 保存到数据库
    const material = await prisma.material.create({
      data: {
        name: name || null,
        path: `/uploads/material/${fileName}`,
        type,
        source: 'upload',
        fileSize: buffer.length,
        width,
        height,
      },
    });

    return NextResponse.json({
      success: true,
      material,
    });
  } catch (error) {
    console.error('[Materials API] POST error:', error);
    return NextResponse.json(
      { error: '上传素材失败' },
      { status: 500 }
    );
  }
}
