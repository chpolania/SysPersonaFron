import { type ButtonHTMLAttributes, type ReactNode } from 'react'

type TextButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
}

export function TextButton({ children, ...props }: TextButtonProps) {
  return (
    <button className="text-button" {...props}>
      {children}
    </button>
  )
}
