'use client'

import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const fieldClasses = [
  'w-full rounded-[10px] bg-ink text-bone text-sm',
  'border border-line-strong hover:border-dim',
  'focus:border-amber focus:ring-3 focus:ring-amber/15',
  'placeholder:text-dim outline-none',
  'transition-all duration-150',
  'disabled:opacity-40 disabled:cursor-not-allowed',
].join(' ')

const baseInputClasses = `${fieldClasses} h-10 px-3`
const labelClasses = 'text-[13px] font-medium text-muted'
const errorBorder = 'border-coral focus:border-coral focus:ring-coral/15'

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className={labelClasses}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            baseInputClasses,
            error ? errorBorder : '',
            className,
          ].join(' ')}
          {...props}
        />
        {error && <p className="text-xs text-coral">{error}</p>}
        {hint && !error && <p className="text-xs text-dim">{hint}</p>}
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
            className={labelClasses}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={[
            fieldClasses,
            'px-3 py-2 resize-y min-h-[88px]',
            error ? errorBorder : '',
            className,
          ].join(' ')}
          {...props}
        />
        {error && <p className="text-xs text-coral">{error}</p>}
        {hint && !error && <p className="text-xs text-dim">{hint}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export function FormError({ children }: { children: React.ReactNode }) {
  return <p className="rounded-[10px] bg-coral/10 px-3 py-2 text-sm text-coral">{children}</p>
}

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
            className={labelClasses}
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
            error ? errorBorder : '',
            className,
          ].join(' ')}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface text-bone">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-coral">{error}</p>}
        {hint && !error && <p className="text-xs text-dim">{hint}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
