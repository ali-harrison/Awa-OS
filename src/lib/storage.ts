export const FILES_BUCKET = 'project-files'

/**
 * Supabase rejects object keys with macrons and most punctuation, so a file called
 * "Te Whāriki #2.pdf" can't be stored under its own name. The original name lives in
 * `files.name`; this is only the key. The timestamp stops same-named uploads colliding.
 */
export function storageFileName(name: string): string {
  const safe = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${Date.now()}-${safe || 'file'}`
}
