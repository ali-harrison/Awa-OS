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
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const file = e.dataTransfer.files?.[0]
          if (file) handleUpload(file)
        }}
        style={{
          border: `2px dashed ${dragging ? '#f59e0b' : '#2a2a2a'}`,
          borderRadius: 6,
          padding: '40px 24px',
          textAlign: 'center',
          cursor: uploading ? 'default' : 'pointer',
          transition: 'border-color 0.15s',
          background: dragging ? 'rgba(245,158,11,0.04)' : 'transparent',
        }}
        onMouseEnter={(e) => { if (!dragging) e.currentTarget.style.borderColor = '#f59e0b' }}
        onMouseLeave={(e) => { if (!dragging) e.currentTarget.style.borderColor = '#2a2a2a' }}
      >
        <Upload size={24} style={{ color: '#2a2a2a', margin: '0 auto 12px' }} />
        {uploading ? (
          <p className="font-mono text-sm" style={{ color: '#f59e0b' }}>Uploading…</p>
        ) : (
          <p className="font-mono text-sm" style={{ color: '#555555' }}>Drop a file or click to browse</p>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
        disabled={uploading}
        className="hidden"
      />
      {error && (
        <p className="font-mono text-xs mt-2" style={{ color: '#ef4444' }}>{error}</p>
      )}
    </div>
  )
}
