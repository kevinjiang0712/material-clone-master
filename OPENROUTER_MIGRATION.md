# OpenRouter 迁移总结

## 改造完成时间
2025-11-25

## 改造内容

### 1. 环境变量配置 (.env)
```env
OPENROUTER_API_KEY=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
OPENROUTER_VISION_MODEL=google/gemini-3-pro-preview
OPENROUTER_IMAGE_MODEL=google/gemini-3-pro-image-preview
OPENROUTER_SITE_URL=https://material-clone-master.com
OPENROUTER_SITE_NAME=Material Clone Master
USE_MOCK_GENERATION=false
```

### 2. 新增文件

#### `src/services/openrouter.ts`
- 替代原有的 `openai.ts`
- 使用 OpenRouter API + Gemini 模型进行图像分析
- 功能：
  - `analyzeLayout()` - 分析竞品图版式
  - `analyzeStyle()` - 分析竞品图风格
  - `analyzeContent()` - 分析实拍图内容
  - `synthesizePrompt()` - 合成提示词

#### `src/services/imageGenerator.ts`
- 替代原有的 `jimeng.ts`
- 使用 OpenRouter API 进行图像生成
- 支持 Mock 模式用于测试
- 使用 `google/gemini-3-pro-image-preview` 模型

### 3. 修改文件

#### `src/services/taskProcessor.ts`
- 更新导入：
  - `openaiService` → `openrouterService`
  - `jimengService` → `imageGeneratorService`
- 所有分析和生成调用已更新

### 4. 旧文件状态

以下文件已不再使用，但保留作为参考：
- `src/services/openai.ts`
- `src/services/jimeng.ts`

## 技术架构

### 图像分析流程
```
竞品图 → OpenRouter + Gemini → 版式分析
竞品图 → OpenRouter + Gemini → 风格分析
实拍图 → OpenRouter + Gemini → 内容分析
```

### 图像生成流程
```
实拍图 + 提示词 → OpenRouter + Gemini Image → 生成新图
```

## 使用说明

### 启动项目
```bash
npm run dev
```

### 测试模式
如需使用 Mock 模式（不调用真实 API）：
```env
USE_MOCK_GENERATION=true
```

### API 调用流程
1. 用户上传竞品图和实拍图
2. 系统使用 Gemini 分析图像（步骤 1-3）
3. 系统合成生成提示词（步骤 4）
4. 系统使用 Gemini Image 生成新图（步骤 5）

## 注意事项

1. **API Key 安全**：API Key 已配置，请勿泄露
2. **模型选择**：
   - 视觉分析：`google/gemini-3-pro-preview`
   - 图像生成：`google/gemini-3-pro-image-preview`
3. **成本控制**：OpenRouter 按使用量计费，注意监控
4. **错误处理**：已实现完整的错误处理和日志记录

## 测试建议

1. 测试图像分析功能
2. 测试图像生成功能
3. 测试完整流程（上传 → 分析 → 生成）
4. 验证错误处理机制

## 后续优化建议

1. 添加请求重试机制
2. 添加请求缓存以降低成本
3. 优化提示词模板
4. 添加更详细的日志记录
5. 实现请求限流保护

## 联系信息

如有问题，请查看：
- OpenRouter 文档: https://openrouter.ai/docs
- Gemini 模型文档: https://ai.google.dev/
