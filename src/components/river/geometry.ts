// The awa: one river shape shared by the dashboard map, the client journey and the login
// screen. Coordinates are in a 1000×160 box. Everything is rounded so the server and the
// browser print identical strings.

export const RIVER_WIDTH = 1000
export const RIVER_HEIGHT = 160

const round = (n: number) => Math.round(n * 10) / 10

/** Centre line of the river at `t` (0 = source, 1 = sea). */
function centreY(t: number): number {
  const meander = Math.sin(t * Math.PI * 2.6 + 0.5) * 36
  const ripple = Math.sin(t * Math.PI * 6.1 + 1.2) * 11
  return RIVER_HEIGHT / 2 + meander + ripple
}

/** The river starts as a stream and widens as it nears the sea. */
function riverWidth(t: number): number {
  return 5 + 45 * t ** 1.4
}

function trace(offset: (t: number) => number, steps = 96): [number, number][] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps
    return [round(t * RIVER_WIDTH), round(centreY(t) + offset(t))]
  })
}

const toPath = (points: [number, number][]) =>
  points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ')

export const CENTRE_PATH = toPath(trace(() => 0))
export const UPPER_FLOW_PATH = toPath(trace((t) => -riverWidth(t) * 0.26))
export const LOWER_FLOW_PATH = toPath(trace((t) => riverWidth(t) * 0.26))

/** The water itself, as a closed shape between the two banks. */
export const BODY_PATH = `${toPath(trace((t) => -riverWidth(t) / 2))} ${toPath(
  trace((t) => riverWidth(t) / 2).reverse()
).replace('M', 'L')} Z`

/** A position on the river as percentages, for placing HTML on top of the stretched SVG. */
export function pointOnRiver(t: number) {
  return { left: round(t * 100), top: round((centreY(t) / RIVER_HEIGHT) * 100) }
}

/** Where stage `index` of `total` sits along the river, clear of both ends. */
export function stageT(index: number, total: number): number {
  return 0.045 + (index / (total - 1)) * 0.91
}

/** Gentle vertical meander for the sidebar: x offset (px) at `y` px down the nav. */
export function sidebarX(y: number): number {
  return round(9 + Math.sin(y / 46) * 4)
}

export function sidebarPath(height: number): string {
  const points: [number, number][] = []
  for (let y = 0; y <= height; y += 6) points.push([sidebarX(y), y])
  return toPath(points)
}
