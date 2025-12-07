import OpenAI from 'openai';
import { LayoutAnalysis, StyleAnalysis, ContentAnalysis, CompetitorAnalysis, CompetitorInfo, ProductInfo, ImageSceneType, PromptSynthesisResult, PromptInputData } from '@/types';
import { API_TIMEOUT, API_RETRIES, RETRY_DELAY } from '@/lib/constants';

// 带 generationId 的响应类型
export interface AnalysisResponse<T> {
  data: T;
  generationId: string;
  inputData?: PromptInputData;  // AI 输入数据（用于调试）
}

// 创建 OpenRouter 客户端
const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  timeout: API_TIMEOUT,
  defaultHeaders: {
    'HTTP-Referer': process.env.OPENROUTER_SITE_URL,
    'X-Title': process.env.OPENROUTER_SITE_NAME,
  },
});

/**
 * 带重试的 API 调用封装
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  context: string
): Promise<T> {
  let lastError: Error | null = null;
  const maxAttempts = API_RETRIES + 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      lastError = new Error(`${errorMessage} (attempt ${attempt}/${maxAttempts})`);

      if (attempt >= maxAttempts) {
        console.error(`[OpenRouter] ${context}: All ${maxAttempts} attempts failed`);
        throw lastError;
      }

      console.log(`[OpenRouter] ${context}: Attempt ${attempt}/${maxAttempts} failed: ${errorMessage}`);
      console.log(`[OpenRouter] ${context}: Retrying in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }

  throw lastError || new Error('Unknown error in withRetry');
}

// 获取配置的视觉模型
const VISION_MODEL = process.env.OPENROUTER_VISION_MODEL || 'google/gemini-flash-1.5-8b';

// 导出模型名称供外部使用
export function getVisionModel(): string {
  return VISION_MODEL;
}

const LAYOUT_ANALYSIS_PROMPT = `你现在负责分析"竞品商品图"的版式模板（layout_template）。

请从上传的竞品图中提取以下结构化信息：

1. main_object（主体构图）
  - position: 主体位置 (left / center / right)
  - horizontal_offset: 水平偏移描述
  - vertical_offset: 垂直偏移描述
  - size: 主体大小描述（宽度占比、高度占比）
  - view_angle: 主体视角（俯拍/平拍/仰拍）
  - rotation: 主体旋转角度描述
  - edge_crop: 是否裁切边缘 (true/false)

2. background_structure（背景结构）
  - type: 背景类型（纯色 / 渐变 / 场景虚化 / 几何背景）
  - layers: 图层描述数组
  - decorations: 装饰元素描述数组

3. text_blocks（所有文字的布局）
对每一段文案提取：
  - type: 类型（标题/副标题/标签/角标/卖点）
  - position: 文案区域位置描述
  - alignment: 文案对齐方式
  - has_mask: 是否使用背景遮罩 (true/false)

4. decors（装饰元素）
  - light_effects: 光效类型数组
  - shadows: 阴影类型数组
  - shapes: 几何图形数组

5. layer_sequence（图层顺序）
示例：["background", "decors", "product", "text"]

请严格按以下 JSON 格式输出，不要添加任何额外说明：
{
  "main_object": {...},
  "background_structure": {...},
  "text_blocks": [...],
  "decors": {...},
  "layer_sequence": [...]
}`;

// 构建带 OCR 结果的竞品分析 Prompt
function buildCompetitorAnalysisPrompt(ocrTexts?: string[]): string {
  // OCR 辅助信息部分
  let ocrSection = '';
  if (ocrTexts && ocrTexts.length > 0) {
    const ocrList = ocrTexts.map((text, idx) => `${idx + 1}. "${text}"`).join('\n');
    ocrSection = `## 辅助信息：OCR 识别的文字（已通过专业 OCR 引擎提取）
以下是从图片中识别出的所有文字，这些文字内容是准确的，请直接使用这些文字进行文案分析：
---
${ocrList}
---

`;
  }

  // 在提示词开头插入 OCR 信息
  return ocrSection + COMPETITOR_ANALYSIS_PROMPT_BASE;
}

// 合并版式+风格分析的 Prompt（基础模板，不含 OCR）
const COMPETITOR_ANALYSIS_PROMPT_BASE = `你现在负责分析"竞品商品图"的版式模板和视觉风格。

请从上传的竞品图中提取以下结构化信息：

## 第一部分：版式模板（layout）

1. main_object（主体构图）
  - position: 主体位置 (left / center / right)
  - horizontal_offset: 水平偏移描述
  - vertical_offset: 垂直偏移描述
  - size: 主体大小描述（宽度占比、高度占比）
  - view_angle: 主体视角（俯拍/平拍/仰拍）
  - rotation: 主体旋转角度描述
  - edge_crop: 是否裁切边缘 (true/false)

2. background_structure（背景结构）
  - type: 背景类型（纯色 / 渐变 / 场景虚化 / 几何背景）
  - layers: 图层描述数组
  - decorations: 装饰元素描述数组

3. text_blocks（所有文字的布局）
对每一段文案提取：
  - type: 类型（标题/副标题/标签/角标/卖点）
  - position: 文案区域位置描述
  - alignment: 文案对齐方式
  - has_mask: 是否使用背景遮罩 (true/false)

4. decors（装饰元素）
  - light_effects: 光效类型数组
  - shadows: 阴影类型数组
  - shapes: 几何图形数组

5. layer_sequence（图层顺序）
示例：["background", "decors", "product", "text"]

## 第二部分：风格信息（style）

1. color_style
  - primary_color: 主色调（HEX 或色名）
  - secondary_colors: 辅色调数组
  - saturation: 色彩饱和度描述
  - brightness: 亮度描述

2. lighting
  - direction: 光源方向
  - type: 光线类型（柔光/硬光）
  - shadow_intensity: 阴影强度描述
  - shadow_blur: 阴影模糊度描述

3. texture
  - surface: 表面质感（哑光/亮面/奶油风/科技光泽）
  - grain: 颗粒感描述
  - reflection: 反光亮度描述

4. background_style
  - gradient_direction: 渐变方向
  - blur_level: 模糊程度
  - floating_effects: 是否有漂浮光效、光斑 (true/false)

5. vibe: 情绪关键词（清新 / 高级 / 科技 / 活力 / 日系 / 韩系 等）

6. style_prompt: 根据以上风格自动生成的描述性 prompt（英文）

## 第三部分：文案与卖点（copywriting）

重要：如果上方提供了"OCR 识别的文字"，请直接使用那些文字内容进行分析，不要自己重新识别。

1. text_content（文案内容）
基于 OCR 提供的文字（或图片中可见的文字），逐条分析每段文案：
  - text: 文字内容（直接使用 OCR 结果，保持原样）
  - type: 文字类型（主标题 / 副标题 / 卖点文案 / 标签 / 价格 / 促销信息）
  - emphasis: 强调程度（高 / 中 / 低）

2. selling_points（卖点分析）
基于文案内容，深入分析商品的卖点策略：
  - main_selling_point: 核心卖点（一句话总结这张图想传达的主要卖点信息）
  - points: 卖点列表数组，每个包含：
    - point: 卖点描述
    - category: 卖点类型（功能 / 情感 / 价格 / 品质 / 场景）
  - target_audience: 目标用户画像（这张图想吸引什么样的人群）
  - emotional_appeal: 情感诉求（解决什么痛点或满足什么需求）

请严格按以下 JSON 格式输出，不要添加任何额外说明：
{
  "layout": {
    "main_object": {...},
    "background_structure": {...},
    "text_blocks": [...],
    "decors": {...},
    "layer_sequence": [...]
  },
  "style": {
    "color_style": {...},
    "lighting": {...},
    "texture": {...},
    "background_style": {...},
    "vibe": "...",
    "style_prompt": "..."
  },
  "copywriting": {
    "text_content": [
      { "text": "...", "type": "...", "emphasis": "..." }
    ],
    "selling_points": {
      "main_selling_point": "...",
      "points": [
        { "point": "...", "category": "..." }
      ],
      "target_audience": "...",
      "emotional_appeal": "..."
    }
  }
}`;

const STYLE_ANALYSIS_PROMPT = `你现在负责分析"竞品商品图"的风格信息（style_profile）。

请从上传的竞品图提取以下视觉风格信息：

1. color_style
  - primary_color: 主色调（HEX 或色名）
  - secondary_colors: 辅色调数组
  - saturation: 色彩饱和度描述
  - brightness: 亮度描述

2. lighting
  - direction: 光源方向
  - type: 光线类型（柔光/硬光）
  - shadow_intensity: 阴影强度描述
  - shadow_blur: 阴影模糊度描述

3. texture
  - surface: 表面质感（哑光/亮面/奶油风/科技光泽）
  - grain: 颗粒感描述
  - reflection: 反光亮度描述

4. background_style
  - gradient_direction: 渐变方向
  - blur_level: 模糊程度
  - floating_effects: 是否有漂浮光效、光斑 (true/false)

5. vibe: 情绪关键词（清新 / 高级 / 科技 / 活力 / 日系 / 韩系 等）

6. style_prompt: 根据以上风格自动生成的描述性 prompt（英文）

请严格按以下 JSON 格式输出，不要添加任何额外说明：
{
  "color_style": {...},
  "lighting": {...},
  "texture": {...},
  "background_style": {...},
  "vibe": "...",
  "style_prompt": "..."
}`;

const CONTENT_ANALYSIS_PROMPT = `你现在负责解析用户上传的"商品实拍图"。

目标：提取实拍图中商品的结构化信息，用于后续的排版模板填充与图生图渲染。

请提取以下内容：

1. product_shape（形状）
  - category: 分类（矩形 / 圆柱体 / 扁平袋 / 瓶子 / 盒子 / 非规则形）
  - proportions: 长宽高的相对比例描述
  - outline_features: 轮廓线特征（圆角、直角、是否带突起）

2. product_orientation（朝向/视角）
  - view_angle: 视角（俯拍 / 平拍 / 仰拍 / 45°角）
  - facing: 产品朝向（正面 / 左侧45° / 右侧45° / 侧面）
  - tilt: 是否倾斜 (true/false)

3. product_regions（可被裁剪/可重用区域）
  - main_bounding_box: 主体位置描述
  - key_regions: 关键结构区域数组（如瓶身/盖子/标签/透明区域）

4. product_surface（材质）
  - material: 材质类型（哑光 / 亮面 / 金属 / 玻璃 / 织物 / 塑料）
  - glossiness: 光泽度描述

5. product_texture（纹理）
  - smoothness: 平滑度描述
  - pattern_direction: 纹路方向
  - transparency: 透明度描述

6. color_profile（基础色彩）
  - primary_color: 主色
  - secondary_color: 辅色
  - brightness: 明度
  - saturation: 饱和度

7. defects（瑕疵）
  - 是否存在：反光过强、噪点、阴影、遮挡、背景脏污等（数组）

请严格按以下 JSON 格式输出，不要添加任何额外说明：
{
  "product_shape": {...},
  "product_orientation": {...},
  "product_regions": {...},
  "product_surface": {...},
  "product_texture": {...},
  "color_profile": {...},
  "defects": [...]
}`;

function parseJsonResponse(content: string): unknown {
  console.log('[OpenRouter] Raw response content:', content.substring(0, 500) + '...');

  // 移除可能的 markdown 代码块标记
  const cleaned = content
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  console.log('[OpenRouter] Cleaned content:', cleaned.substring(0, 500) + '...');

  try {
    const parsed = JSON.parse(cleaned);
    console.log('[OpenRouter] Parsed JSON keys:', Object.keys(parsed));
    return parsed;
  } catch (error) {
    console.error('[OpenRouter] JSON parse error:', error);
    console.error('[OpenRouter] Failed content:', cleaned);
    throw error;
  }
}

export async function analyzeLayout(imageBase64: string): Promise<LayoutAnalysis> {
  console.log('[OpenRouter] Calling analyzeLayout with model:', VISION_MODEL);
  console.log('[OpenRouter] Image base64 length:', imageBase64.length);

  try {
    const response = await openrouter.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: LAYOUT_ANALYSIS_PROMPT },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    console.log('[OpenRouter] analyzeLayout response status:', response.choices[0].finish_reason);
    const content = response.choices[0].message.content || '{}';
    console.log('[OpenRouter] analyzeLayout content length:', content.length);

    const result = parseJsonResponse(content) as LayoutAnalysis;
    console.log('[OpenRouter] analyzeLayout completed successfully');
    return result;
  } catch (error) {
    console.error('[OpenRouter] analyzeLayout error:', error);
    throw error;
  }
}

export async function analyzeStyle(imageBase64: string): Promise<StyleAnalysis> {
  console.log('[OpenRouter] Calling analyzeStyle with model:', VISION_MODEL);

  try {
    const response = await openrouter.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: STYLE_ANALYSIS_PROMPT },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    console.log('[OpenRouter] analyzeStyle response status:', response.choices[0].finish_reason);
    const content = response.choices[0].message.content || '{}';
    console.log('[OpenRouter] analyzeStyle content length:', content.length);

    const result = parseJsonResponse(content) as StyleAnalysis;
    console.log('[OpenRouter] analyzeStyle completed successfully');
    return result;
  } catch (error) {
    console.error('[OpenRouter] analyzeStyle error:', error);
    throw error;
  }
}

export async function analyzeContent(imageBase64: string): Promise<AnalysisResponse<ContentAnalysis>> {
  console.log('[OpenRouter] Calling analyzeContent with model:', VISION_MODEL);

  return withRetry(async () => {
    const response = await openrouter.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: CONTENT_ANALYSIS_PROMPT },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    console.log('[OpenRouter] analyzeContent response status:', response.choices[0].finish_reason);
    const content = response.choices[0].message.content || '{}';
    console.log('[OpenRouter] analyzeContent content length:', content.length);

    const result = parseJsonResponse(content) as ContentAnalysis;
    const generationId = response.id || '';
    console.log('[OpenRouter] analyzeContent result keys:', Object.keys(result));
    console.log('[OpenRouter] analyzeContent generationId:', generationId);
    console.log('[OpenRouter] analyzeContent completed successfully');
    return { data: result, generationId };
  }, 'analyzeContent');
}

// 合并分析竞品图（版式+风格），支持 OCR 文字辅助
export async function analyzeCompetitor(imageBase64: string, ocrTexts?: string[]): Promise<AnalysisResponse<CompetitorAnalysis>> {
  console.log('[OpenRouter] Calling analyzeCompetitor with model:', VISION_MODEL);
  console.log('[OpenRouter] Image base64 length:', imageBase64.length);
  console.log('[OpenRouter] OCR texts count:', ocrTexts?.length || 0);

  // 构建带 OCR 结果的提示词
  const prompt = buildCompetitorAnalysisPrompt(ocrTexts);
  console.log('[OpenRouter] Prompt length:', prompt.length);

  return withRetry(async () => {
    const response = await openrouter.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
          ],
        },
      ],
      max_tokens: 6000,
    });

    console.log('[OpenRouter] analyzeCompetitor response status:', response.choices[0].finish_reason);
    const content = response.choices[0].message.content || '{}';
    console.log('[OpenRouter] analyzeCompetitor content length:', content.length);

    const result = parseJsonResponse(content) as CompetitorAnalysis;
    const generationId = response.id || '';
    console.log('[OpenRouter] analyzeCompetitor generationId:', generationId);
    console.log('[OpenRouter] analyzeCompetitor completed successfully');
    return { data: result, generationId };
  }, 'analyzeCompetitor');
}

// 从 CompetitorAnalysis 中提取 copywriting 信息的接口
interface CopywritingInfo {
  selling_points?: {
    main_selling_point?: string;
    points?: Array<{ point: string; category: string }>;
    target_audience?: string;
    emotional_appeal?: string;
  };
}

export function synthesizePrompt(
  layout: LayoutAnalysis,
  style: StyleAnalysis,
  content: ContentAnalysis,
  competitorInfo?: CompetitorInfo | null,
  productInfo?: ProductInfo | null,
  copywriting?: CopywritingInfo | null
): string {
  console.log('[OpenRouter] synthesizePrompt called');
  console.log('[OpenRouter] layout keys:', Object.keys(layout || {}));
  console.log('[OpenRouter] style keys:', Object.keys(style || {}));
  console.log('[OpenRouter] content keys:', Object.keys(content || {}));
  console.log('[OpenRouter] competitorInfo:', competitorInfo);
  console.log('[OpenRouter] productInfo:', productInfo);
  console.log('[OpenRouter] copywriting:', copywriting);

  // 防御性检查
  if (!layout?.main_object) {
    console.error('[OpenRouter] layout.main_object is undefined');
  }
  if (!style?.color_style) {
    console.error('[OpenRouter] style.color_style is undefined');
  }
  if (!content?.product_shape) {
    console.error('[OpenRouter] content.product_shape is undefined');
    console.error('[OpenRouter] content object:', JSON.stringify(content, null, 2));
  }

  // 1. 产品物理属性约束（必须保持不变）
  const productPhysicalConstraints = `=== PRODUCT PHYSICAL PROPERTIES (MUST PRESERVE) ===
The product's physical appearance must remain IDENTICAL:
- Shape: ${content?.product_shape?.category || 'original shape'} (${content?.product_shape?.proportions || 'original proportions'})
- Color: ${content?.color_profile?.primary_color || 'original color'}${content?.color_profile?.secondary_color ? ` with ${content.color_profile.secondary_color}` : ''}
- Material: ${content?.product_surface?.material || 'original material'} (${content?.product_surface?.glossiness || 'original finish'})
- Texture: ${content?.product_texture?.smoothness || 'original texture'}`;

  // 2. 竞品风格学习（自由发挥区域）
  const styleToLearn = `=== STYLE TO LEARN FROM COMPETITOR ===
Apply the competitor's visual excellence:
- Color atmosphere: ${style?.color_style?.primary_color || 'warm'} theme with ${style?.color_style?.saturation || 'moderate'} saturation
- Lighting style: ${style?.lighting?.type || 'soft'} ${style?.lighting?.direction || 'natural'} lighting
- Background approach: ${layout?.background_structure?.type || 'lifestyle'} style
- Visual mood: ${style?.vibe || 'professional and appealing'}
- Texture feel: ${style?.texture?.surface || 'premium'}`;

  // 3. 构图参考
  const compositionGuide = `=== COMPOSITION REFERENCE ===
- Product position: ${layout?.main_object?.position || 'center'}
- Camera angle: ${layout?.main_object?.view_angle || 'eye level'}
- Product size in frame: ${layout?.main_object?.size || 'prominent'}`;

  // 4. 卖点驱动的创意指导
  let sellingPointGuidance = '';
  const mainSellingPoint = copywriting?.selling_points?.main_selling_point || productInfo?.sellingPoints;
  const targetAudience = copywriting?.selling_points?.target_audience;
  const emotionalAppeal = copywriting?.selling_points?.emotional_appeal;

  if (mainSellingPoint || targetAudience || emotionalAppeal) {
    const guidanceParts: string[] = [];
    if (mainSellingPoint) {
      guidanceParts.push(`- Core message to convey: ${mainSellingPoint}`);
    }
    if (targetAudience) {
      guidanceParts.push(`- Target audience: ${targetAudience}`);
    }
    if (emotionalAppeal) {
      guidanceParts.push(`- Emotional connection: ${emotionalAppeal}`);
    }
    sellingPointGuidance = `\n=== SELLING POINT GUIDANCE ===
Design the scene to reinforce the product's value:
${guidanceParts.join('\n')}`;
  }

  // 5. 用户商品信息
  let productContext = '';
  if (productInfo?.productName) {
    const contextParts: string[] = [];
    contextParts.push(`- Product: ${productInfo.productName}`);
    if (productInfo.productCategory) {
      contextParts.push(`- Category: ${productInfo.productCategory}`);
    }
    if (productInfo.brandTone?.length) {
      contextParts.push(`- Brand tone: ${productInfo.brandTone.join(', ')}`);
    }
    productContext = `\n=== PRODUCT CONTEXT ===
${contextParts.join('\n')}`;
  }

  // 6. 创意自由区域（AI可发挥）
  const creativeLiberty = `=== CREATIVE FREEDOM (AI CAN DECIDE) ===
You have creative freedom in these areas to make the image more appealing:

1. BACKGROUND & SCENE:
   - Design an attractive background that matches the competitor's style
   - Can add lifestyle elements, props, or contextual scenes
   - For pet products: consider adding cute pets (cats/dogs) if it enhances the selling point

2. PRODUCT QUANTITY:
   - You may show multiple instances of the same product if competitor does so
   - Consider product stacking, grouping, or arrangement patterns

3. DECORATIVE ELEMENTS:
   - Add complementary props that enhance the product story
   - For pet products: paw prints, pet toys, treats, cozy fabrics, greenery
   - Match the competitor's decoration style and density

4. COLOR ATMOSPHERE:
   - Apply the competitor's color grading and mood
   - Adjust ambient colors (not product colors) to match the vibe

5. LIGHTING EFFECTS:
   - Replicate the competitor's professional lighting setup
   - Add highlights, reflections, or glow effects as appropriate`;

  // 7. 严格限制
  const strictRules = `=== STRICT RULES ===
DO NOT:
- Change the product's shape, proportions, or physical structure
- Alter the product's actual colors or material appearance
- Add text, watermarks, logos, or price tags
- Distort or deform the product
- Make the product unrecognizable

MUST:
- Keep product physically identical to the input image
- Create a professional e-commerce quality photo
- Make the image visually appealing and conversion-optimized`;

  return `${productPhysicalConstraints}

${styleToLearn}

${compositionGuide}
${sellingPointGuidance}
${productContext}

${creativeLiberty}

${strictRules}

TASK: Create a professional e-commerce product photo that:
1. Preserves the exact physical appearance of the product
2. Applies the competitor's visual style and atmosphere
3. Uses creative scene design to highlight the product's selling points
4. Looks premium, appealing, and ready for online sales`;
}

/**
 * 使用 AI 动态合成提示词
 * 根据竞品分析、实拍图分析和商品信息，智能生成图像生成提示词
 * 同时输出场景类型和场景描述
 */
