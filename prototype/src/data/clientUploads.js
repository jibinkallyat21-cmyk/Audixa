// Shared module-level state for client-submitted signed documents
// Visible to both client portal and team workspace
const _uploads = {
  signedEngagementLetter: null,
  signedDraftAFS: null,
  zakatSupportingDocs: null,
}

const _listeners = []

export function getClientUpload(key) {
  return _uploads[key] || null
}

export function setClientUpload(key, fileInfo) {
  _uploads[key] = fileInfo
  _listeners.forEach((fn) => fn())
}

export function onUploadsChange(fn) {
  _listeners.push(fn)
  return () => {
    const i = _listeners.indexOf(fn)
    if (i >= 0) _listeners.splice(i, 1)
  }
}

export function getAllClientUploads() {
  return { ..._uploads }
}
