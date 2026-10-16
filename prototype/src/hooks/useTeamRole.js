import { useEffect, useState } from 'react'

const KEY = 'audit360-team-view-role'
const EVENT = 'audit360-team-role-change'

// Demo-only role toggle (Audit Lead / Associate) for the team portal. Backed
// by sessionStorage + a same-tab custom event so every mounted instance of
// this hook (header toggle, workspace pages) stays in sync and the choice
// survives navigating between workspace tabs within the session.
export function useTeamRole() {
  const [role, setRoleState] = useState(() => {
    try {
      return sessionStorage.getItem(KEY) || 'Audit Lead'
    } catch {
      return 'Audit Lead'
    }
  })

  useEffect(() => {
    const handler = () => {
      try {
        setRoleState(sessionStorage.getItem(KEY) || 'Audit Lead')
      } catch {
        // ignore
      }
    }
    window.addEventListener(EVENT, handler)
    return () => window.removeEventListener(EVENT, handler)
  }, [])

  const setRole = (next) => {
    try {
      sessionStorage.setItem(KEY, next)
    } catch {
      // sessionStorage unavailable — in-memory state still updates below
    }
    setRoleState(next)
    window.dispatchEvent(new Event(EVENT))
  }

  return [role, setRole]
}
