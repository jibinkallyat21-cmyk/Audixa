import { createContext, useContext, useState } from 'react'
import { initialTBLines, initialAdjustments } from '../data/workingTB'
import { addActivityEvent } from '../data/activityLog'

const TBContext = createContext(null)

export function TBProvider({ children }) {
  const [tbLines, setTBLines] = useState(initialTBLines)
  const [adjustments, setAdjustments] = useState(initialAdjustments)
  const [tbUploaded, setTBUploaded] = useState(true) // pre-populated for demo

  const pendingAdjustments = adjustments.filter((a) => a.status === 'Pending Client Approval')

  function approveAdjustment(adjId, clientNote = '') {
    setAdjustments((prev) =>
      prev.map((a) =>
        a.id === adjId ? { ...a, status: 'Approved by Client', clientNote } : a
      )
    )
    const adj = adjustments.find((a) => a.id === adjId)
    if (adj) {
      setTBLines((prev) =>
        prev.map((line) => {
          const entry = adj.entries.find((e) => e.ledgerCode === line.ledgerCode)
          if (!entry) return line
          return {
            ...line,
            adjustmentDebit: (line.adjustmentDebit || 0) + (entry.debit || 0),
            adjustmentCredit: (line.adjustmentCredit || 0) + (entry.credit || 0),
          }
        })
      )
      addActivityEvent({
        id: `act-adj-approve-${adjId}`,
        icon: 'emerald',
        description: `You approved adjustment ${adj.adjustmentRef} — trial balance updated`,
        timestamp: new Date().toLocaleString('en-GB'),
        section: 'Working TB',
      })
    }
  }

  function rejectAdjustment(adjId, clientNote = '') {
    setAdjustments((prev) =>
      prev.map((a) =>
        a.id === adjId ? { ...a, status: 'Rejected by Client', clientNote } : a
      )
    )
    const adj = adjustments.find((a) => a.id === adjId)
    if (adj) {
      addActivityEvent({
        id: `act-adj-reject-${adjId}`,
        icon: 'red',
        description: `You rejected adjustment ${adj.adjustmentRef}`,
        timestamp: new Date().toLocaleString('en-GB'),
        section: 'Working TB',
      })
    }
  }

  function postAdjustment(newAdj) {
    setAdjustments((prev) => [newAdj, ...prev])
    addActivityEvent({
      id: `act-adj-post-${newAdj.id}`,
      icon: 'amber',
      description: `Your auditor proposed adjustment ${newAdj.adjustmentRef} — awaiting your review`,
      timestamp: new Date().toLocaleString('en-GB'),
      section: 'Working TB',
    })
  }

  function reclassifyLine(ledgerCode, newClassification) {
    setTBLines((prev) =>
      prev.map((l) =>
        l.ledgerCode === ledgerCode ? { ...l, zakatClassification: newClassification } : l
      )
    )
  }

  function uploadTB(newLines) {
    setTBLines(newLines)
    setTBUploaded(true)
    addActivityEvent({
      id: `act-tb-upload-${Date.now()}`,
      icon: 'blue',
      description: 'You uploaded your trial balance — FY2024',
      timestamp: new Date().toLocaleString('en-GB'),
      section: 'Working TB',
    })
  }

  return (
    <TBContext.Provider
      value={{
        tbLines,
        adjustments,
        pendingAdjustments,
        tbUploaded,
        approveAdjustment,
        rejectAdjustment,
        postAdjustment,
        reclassifyLine,
        uploadTB,
      }}
    >
      {children}
    </TBContext.Provider>
  )
}

export function useTB() {
  const ctx = useContext(TBContext)
  if (!ctx) throw new Error('useTB must be used within TBProvider')
  return ctx
}
