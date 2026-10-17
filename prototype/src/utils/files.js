// The documents behind requirement items. With Supabase on, the file itself goes to the private `documents` bucket and the item keeps its path,
// so the audit team can open what the client sent. Without it only the file name is kept, as before (the prototype has no file storage).
// To move to the company storage change uploadFile / signedUrl only.
import { supabase, cloudOn } from './supabase.js'
import { cloudState } from './store.js'
import { setItemStatus } from './requirementsStore.js'

import { MAX_BYTES, pathFor } from './fileNames.js'
const BUCKET = 'documents'
export const storageOn = () => cloudOn && cloudState().connected

// Uploads the file and marks the item as received. Returns { ok, error }.
export async function uploadItemFile(slug, ref, file, extra = {}) {
  if (file.size > MAX_BYTES) return { ok: false, error: `${file.name} is larger than 50 MB.` }
  const received = { status: 'Uploaded Processing', filename: file.name, alert: '', ...extra }
  if (!storageOn()) { setItemStatus(slug, ref, received); return { ok: true, stored: false } }
  const path = pathFor(slug, ref, file.name)
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false })
  if (error) return { ok: false, error: `${file.name} could not be saved: ${error.message}` }
  setItemStatus(slug, ref, { ...received, filePath: path, fileSize: file.size, fileType: file.type || '' })
  return { ok: true, stored: true, path }
}

// Opens a stored file in a new tab through a link that stops working after five minutes. Returns { ok, error }.
export async function openStoredFile(path) {
  if (!path || !storageOn()) return { ok: false, error: 'This file was not stored (the prototype keeps file names only).' }
  const w = window.open('', '_blank')
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300)
  if (error || !data?.signedUrl) { if (w) w.close(); return { ok: false, error: `The file could not be opened: ${error?.message || 'no link'}` } }
  if (w) { w.opener = null; w.location.href = data.signedUrl } else window.location.href = data.signedUrl
  return { ok: true }
}

// Keeps a file that is not a requirement item (the trial balance, general ledger and previous year file). Returns the path, or '' when files are not stored.
export async function storeFile(slug, folder, file) {
  if (!file || !storageOn()) return ''
  const path = pathFor(slug, folder, file.name)
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false })
  if (error) throw new Error(`${file.name} could not be saved: ${error.message}`)
  return path
}
