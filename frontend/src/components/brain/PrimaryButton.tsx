import { ButtonHTMLAttributes } from 'react'

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
}

export default function PrimaryButton({ label, className = '', ...props }: PrimaryButtonProps) {
  return (
    <button
      className={`
        h-14 w-full rounded-14 font-semibold
        bg-primary text-primary-foreground shadow-primary
        hover:brightness-110 active:scale-[0.99]
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:active:scale-100
        transition-all duration-150
        ${className}
      `}
      {...props}
    >
      {label}
    </button>
  )
}
