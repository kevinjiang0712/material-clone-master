import { cn } from '@/lib/utils';
import Spinner from './Spinner';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit';
  className?: string;
}

const variantClasses = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed',
  secondary:
    'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
};

const sizeClasses = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export default function Button({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
