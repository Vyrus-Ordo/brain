interface SegmentedControlProps<T> {
  options: { label: string; value: T }[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export default function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`
        flex p-1 bg-surface-2 rounded-10 w-full
        ${className}
      `}
    >
      {options.map((option) => {
        const isSelected = option.value === value
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              flex-1 h-10 rounded-[8px] text-sm font-medium transition-all duration-200
              ${
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-selection'
                  : 'text-muted-foreground hover:text-foreground'
              }
            `}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
