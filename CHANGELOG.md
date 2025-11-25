# Changelog

## [Unreleased]

### TODO - 待办事项

- [ ] **图像生成 API 调试**: 需要验证 `google/gemini-2.5-flash-image` 模型的正确调用方式
  - 当前使用 `modalities: ["text", "image"]` 参数，但官方文档示例未包含此参数
  - 需要测试移除 `modalities` 参数后的效果
  - 可能需要改用 `@openrouter/sdk` 官方 SDK
- [ ] **响应格式适配**: 确认图像生成模型的实际响应格式，调整解析逻辑

---

## [0.2.0] - 2024-11-26

### Added

- **结果页步骤展示**: 生成结果页现在展示每个 AI 分析步骤的详细输出
  - 版式分析: 主体构图、背景结构、图层顺序
  - 风格分析: 色彩风格、光影效果、整体氛围
  - 内容分析: 产品形状、材质、朝向、色彩
  - 生成提示词: 可展开查看完整 prompt

- **失败任务分析展示**: 失败任务也能查看已完成步骤的分析结果

- **断点重试功能**: 失败任务支持从失败步骤继续执行
  - 新增 `failedStep` 数据库字段记录失败步骤
  - 新增 `POST /api/task/[taskId]/retry` 重试接口
  - 任务处理器支持 `startFromStep` 参数
  - 前端添加「从失败处重试」按钮

- **新增组件**:
  - `StepAnalysisCard`: 可折叠的步骤分析卡片组件

### Changed

- **API 返回数据增强**:
  - `/api/task/[taskId]/result` 现在返回完整的分析数据 (layoutAnalysis, styleAnalysis, contentAnalysis)
  - `/api/task/[taskId]/status` 现在返回 failedStep 字段
  - 允许 failed 状态的任务也能获取分析结果

- **任务处理器重构**:
  - `processTask()` 函数支持 `startFromStep` 参数
  - 失败时记录具体失败步骤号
  - 重试时自动加载之前步骤的分析结果

### Fixed

- 修复图像生成 API 调用问题 (添加 modalities 参数)
- 修复未使用变量导致的 ESLint 错误

---

## [0.1.0] - 2024-11-25

### Added

- 初始 MVP 版本
- 图片上传功能 (竞品图 + 实拍图)
- 5 步 AI 分析流程
- 任务状态轮询和进度展示
- 结果图片展示和下载
- 任务历史列表
