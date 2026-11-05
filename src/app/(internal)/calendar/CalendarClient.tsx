'use client'

import { useState, useSyncExternalStore } from 'react'
import { Header } from '@/components/layout/Header'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormError, Input, Select, Textarea } from '@/components/ui/Input'
import { SlideOver } from '@/components/ui/SlideOver'
import { createCalendarEventAction, deleteCalendarEventAction } from './actions'
import { useFormSubmit } from '@/lib/use-form-submit'
import { localInputToISO } from '@/lib/format'
import { EVENT_TYPE_OPTIONS } from '@/types'
import type { CalendarEvent, Project, CalendarEventType } from '@/types'

type ViewMode = 'month' | 'week'

const eventColors: Record<CalendarEventType, string> = {
  deadline: 'bg-amber/12 text-amber',
  meeting: 'bg-water/12 text-water',
  milestone: 'bg-pounamu/12 text-pounamu',
  reminder: 'bg-bone/[0.06] text-muted',
}

const eventDotColors: Record<CalendarEventType, string> = {
  deadline: 'bg-amber',
  meeting: 'bg-water',
  milestone: 'bg-pounamu',
  reminder: 'bg-dim',
}

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' })
}

// ─── Month view ───────────────────────────────────────────────────────────────

function MonthView({
  events,
  currentDate,
  onDayClick,
  onEventClick,
}: {
  events: (CalendarEvent & { project?: Pick<Project, 'name'> | null })[]
  currentDate: Date
  onDayClick: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
}) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay() // 0 = Sun

  const days: (Date | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => new Date(year, month, i + 1)),
  ]

  // Pad to complete weeks
  while (days.length % 7 !== 0) days.push(null)

  const today = new Date()

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-line">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="px-2 py-2.5 text-center">
            <span className="eyebrow">{d}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} className="min-h-[108px] border-r border-b border-line bg-ink/40 [&:nth-child(7n)]:border-r-0" />
          const dayEvents = events.filter((e) => isSameDay(new Date(e.start_at), day))
          const isToday = isSameDay(day, today)
          const isWeekend = day.getDay() === 0 || day.getDay() === 6

          return (
            <div
              key={day.toISOString()}
              className={[
                'min-h-[108px] cursor-pointer border-r border-b border-line p-2 transition-colors duration-150 [&:nth-child(7n)]:border-r-0',
                isWeekend ? 'bg-ink/40' : '',
                'hover:bg-bone/[0.03]',
              ].join(' ')}
              onClick={() => onDayClick(day)}
            >
              <p className={[
                'mb-1 flex size-6 items-center justify-center rounded-full font-mono text-xs',
                isToday ? 'bg-amber font-semibold text-ink' : 'text-dim',
              ].join(' ')}>
                {day.getDate()}
              </p>
              <div className="flex flex-col gap-0.5">
                {dayEvents.slice(0, 3).map((ev) => (
                  <button
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick(ev) }}
                    className={[
                      'w-full cursor-pointer truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium transition-opacity hover:opacity-80',
                      eventColors[ev.type as CalendarEventType],
                    ].join(' ')}
                  >
                    {ev.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <p className="px-1 text-[11px] text-dim">+{dayEvents.length - 3} more</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Week view ────────────────────────────────────────────────────────────────

function WeekView({
  events,
  currentDate,
  onDayClick,
  onEventClick,
}: {
  events: (CalendarEvent & { project?: Pick<Project, 'name'> | null })[]
  currentDate: Date
  onDayClick: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
}) {
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    return d
  })

  const today = new Date()

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-line">
        {days.map((day) => {
          const isToday = isSameDay(day, today)
          return (
            <div key={day.toISOString()} className="border-r border-line px-2 py-2.5 text-center last:border-r-0">
              <p className="eyebrow">
                {day.toLocaleDateString('en-NZ', { weekday: 'short' })}
              </p>
              <p className={[
                'mx-auto mt-1 flex size-7 items-center justify-center rounded-full font-mono text-sm',
                isToday ? 'bg-amber font-semibold text-ink' : 'text-bone',
              ].join(' ')}>
                {day.getDate()}
              </p>
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-7 min-h-[400px]">
        {days.map((day) => {
          const dayEvents = events.filter((e) => isSameDay(new Date(e.start_at), day))
          return (
            <div
              key={day.toISOString()}
              className="cursor-pointer border-r border-line p-2 transition-colors duration-150 last:border-r-0 hover:bg-bone/[0.03]"
              onClick={() => onDayClick(day)}
            >
              <div className="flex flex-col gap-1.5">
                {dayEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick(ev) }}
                    className={[
                      'w-full cursor-pointer rounded-lg px-2 py-1.5 text-left text-xs font-medium',
                      eventColors[ev.type as CalendarEventType],
                    ].join(' ')}
                  >
                    <p className="truncate">{ev.title}</p>
                    <p className="font-mono text-[10px] opacity-70">
                      {new Date(ev.start_at).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Create event form ────────────────────────────────────────────────────────

function CreateEventForm({
  projects,
  defaultDate,
  onSuccess,
}: {
  projects: Project[]
  defaultDate: Date | null
  onSuccess: () => void
}) {
  const { onSubmit, error, pending } = useFormSubmit((fd) => {
    fd.set('start_at', localInputToISO(fd.get('start_at') as string))
    fd.set('end_at', localInputToISO(fd.get('end_at') as string))
    return createCalendarEventAction(fd)
  }, onSuccess)

  const defaultStart = defaultDate
    ? `${defaultDate.getFullYear()}-${String(defaultDate.getMonth() + 1).padStart(2, '0')}-${String(defaultDate.getDate()).padStart(2, '0')}T09:00`
    : ''
  const defaultEnd = defaultDate
    ? `${defaultDate.getFullYear()}-${String(defaultDate.getMonth() + 1).padStart(2, '0')}-${String(defaultDate.getDate()).padStart(2, '0')}T10:00`
    : ''

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input name="title" label="Title" required />
      <Select name="type" label="Type" defaultValue="milestone" options={EVENT_TYPE_OPTIONS} />
      <Select
        name="project_id"
        label="Project (optional)"
        options={[
          { value: '', label: 'No project' },
          ...projects.map((p) => ({ value: p.id, label: p.name })),
        ]}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input name="start_at" type="datetime-local" label="Start" required defaultValue={defaultStart} />
        <Input name="end_at" type="datetime-local" label="End" required defaultValue={defaultEnd} />
      </div>
      <Textarea name="description" label="Description" />
      <div className="flex items-center gap-2">
        <input type="checkbox" name="visible_to_client" id="cal_visible" className="accent-amber" />
        <label htmlFor="cal_visible" className="cursor-pointer text-[13px] text-muted">
          Visible to client
        </label>
      </div>
      {error && <FormError>{error}</FormError>}
      <Button type="submit" loading={pending}>Add event</Button>
    </form>
  )
}

// ─── Event detail slide-over ──────────────────────────────────────────────────

function EventDetail({
  event,
  projectName,
  onClose,
}: {
  event: CalendarEvent
  projectName: string | null
  onClose: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await deleteCalendarEventAction(event.id)
    onClose()
  }

  const when = (value: string) =>
    new Date(value).toLocaleString('en-NZ', {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    })

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Badge variant={event.type} dot>{event.type}</Badge>
        <p className="mt-3 font-display text-2xl text-bone">{event.title}</p>
        {projectName && <p className="mt-1 text-sm text-dim">{projectName}</p>}
      </div>
      <dl className="divide-y divide-line rounded-xl border border-line">
        <div className="px-4 py-3">
          <dt className="eyebrow mb-1">Start</dt>
          <dd className="text-sm text-bone">{when(event.start_at)}</dd>
        </div>
        <div className="px-4 py-3">
          <dt className="eyebrow mb-1">End</dt>
          <dd className="text-sm text-bone">{when(event.end_at)}</dd>
        </div>
        {event.description && (
          <div className="px-4 py-3">
            <dt className="eyebrow mb-1">Notes</dt>
            <dd className="text-sm text-muted">{event.description}</dd>
          </div>
        )}
        <div className="px-4 py-3">
          <dt className="eyebrow mb-1">Client visible</dt>
          <dd className={`text-sm ${event.visible_to_client ? 'text-pounamu' : 'text-dim'}`}>
            {event.visible_to_client ? 'Yes' : 'No'}
          </dd>
        </div>
      </dl>
      <Button variant="danger" loading={deleting} onClick={handleDelete}>
        Delete event
      </Button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type WithProject = CalendarEvent & { project?: Pick<Project, 'id' | 'name'> | null }

const subscribeToNothing = () => () => {}

/** False during server render and hydration. The grid depends on the browser's "today" and time zone, so it can only render client-side. */
function useHasMounted() {
  return useSyncExternalStore(subscribeToNothing, () => true, () => false)
}

export function CalendarClient({
  events,
  projects,
}: {
  events: WithProject[]
  projects: Project[]
}) {
  const mounted = useHasMounted()
  const [view, setView] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [createOpen, setCreateOpen] = useState(false)
  const [defaultDate, setDefaultDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<WithProject | null>(null)

  function navigate(dir: -1 | 1) {
    if (view === 'month') {
      // Via the 1st: Jan 31 + 1 month would otherwise roll over into March
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + dir, 1))
    } else {
      const d = new Date(currentDate)
      d.setDate(d.getDate() + dir * 7)
      setCurrentDate(d)
    }
  }

  function handleDayClick(date: Date) {
    setDefaultDate(date)
    setCreateOpen(true)
  }

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]))

  return (
    <>
      <Header
        title="Calendar"
        subtitle="Events & deadlines"
        actions={<Button size="sm" onClick={() => { setDefaultDate(null); setCreateOpen(true) }}>+ Event</Button>}
      />
      <PageWrapper>
        {!mounted ? (
          <div className="min-h-[640px]" />
        ) : (
          <>
            {/* Controls */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" aria-label="Previous" onClick={() => navigate(-1)}>←</Button>
                <p className="w-48 text-center font-display text-xl text-bone">
                  {view === 'month'
                    ? formatMonthYear(currentDate)
                    : `Week of ${currentDate.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}`}
                </p>
                <Button size="sm" variant="ghost" aria-label="Next" onClick={() => navigate(1)}>→</Button>
                <Button size="sm" variant="ghost" onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden items-center gap-3 lg:flex">
                  {Object.entries(eventDotColors).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-1.5">
                      <span className={`size-2 rounded-full ${color}`} />
                      <span className="text-xs text-dim capitalize">{type}</span>
                    </div>
                  ))}
                </div>
                <div className="flex rounded-lg bg-bone/[0.06] p-0.5">
                  {(['month', 'week'] as ViewMode[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={[
                        'cursor-pointer rounded-md px-3 py-1 text-[13px] capitalize transition-colors duration-150',
                        view === v ? 'bg-overlay font-medium text-bone' : 'text-dim hover:text-bone',
                      ].join(' ')}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Calendar grid */}
            <Card padding="none" className="overflow-x-auto">
              <div className="min-w-[640px]">
                {view === 'month' ? (
                  <MonthView
                    events={events}
                    currentDate={currentDate}
                    onDayClick={handleDayClick}
                    onEventClick={(ev) => setSelectedEvent(ev as WithProject)}
                  />
                ) : (
                  <WeekView
                    events={events}
                    currentDate={currentDate}
                    onDayClick={handleDayClick}
                    onEventClick={(ev) => setSelectedEvent(ev as WithProject)}
                  />
                )}
              </div>
            </Card>
          </>
        )}
      </PageWrapper>

      {/* Create event */}
      <SlideOver open={createOpen} onClose={() => setCreateOpen(false)} title="New event">
        <CreateEventForm
          projects={projects}
          defaultDate={defaultDate}
          onSuccess={() => setCreateOpen(false)}
        />
      </SlideOver>

      {/* Event detail */}
      {selectedEvent && (
        <SlideOver
          open={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title="Event"
        >
          <EventDetail
            event={selectedEvent}
            projectName={selectedEvent.project?.name ?? (selectedEvent.project_id ? (projectMap[selectedEvent.project_id]?.name ?? null) : null)}
            onClose={() => setSelectedEvent(null)}
          />
        </SlideOver>
      )}
    </>
  )
}
