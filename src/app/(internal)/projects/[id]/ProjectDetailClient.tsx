'use client'

import { useState, useActionState, useTransition, useRef } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import {
  createTaskAction,
  updateTaskStatusAction,
  createEventAction,
  saveNotesAction,
  updateStatusAction,
  createFileRecordAction,
} from './actions'
import { NEXT_ACTIONS } from '@/types'
import type { Project, Client, Task, ProjectFile, CalendarEvent, ProjectStatus, FileType, CalendarEventType } from '@/types'

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'questionnaire_sent', label: 'Questionnaire Sent' },
  { value: 'questionnaire_received', label: 'Questionnaire Received' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'contract_sent', label: 'Contract Sent' },
  { value: 'deposit_pending', label: 'Deposit Pending' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'complete', label: 'Complete' },
]

const FILE_TYPE_OPTIONS: { value: FileType; label: string }[] = [
  { value: 'document', label: 'Document' },
  { value: 'image', label: 'Image' },
  { value: 'brand_asset', label: 'Brand Asset' },
  { value: 'contract', label: 'Contract' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'other', label: 'Other' },
]

const EVENT_TYPE_OPTIONS: { value: CalendarEventType; label: string }[] = [
  { value: 'deadline', label: 'Deadline' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'reminder', label: 'Reminder' },
]

type Tab = 'tasks' | 'files' | 'timeline' | 'notes' | 'questionnaire'

