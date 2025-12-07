/**
 * 即梦 (Doubao Seedream) 图像生成服务
 *
 * 使用火山引擎 Ark API 进行图像生成
 */

import { JIMEN_MODEL_COSTS, JIMEN_DEFAULT_COST_PER_IMAGE, JIMEN_RESOLUTION_OPTIONS, DEFAULT_JIMEN_RESOLUTION } from '@/lib/constants';
import { fetchWithRetry } from '@/lib/fetchWithTimeout';
import { ImageSceneType } from '@/types';

// 获取配置
const JIMEN_API_KEY = process.env.JIMEN_API_KEY;
const JIMEN_MODEL = process.env.JIMEN_MODEL || 'doubao-seedream-4-0-250828';
const JIMEN_API_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';

// 导出模型名称供外部使用
export function getJimenModel(): string {
  return JIMEN_MODEL;
}

interface JimenImageGenerateOptions {
  sourceImageBase64: string;
  styleImageBase64?: string;  // 风格参考图（模板图或竞品图）
  prompt: string;
  resolutionId?: string;  // "1k" | "2k" | "4k"
  modelId?: string;  // 指定模型ID，如 "doubao-seedream-4-5-251128"
  sceneType?: ImageSceneType;  // 场景类型
  sceneDescription?: string;  // 场景描述
}

interface JimenImageGenerationResponse {
  imageUrl: string;
  imageBase64?: string;
  generationId?: string;
  cost?: number;  // 本次调用成本（元）
}

/**
 * 即梦 API 响应结构
 */
interface JimenApiResponse {
  created: number;
  data: Array<{
    url: string;
    index: number;
  }>;
  model: string;
  object: string;
}

/**
 * 使用即梦生成图像
 *
 * @param options - 生成选项
 * @returns 生成结果
 */

/**
 * 根据场景类型构建场景指令
 */
function buildSceneInstructions(sceneType: ImageSceneType, sceneDescription?: string): string {
  switch (sceneType) {
    case 'human_usage':
      return `【使用场景模式 - 人物使用】
生成一张展示产品使用方式的图片，画面中需要包含人物（可以是手部特写或半身人物）正在使用该产品。

【场景设计】
${sceneDescription || '展示人物正在自然使用产品的场景，体现产品的实用价值。'}

【场景元素要求】
- 可以添加人物的手部或半身，展示自然的使用姿势
- 人物动作要符合产品的实际使用方式
- 背景环境要与产品使用场景匹配
- 光影自然，氛围真实

【产品要求】
- 产品必须清晰可见、可识别
- 产品的颜色、材质、外观特征必须与原图一致
- 产品在画面中占据重要位置`;

    case 'pet_interaction':
      return `【使用场景模式 - 宠物互动】
生成一张展示宠物与产品互动的图片，画面中需要包含可爱的宠物正在使用或接触该产品。

【场景设计】
${sceneDescription || '展示宠物与产品的自然互动，体现产品对宠物的吸引力和实用性。'}

【场景元素要求】
- 必须添加可爱的宠物（猫/狗等，根据产品类型选择合适的宠物）
- 宠物的姿态自然生动，表情可爱
- 展示宠物与产品的真实互动方式（如：吃食物、躺在窝里、玩玩具）
- 宠物毛发质感真实，表情自然
- 背景温馨舒适

【产品要求】
- 产品必须清晰可见、可识别
- 产品的颜色、材质、外观特征必须与原图一致
- 产品与宠物的比例要合理真实`;

    case 'environment':
      return `【使用场景模式 - 环境展示】
生成一张展示产品在实际环境中摆放的图片，体现产品在空间中的效果。

【场景设计】
${sceneDescription || '将产品放置在合适的家居或办公环境中，展示产品的实际使用效果。'}

【场景元素要求】
- 设计一个与产品风格匹配的环境场景
- 环境布置要合理自然
- 光影效果营造舒适氛围
- 可以添加适当的装饰元素

【产品要求】
- 产品必须清晰可见、可识别
- 产品的颜色、材质、外观特征必须与原图一致
- 产品在环境中的摆放位置和角度要自然`;

    case 'product_display':
    default:
      return `【产品展示模式】
生成一张专业的电商产品展示图，重点突出产品本身。

【场景设计】
${sceneDescription || '简洁专业的产品展示，背景干净，突出产品特征。'}

【产品要求 - 绝对约束】
1. 产品的形状、比例、轮廓必须与原图完全一致，不得拉伸、压缩或变形
2. 产品的所有颜色必须精确保留，包括透明部分、渐变色、图案花纹
3. 产品的材质质感必须保持，透明的保持透明，哑光的保持哑光
4. 产品的所有细节（Logo、图案、纹理、配件）必须完整保留
5. 产品的拍摄角度和朝向必须与原图一致`;
  }
}

