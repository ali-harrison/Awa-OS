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
        className="absolute inset-0 bg-[#0A0A0A]/75 transition-opacity duration-150"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={[
          'relative w-full bg-[#111111] border-l border-[#1A1A1A]',
          'flex flex-col h-full',
          widthClasses[width],
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A1A1A] flex-shrink-0">
          <h2 className="text-[#F5F0E8] font-mono text-sm font-medium uppercase tracking-widest">
            {title}
          </h2>
          <Button size="sm" variant="ghost" onClick={onClose} type="button">
            ✕
          </Button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {children}
        </div>
      </div>
    </div>
  )
}
