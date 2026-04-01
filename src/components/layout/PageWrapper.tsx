import { HTMLAttributes } from 'react'

interface PageWrapperProps extends HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'full' | 'xl' | '2xl' | '4xl'
}

const maxWidthClasses = {
  full: 'w-full',
  xl: 'max-w-5xl',
  '2xl': 'max-w-6xl',
  '4xl': 'max-w-screen-xl',
}

export function PageWrapper({
  maxWidth = 'full',
  className = '',
  children,
  ...props
}: PageWrapperProps) {
  return (
    <main className="flex-1 overflow-y-auto bg-[#0A0A0A]">
      <div
        className={[maxWidthClasses[maxWidth], 'p-6', className].join(' ')}
        {...props}
      >
        {children}
      </div>
    </main>
  )
}

/** Full-bleed wrapper — no padding, scroll container only */
export function PageContainer({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <main
      className={['flex-1 overflow-y-auto bg-[#0A0A0A] flex flex-col', className].join(' ')}
      {...props}
    >
      {children}
    </main>
  )
}
