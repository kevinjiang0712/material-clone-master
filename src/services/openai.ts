import OpenAI from 'openai';
import { LayoutAnalysis, StyleAnalysis, ContentAnalysis } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  // 移除可能的 markdown 代码块标记
  const cleaned = content
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  return JSON.parse(cleaned);
}

export async function analyzeLayout(imageBase64: string): Promise<LayoutAnalysis> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
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

  const content = response.choices[0].message.content || '{}';
  return parseJsonResponse(content) as LayoutAnalysis;
}

export async function analyzeStyle(imageBase64: string): Promise<StyleAnalysis> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
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

  const content = response.choices[0].message.content || '{}';
  return parseJsonResponse(content) as StyleAnalysis;
}

export async function analyzeContent(imageBase64: string): Promise<ContentAnalysis> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
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

  const content = response.choices[0].message.content || '{}';
  return parseJsonResponse(content) as ContentAnalysis;
}

export function synthesizePrompt(
  layout: LayoutAnalysis,
  style: StyleAnalysis,
  content: ContentAnalysis
): string {
  return `Create a professional e-commerce product image with the following specifications:

=== LAYOUT REQUIREMENTS ===
- Main subject position: ${layout.main_object.position}
- View angle: ${layout.main_object.view_angle}
- Background type: ${layout.background_structure.type}
- Layer sequence: ${layout.layer_sequence.join(' → ')}

=== STYLE REQUIREMENTS ===
- Primary color: ${style.color_style.primary_color}
- Secondary colors: ${style.color_style.secondary_colors.join(', ')}
- Lighting: ${style.lighting.type} from ${style.lighting.direction}
- Surface texture: ${style.texture.surface}
- Overall vibe: ${style.vibe}

=== PRODUCT DETAILS ===
- Product shape: ${content.product_shape.category}
- Material: ${content.product_surface.material}
- Facing: ${content.product_orientation.facing}
- Primary color: ${content.color_profile.primary_color}

=== STYLE PROMPT ===
${style.style_prompt}

Generate a high-quality, professional product photography image with studio lighting.
No text, no watermarks. Clean, commercial-grade e-commerce visual.`;
}
