import { useEffect, useState } from 'react'

// Direct messages sent from Management to a Front Office manager. Stored for
// the session and shown in the Front Office portal's chat as private messages.
const KEY = 'audit360_direct_messages'
const EVENT = 'audit360-direct-messages-change'

function readAll() {
  try { return JSON.parse(sessionStorage.getItem(KEY)) || [] } catch { return [] }
}

export function sendDirectMessage({ to, text, ref }) {
  const msg = {
    id: `dm-${Date.now().toString(36)}`,
    to, text, ref,
    ts: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  }
  try { sessionStorage.setItem(KEY, JSON.stringify([...readAll(), msg])) } catch {}
  window.dispatchEvent(new Event(EVENT))
  return msg
}

export function useFrontOfficeInbox(meId) {
  const [list, setList] = useState(readAll)
  useEffect(() => {
    const handler = () => setList(readAll())
    window.addEventListener(EVENT, handler)
    return () => window.removeEventListener(EVENT, handler)
  }, [])
  return list.map((m) => ({
    id: m.id, senderId: 'mohammed', text: `To ${m.to} — ${m.text}`, ts: m.ts, mentions: [meId],
  }))
}
