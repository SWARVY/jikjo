'use client'

import { Toolbar } from '@base-ui/react/toolbar'
import type { ReactNode } from 'react'

interface EditorToolbarProps {
  children: ReactNode
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

export function EditorToolbar({
  children,
  className,
  orientation = 'horizontal',
}: EditorToolbarProps) {
  return (
    <Toolbar.Root orientation={orientation} className={className}>
      {children}
    </Toolbar.Root>
  )
}

interface ToolbarButtonProps {
  onClick?: () => void
  disabled?: boolean
  children: ReactNode
  className?: string
  'aria-label'?: string
  'data-active'?: boolean
}

export function ToolbarButton({
  onClick,
  disabled,
  children,
  className,
  'aria-label': ariaLabel,
  'data-active': dataActive,
}: ToolbarButtonProps) {
  return (
    <Toolbar.Button
      onClick={onClick}
      disabled={disabled}
      className={className}
      aria-label={ariaLabel}
      data-active={dataActive}
    >
      {children}
    </Toolbar.Button>
  )
}

export function ToolbarSeparator({ className }: { className?: string }) {
  return <Toolbar.Separator className={className} />
}

interface ToolbarGroupProps {
  children: ReactNode
  className?: string
  disabled?: boolean
}

export function ToolbarGroup({ children, className, disabled }: ToolbarGroupProps) {
  return (
    <Toolbar.Group className={className} disabled={disabled}>
      {children}
    </Toolbar.Group>
  )
}
