import { CompetitorAnalysis } from '@/types';

// 宠物行业风格模板
export interface PetStyleTemplate {
  id: string;
  name: string;
  category: string;
  thumbnail: string;  // 缩略图路径
  description: string;
  suitableProducts: string[];  // 适用产品类型
  presetAnalysis: CompetitorAnalysis;
}

// 模板分类
export const TEMPLATE_CATEGORIES = [
  { id: 'supplies', name: '用品类' },
] as const;

// 宠物行业风格模板库
export const PET_STYLE_TEMPLATES: PetStyleTemplate[] = [
  // ========== Mango蛮果 活力实用风 ==========
  {
    id: 'mango-playful-practical',
    name: 'Mango活力实用风',
    category: 'supplies',
    thumbnail: '/templates/mango.jpg',
    description: '活力可爱、年轻实用暖色系风格，适合年轻养宠人群',
    suitableProducts: ['猫砂盆', '饮水机餐具', '储粮桶', '护理用品', '宠物玩具'],
    presetAnalysis: {
      layout: {
        main_object: {
          position: 'center',
          horizontal_offset: '居中',
          vertical_offset: '中心偏下',
          size: '产品占画面60%，留白充足',
          view_angle: '平拍或45度俯拍',
          rotation: '无旋转或轻微倾斜',
          edge_crop: false
        },
        background_structure: {

          type: '浅色背景/暖调渐变',
          layers: ['暖色渐变背景', '柔和投影层', '产品层'],
          decorations: ['圆润阴影', '干净活泼']
        },
        text_blocks: [],
        decors: {
          light_effects: ['柔和棚拍光', '均匀散射光'],
          shadows: ['轻柔圆润阴影', '自然过渡'],
          shapes: []
        },
        layer_sequence: ['background', 'shadow', 'product']
      },
      style: {
        color_style: {
          primary_color: '#FFD966',
          secondary_colors: ['#FFB6C1', '#B19CD9', '#FFF8E7', '#C4C4C4'],
          saturation: '中等偏高，暖色系',
          brightness: '明亮温暖，年轻活力'
        },
        lighting: {
          direction: '顶部柔光',
          type: '柔和棚拍光/散射光',
          shadow_intensity: '轻柔',
          shadow_blur: '高模糊度，圆润自然'
        },
        texture: {
          surface: '哑光磨砂质感，圆润饱满',
          grain: '细腻无颗粒',
          reflection: '低反光，部分光泽感'
        },
        background_style: {
          gradient_direction: '上到下暖调渐变',
          blur_level: '背景纯净',
          floating_effects: false
        },
        vibe: '可爱、活泼、年轻、实用、圆润',
        style_prompt: '浅色背景，产品居中构图，柔和的棚拍漫射光，轻柔自然的阴影，可爱圆润的设计风格，哑光磨砂质感，活泼可爱的产品摄影风格，年轻活力的品牌调性，专业电商产品摄影，高清画质。避免深色调、避免生硬阴影、避免尖锐棱角、避免工业风格、避免奢华高端感'
      },

    }
  },

  // ========== POPOCOLA 简约实用风 ==========
  {
    id: 'popocola-simple-practical',
    name: 'POPOCOLA简约实用风',
    category: 'supplies',
    thumbnail: '/templates/popocola.jpg',
    description: '中性温和、简约实用的宠物用品电商风格，灰白米色调',
    suitableProducts: ['猫窝狗窝', '猫砂盆', '饮水机餐具', '宠物服饰', '猫抓板玩具', '储粮桶日用'],
    presetAnalysis: {
      layout: {
        main_object: {
          position: 'center',
          horizontal_offset: '居中',
          vertical_offset: '中心偏下',
          size: '产品占画面60%，视觉突出',
          view_angle: '平拍略俯',
          rotation: '无旋转或微倾5°',
          edge_crop: false
        },
        background_structure: {
          type: '浅色背景+柔和阴影',
          layers: ['浅色渐变背景', '柔和投影层', '产品层'],
          decorations: ['极简阴影', '干净整洁']
        },
        text_blocks: [],
        decors: {
          light_effects: ['柔和漫射光', '均匀照明'],
          shadows: ['产品底部柔和阴影', '轻微投影'],
          shapes: []
        },
        layer_sequence: ['background', 'shadow', 'product']
      },
      style: {
        color_style: {
          primary_color: '#8C8C8C',
          secondary_colors: ['#F5F0E6', '#FAF8F5', '#D9C4A9', '#A6A6A6'],
          saturation: '低饱和度，中性温和',
          brightness: '明亮干净，柔和不刺眼'
        },
        lighting: {
          direction: '顶部柔光',
          type: '漫射柔光箱',
          shadow_intensity: '轻柔',
          shadow_blur: '高模糊度，自然过渡'
        },
        texture: {
          surface: '哑光质感，圆润设计',
          grain: '细腻无颗粒',
          reflection: '低反光，哑光塑料/织物质感'
        },
        background_style: {
          gradient_direction: '上到下轻微渐变',
          blur_level: '背景纯净无杂物',
          floating_effects: false
        },
        vibe: '简约、温馨、实用、干净、舒适',
        style_prompt: '产品居中构图，柔和的棚拍漫射光，轻柔自然的阴影，中性色调（灰色、米色、奶油色），简约实用的设计风格，圆润边角，哑光质感，干净整洁的构图，温馨舒适的氛围，专业电商产品摄影，高清画质。避免鲜艳色彩、避免强烈对比、避免戏剧性光影、避免生硬阴影'
      },
      copywriting: {
        text_content: [],
        selling_points: {
          main_selling_point: '简约实用，给毛孩子舒适的家',
          points: [
            { point: '简约设计', category: '品质' },
            { point: '实用耐用', category: '功能' },
            { point: '温馨舒适', category: '情感' }
          ],
          target_audience: '追求简约实用、注重生活品质的养宠人士',
          emotional_appeal: '简单好用，让养宠生活更轻松'
        }
      }
    }
  }
];

// 根据分类获取模板
export function getTemplatesByCategory(categoryId: string): PetStyleTemplate[] {
  return PET_STYLE_TEMPLATES.filter(t => t.category === categoryId);
}

// 根据ID获取模板
export function getTemplateById(id: string): PetStyleTemplate | undefined {
  return PET_STYLE_TEMPLATES.find(t => t.id === id);
}

// 获取所有模板（按分类分组）
export function getTemplatesGroupedByCategory(): Record<string, PetStyleTemplate[]> {
  const grouped: Record<string, PetStyleTemplate[]> = {};
  for (const category of TEMPLATE_CATEGORIES) {
    grouped[category.id] = getTemplatesByCategory(category.id);
  }
  return grouped;
}
