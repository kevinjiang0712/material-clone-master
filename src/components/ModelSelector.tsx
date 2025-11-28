'use client';

import { AVAILABLE_IMAGE_MODELS, MAX_SELECTED_MODELS, DEFAULT_IMAGE_MODELS } from '@/lib/constants';

interface ModelSelectorProps {
  selectedModels: string[];
  onChange: (models: string[]) => void;
}

export default function ModelSelector({ selectedModels, onChange }: ModelSelectorProps) {
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
