import { NextRequest, NextResponse } from 'next/server';
import { processAndSaveImage } from '@/services/imageProcessor';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as 'competitor' | 'product' | null;

    // 验证参数
    if (!file) {
      return NextResponse.json(
        { error: '请选择要上传的图片' },
        { status: 400 }
      );
    }

    if (!type || !['competitor', 'product'].includes(type)) {
      return NextResponse.json(
        { error: '无效的图片类型' },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的图片格式，仅支持 JPG、PNG、WebP' },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: '图片大小不能超过 10MB' },
        { status: 400 }
      );
    }

    // 处理并保存图片
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const path = await processAndSaveImage(buffer, type);

    return NextResponse.json({ path });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: '上传失败，请重试' },
      { status: 500 }
    );
  }
}