export async function synthesizePromptWithAI(
  layout: LayoutAnalysis,
  style: StyleAnalysis,
  content: ContentAnalysis,
  competitorInfo?: CompetitorInfo | null,
  productInfo?: ProductInfo | null,
  copywriting?: CopywritingInfo | null
): Promise<AnalysisResponse<PromptSynthesisResult>> {
  console.log('[OpenRouter] synthesizePromptWithAI called');
  console.log('[OpenRouter] Using model:', VISION_MODEL);

  // 构建输入信息
  const productContext = productInfo ? `
### 商品基本信息
- 商品名称: ${productInfo.productName || '未提供'}
- 商品类目: ${productInfo.productCategory || '未提供'}
- 核心卖点: ${productInfo.sellingPoints || '未提供'}
- 目标人群: ${productInfo.targetAudience || '未提供'}
- 品牌调性: ${productInfo.brandTone?.join('、') || '未提供'}
- 使用场景: ${productInfo.usageScenario || '未提供（请根据商品信息智能推断）'}` : '';

  const competitorContext = competitorInfo ? `
### 竞品信息
- 竞品名称: ${competitorInfo.competitorName}
- 竞品类目: ${competitorInfo.competitorCategory || '未提供'}` : '';

  const prompt = `你是一个专业的电商产品图生成提示词专家。

## 输入信息

### 竞品图版式分析
${JSON.stringify(layout, null, 2)}

### 竞品图风格分析
${JSON.stringify(style, null, 2)}

### 竞品图文案与卖点
${JSON.stringify(copywriting, null, 2)}

### 实拍商品图分析（产品物理特征）
${JSON.stringify(content, null, 2)}
${competitorContext}
${productContext}

## 你的任务
1. 根据商品信息智能判断最合适的图像场景类型
2. 生成详细的场景描述
3. 生成完整的图像生成提示词

## 场景类型判断（重要）
根据产品类型和功能，判断最适合的图像场景类型：

1. **human_usage**（人物使用场景）：
   - 适用：工具类（铲子、钳子、螺丝刀）、厨具、清洁用品、健身器材、美妆护肤
   - 展示：手部或半身人物使用产品的动作

2. **pet_interaction**（宠物互动场景）：
   - 适用：宠物用品（猫粮、狗窝、玩具、餐具、猫抓板、宠物服饰）
   - 展示：宠物与产品的自然互动

3. **environment**（环境展示场景）：
   - 适用：家居装饰、摆件、收纳用品、家具
   - 展示：产品在合适环境中的摆放

4. **product_display**（纯产品展示）：
   - 适用：无明显使用场景的产品（数据线、转接头等）
   - 展示：产品本身，简洁背景

## 关键规则

### 1. 产品物理属性（必须保持不变）
- 产品的形状、颜色、材质必须与实拍图分析中描述的完全一致
- 不能改变产品的任何物理特征

### 2. 场景设计
根据判断的场景类型，设计合适的使用场景：

**如果是 pet_interaction，必须详细描述宠物**：
- 宠物类型和特征（如：毛茸茸的橘猫、金毛幼犬）
- 自然生动的姿态和表情
- 与商品的自然互动方式
- 毛发质感

**如果是 human_usage，必须详细描述人物使用**：
- 人物局部（如：手部特写）
- 使用动作和姿态
- 使用环境

**如果是 environment，必须详细描述环境**：
- 摆放位置和环境场景
- 光影和氛围

### 3. 参考竞品风格
- 背景风格、光影效果、色调氛围应参考竞品图的风格分析结果

### 4. 画面布局约束（强制执行）
⚠️ 这是电商营销图，顶部和底部必须留白用于叠加文字，这是硬性要求。

【必须】
- 顶部 25%：必须是简洁背景（纯色/渐变/虚化），绝对不能有产品或人物
- 底部 12%：必须是简洁背景，不能有主体元素
- 中部 63%：产品和人物只能出现在这个区域（垂直25%-88%）

【禁止】
- 禁止产品顶部超出画面25%位置
- 禁止人物头顶超出画面30%位置
- 禁止在顶部/底部留白区放置文字、装饰或重要细节

## 输出格式
请严格按以下 JSON 格式输出，不要添加任何额外说明：
{
  "scene_type": "human_usage 或 pet_interaction 或 environment 或 product_display",
  "scene_description": "具体的场景描述（50-100字），描述画面中除产品外的场景元素",
  "prompt": "完整的中文图像生成提示词（200-400字），包含产品描述、场景设计、光影氛围等"
}`;

  return withRetry(async () => {
    const response = await openrouter.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 2000,
    });

    console.log('[OpenRouter] synthesizePromptWithAI response status:', response.choices[0].finish_reason);
    const responseContent = response.choices[0].message.content || '{}';
    console.log('[OpenRouter] synthesizePromptWithAI response length:', responseContent.length);

    const generationId = response.id || '';
    console.log('[OpenRouter] synthesizePromptWithAI generationId:', generationId);

    // 解析 JSON 响应
    let result: PromptSynthesisResult;
    try {
      const parsed = parseJsonResponse(responseContent) as {
        scene_type?: string;
        scene_description?: string;
        prompt?: string;
      };

      // 验证并转换场景类型
      const validSceneTypes: ImageSceneType[] = ['product_display', 'human_usage', 'pet_interaction', 'environment'];
      const sceneType = validSceneTypes.includes(parsed.scene_type as ImageSceneType)
        ? (parsed.scene_type as ImageSceneType)
        : 'product_display';

      result = {
        prompt: parsed.prompt || '',
        sceneType,
        sceneDescription: parsed.scene_description,
      };

      console.log('[OpenRouter] synthesizePromptWithAI scene_type:', result.sceneType);
      console.log('[OpenRouter] synthesizePromptWithAI scene_description:', result.sceneDescription?.substring(0, 50) + '...');
      console.log('[OpenRouter] synthesizePromptWithAI prompt length:', result.prompt.length);
    } catch (error) {
      // 如果 JSON 解析失败，将整个响应作为 prompt，默认场景类型为 product_display
      console.warn('[OpenRouter] Failed to parse JSON response, using raw content as prompt');
      result = {
        prompt: responseContent.trim(),
        sceneType: 'product_display',
      };
    }

    console.log('[OpenRouter] synthesizePromptWithAI completed successfully');
    return {
      data: result,
      generationId,
      inputData: {
        mode: 'competitor' as const,
        fullPrompt: prompt,
        layoutAnalysis: layout,
        styleAnalysis: style,
        copywritingAnalysis: copywriting as PromptInputData['copywritingAnalysis'],
        contentAnalysis: content,
        competitorInfo,
        productInfo,
      },
    };
  }, 'synthesizePromptWithAI');
}