/**
 * 构建图像生成 Prompt
 * 根据场景类型选择不同的提示词模板
 */
function buildDualImagePrompt(
  originalPrompt: string,
  hasStyleRef: boolean,
  sceneType?: ImageSceneType,
  sceneDescription?: string
): string {
  // 默认为产品展示模式
  const actualSceneType = sceneType || 'product_display';
  const isUsageScene = actualSceneType !== 'product_display';

  console.log(`[JimenGenerator] Building prompt for scene type: ${actualSceneType}, hasStyleRef: ${hasStyleRef}`);

  // 使用场景模式（human_usage, pet_interaction, environment）
  if (isUsageScene) {
    const sceneInstructions = buildSceneInstructions(actualSceneType, sceneDescription);

    if (!hasStyleRef) {
      // 单图 + 使用场景模式
      return `【核心任务】生成产品使用场景图，展示产品的实际使用方式。

${sceneInstructions}

【附加信息】
${originalPrompt}

【输出要求】
生成一张真实自然的产品使用场景图，让消费者直观了解产品的使用方式和价值。`;
    }

    // 双图 + 使用场景模式
    return `【核心任务】生成产品使用场景图，产品来自图1，风格参考图2。

【图1 - 产品实拍图】
产品的外观特征（颜色、材质、形状）必须与图1保持一致。

【图2 - 风格参考】
参考图2的背景风格、光影效果和整体氛围。

${sceneInstructions}

【严格禁止】
- 禁止复制图2中的任何文字、品牌名称、Logo

【附加信息】
${originalPrompt}

【输出要求】
生成一张展示产品使用场景的图片，结合图2的风格氛围。`;
  }

  // 产品展示模式（默认，保持原有逻辑）
  if (!hasStyleRef) {
    // 单图模式：强调产品保真
    return `【核心任务】生成电商产品图，只改变背景和光影，产品本身必须100%保持原样。

【绝对约束 - 产品保真】
1. 产品的形状、比例、轮廓必须与原图完全一致，不得拉伸、压缩或变形
2. 产品的所有颜色必须精确保留，包括透明部分、渐变色、图案花纹
3. 产品的材质质感必须保持，透明的保持透明，哑光的保持哑光
4. 产品的所有细节（Logo、图案、纹理、配件）必须完整保留
5. 产品的拍摄角度和朝向必须与原图一致

【允许修改】
- 背景颜色和氛围
- 光影效果（但不能改变产品本身的颜色）
- 整体画面的亮度和对比度

${originalPrompt}

【输出要求】
生成一张专业电商产品图，产品必须与输入图片完全一致，仅优化背景和光影。`;
  }

  // 双图模式：明确图1和图2的角色
  return `【核心任务】生成电商产品图，产品来自图1，风格参考图2，产品必须100%保真。

【图1 - 产品实拍图】绝对约束，不可修改：
1. 产品的形状、比例、轮廓必须与图1完全一致，不得拉伸、压缩或变形
2. 产品的所有颜色必须精确保留，包括透明部分、渐变色、图案花纹
3. 产品的材质质感必须保持，透明的保持透明，哑光的保持哑光
4. 产品的所有细节（Logo、图案、纹理、配件）必须完整保留
5. 产品的拍摄角度和朝向必须与图1一致

【图2 - 风格参考】仅学习以下元素：
- 背景的颜色和氛围
- 光影的方向和柔和度
- 整体画面的调性

【严格禁止】
- 禁止修改产品的任何部分（形状、颜色、材质、细节）
- 禁止复制图2中的任何文字、品牌名称、Logo
- 禁止改变产品的透明度或材质属性

【附加信息】
${originalPrompt}

【输出要求】
将图1的产品放入图2风格的背景中，产品必须与图1完全一致，生成专业电商产品图。`;
}

