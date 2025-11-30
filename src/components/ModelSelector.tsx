'use client';

import { AVAILABLE_IMAGE_MODELS, MAX_SELECTED_MODELS, DEFAULT_IMAGE_MODELS, JIMEN_RESOLUTION_OPTIONS, DEFAULT_JIMEN_RESOLUTION } from '@/lib/constants';

interface ModelSelectorProps {
  selectedModels: string[];
  onChange: (models: string[]) => void;
  jimenResolution?: string;
  onResolutionChange?: (resolution: string) => void;
}

export default function ModelSelector({
  selectedModels,
  onChange,
  jimenResolution = DEFAULT_JIMEN_RESOLUTION,
  onResolutionChange,
}: ModelSelectorProps) {
  const handleToggle = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      // 至少保留一个模型
      if (selectedModels.length > 1) {
        onChange(selectedModels.filter(id => id !== modelId));
      }
    } else {
      // 最多选择 MAX_SELECTED_MODELS 个
      if (selectedModels.length < MAX_SELECTED_MODELS) {
        onChange([...selectedModels, modelId]);
      }
    }
  };

  // 按 provider 分组
  const jimenModels = AVAILABLE_IMAGE_MODELS.filter(m => m.provider === 'jimen');
  const openrouterModels = AVAILABLE_IMAGE_MODELS.filter(m => m.provider === 'openrouter');

  // 检查是否选中了即梦模型
  const hasJimenSelected = selectedModels.some(id => id.startsWith('jimen:'));

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
          3
        </span>
        <h2 className="text-lg font-semibold text-gray-800">
          选择生成模型
        </h2>
        <span className="text-xs text-gray-400 ml-auto">
          已选 {selectedModels.length}/{MAX_SELECTED_MODELS}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        可多选，将并行生成多张图片进行对比
      </p>

      {/* 即梦模型 */}
      <div className="mb-4">
        <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-400"></span>
          即梦 (Doubao)
        </div>
        <div className="space-y-2">
          {jimenModels.map(model => (
            <ModelCheckbox
              key={model.id}
              model={model}
              checked={selectedModels.includes(model.id)}
              disabled={!selectedModels.includes(model.id) && selectedModels.length >= MAX_SELECTED_MODELS}
              onChange={() => handleToggle(model.id)}
            />
          ))}
        </div>

        {/* 即梦分辨率选择器 - 仅当选中即梦模型时显示 */}
        {hasJimenSelected && onResolutionChange && (
          <div className="mt-3 ml-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
            <div className="text-xs font-medium text-gray-600 mb-2">输出分辨率</div>
            <div className="flex gap-2 flex-wrap">
              {JIMEN_RESOLUTION_OPTIONS.map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onResolutionChange(option.id)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-all
                    ${jimenResolution === option.id
                      ? 'border-orange-400 bg-orange-100 text-orange-700 font-medium'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-orange-200 hover:bg-orange-50'
                    }`}
                >
                  <span className="font-medium">{option.name}</span>
                  <span className="text-gray-400 ml-1">({option.size}×{option.size})</span>
                  {option.id === '2k' && (
                    <span className="ml-1 text-orange-500">推荐</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* OpenRouter 模型 */}
      <div>
        <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          OpenRouter
        </div>
        <div className="space-y-2">
          {openrouterModels.map(model => (
            <ModelCheckbox
              key={model.id}
              model={model}
              checked={selectedModels.includes(model.id)}
              disabled={!selectedModels.includes(model.id) && selectedModels.length >= MAX_SELECTED_MODELS}
              onChange={() => handleToggle(model.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ModelCheckboxProps {
  model: {
    id: string;
    displayName: string;
    description?: string;
  };
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}

function ModelCheckbox({ model, checked, disabled, onChange }: ModelCheckboxProps) {
  return (
    <label
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer
        ${checked
          ? 'border-purple-300 bg-purple-50'
          : disabled
            ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
            : 'border-gray-200 hover:border-purple-200 hover:bg-purple-50/50'
        }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 truncate">
          {model.displayName}
        </div>
        {model.description && (
          <div className="text-xs text-gray-500 truncate">
            {model.description}
          </div>
        )}
      </div>
    </label>
  );
}

export { DEFAULT_IMAGE_MODELS };
