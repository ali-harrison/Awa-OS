'use client'

import { useState, useActionState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { SlideOver } from '@/components/ui/SlideOver'
import { createCalendarEventAction, deleteCalendarEventAction } from './actions'
import type { CalendarEvent, Project, CalendarEventType } from '@/types'

type ViewMode = 'month' | 'week'

const EVENT_TYPE_OPTIONS: { value: CalendarEventType; label: string }[] = [
  { value: 'deadline', label: 'Deadline' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'reminder', label: 'Reminder' },
]

const eventColors: Record<CalendarEventType, string> = {
  deadline: 'bg-[#C9963A11] text-[#C9963A] border-[#C9963A33]',
  meeting: 'bg-[#1A1A1A] text-[#F5F0E8] border-[#2A2A2A]',
  milestone: 'bg-[#4CAF7D11] text-[#4CAF7D] border-[#4CAF7D33]',
  reminder: 'bg-transparent text-[#8A8580] border-[#1A1A1A]',
}

const eventDotColors: Record<CalendarEventType, string> = {
  deadline: 'bg-[#C9963A]',
  meeting: 'bg-[#F5F0E8]',
  milestone: 'bg-[#4CAF7D]',
  reminder: 'bg-[#555050]',
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
  projects,
  currentDate,
  onDayClick,
  onEventClick,
}: {
  events: (CalendarEvent & { project?: Pick<Project, 'name'> | null })[]
  projects: Project[]
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
      <div className="grid grid-cols-7 border-b border-[#1A1A1A] mb-0">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="px-2 py-2 text-center">
            <span className="text-[#555050] font-mono text-[9px] uppercase tracking-widest">{d}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} className="border-r border-b border-[#1A1A1A] min-h-[100px]" />
          const dayEvents = events.filter((e) => isSameDay(new Date(e.start_at), day))
          const isToday = isSameDay(day, today)
          const isWeekend = day.getDay() === 0 || day.getDay() === 6

          return (
            <div
              key={day.toISOString()}
              className={[
                'border-r border-b border-[#1A1A1A] min-h-[100px] p-1.5 cursor-pointer transition-colors duration-100',
                isWeekend ? 'bg-[#0A0A0A]' : '',
                'hover:bg-[#111111]',
              ].join(' ')}
              onClick={() => onDayClick(day)}
            >
              <p className={[
                'font-mono text-xs mb-1 w-5 h-5 flex items-center justify-center',
                isToday ? 'bg-[#F5F0E8] text-[#0A0A0A] font-bold' : 'text-[#555050]',
              ].join(' ')}>
                {day.getDate()}
              </p>
              <div className="flex flex-col gap-0.5">
                {dayEvents.slice(0, 3).map((ev) => (
                  <button
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick(ev) }}
                    className={[
                      'w-full text-left px-1.5 py-0.5 border font-mono text-[9px] truncate cursor-pointer',
                      eventColors[ev.type as CalendarEventType],
                    ].join(' ')}
                  >
                    {ev.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-[#555050] font-mono text-[9px] px-1">+{dayEvents.length - 3} more</p>
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
      <div className="grid grid-cols-7 border-b border-[#1A1A1A]">
        {days.map((day) => {
          const isToday = isSameDay(day, today)
          return (
            <div key={day.toISOString()} className="px-2 py-2 text-center border-r border-[#1A1A1A] last:border-r-0">
              <p className="text-[#555050] font-mono text-[9px] uppercase tracking-widest">
                {day.toLocaleDateString('en-NZ', { weekday: 'short' })}
              </p>
              <p className={[
                'font-mono text-sm mt-0.5 w-7 h-7 flex items-center justify-center mx-auto',
                isToday ? 'bg-[#F5F0E8] text-[#0A0A0A] font-bold' : 'text-[#F5F0E8]',
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
              className="border-r border-[#1A1A1A] last:border-r-0 p-2 cursor-pointer hover:bg-[#111111] transition-colors duration-100"
              onClick={() => onDayClick(day)}
            >
              <div className="flex flex-col gap-1.5">
                {dayEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick(ev) }}
                    className={[
                      'w-full text-left px-2 py-1.5 border font-mono text-xs cursor-pointer',
                      eventColors[ev.type as CalendarEventType],
                    ].join(' ')}
                  >
                    <p className="truncate">{ev.title}</p>
                    <p className="text-[10px] opacity-70">
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
  const [state, formAction, pending] = useActionState(createCalendarEventAction, null)

  const defaultStart = defaultDate
    ? `${defaultDate.getFullYear()}-${String(defaultDate.getMonth() + 1).padStart(2, '0')}-${String(defaultDate.getDate()).padStart(2, '0')}T09:00`
    : ''
  const defaultEnd = defaultDate
    ? `${defaultDate.getFullYear()}-${String(defaultDate.getMonth() + 1).padStart(2, '0')}-${String(defaultDate.getDate()).padStart(2, '0')}T10:00`
    : ''

  return (
    <form
      action={async (fd) => {
        const result = await createCalendarEventAction(null, fd)
        if (!result) onSuccess()
      }}
      className="flex flex-col gap-4"
    >
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
        <input type="checkbox" name="visible_to_client" id="cal_visible" className="accent-[#C9963A]" />
        <label htmlFor="cal_visible" className="text-[#8A8580] font-mono text-xs cursor-pointer">
          Visible to client
        </label>
      </div>
      {state?.error && (
        <p className="text-[#E05252] font-mono text-xs">{state.error}</p>
      )}
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

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Badge variant={event.type as 'deadline' | 'meeting' | 'milestone' | 'reminder'}>{event.type}</Badge>
        <p className="text-[#F5F0E8] font-mono text-base font-medium mt-2">{event.title}</p>
        {projectName && (
          <p className="text-[#555050] font-mono text-xs mt-1">{projectName}</p>
        )}
      </div>
      <div className="border border-[#1A1A1A] divide-y divide-[#1A1A1A]">
        <div className="px-3 py-2.5">
          <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest mb-1">Start</p>
          <p className="text-[#F5F0E8] font-mono text-sm">
            {new Date(event.start_at).toLocaleString('en-NZ', {
              weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest mb-1">End</p>
          <p className="text-[#F5F0E8] font-mono text-sm">
            {new Date(event.end_at).toLocaleString('en-NZ', {
              weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        {event.description && (
          <div className="px-3 py-2.5">
            <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest mb-1">Notes</p>
            <p className="text-[#8A8580] font-mono text-sm">{event.description}</p>
          </div>
        )}
        <div className="px-3 py-2.5">
          <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest mb-1">Client visible</p>
          <p className={event.visible_to_client ? 'text-[#4CAF7D] font-mono text-sm' : 'text-[#555050] font-mono text-sm'}>
            {event.visible_to_client ? 'Yes' : 'No'}
          </p>
        </div>
      </div>
      <Button variant="danger" loading={deleting} onClick={handleDelete}>
        Delete event
      </Button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type WithProject = CalendarEvent & { project?: Pick<Project, 'id' | 'name'> | null }

export function CalendarClient({
  events,
  projects,
}: {
  events: WithProject[]
  projects: Project[]
}) {
  const [view, setView] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [createOpen, setCreateOpen] = useState(false)
  const [defaultDate, setDefaultDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<WithProject | null>(null)

  function navigate(dir: -1 | 1) {
    const d = new Date(currentDate)
    if (view === 'month') {
      d.setMonth(d.getMonth() + dir)
    } else {
      d.setDate(d.getDate() + dir * 7)
    }
    setCurrentDate(d)
  }

  function handleDayClick(date: Date) {
    setDefaultDate(date)
    setCreateOpen(true)
  }

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]))

  return (
    <>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={() => navigate(-1)}>←</Button>
          <p className="text-[#F5F0E8] font-mono text-sm font-medium w-44 text-center">
            {view === 'month'
              ? formatMonthYear(currentDate)
              : `Week of ${currentDate.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}`}
          </p>
          <Button size="sm" variant="ghost" onClick={() => navigate(1)}>→</Button>
          <Button size="sm" variant="ghost" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-[#2A2A2A]">
            {(['month', 'week'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={[
                  'px-3 py-1 font-mono text-xs uppercase tracking-wide transition-colors duration-100 cursor-pointer',
                  view === v ? 'bg-[#1A1A1A] text-[#F5F0E8]' : 'text-[#555050] hover:text-[#F5F0E8]',
                ].join(' ')}
              >
                {v}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => { setDefaultDate(null); setCreateOpen(true) }}>
            + Event
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        {Object.entries(eventDotColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 ${color}`} />
            <span className="text-[#555050] font-mono text-[10px] uppercase tracking-widest">{type}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="border border-[#1A1A1A]">
        {view === 'month' ? (
          <MonthView
            events={events}
            projects={projects}
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

      {/* Create event */}
      <SlideOver open={createOpen} onClose={() => setCreateOpen(false)} title="New Event">
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
