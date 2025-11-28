import OpenAI from 'openai';
import { LayoutAnalysis, StyleAnalysis, ContentAnalysis, CompetitorAnalysis, CompetitorInfo, ProductInfo } from '@/types';
import { API_TIMEOUT, API_RETRIES, RETRY_DELAY } from '@/lib/constants';

// 带 generationId 的响应类型
export interface AnalysisResponse<T> {
  data: T;
  generationId: string;
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

// 合并版式+风格分析的 Prompt
const COMPETITOR_ANALYSIS_PROMPT = `你现在负责分析"竞品商品图"的版式模板和视觉风格。

请从上传的竞品图中提取以下两部分结构化信息：

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

1. text_content（文案内容）
逐条提取图片中出现的所有文字，每条包含：
  - text: 文字内容（原文，保持原样）
  - type: 文字类型（主标题 / 副标题 / 卖点文案 / 标签 / 价格 / 促销信息）
  - emphasis: 强调程度（高 / 中 / 低）

2. selling_points（卖点分析）
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

// 合并分析竞品图（版式+风格）
export async function analyzeCompetitor(imageBase64: string): Promise<AnalysisResponse<CompetitorAnalysis>> {
  console.log('[OpenRouter] Calling analyzeCompetitor with model:', VISION_MODEL);
  console.log('[OpenRouter] Image base64 length:', imageBase64.length);

  return withRetry(async () => {
    const response = await openrouter.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: COMPETITOR_ANALYSIS_PROMPT },
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

export function synthesizePrompt(
  layout: LayoutAnalysis,
  style: StyleAnalysis,
  content: ContentAnalysis,
  competitorInfo?: CompetitorInfo | null,
  productInfo?: ProductInfo | null
): string {
  console.log('[OpenRouter] synthesizePrompt called');
  console.log('[OpenRouter] layout keys:', Object.keys(layout || {}));
  console.log('[OpenRouter] style keys:', Object.keys(style || {}));
  console.log('[OpenRouter] content keys:', Object.keys(content || {}));
  console.log('[OpenRouter] competitorInfo:', competitorInfo);
  console.log('[OpenRouter] productInfo:', productInfo);

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

  // 1. 构建产品约束部分（核心 - 放在最前面）
  const productConstraints = `=== CRITICAL: PRODUCT PRESERVATION (MUST FOLLOW) ===
You MUST keep the product EXACTLY as shown in the reference image:
- Shape: ${content?.product_shape?.category || 'original shape'} (${content?.product_shape?.proportions || 'original proportions'})
- Color: ${content?.color_profile?.primary_color || 'original color'}${content?.color_profile?.secondary_color ? ` with ${content.color_profile.secondary_color}` : ''}
- Material: ${content?.product_surface?.material || 'original material'} (${content?.product_surface?.glossiness || 'original finish'})
- Orientation: ${content?.product_orientation?.facing || 'front'} view, ${content?.product_orientation?.view_angle || 'eye level'}

DO NOT modify the product itself in any way.`;

  // 2. 构建风格参考部分
  const styleReference = `=== STYLE TO APPLY ===
Apply these visual elements to the background and lighting only:
- Primary color theme: ${style?.color_style?.primary_color || 'neutral'}
- Lighting: ${style?.lighting?.type || 'soft'} light from ${style?.lighting?.direction || 'front'}
- Background: ${layout?.background_structure?.type || 'clean studio'} style
- Surface texture feel: ${style?.texture?.surface || 'smooth'}
- Overall mood: ${style?.vibe || 'professional'}`;

  // 3. 构建布局参考
  const compositionGuide = `=== COMPOSITION ===
- Position product: ${layout?.main_object?.position || 'center'}
- View angle: ${layout?.main_object?.view_angle || 'front view'}`;

  // 4. 用户提供的商品信息（可选）
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
    productContext = `\n=== PRODUCT CONTEXT ===\n${contextParts.join('\n')}`;
  }

  // 5. 禁止项
  const prohibitions = `=== STRICT PROHIBITIONS ===
- DO NOT change product shape, size, or proportions
- DO NOT alter product colors or materials
- DO NOT add new elements to the product
- NO text, NO watermarks, NO logos`;

  return `${productConstraints}

${styleReference}

${compositionGuide}
${productContext}

${prohibitions}

Create a professional e-commerce product photo showing the SAME product
with enhanced styling. The product must be identical to the input image.`;
}
