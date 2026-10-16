// EL requests (Process 2.1) and the project-coordinator assignments, kept in the store module.
import { useStore } from './store'
import { emptyFields, evaluateELRequest } from './elRequest.js'
import { teamUser } from '../data/sampleData'

const REQ_KEY = 'el-requests'
const COORD_KEY = 'el-coordinators'
const EMPTY = []

export function useELRequests() {
  const [requests, setRequests] = useStore(REQ_KEY, EMPTY)
  const upsert = (req) => setRequests((cur) => {
    const next = { ...req, updatedAt: new Date().toISOString() }
    return cur.some((r) => r.id === req.id) ? cur.map((r) => (r.id === req.id ? next : r)) : [next, ...cur]
  })
  const remove = (id) => setRequests((cur) => cur.filter((r) => r.id !== id))
  return { requests, upsert, remove }
}

export function newELRequest({ proposalId, client, firm, requestedBy, clientProfile }) {
  return {
    id: `el-${Date.now().toString(36)}`,
    proposalId, client, firm, requestedBy, clientProfile,
    createdAt: new Date().toISOString(), status: 'Draft',
    docs: {}, fields: emptyFields(), log: [],
  }
}

// Audit managers assign the project coordinator for their firm. Until they do, the
// demo user is the coordinator for both firms so the flow can be shown.
const SEED = { ABCPA: teamUser.name, MISCPA: teamUser.name }
export function useCoordinators() {
  const [coordinators, setCoordinators] = useStore(COORD_KEY, SEED)
  const assign = (firm, name) => setCoordinators((cur) => ({ ...cur, [firm]: name }))
  return { coordinators, assign }
}

// Number of open EL flags across requests that have not been sent (drives the FO nav badge).
export function useOpenELFlagCount() {
  const { requests } = useELRequests()
  return requests.filter((r) => !r.sentAt).reduce((n, r) => n + evaluateELRequest({ ...r, requestedBy: r.requestedBy }).flags.length, 0)
}
