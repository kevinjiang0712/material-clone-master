import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { existsSync } from 'fs';
import { MODEL_INPUT_RESOLUTION, DEFAULT_INPUT_RESOLUTION, BRAND_WATERMARK_CONFIG } from '@/lib/constants';

const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads');

/**
 * 确保目录存在
 */
async function ensureDir(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

/**
 * 处理并保存上传的图片
 *
 * @param buffer - 图片二进制数据
 * @param type - 图片类型（competitor 或 product）
 * @returns 保存后的相对路径
 */
export async function processAndSaveImage(
  buffer: Buffer,
  type: 'competitor' | 'product'
): Promise<string> {
  const targetDir = join(UPLOADS_DIR, type);
  await ensureDir(targetDir);

  // 处理图片：仅压缩质量，保留原始尺寸（生成时按模型动态缩放）
  const processedBuffer = await sharp(buffer)
    .jpeg({ quality: 90 })
    .toBuffer();

  const filename = `${uuidv4()}.jpg`;
  const filepath = join(targetDir, filename);
  await writeFile(filepath, processedBuffer);

  return `/uploads/${type}/${filename}`;
}

/**
 * 从文件路径读取图片并转换为 base64
 * 使用 sharp 统一转换为 JPEG 格式，确保 API 兼容性（如即梦不支持 WebP）
 *
 * @param imagePath - 相对于 public 目录的图片路径
 * @returns base64 编码的图片数据（JPEG 格式）
 */
export async function getImageBase64(imagePath: string): Promise<string> {
  const fullPath = join(process.cwd(), 'public', imagePath);
  const buffer = await readFile(fullPath);

  // 统一转换为 JPEG 格式，确保 API 兼容性
  const jpegBuffer = await sharp(buffer)
    .jpeg({ quality: 90 })
    .toBuffer();

  return jpegBuffer.toString('base64');
}

/**
 * 从 URL 下载图片并保存到结果目录
 *
 * @param imageUrl - 图片 URL
 * @param taskId - 任务 ID，用于命名文件
 * @param withWatermark - 是否添加品牌水印，默认 true
 * @returns 保存后的相对路径
 */
export async function saveImageFromUrl(
  imageUrl: string,
  taskId: string,
  withWatermark: boolean = true
): Promise<string> {
  const targetDir = join(UPLOADS_DIR, 'result');
  await ensureDir(targetDir);

  let buffer: Buffer;

  // 检查是否是本地路径
  if (imageUrl.startsWith('/uploads/')) {
    // 本地文件，直接读取
    const fullPath = join(process.cwd(), 'public', imageUrl);
    buffer = await readFile(fullPath);
  } else {
    // 远程 URL，下载
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  }

  // 添加品牌水印（如果启用）
  let processedBuffer: Buffer;
  if (withWatermark) {
    processedBuffer = await addBrandWatermark(buffer);
  } else {
    processedBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
  }

  const filename = `${taskId}.jpg`;
  const filepath = join(targetDir, filename);
  await writeFile(filepath, processedBuffer);

  return `/uploads/result/${filename}`;
}

/**
 * 从 base64 保存图片
 *
 * @param base64Data - base64 编码的图片数据
 * @param taskId - 任务 ID
 * @param withWatermark - 是否添加品牌水印，默认 true
 * @returns 保存后的相对路径
 */
export async function saveImageFromBase64(
  base64Data: string,
  taskId: string,
  withWatermark: boolean = true
): Promise<string> {
  const targetDir = join(UPLOADS_DIR, 'result');
  await ensureDir(targetDir);

  const buffer = Buffer.from(base64Data, 'base64');

  // 添加品牌水印（如果启用）
  let processedBuffer: Buffer;
  if (withWatermark) {
    processedBuffer = await addBrandWatermark(buffer);
  } else {
    processedBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
  }

  const filename = `${taskId}.jpg`;
  const filepath = join(targetDir, filename);
  await writeFile(filepath, processedBuffer);

  return `/uploads/result/${filename}`;
}

/**
 * 获取图片尺寸
 */
export async function getImageDimensions(
  imagePath: string
): Promise<{ width: number; height: number }> {
  const fullPath = join(process.cwd(), 'public', imagePath);
  const metadata = await sharp(fullPath).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
}

/**
 * 根据模型配置动态缩放图片并返回 base64
 *
 * @param imagePath - 相对于 public 目录的图片路径
 * @param modelId - 模型 ID，用于获取最优分辨率配置
 * @returns base64 编码的缩放后图片
 */
export async function getImageBase64ForModel(
  imagePath: string,
  modelId: string
): Promise<string> {
  const fullPath = join(process.cwd(), 'public', imagePath);
  const config = MODEL_INPUT_RESOLUTION[modelId] || DEFAULT_INPUT_RESOLUTION;
  const { width: maxWidth, height: maxHeight, align } = config;

  // 获取原图尺寸
  const metadata = await sharp(fullPath).metadata();
  const origWidth = metadata.width || maxWidth;
  const origHeight = metadata.height || maxHeight;

  let targetWidth = Math.min(origWidth, maxWidth);
  let targetHeight = Math.min(origHeight, maxHeight);

  // 保持宽高比
  const aspectRatio = origWidth / origHeight;
  if (targetWidth / targetHeight > aspectRatio) {
    targetWidth = Math.round(targetHeight * aspectRatio);
  } else {
    targetHeight = Math.round(targetWidth / aspectRatio);
  }

  // 如果需要对齐（如 Flux 要求 16 的倍数）
  if (align) {
    targetWidth = Math.floor(targetWidth / align) * align;
    targetHeight = Math.floor(targetHeight / align) * align;
    // 确保最小尺寸
    targetWidth = Math.max(targetWidth, align);
    targetHeight = Math.max(targetHeight, align);
  }

  console.log(`[ImageProcessor] Resizing for model ${modelId}: ${origWidth}x${origHeight} -> ${targetWidth}x${targetHeight}`);

  const buffer = await sharp(fullPath)
    .resize(targetWidth, targetHeight, {
      fit: 'fill',
    })
    .jpeg({ quality: 90 })
    .toBuffer();

  return buffer.toString('base64');
}

/**
 * 为图片添加品牌水印
 * 左下角：Logo + 品牌名称
 * 右下角：SLOGAN
 *
 * @param buffer - 原始图片 Buffer
 * @returns 添加水印后的图片 Buffer
 */
export async function addBrandWatermark(buffer: Buffer): Promise<Buffer> {
  const config = BRAND_WATERMARK_CONFIG;
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width || 2048;
  const height = metadata.height || 2048;

  // 动态计算尺寸（基于图片宽度，以 2048px 为基准）
  const scale = width / 2048;
  const fontSize = Math.round(config.style.fontSize * scale);
  const padding = Math.round(config.style.padding * scale);
  const logoSize = Math.round(config.style.logoSize * scale);
  const logoGap = Math.round(config.style.logoGap * scale);

  const composites: sharp.OverlayOptions[] = [];

  // 1. 尝试加载并缩放 Logo
  const logoPath = join(process.cwd(), 'public', config.logoPath);
  let hasLogo = false;
  if (existsSync(logoPath)) {
    try {
      const logoBuffer = await sharp(logoPath)
        .resize({ height: logoSize })
        .toBuffer();
      composites.push({
        input: logoBuffer,
        left: padding,
        top: height - padding - logoSize,
      });
      hasLogo = true;
    } catch (err) {
      console.warn('[ImageProcessor] Failed to load logo:', err);
    }
  }

  // 2. 生成文字 SVG（品牌名在左下角 Logo 右侧，SLOGAN 在右下角）
  const textY = height - padding - fontSize / 2;
  const brandX = hasLogo ? padding + logoSize + logoGap : padding;
  const sloganX = width - padding;

  const textSvg = `
    <svg width="${width}" height="${height}">
      <style>
        .text {
          font-family: ${config.style.fontFamily};
          font-size: ${fontSize}px;
          font-weight: bold;
          fill: ${config.style.color};
        }
      </style>
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="${config.style.shadowBlur}" flood-color="${config.style.shadowColor}"/>
        </filter>
      </defs>
      <text x="${brandX}" y="${textY}" text-anchor="start" class="text" filter="url(#shadow)">${config.brandName}</text>
      <text x="${sloganX}" y="${textY}" text-anchor="end" class="text" filter="url(#shadow)">${config.slogan}</text>
    </svg>
  `;

  composites.push({ input: Buffer.from(textSvg), top: 0, left: 0 });

  return sharp(buffer)
    .composite(composites)
    .jpeg({ quality: 90 })
    .toBuffer();
}
