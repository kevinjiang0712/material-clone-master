'use client';

interface Step {
  number: number;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export default function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const isCompleted = step.number < currentStep;
        const isCurrent = step.number === currentStep;
        const isClickable = isCompleted && onStepClick;

        return (
          <div key={step.number} className="flex items-center">
            {/* 步骤圆圈 */}
            <div
              className={`
                flex flex-col items-center
                ${isClickable ? 'cursor-pointer' : ''}
              `}
              onClick={() => isClickable && onStepClick(step.number)}
            >
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  font-semibold text-sm transition-all duration-200
                  ${isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                      ? 'bg-purple-600 text-white ring-4 ring-purple-100'
                      : 'bg-gray-200 text-gray-500'
                  }
                `}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`
                  mt-2 text-xs font-medium whitespace-nowrap
                  ${isCurrent ? 'text-purple-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}
                `}
              >
                {step.label}
              </span>
            </div>

            {/* 连接线 */}
            {index < steps.length - 1 && (
              <div
                className={`
                  w-16 h-0.5 mx-2 transition-colors duration-200
                  ${step.number < currentStep ? 'bg-green-500' : 'bg-gray-200'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
