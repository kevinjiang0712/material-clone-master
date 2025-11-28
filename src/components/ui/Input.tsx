import { cn } from '@/lib/utils';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  className?: string;
}

export default function Input({
  label,
  placeholder,
  value,
  onChange,
  required = false,
  multiline = false,
  rows = 3,
  className,
}: InputProps) {
  const baseClasses = cn(
    'w-full px-3 py-2 text-sm rounded-lg border border-gray-300',
    'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100',
    'placeholder:text-gray-400 transition-all duration-200',
    className
  );

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={cn(baseClasses, 'resize-none')}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClasses}
        />
      )}
    </div>
  );
}
