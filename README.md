# 素材克隆大师 (Material Clone Master)

一款基于 AI 的电商产品图生成工具，通过分析竞品图的版式和风格，结合你的产品实拍图，自动生成同款风格的产品图。

## 功能特性

- **竞品图分析**: 自动提取竞品图的版式布局、视觉风格
- **实拍图识别**: 识别产品形状、材质、朝向等特征
- **智能提示词合成**: 综合分析结果生成图像生成提示词
- **AI 图像生成**: 基于 OpenRouter API 调用图像生成模型
- **任务历史**: 查看历史任务和生成结果
- **断点重试**: 失败任务可从失败步骤继续执行

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **数据库**: SQLite + Prisma ORM
- **样式**: Tailwind CSS
- **AI 服务**: OpenRouter API (支持多种模型)

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件:

```env
DATABASE_URL="file:./dev.db"

# OpenRouter API 配置
OPENROUTER_API_KEY="your-api-key"
OPENROUTER_VISION_MODEL="google/gemini-flash-1.5-8b"
OPENROUTER_IMAGE_MODEL="google/gemini-2.5-flash-image"
OPENROUTER_SITE_URL="https://your-site.com"
OPENROUTER_SITE_NAME="Material Clone Master"

# Mock 模式 (设为 true 跳过真实 API 调用)
USE_MOCK_GENERATION="false"
```

### 3. 初始化数据库

```bash
npx prisma db push
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 工作流程

1. **上传竞品图** - 作为风格参考
2. **上传实拍图** - 你的产品照片
3. **AI 分析** (5 个步骤):
   - 分析竞品图版式
   - 分析竞品图风格
   - 分析实拍图内容
   - 合成生成提示词
   - 生成结果图片
4. **查看结果** - 下载生成的产品图

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── task/          # 任务相关 API
│   │   ├── tasks/         # 任务列表 API
│   │   └── upload/        # 图片上传 API
│   ├── result/[taskId]/   # 结果页面
│   └── page.tsx           # 首页
├── components/            # React 组件
├── services/              # 业务逻辑
│   ├── taskProcessor.ts   # 任务处理器
│   ├── openrouter.ts      # OpenRouter 视觉分析
│   └── imageGenerator.ts  # 图像生成
├── lib/                   # 工具函数
└── types/                 # TypeScript 类型定义
```

## API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/task/create` | POST | 创建新任务 |
| `/api/task/[taskId]/status` | GET | 获取任务状态 |
| `/api/task/[taskId]/result` | GET | 获取任务结果 |
| `/api/task/[taskId]/retry` | POST | 重试失败任务 |
| `/api/tasks` | GET | 获取任务列表 |
| `/api/upload` | POST | 上传图片 |

## 许可证

MIT
