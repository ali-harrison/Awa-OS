import { HTMLAttributes } from 'react'

export function PageWrapper({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className={['animate-rise px-5 pt-2 pb-10 md:px-8', className].join(' ')} {...props}>
        {children}
      </div>
    </main>
  )
}