function formatNZD(value: number) {
  return new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', minimumFractionDigits: 0 }).format(value)
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────

function TasksTab({ tasks, projectId }: { tasks: Task[]; projectId: string }) {
  const [taskState, taskAction, taskPending] = useActionState(createTaskAction, null)
  const [, startTransition] = useTransition()

  return (
    <div className="flex flex-col gap-4">
      {/* Task list */}
      {tasks.length === 0 ? (
        <p className="text-[#555050] font-mono text-sm py-4">No tasks yet.</p>
      ) : (
        <div className="border border-[#1A1A1A] divide-y divide-[#1A1A1A]">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={() =>
                  startTransition(() =>
                    updateTaskStatusAction(
                      t.id,
                      projectId,
                      t.status === 'done' ? 'todo' : 'done'
                    )
                  )
                }
                className={[
                  'w-4 h-4 border flex-shrink-0 flex items-center justify-center cursor-pointer transition-colors duration-100',
                  t.status === 'done'
                    ? 'border-[#4CAF7D] bg-[#4CAF7D11] text-[#4CAF7D]'
                    : 'border-[#2A2A2A] hover:border-[#4CAF7D]',
                ].join(' ')}
              >
                {t.status === 'done' && <span className="text-[9px]">✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <p className={['font-mono text-sm', t.status === 'done' ? 'text-[#555050] line-through' : 'text-[#F5F0E8]'].join(' ')}>
                  {t.title}
                </p>
                {t.due_date && (
                  <p className="text-[#555050] font-mono text-xs mt-0.5">
                    Due {new Date(t.due_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={t.status as 'todo' | 'in_progress' | 'done'}>{t.status.replace(/_/g, ' ')}</Badge>
                {t.visible_to_client && (
                  <Badge variant="muted">client visible</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add task form */}
      <div className="border border-[#1A1A1A] p-4">
        <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest mb-3">Add task</p>
        <form action={taskAction} className="flex flex-col gap-3">
          <input type="hidden" name="project_id" value={projectId} />
          <Input name="title" placeholder="Task title" required />
          <div className="grid grid-cols-2 gap-3">
            <Input name="due_date" type="date" label="Due date" />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-[#8A8580] uppercase tracking-wide">Client visible</label>
              <div className="flex items-center gap-2 h-9 px-3 border border-[#2A2A2A]">
                <input type="checkbox" name="visible_to_client" id="visible_to_client" className="accent-[#C9963A]" />
                <label htmlFor="visible_to_client" className="text-[#8A8580] font-mono text-xs cursor-pointer">
                  Show to client
                </label>
              </div>
            </div>
          </div>
          {taskState?.error && (
            <p className="text-[#E05252] font-mono text-xs">{taskState.error}</p>
          )}
          <Button type="submit" size="sm" loading={taskPending} variant="secondary">
            Add task
          </Button>
        </form>
      </div>
    </div>
  )
}

// ─── File Row (with download) ─────────────────────────────────────────────────

function FileRow({ file }: { file: ProjectFile }) {
  const [url, setUrl] = useState<string | null>(null)

  async function handleDownload() {
    const { createBrowserClient } = await import('@supabase/ssr')
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase.storage.from('project-files').createSignedUrl(file.storage_path, 60)
    if (data?.signedUrl) {
      const a = document.createElement('a')
      a.href = data.signedUrl
      a.download = file.name
      a.click()
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-[#F5F0E8] font-mono text-sm truncate">{file.name}</p>
        <p className="text-[#555050] font-mono text-xs mt-0.5">
          {new Date(file.created_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant="muted">{file.type.replace(/_/g, ' ')}</Badge>
        <Badge variant={file.uploaded_by === 'client' ? 'amber' : 'muted'}>{file.uploaded_by}</Badge>
        <button
          onClick={handleDownload}
          className="text-[#555050] hover:text-[#F5F0E8] font-mono text-[10px] transition-colors cursor-pointer"
        >
          ↓ download
        </button>
      </div>
    </div>
  )
}

// ─── Questionnaire Tab ────────────────────────────────────────────────────────

type QuestionnaireResponseWithTemplate = {
  responses: Record<string, string>
  submitted_at: string | null
  completed: boolean
  template: { questions: { id: string; question: string; order: number }[] }
}

function QuestionnaireTab({ response }: { response: QuestionnaireResponseWithTemplate | null }) {
  if (!response) {
    return (
      <div className="border border-[#1A1A1A] px-6 py-10 text-center">
        <p className="text-[#555050] font-mono text-sm">No questionnaire submitted yet.</p>
      </div>
    )
  }

  const questions = [...response.template.questions].sort((a, b) => a.order - b.order)

  return (
    <div className="flex flex-col gap-1">
      {response.submitted_at && (
        <p className="text-[#4CAF7D] font-mono text-xs mb-4">
          Submitted {new Date(response.submitted_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      )}
      {questions.map((q, i) => {
        const answer = response.responses[q.id]
        return (
          <div key={q.id} className="border-b border-[#1A1A1A] py-4">
            <p className="text-[#555050] font-mono text-xs mb-1">
              <span className="mr-2">{String(i + 1).padStart(2, '0')}.</span>{q.question}
            </p>
            <p className="text-[#F5F0E8] font-mono text-sm leading-relaxed pl-6">
              {answer?.trim() ? answer : <span className="text-[#2A2A2A]">No answer</span>}
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ─── Files Tab ────────────────────────────────────────────────────────────────

function FilesTab({ files, projectId, clientId, clientSlug }: {
  files: ProjectFile[]
  projectId: string
  clientId: string
  clientSlug: string
}) {
  const [uploading, setUploading] = useState(false)
  const [fileType, setFileType] = useState<FileType>('document')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { createBrowserClient } = await import('@supabase/ssr')
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const path = `${clientSlug}/${projectId}/${fileType}/${file.name}`
      const { error } = await supabase.storage.from('project-files').upload(path, file, { upsert: true })
      if (!error) {
        await createFileRecordAction({
          projectId,
          clientId,
          name: file.name,
          type: fileType,
          storagePath: path,
          uploadedBy: 'internal',
        })
      }
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {files.length === 0 ? (
        <p className="text-[#555050] font-mono text-sm py-4">No files yet.</p>
      ) : (
        <div className="border border-[#1A1A1A] divide-y divide-[#1A1A1A]">
          {files.map((f) => (
            <FileRow key={f.id} file={f} />
          ))}
        </div>
      )}

      <div className="border border-[#1A1A1A] p-4">
        <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest mb-3">Upload file</p>
        <div className="flex flex-col gap-3">
          <Select
            label="File type"
            options={FILE_TYPE_OPTIONS}
            value={fileType}
            onChange={(e) => setFileType(e.target.value as FileType)}
          />
          <div>
            <input
              ref={fileRef}
              type="file"
              onChange={handleUpload}
              disabled={uploading}
              className="font-mono text-sm text-[#8A8580] file:bg-[#1A1A1A] file:border file:border-[#2A2A2A] file:text-[#F5F0E8] file:font-mono file:text-xs file:px-3 file:py-1.5 file:mr-3 file:cursor-pointer disabled:opacity-40"
            />
          </div>
          {uploading && <p className="text-[#C9963A] font-mono text-xs">Uploading…</p>}
        </div>
      </div>
    </div>
  )
}

// ─── Timeline Tab ─────────────────────────────────────────────────────────────

function TimelineTab({ events, projectId }: { events: CalendarEvent[]; projectId: string }) {
  const [eventState, eventAction, eventPending] = useActionState(createEventAction, null)

  const eventTypeColors: Record<CalendarEventType, string> = {
    deadline: 'amber',
    meeting: 'default',
    milestone: 'green',
    reminder: 'muted',
  }

  return (
    <div className="flex flex-col gap-4">
      {events.length === 0 ? (
        <p className="text-[#555050] font-mono text-sm py-4">No events yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {events
            .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
            .map((ev) => (
              <div key={ev.id} className="flex gap-4 border-l-2 border-[#1A1A1A] pl-4 py-1">
                <div>
                  <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest">
                    {new Date(ev.start_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[#F5F0E8] font-mono text-sm">{ev.title}</p>
                    <Badge variant={eventTypeColors[ev.type] as 'amber' | 'green' | 'muted' | 'default'}>
                      {ev.type}
                    </Badge>
                    {ev.visible_to_client && <Badge variant="muted">client visible</Badge>}
                  </div>
                  {ev.description && (
                    <p className="text-[#8A8580] font-mono text-xs mt-0.5">{ev.description}</p>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      <div className="border border-[#1A1A1A] p-4">
        <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest mb-3">Add event</p>
        <form action={eventAction} className="flex flex-col gap-3">
          <input type="hidden" name="project_id" value={projectId} />
          <Input name="title" label="Title" required />
          <Select name="type" label="Type" defaultValue="milestone" options={EVENT_TYPE_OPTIONS} />
          <div className="grid grid-cols-2 gap-3">
            <Input name="start_at" type="datetime-local" label="Start" required />
            <Input name="end_at" type="datetime-local" label="End" required />
          </div>
          <Textarea name="description" label="Description" />
          <div className="flex items-center gap-2">
            <input type="checkbox" name="visible_to_client" id="event_visible" className="accent-[#C9963A]" />
            <label htmlFor="event_visible" className="text-[#8A8580] font-mono text-xs cursor-pointer">
              Visible to client
            </label>
          </div>
          {eventState?.error && (
            <p className="text-[#E05252] font-mono text-xs">{eventState.error}</p>
          )}
          <Button type="submit" size="sm" loading={eventPending} variant="secondary">
            Add event
          </Button>
        </form>
      </div>
    </div>
  )
}

// ─── Notes Tab ────────────────────────────────────────────────────────────────

function NotesTab({ notes, projectId }: { notes: string | null; projectId: string }) {
  const [value, setValue] = useState(notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleBlur() {
    if (value === (notes ?? '')) return
    setSaving(true)
    await saveNotesAction(projectId, value)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest">Internal notes</p>
        <Badge variant="red">Internal only — never shown to client</Badge>
        {saving && <span className="text-[#555050] font-mono text-[10px]">Saving…</span>}
        {saved && <span className="text-[#4CAF7D] font-mono text-[10px]">Saved</span>}
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="Internal notes about this project…"
        rows={12}
        className="w-full bg-[#111111] text-[#F5F0E8] border border-[#2A2A2A] hover:border-[#3A3A3A] focus:border-[#C9963A] font-mono text-sm px-3 py-2 outline-none resize-y placeholder:text-[#555050] transition-colors duration-150"
      />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProjectDetailClient({
  project,
  client,
  tasks,
  files,
  events,
  questionnaireResponse,
}: {
  project: Project
  client: Client
  tasks: Task[]
  files: ProjectFile[]
  events: CalendarEvent[]
  questionnaireResponse: QuestionnaireResponseWithTemplate | null
}) {
  const [tab, setTab] = useState<Tab>('tasks')
  const [, startTransition] = useTransition()

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'tasks', label: 'Tasks', count: tasks.length },
    { key: 'files', label: 'Files', count: files.length },
    { key: 'timeline', label: 'Timeline', count: events.length },
    { key: 'questionnaire', label: 'Questionnaire' },
    { key: 'notes', label: 'Notes' },
  ]

  return (
    <>
      {/* Next action banner */}
      <div className="border border-[#C9963A33] bg-[#C9963A0A] px-4 py-3 mb-5 flex items-start gap-3">
        <span className="text-[#C9963A] font-mono text-sm flex-shrink-0">→</span>
        <div>
          <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest mb-0.5">Next action</p>
          <p className="text-[#C9963A] font-mono text-sm">{NEXT_ACTIONS[project.status]}</p>
        </div>
        <div className="ml-auto flex-shrink-0">
          <select
            value={project.status}
            onChange={(e) =>
              startTransition(() => updateStatusAction(project.id, e.target.value as ProjectStatus))
            }
            className="bg-[#111111] text-[#F5F0E8] border border-[#2A2A2A] hover:border-[#3A3A3A] font-mono text-xs px-2 py-1 outline-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#111111]">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Project meta row */}
      <div className="grid grid-cols-2 md:grid-cols-4 border border-[#1A1A1A] divide-x divide-[#1A1A1A] mb-5">
        {[
          { label: 'Tier', value: project.tier ?? '—' },
          { label: 'Value', value: project.value != null ? formatNZD(project.value) : '—' },
          { label: 'Start', value: project.start_date ? new Date(project.start_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' }) : '—' },
          { label: 'Due', value: project.estimated_completion ? new Date(project.estimated_completion).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="px-4 py-3">
            <p className="text-[#555050] font-mono text-[10px] uppercase tracking-widest mb-1">{label}</p>
            <p className="text-[#F5F0E8] font-mono text-sm">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1A1A1A] mb-5">
        {TABS.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={[
              'px-4 py-2.5 font-mono text-xs uppercase tracking-wide border-b-2 transition-colors duration-100 cursor-pointer flex items-center gap-1.5',
              tab === key
                ? 'border-[#F5F0E8] text-[#F5F0E8]'
                : 'border-transparent text-[#555050] hover:text-[#8A8580]',
            ].join(' ')}
          >
            {label}
            {count !== undefined && (
              <span className={['text-[9px] font-mono', tab === key ? 'text-[#555050]' : 'text-[#2A2A2A]'].join(' ')}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'tasks' && <TasksTab tasks={tasks} projectId={project.id} />}
      {tab === 'files' && (
        <FilesTab
          files={files}
          projectId={project.id}
          clientId={project.client_id}
          clientSlug={client.slug}
        />
      )}
      {tab === 'timeline' && <TimelineTab events={events} projectId={project.id} />}
      {tab === 'questionnaire' && <QuestionnaireTab response={questionnaireResponse} />}
      {tab === 'notes' && <NotesTab notes={project.internal_notes} projectId={project.id} />}
    </>
  )
}
