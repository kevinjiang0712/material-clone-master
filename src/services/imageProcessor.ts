import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { existsSync } from 'fs';
import { MODEL_INPUT_RESOLUTION, DEFAULT_INPUT_RESOLUTION } from '@/lib/constants';

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
 *
 * @param imagePath - 相对于 public 目录的图片路径
 * @returns base64 编码的图片数据
 */
export async function getImageBase64(imagePath: string): Promise<string> {
  const fullPath = join(process.cwd(), 'public', imagePath);
  const buffer = await readFile(fullPath);
  return buffer.toString('base64');
}

/**
 * 从 URL 下载图片并保存到结果目录
 *
 * @param imageUrl - 图片 URL
 * @param taskId - 任务 ID，用于命名文件
 * @returns 保存后的相对路径
 */
export async function saveImageFromUrl(
  imageUrl: string,
  taskId: string
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

  // 处理并保存
  const processedBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();

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
 * @returns 保存后的相对路径
 */
export async function saveImageFromBase64(
  base64Data: string,
  taskId: string
): Promise<string> {
  const targetDir = join(UPLOADS_DIR, 'result');
  await ensureDir(targetDir);

  const buffer = Buffer.from(base64Data, 'base64');
  const processedBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();

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
