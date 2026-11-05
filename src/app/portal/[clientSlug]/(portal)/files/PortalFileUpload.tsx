'use client'

import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FILES_BUCKET } from '@/lib/storage'
import { createPortalUploadAction, recordPortalUploadAction } from './actions'

export function PortalFileUpload({ clientSlug }: { clientSlug: string }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleUpload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const ticket = await createPortalUploadAction(clientSlug, file.name)
      if ('error' in ticket) {
        setError(ticket.error)
        return
      }

      const { error: uploadError } = await createClient()
        .storage.from(FILES_BUCKET)
        .uploadToSignedUrl(ticket.path, ticket.token, file)

      if (uploadError) {
        setError(uploadError.message)
        return
      }

      const saved = await recordPortalUploadAction(clientSlug, ticket.path, file.name)
      if (saved.error) {
        setError(saved.error)
        return
      }

      router.refresh()
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const file = e.dataTransfer.files?.[0]
          if (file) handleUpload(file)
        }}
        disabled={uploading}
        className={[
          'flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 transition-colors duration-150',
          dragging ? 'border-amber bg-amber/5' : 'border-line-strong hover:border-amber',
        ].join(' ')}
      >
        <Upload size={22} className={uploading ? 'text-amber' : 'text-dim'} />
        <span className={`text-sm ${uploading ? 'text-amber' : 'text-muted'}`}>
          {uploading ? 'Uploading…' : 'Drop a file or click to browse'}
        </span>
      </button>
      <input
        ref={fileRef}
        type="file"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
        disabled={uploading}
        className="hidden"
      />
      {error && <p className="mt-2 text-sm text-coral">{error}</p>}
    </div>
  )
}
