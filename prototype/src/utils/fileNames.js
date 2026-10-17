// Names and paths for stored documents. Pure, so they are tested.
export const MAX_BYTES = 50 * 1024 * 1024
// Storage keys cannot hold every character a file name can; the original name is kept on the item.
export const safeName = (name) => String(name || 'file').normalize('NFKD').replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '').slice(-120) || 'file'
export const pathFor = (slug, ref, name, at = Date.now()) => `${slug}/${safeName(ref)}/${at}-${safeName(name)}`
