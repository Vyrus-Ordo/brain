import { ButtonHTMLAttributes } from 'react'

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
}

export default function SecondaryButton({ label, className = '', ...props }: SecondaryButtonProps) {
  return (
    <button
      className={`
        h-14 w-full rounded-14 font-semibold
        bg-transparent border-2 border-primary text-primary
        hover:bg-primary/10 active:scale-[0.99]
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:active:scale-100
        transition-all duration-150
        ${className}
      `}
      {...props}
    >
      {label}
    </button>
  )
}
