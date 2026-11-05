'use client'

import { useState, useTransition, useRef } from 'react'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, EmptyState } from '@/components/ui/Card'
import { FormError, Input, Select, Textarea } from '@/components/ui/Input'
import { RiverJourney } from '@/components/river/RiverJourney'
import {
  createTaskAction,
  updateTaskStatusAction,
  saveNotesAction,
  updateStatusAction,
  createFileRecordAction,
} from './actions'
import { createCalendarEventAction } from '../../calendar/actions'
import { createClient } from '@/lib/supabase/client'
import { useFormSubmit } from '@/lib/use-form-submit'
import { formatDate, formatDollars, localInputToISO } from '@/lib/format'
import { FILES_BUCKET, storageFileName } from '@/lib/storage'
import { EVENT_TYPE_OPTIONS, NEXT_ACTIONS, PROJECT_STATUS_OPTIONS, STAGE_LABELS } from '@/types'
import type { Project, Client, Task, ProjectFile, CalendarEvent, ProjectStatus, FileType, CalendarEventType } from '@/types'

const FILE_TYPE_OPTIONS: { value: FileType; label: string }[] = [
  { value: 'document', label: 'Document' },
  { value: 'image', label: 'Image' },
  { value: 'brand_asset', label: 'Brand Asset' },
  { value: 'contract', label: 'Contract' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'other', label: 'Other' },
]

type Tab = 'tasks' | 'files' | 'timeline' | 'notes' | 'questionnaire'

// ─── Tasks Tab ────────────────────────────────────────────────────────────────

function TasksTab({ tasks, projectId }: { tasks: Task[]; projectId: string }) {
  const addTask = useFormSubmit(createTaskAction)
  const [, startTransition] = useTransition()

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
      {tasks.length === 0 ? (
        <EmptyState title="No tasks yet" />
      ) : (
        <Card padding="none" className="divide-y divide-line overflow-hidden">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-5 py-3">
              <button
                aria-label={t.status === 'done' ? `Mark "${t.title}" as not done` : `Mark "${t.title}" as done`}
                onClick={() =>
                  startTransition(() =>
                    updateTaskStatusAction(t.id, projectId, t.status === 'done' ? 'todo' : 'done')
                  )
                }
                className={[
                  'flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors duration-150',
                  t.status === 'done'
                    ? 'border-pounamu bg-pounamu/15 text-pounamu'
                    : 'border-line-strong hover:border-pounamu',
                ].join(' ')}
              >
                {t.status === 'done' && <Check size={13} strokeWidth={3} />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={['text-sm', t.status === 'done' ? 'text-dim line-through' : 'text-bone'].join(' ')}>
                  {t.title}
                </p>
                {t.due_date && <p className="mt-0.5 text-[13px] text-dim">Due {formatDate(t.due_date)}</p>}
              </div>
              {t.visible_to_client && <Badge variant="blue">Client visible</Badge>}
            </div>
          ))}
        </Card>
      )}

      <Card>
        <p className="eyebrow mb-3">Add task</p>
        <form onSubmit={addTask.onSubmit} className="flex flex-col gap-3">
          <input type="hidden" name="project_id" value={projectId} />
          <Input name="title" placeholder="Task title" required />
          <Input name="due_date" type="date" label="Due date" />
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted">
            <input type="checkbox" name="visible_to_client" className="accent-amber" />
            Show to client
          </label>
          {addTask.error && <FormError>{addTask.error}</FormError>}
          <Button type="submit" size="sm" loading={addTask.pending} variant="secondary">
            Add task
          </Button>
        </form>
      </Card>
    </div>
  )
}

// ─── File Row (with download) ─────────────────────────────────────────────────

function FileRow({ file }: { file: ProjectFile }) {
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    setError(null)
    const { data, error: signError } = await createClient()
      .storage.from(FILES_BUCKET)
      .createSignedUrl(file.storage_path, 60, { download: file.name })

    if (signError || !data) setError('Download failed.')
    else window.location.href = data.signedUrl
  }

  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-bone">{file.name}</p>
        <p className="mt-0.5 font-mono text-xs text-dim">{formatDate(file.created_at, 'medium')}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant="muted">{file.type.replace(/_/g, ' ')}</Badge>
        <Badge variant={file.uploaded_by === 'client' ? 'amber' : 'muted'}>{file.uploaded_by}</Badge>
        {error && <span className="text-xs text-coral">{error}</span>}
        <button
          onClick={handleDownload}
          className="cursor-pointer text-[13px] text-dim transition-colors hover:text-bone"
        >
          Download
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
  if (!response) return <EmptyState title="No questionnaire submitted yet" />

  const questions = [...response.template.questions].sort((a, b) => a.order - b.order)

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="border-b border-line px-5 py-3">
        {response.submitted_at && (
          <p className="text-[13px] text-pounamu">Submitted {formatDate(response.submitted_at, 'long')}</p>
        )}
        {!response.completed && (
          <p className="text-[13px] text-amber">Draft — the client has started this but hasn&apos;t submitted it yet.</p>
        )}
      </div>
      <div className="divide-y divide-line">
        {questions.map((q, i) => {
          const answer = response.responses[q.id]
          return (
            <div key={q.id} className="px-5 py-4">
              <p className="mb-1 text-[13px] text-dim">
                <span className="mr-2 font-mono text-xs">{String(i + 1).padStart(2, '0')}</span>
                {q.question}
              </p>
              <p className="text-sm leading-relaxed text-bone">
                {answer?.trim() ? answer : <span className="text-dim/70">No answer</span>}
              </p>
            </div>
          )
        })}
      </div>
    </Card>
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
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [fileType, setFileType] = useState<FileType>('document')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const path = `${clientSlug}/${projectId}/${fileType}/${storageFileName(file.name)}`
      const { error } = await createClient().storage.from(FILES_BUCKET).upload(path, file)
      if (error) {
        setUploadError(error.message)
        return
      }
      const saved = await createFileRecordAction({
        projectId,
        clientId,
        name: file.name,
        type: fileType,
        storagePath: path,
      })
      if (saved.error) setUploadError(saved.error)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
      {files.length === 0 ? (
        <EmptyState title="No files yet" />
      ) : (
        <Card padding="none" className="divide-y divide-line overflow-hidden">
          {files.map((f) => (
            <FileRow key={f.id} file={f} />
          ))}
        </Card>
      )}

      <Card>
        <p className="eyebrow mb-3">Upload file</p>
        <div className="flex flex-col gap-3">
          <Select
            label="File type"
            options={FILE_TYPE_OPTIONS}
            value={fileType}
            onChange={(e) => setFileType(e.target.value as FileType)}
          />
          <input
            ref={fileRef}
            type="file"
            onChange={handleUpload}
            disabled={uploading}
            className="text-[13px] text-muted file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-bone/[0.08] file:px-3 file:py-1.5 file:text-[13px] file:text-bone disabled:opacity-40"
          />
          {uploading && <p className="text-[13px] text-amber">Uploading…</p>}
          {uploadError && <FormError>{uploadError}</FormError>}
        </div>
      </Card>
    </div>
  )
}

