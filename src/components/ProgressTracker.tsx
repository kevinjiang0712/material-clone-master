'use client';

import { STEP_LABELS } from '@/lib/constants';

interface ProgressTrackerProps {
  currentStep: number;
  totalSteps: number;
  stepDescription: string;
  progress: number;
}

export default function ProgressTracker({
  currentStep,
  stepDescription,
  progress,
}: ProgressTrackerProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
      {/* 步骤指示器 */}
      <div className="flex justify-between mb-8 relative">
        {/* 连接线 */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{
              width: `${((currentStep - 1) / (STEP_LABELS.length - 1)) * 100}%`,
            }}
          />
        </div>

        {STEP_LABELS.map((step) => (
          <div key={step.id} className="flex flex-col items-center relative z-10">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                font-semibold text-sm transition-all duration-300
                ${step.id < currentStep ? 'bg-blue-500 text-white' : ''}
                ${
                  step.id === currentStep
                    ? 'bg-blue-500 text-white ring-4 ring-blue-200 animate-pulse'
                    : ''
                }
                ${step.id > currentStep ? 'bg-gray-200 text-gray-500' : ''}
              `}
            >
              {step.id < currentStep ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                step.id
              )}
            </div>
            <span
              className={`text-xs mt-2 text-center max-w-[60px] ${
                step.id <= currentStep ? 'text-gray-700' : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* 进度条 */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 当前步骤描述 */}
      <div className="text-center">
        <p className="text-gray-600">{stepDescription}</p>
        <p className="text-sm text-gray-400 mt-1">{progress}% 完成</p>
      </div>
    </div>
  );
}
