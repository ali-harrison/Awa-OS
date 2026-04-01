'use client'

import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const baseInputClasses = [
  'w-full bg-[#111111] text-[#F5F0E8]',
  'border border-[#2A2A2A] hover:border-[#3A3A3A] focus:border-[#C9963A]',
  'text-sm font-mono',
  'px-3 py-2 h-9',
  'placeholder:text-[#555050]',
  'outline-none',
  'transition-colors duration-150',
  'disabled:opacity-40 disabled:cursor-not-allowed',
].join(' ')

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-mono text-[#8A8580] uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            baseInputClasses,
            error ? 'border-[#E05252] focus:border-[#E05252]' : '',
            className,
          ].join(' ')}
          {...props}
        />
        {error && <p className="text-xs font-mono text-[#E05252]">{error}</p>}
        {hint && !error && <p className="text-xs font-mono text-[#555050]">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-mono text-[#8A8580] uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={[
            'w-full bg-[#111111] text-[#F5F0E8]',
            'border border-[#2A2A2A] hover:border-[#3A3A3A] focus:border-[#C9963A]',
            'text-sm font-mono',
            'px-3 py-2',
            'placeholder:text-[#555050]',
            'outline-none resize-y min-h-[80px]',
            'transition-colors duration-150',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            error ? 'border-[#E05252] focus:border-[#E05252]' : '',
            className,
          ].join(' ')}
          {...props}
        />
        {error && <p className="text-xs font-mono text-[#E05252]">{error}</p>}
        {hint && !error && <p className="text-xs font-mono text-[#555050]">{hint}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, className = '', id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-mono text-[#8A8580] uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={[
            baseInputClasses,
            'cursor-pointer',
            'bg-[#111111]',
            error ? 'border-[#E05252] focus:border-[#E05252]' : '',
            className,
          ].join(' ')}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#111111] text-[#F5F0E8]">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs font-mono text-[#E05252]">{error}</p>}
        {hint && !error && <p className="text-xs font-mono text-[#555050]">{hint}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
