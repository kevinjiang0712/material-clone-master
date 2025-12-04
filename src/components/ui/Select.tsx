// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { cn } from '@/lib/utils';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export default function Select({
  label,
  options,
  value,
  onChange,
  placeholder = '请选择',
  className,
  error,
}: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full px-4 py-2 rounded-lg appearance-none transition-all duration-200
          bg-[#333] border border-[#404040] text-white
          focus:outline-none focus:border-[#e07a5f] focus:ring-1 focus:ring-[#e07a5f]
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${className}
        `}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
