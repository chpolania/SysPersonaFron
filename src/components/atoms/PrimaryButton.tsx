import { type ButtonHTMLAttributes, type ReactNode } from 'react'

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
}

export function PrimaryButton({
  children,
  ...props
}: PrimaryButtonProps) {
  return (
    <button className="primary-button" {...props}>
      {children} <span aria-hidden="true">→</span>
    </button>
  )
}
