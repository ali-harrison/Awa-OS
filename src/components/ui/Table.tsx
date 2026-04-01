import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'

interface TableProps extends HTMLAttributes<HTMLTableElement> {}

export function Table({ className = '', children, ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={['w-full border-collapse text-sm font-mono', className].join(' ')}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

export function TableHead({ className = '', children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={className} {...props}>
      {children}
    </thead>
  )
}

export function TableBody({ className = '', children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  )
}

export function TableRow({ className = '', children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={[
        'border-b border-[#1A1A1A]',
        'hover:bg-[#111111] transition-colors duration-100',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </tr>
  )
}

export function TableHeader({
  className = '',
  children,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={[
        'text-left text-xs text-[#555050] font-mono font-medium uppercase tracking-wide',
        'px-4 py-2.5 border-b border-[#2A2A2A]',
        'whitespace-nowrap',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </th>
  )
}

export function TableCell({
  className = '',
  children,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={['px-4 py-3 text-[#F5F0E8]', className].join(' ')}
      {...props}
    >
      {children}
    </td>
  )
}

/** Empty state row spanning all columns */
export function TableEmpty({
  colSpan,
  message = 'No data',
}: {
  colSpan: number
  message?: string
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-8 text-center text-sm font-mono text-[#555050]"
      >
        {message}
      </td>
    </tr>
  )
}
