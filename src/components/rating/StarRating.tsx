'use client';

import { useState } from 'react';

interface StarRatingProps {
  value: number; // 当前评分 0-5
  onChange?: (value: number) => void;
  size?: 'small' | 'medium' | 'large';
  readonly?: boolean;
  showLabel?: boolean; // 显示文字标签（优秀/良好等）
}

const sizeClasses = {
  small: 'w-4 h-4',
  medium: 'w-6 h-6',
  large: 'w-8 h-8',
};

const labelTexts: Record<number, string> = {
  1: '很差',
  2: '较差',
  3: '一般',
  4: '良好',
  5: '优秀',
};

export default function StarRating({
  value,
  onChange,
  size = 'medium',
  readonly = false,
  showLabel = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue !== null ? hoverValue : value;

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
            className={`${sizeClasses[size]} transition-transform ${
              !readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={rating <= displayValue ? 'currentColor' : 'none'}
              stroke="currentColor"
              className={`w-full h-full ${
                rating <= displayValue
                  ? 'text-yellow-400'
                  : 'text-gray-300'
              }`}
              strokeWidth={rating <= displayValue ? 0 : 2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          </button>
        ))}
      </div>
      {showLabel && value > 0 && (
        <span className="text-sm text-gray-600 font-medium">
          {labelTexts[value]}
        </span>
      )}
    </div>
  );
}
