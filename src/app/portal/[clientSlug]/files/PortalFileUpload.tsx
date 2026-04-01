'use client'

import { useState, useRef } from 'react'
import { createFileRecordAction } from '@/app/(internal)/projects/[id]/actions'
import { useRouter } from 'next/navigation'

export function PortalFileUpload({
  projectId,
  clientSlug,
  clientId,
}: {
  projectId: string
  clientSlug: string
  clientId: string
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const { createBrowserClient } = await import('@supabase/ssr')
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const path = `${clientSlug}/${projectId}/client_uploads/${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(path, file, { upsert: true })

      if (uploadError) {
        setError(uploadError.message)
        return
      }

      await createFileRecordAction({
        projectId,
        clientId,
        name: file.name,
        type: 'other',
        storagePath: path,
        uploadedBy: 'client',
      })

      router.refresh()
    } catch (e) {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="border border-dashed border-[#2A2A2A] hover:border-[#3A3A3A] px-6 py-6 text-center transition-colors duration-150">
      <p className="text-[#555050] font-mono text-sm mb-3">Upload a file</p>
      <input
        ref={fileRef}
        type="file"
        onChange={handleUpload}
        disabled={uploading}
        className="font-mono text-sm text-[#8A8580] file:bg-[#1A1A1A] file:border file:border-[#2A2A2A] file:text-[#F5F0E8] file:font-mono file:text-xs file:px-3 file:py-1.5 file:mr-3 file:cursor-pointer disabled:opacity-40"
      />
      {uploading && <p className="text-[#C9963A] font-mono text-xs mt-2">Uploading…</p>}
      {error && <p className="text-[#E05252] font-mono text-xs mt-2">{error}</p>}
    </div>
  )
}