export async function generateImage(
  options: JimenImageGenerateOptions
): Promise<JimenImageGenerationResponse> {
  const {
    sourceImageBase64,
    styleImageBase64,
    prompt,
    resolutionId = DEFAULT_JIMEN_RESOLUTION,
    modelId,
    sceneType,
    sceneDescription
  } = options;

  // 使用传入的模型ID，或者环境变量配置，或者默认值
  const actualModel = modelId || JIMEN_MODEL;

  // 根据 resolutionId 获取实际分辨率
  const resolution = JIMEN_RESOLUTION_OPTIONS.find(r => r.id === resolutionId)
    || JIMEN_RESOLUTION_OPTIONS.find(r => r.id === DEFAULT_JIMEN_RESOLUTION)!;
  const size = resolution.size;

  // 是否为双图模式
  const hasDualImage = !!styleImageBase64;

  console.log(`\n[JimenGenerator] ==================== START ====================`);
  console.log(`[JimenGenerator] Model: ${actualModel}`);
  console.log(`[JimenGenerator] Mode: ${hasDualImage ? '双图模式（产品图+风格参考图）' : '单图模式'}`);
  console.log(`[JimenGenerator] Scene type: ${sceneType || 'product_display (default)'}`);
  console.log(`[JimenGenerator] Resolution: ${resolution.name} (${size}x${size})`);
  console.log(`[JimenGenerator] Product image base64 length: ${sourceImageBase64.length}`);
  if (styleImageBase64) {
    console.log(`[JimenGenerator] Style image base64 length: ${styleImageBase64.length}`);
  }
  if (sceneDescription) {
    console.log(`[JimenGenerator] Scene description: ${sceneDescription.substring(0, 100)}...`);
  }
  console.log(`[JimenGenerator] Prompt preview: ${prompt.substring(0, 200)}...`);

  if (!JIMEN_API_KEY) {
    throw new Error('即梦 API Key 未配置 (JIMEN_API_KEY)');
  }

  try {
    // 构建图片数组：图1是产品图，图2是风格参考图（如果有）
    const images = [`data:image/jpeg;base64,${sourceImageBase64}`];
    if (styleImageBase64) {
      images.push(`data:image/jpeg;base64,${styleImageBase64}`);
    }

    // 构建请求体 - 支持双图输入
    const requestBody = {
      model: actualModel,
      prompt: buildDualImagePrompt(prompt, hasDualImage, sceneType, sceneDescription),
      size: `${size}x${size}`,
      image: images,
      watermark: false,  // 关闭水印
    };

    console.log(`[JimenGenerator] Request body (without image):`, JSON.stringify({
      model: requestBody.model,
      prompt: requestBody.prompt.substring(0, 100) + '...',
      size: requestBody.size,
      image: images.map((_, i) => `[IMAGE_${i + 1}_BASE64]`),
    }, null, 2));

    const response = await fetchWithRetry(JIMEN_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JIMEN_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`[JimenGenerator] Response status: ${response.status} ${response.statusText}`);

    const responseText = await response.text();
    console.log(`[JimenGenerator] Raw response length: ${responseText.length}`);

    if (!response.ok) {
      console.error(`[JimenGenerator] API Error:`, responseText);
      throw new Error(`即梦 API 请求失败: ${response.status} ${response.statusText} - ${responseText}`);
    }

    // 解析 JSON
    let data: JimenApiResponse;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('[JimenGenerator] Failed to parse JSON:', e);
      throw new Error(`Failed to parse response as JSON: ${responseText.substring(0, 500)}`);
    }

    console.log(`[JimenGenerator] Parsed response:`, JSON.stringify(data, null, 2));

    // 提取图像 URL
    if (data.data && data.data.length > 0 && data.data[0].url) {
      const imageUrl = data.data[0].url;
      // 根据模型获取对应价格
      const modelCost = JIMEN_MODEL_COSTS[actualModel] || JIMEN_DEFAULT_COST_PER_IMAGE;
      console.log(`[JimenGenerator] Successfully got image URL:`, imageUrl.substring(0, 100) + '...');
      console.log(`[JimenGenerator] Cost: ${modelCost} 元 (model: ${actualModel})`);
      console.log(`[JimenGenerator] ==================== END ====================\n`);

      return {
        imageUrl,
        generationId: `jimen-${data.created}`,
        cost: modelCost,
      };
    }

    console.log(`[JimenGenerator] ==================== END ====================\n`);
    throw new Error(`Could not extract image from response. Response: ${JSON.stringify(data)}`);

  } catch (error) {
    console.error(`[JimenGenerator] ========== ERROR ==========`);
    console.error(`[JimenGenerator] Error:`, error);
    console.error(`[JimenGenerator] ==================== END ====================\n`);
    throw new Error(
      `即梦图像生成失败: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * 检查即梦 API 是否已配置
 */
export function isJimenConfigured(): boolean {
  return Boolean(JIMEN_API_KEY && JIMEN_API_KEY !== 'your-jimen-api-key');
}
