'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        gradient:
          'bg-brand-gradient text-white border-none shadow-[0_4px_14px_rgba(147,51,234,.25)] hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(147,51,234,.35)]',
        dark:
          'bg-ink-900 text-white border-none hover:bg-ink-700 hover:-translate-y-px',
        ghost:
          'bg-white text-ink-700 border border-line hover:border-ink-400',
        icon:
          'bg-white text-ink-500 border border-line hover:border-ink-400',
      },
      size: {
        sm:   'h-8  px-3   rounded-[8px]  text-[11.5px]',
        md:   'h-9  px-4   rounded-[9px]  text-[13px]',
        lg:   'h-11 px-[22px] rounded-[10px] text-[13.5px]',
        icon: 'h-7  w-7    rounded-[7px]  text-[12px]',
      },
    },
    defaultVariants: { variant: 'dark', size: 'md' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    )
  }
)
Button.displayName = 'Button'