/**
 * 生成使用场景描述（用于模板模式）
 * 根据商品信息和产品分析，智能推断合适的使用场景
 * 返回场景类型和场景描述
 */
export async function generateUsageSceneDescription(
  productInfo: ProductInfo | null,
  contentAnalysis: ContentAnalysis | null
): Promise<AnalysisResponse<PromptSynthesisResult>> {
  console.log('[OpenRouter] generateUsageSceneDescription called');
  console.log('[OpenRouter] Using model:', VISION_MODEL);

  // 如果没有商品信息，返回默认值
  if (!productInfo?.productName) {
    console.log('[OpenRouter] No product info, returning default');
    return {
      data: {
        prompt: '',
        sceneType: 'product_display',
        sceneDescription: '',
      },
      generationId: '',
    };
  }

  const prompt = `你是电商产品使用场景设计专家。

## 输入信息

### 商品基本信息
- 商品名称: ${productInfo.productName}
- 商品类目: ${productInfo.productCategory || '未提供'}
- 核心卖点: ${productInfo.sellingPoints || '未提供'}
- 目标人群: ${productInfo.targetAudience || '未提供'}
- 用户指定场景: ${productInfo.usageScenario || '未提供'}

### 产品物理特征
${contentAnalysis ? JSON.stringify(contentAnalysis, null, 2) : '未提供'}

## 任务
1. 根据商品信息判断最合适的场景类型
2. 生成详细的场景描述

## 场景类型判断规则

1. **human_usage**（人物使用场景）：
   - 适用：工具类（铲子、钳子）、厨具、清洁用品、健身器材、美妆护肤
   - 展示：手部或半身人物使用产品的动作

2. **pet_interaction**（宠物互动场景）：
   - 适用：宠物用品（猫粮、狗窝、玩具、餐具、猫抓板）
   - 展示：宠物与产品的自然互动

3. **environment**（环境展示场景）：
   - 适用：家居装饰、摆件、收纳用品
   - 展示：产品在合适环境中的摆放

4. **product_display**（纯产品展示）：
   - 适用：无明显使用场景的产品
   - 展示：产品本身，简洁背景

## 输出格式
请严格按以下 JSON 格式输出，不要添加任何额外说明：
{
  "scene_type": "human_usage 或 pet_interaction 或 environment 或 product_display",
  "scene_description": "具体的场景描述（100-200字），包含场景主体、动作状态、环境背景、氛围营造"
}`;

  return withRetry(async () => {
    const response = await openrouter.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
    });

    console.log('[OpenRouter] generateUsageSceneDescription response status:', response.choices[0].finish_reason);
    const responseContent = response.choices[0].message.content || '{}';
    console.log('[OpenRouter] generateUsageSceneDescription response length:', responseContent.length);

    const generationId = response.id || '';
    console.log('[OpenRouter] generateUsageSceneDescription generationId:', generationId);

    // 解析 JSON 响应
    let result: PromptSynthesisResult;
    try {
      const parsed = parseJsonResponse(responseContent) as {
        scene_type?: string;
        scene_description?: string;
      };

      // 验证并转换场景类型
      const validSceneTypes: ImageSceneType[] = ['product_display', 'human_usage', 'pet_interaction', 'environment'];
      const sceneType = validSceneTypes.includes(parsed.scene_type as ImageSceneType)
        ? (parsed.scene_type as ImageSceneType)
        : 'product_display';

      result = {
        prompt: '', // 模板模式的 prompt 由 taskProcessor 组合
        sceneType,
        sceneDescription: parsed.scene_description,
      };

      console.log('[OpenRouter] generateUsageSceneDescription scene_type:', result.sceneType);
      console.log('[OpenRouter] generateUsageSceneDescription scene_description:', result.sceneDescription?.substring(0, 50) + '...');
    } catch (error) {
      // 如果 JSON 解析失败，默认返回 product_display
      console.warn('[OpenRouter] Failed to parse JSON response, using default');
      result = {
        prompt: '',
        sceneType: 'product_display',
        sceneDescription: responseContent.trim(),
      };
    }

    console.log('[OpenRouter] generateUsageSceneDescription completed successfully');
    return {
      data: result,
      generationId,
      inputData: {
        mode: 'template',
        fullPrompt: prompt,
        contentAnalysis: contentAnalysis || undefined,
        productInfo,
      },
    };
  }, 'generateUsageSceneDescription');
}