// ─── Timeline Tab ─────────────────────────────────────────────────────────────

function TimelineTab({ events, projectId }: { events: CalendarEvent[]; projectId: string }) {
  const addEvent = useFormSubmit((fd) => {
    fd.set('start_at', localInputToISO(fd.get('start_at') as string))
    fd.set('end_at', localInputToISO(fd.get('end_at') as string))
    return createCalendarEventAction(fd)
  })

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
      {events.length === 0 ? (
        <EmptyState title="No events yet" />
      ) : (
        <Card padding="none" className="divide-y divide-line overflow-hidden">
          {events.map((ev) => (
            <div key={ev.id} className="flex gap-4 px-5 py-3">
              <p className="w-14 shrink-0 pt-0.5 font-mono text-xs text-amber">{formatDate(ev.start_at)}</p>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm text-bone">{ev.title}</p>
                  <Badge variant={ev.type as CalendarEventType}>{ev.type}</Badge>
                  {ev.visible_to_client && <Badge variant="blue">Client visible</Badge>}
                </div>
                {ev.description && <p className="mt-0.5 text-[13px] text-dim">{ev.description}</p>}
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card>
        <p className="eyebrow mb-3">Add event</p>
        <form onSubmit={addEvent.onSubmit} className="flex flex-col gap-3">
          <input type="hidden" name="project_id" value={projectId} />
          <Input name="title" label="Title" required />
          <Select name="type" label="Type" defaultValue="milestone" options={EVENT_TYPE_OPTIONS} />
          <Input name="start_at" type="datetime-local" label="Start" required />
          <Input name="end_at" type="datetime-local" label="End" required />
          <Textarea name="description" label="Description" />
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted">
            <input type="checkbox" name="visible_to_client" className="accent-amber" />
            Visible to client
          </label>
          {addEvent.error && <FormError>{addEvent.error}</FormError>}
          <Button type="submit" size="sm" loading={addEvent.pending} variant="secondary">
            Add event
          </Button>
        </form>
      </Card>
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
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <p className="eyebrow">Internal notes</p>
        <Badge variant="red" className="normal-case">Never shown to the client</Badge>
        {saving && <span className="text-xs text-dim">Saving…</span>}
        {saved && <span className="text-xs text-pounamu">Saved</span>}
      </div>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="Internal notes about this project…"
        rows={12}
      />
    </Card>
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

  const facts = [
    { label: 'Tier', value: project.tier?.replace('tier', 'Tier ') ?? '—' },
    { label: 'Value', value: project.value != null ? formatDollars(project.value) : '—' },
    { label: 'Start', value: project.start_date ? formatDate(project.start_date) : '—' },
    { label: 'Due', value: project.estimated_completion ? formatDate(project.estimated_completion, 'medium') : '—' },
  ]

  return (
    <>
      {/* Where it is on the river, and what happens next */}
      <Card padding="none" className="mb-4 overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 px-5 pt-4">
          <div className="min-w-0 flex-1">
            <p className="eyebrow mb-1">Next action</p>
            <p className="font-display text-xl text-bone">{NEXT_ACTIONS[project.status]}</p>
          </div>
          <select
            aria-label="Project status"
            value={project.status}
            onChange={(e) =>
              startTransition(() => updateStatusAction(project.id, e.target.value as ProjectStatus))
            }
            className="h-9 cursor-pointer rounded-lg border border-line-strong bg-ink px-2.5 text-[13px] text-bone outline-none transition-colors hover:border-dim"
          >
            {PROJECT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-surface">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="px-5 pt-2 pb-4">
          <RiverJourney status={project.status} height="h-[110px]" marker={STAGE_LABELS[project.status]} />
        </div>
        <div className="grid grid-cols-2 border-t border-line md:grid-cols-4">
          {facts.map(({ label, value }) => (
            <div key={label} className="px-5 py-3">
              <p className="eyebrow mb-1">{label}</p>
              <p className="font-mono text-sm text-bone">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={[
              '-mb-px flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition-colors duration-150',
              tab === key ? 'border-amber font-medium text-bone' : 'border-transparent text-dim hover:text-muted',
            ].join(' ')}
          >
            {label}
            {count !== undefined && <span className="font-mono text-xs text-dim">{count}</span>}
          </button>
        ))}
      </div>

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
