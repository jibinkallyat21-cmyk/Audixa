import { useEffect, useState } from 'react'

const KEY = 'audit360-mgmt-scope'
const EVENT = 'audit360-mgmt-scope-change'
export const MGMT_SCOPES = ['ABCPA', 'MISCPA', 'Combined']

// Which firm the Management portal is viewing. Session-backed with a same-tab
// event so the header selector and every page stay in sync.
export function useMgmtScope() {
  const read = () => {
    try { const v = sessionStorage.getItem(KEY); return MGMT_SCOPES.includes(v) ? v : 'Combined' } catch { return 'Combined' }
  }
  const [scope, setScopeState] = useState(read)

  useEffect(() => {
    const handler = () => setScopeState(read())
    window.addEventListener(EVENT, handler)
    return () => window.removeEventListener(EVENT, handler)
  }, [])

  const setScope = (next) => {
    try { sessionStorage.setItem(KEY, next) } catch {}
    setScopeState(next)
    window.dispatchEvent(new Event(EVENT))
  }

  return [scope, setScope]
}
