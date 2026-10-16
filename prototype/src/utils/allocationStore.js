import { useStore } from './store'
import { leadWorkload } from '../data/sampleData'

const EMPTY = []
export const EXP_KEYS = ['similarClients', 'auditType', 'industry', 'complicatedAreas', 'technical', 'sameClient']

// Starting capacity and experience values for the demo leads. The manager can edit every one of them
// on the allocation screen; they are not facts about the people.
const DEMO = [
  { highComplexityFiles: 4, dueSoon: 3, reviewDuties: 3, onLeave: false, exp: 6 },
  { highComplexityFiles: 3, dueSoon: 2, reviewDuties: 2, onLeave: false, exp: 5 },
  { highComplexityFiles: 2, dueSoon: 1, reviewDuties: 1, onLeave: false, exp: 4 },
  { highComplexityFiles: 1, dueSoon: 0, reviewDuties: 0, onLeave: false, exp: 3 },
  { highComplexityFiles: 4, dueSoon: 4, reviewDuties: 3, onLeave: true, exp: 5 },
  { highComplexityFiles: 0, dueSoon: 0, reviewDuties: 0, onLeave: false, exp: 2 },
]
export const defaultCapacity = () => Object.fromEntries(leadWorkload.map((l, i) => {
  const d = DEMO[i % DEMO.length]
  return [l.name, { highComplexityFiles: d.highComplexityFiles, dueSoon: d.dueSoon, reviewDuties: d.reviewDuties, onLeave: d.onLeave, experience: Object.fromEntries(EXP_KEYS.map((k, j) => [k, j < d.exp])) }]
}))

export function useCapacity() {
  const [cap, setCap] = useStore('lead-capacity', null)
  const value = cap || defaultCapacity()
  const update = (name, patch) => setCap({ ...value, [name]: { ...value[name], ...patch } })
  return { capacity: value, update }
}
export function useAllocations() {
  const [list, setList] = useStore('allocations', EMPTY)
  return { allocations: list, add: (a) => setList((cur) => [a, ...cur]) }
}
