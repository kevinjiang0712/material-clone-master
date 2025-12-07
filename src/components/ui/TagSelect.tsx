import { cn } from '@/lib/utils';

interface TagSelectProps {
  label?: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

export default function TagSelect({
  label,
  options,
  selected,
  onChange,
  className,
}: TagSelectProps) {
  const toggleTag = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((tag) => {
          const isSelected = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
              ${isSelected
                  ? 'bg-primary text-white border-primary'
                  : 'bg-background text-muted border-card-border hover:border-primary hover:text-foreground'
                }
            `}>
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
