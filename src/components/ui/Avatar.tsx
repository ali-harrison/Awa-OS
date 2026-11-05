// A person's initials on a colour that stays theirs. Picked from the name, so it never
// changes between pages, and drawn from the brand palette rather than a generated rainbow.
const TINTS = [
  'bg-amber/15 text-amber',
  'bg-pounamu/15 text-pounamu',
  'bg-water/15 text-water',
  'bg-coral/15 text-coral',
  'bg-bone/10 text-bone',
]

const SIZES = {
  sm: 'size-7 text-[11px]',
  md: 'size-9 text-xs',
  lg: 'size-14 text-lg',
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/)
  const letters = words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0].slice(0, 2)
  return letters.toUpperCase()
}

function tintFor(name: string): string {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return TINTS[hash % TINTS.length]
}

export function Avatar({ name, size = 'md' }: { name: string; size?: keyof typeof SIZES }) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${SIZES[size]} ${tintFor(name)}`}
    >
      {initials(name)}
    </span>
  )
}
