// The documents behind requirement items. This prototype keeps no file contents, only the file name; the real backend stores the file and
// returns a path. The seam is here: set `storage` (see docs/backend-handover.md) and the same screens upload, and the audit team opens, the real file.
// storage = { upload(path, file) -> Promise<{ error? }>, link(path) -> Promise<{ url?, error? }> }
import { setItemStatus } from './requirementsStore.js'
import { MAX_BYTES, pathFor } from './fileNames.js'

let storage = null
export const setStorage = (s) => { storage = s }
export const storageOn = () => !!storage

// Uploads the file and marks the item as received. Returns { ok, error }.
export async function uploadItemFile(slug, ref, file, extra = {}) {
  if (file.size > MAX_BYTES) return { ok: false, error: `${file.name} is larger than 50 MB.` }
  const received = { status: 'Uploaded Processing', filename: file.name, alert: '', ...extra }
  if (!storage) { setItemStatus(slug, ref, received); return { ok: true, stored: false } }
  const path = pathFor(slug, ref, file.name)
  const { error } = await storage.upload(path, file)
  if (error) return { ok: false, error: `${file.name} could not be saved: ${error.message || error}` }
  setItemStatus(slug, ref, { ...received, filePath: path, fileSize: file.size, fileType: file.type || '' })
  return { ok: true, stored: true, path }
}

// Opens a stored file in a new tab through a short-lived link. Returns { ok, error }.
export async function openStoredFile(path) {
  if (!path || !storage) return { ok: false, error: 'This file was not stored (the prototype keeps file names only).' }
  const w = window.open('', '_blank')
  const { url, error } = await storage.link(path)
  if (error || !url) { if (w) w.close(); return { ok: false, error: `The file could not be opened: ${error?.message || error || 'no link'}` } }
  if (w) { w.opener = null; w.location.href = url } else window.location.href = url
  return { ok: true }
}

// Keeps a file that is not a requirement item (trial balance, general ledger, previous year file). Returns the path, or '' when files are not stored.
export async function storeFile(slug, folder, file) {
  if (!file || !storage) return ''
  const path = pathFor(slug, folder, file.name)
  const { error } = await storage.upload(path, file)
  if (error) throw new Error(`${file.name} could not be saved: ${error.message || error}`)
  return path
}
