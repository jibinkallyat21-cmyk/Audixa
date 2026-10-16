import { useEffect, useState } from 'react'
import { MGMT_VISIBLE_ESCALATION_TIER } from '../data/sampleData'

// Escalations raised from the client portal this session. All levels are
// stored; Management only ever receives the Front Office level.
const KEY = 'audit360_raised_escalations'
const EVENT = 'audit360-escalations-change'
const DEMO_CLIENT = { client: 'Kingdom Retail Holdings LLC', dept: 'ABCPA', fo: 'Fayis' }

function readAll() {
  try { return JSON.parse(sessionStorage.getItem(KEY)) || [] } catch { return [] }
}

export function raiseEscalation({ level, issue }) {
  const record = {
    id: `CL-${Date.now().toString(36).toUpperCase()}`,
    level,
    issue,
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
  }
  try { sessionStorage.setItem(KEY, JSON.stringify([record, ...readAll()])) } catch {}
  window.dispatchEvent(new Event(EVENT))
}

function managementView() {
  return readAll()
    .filter((r) => r.level === MGMT_VISIBLE_ESCALATION_TIER)
    .map((r) => ({
      id: r.id, ...DEMO_CLIENT, tier: r.level, daysOverdue: 0, date: r.date,
      reason: r.issue, status: 'Open', raisedBy: 'Client',
    }))
}

export function useManagementRaisedEscalations() {
  const [list, setList] = useState(managementView)
  useEffect(() => {
    const handler = () => setList(managementView())
    window.addEventListener(EVENT, handler)
    return () => window.removeEventListener(EVENT, handler)
  }, [])
  return list
}
