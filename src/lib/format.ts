// Display formatting. Dates are pinned to NZ time so server-rendered and browser-rendered
// output agree: the server runs in UTC, which is a different calendar day for half of each day.

const NZ_TIME_ZONE = 'Pacific/Auckland'

/** Format integer cents (invoice amounts) as NZD. */
export function formatNZD(cents: number, fractionDigits = 2): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(cents / 100)
}

/** Format a dollar amount (project values). Cents are only shown when there are some. */
export function formatDollars(dollars: number): string {
  return formatNZD(dollars * 100, Number.isInteger(dollars) ? 0 : 2)
}

/** Short form for tight spaces: $950, $3.5k. Takes cents. */
export function formatCompactNZD(cents: number): string {
  const dollars = cents / 100
  if (dollars < 1000) return `$${Math.round(dollars)}`
  const thousands = dollars / 1000
  return `$${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}k`
}

const DATE_STYLES = {
  short: { day: 'numeric', month: 'short' },
  medium: { day: 'numeric', month: 'short', year: 'numeric' },
  long: { day: 'numeric', month: 'long', year: 'numeric' },
  full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
} as const

export function formatDate(value: string | Date, style: keyof typeof DATE_STYLES = 'short'): string {
  return new Date(value).toLocaleDateString('en-NZ', { ...DATE_STYLES[style], timeZone: NZ_TIME_ZONE })
}

export function formatDateTime(value: string | Date): string {
  return new Date(value).toLocaleString('en-NZ', {
    ...DATE_STYLES.medium,
    hour: '2-digit',
    minute: '2-digit',
    timeZone: NZ_TIME_ZONE,
  })
}

/** Calendar date in NZ as YYYY-MM-DD — sorts and compares as a plain string. */
export function nzDate(value: string | Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: NZ_TIME_ZONE }).format(new Date(value))
}

/** Te reo greeting for the time of day in NZ. */
export function nzGreeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-NZ', { hour: 'numeric', hourCycle: 'h23', timeZone: NZ_TIME_ZONE }).format(new Date())
  )
  return hour >= 4 && hour < 12 ? 'Mōrena' : 'Kia ora'
}

export function daysSince(value: string): number {
  return Math.floor((Date.now() - new Date(value).getTime()) / 86400000)
}

/**
 * A datetime-local input has no time zone. Convert it here in the browser, where "local"
 * means the user's own clock — the server would read 9am as 9am UTC.
 */
export function localInputToISO(value: string): string {
  return new Date(value).toISOString()
}
