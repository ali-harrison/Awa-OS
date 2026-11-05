'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface SlideOverProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  width?: 'sm' | 'md' | 'lg'
}

const widthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export function SlideOver({ open, onClose, title, children, width = 'md' }: SlideOverProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      window.addEventListener('keydown', handler)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-fade-in bg-ink/70 backdrop-blur-[3px]"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={[
          'relative w-full animate-slide-in bg-surface border-l border-line shadow-2xl',
          'flex flex-col h-full',
          widthClasses[width],
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line flex-shrink-0">
          <h2 className="font-display text-xl text-bone">
            {title}
          </h2>
          <Button size="sm" variant="ghost" onClick={onClose} type="button">
            ✕
          </Button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  )
}
