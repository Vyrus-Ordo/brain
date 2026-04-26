interface BrainLogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function BrainLogo({ size = 'lg', className = '' }: BrainLogoProps) {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  }

  return (
    <h1
      className={`
        font-display font-extrabold text-primary text-glow select-none
        ${sizeClasses[size]}
        ${className}
      `}
    >
      Brain<span className="text-foreground">.</span>
    </h1>
  )
}
