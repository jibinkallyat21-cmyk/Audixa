import { useStore } from './store'
const EMPTY = []
export function useQueries() {
  const [queries, setQueries] = useStore('queries', EMPTY)
  const upsert = (q) => setQueries((cur) => (cur.some((x) => x.id === q.id) ? cur.map((x) => (x.id === q.id ? q : x)) : [q, ...cur]))
  return { queries, upsert, setQueries }
}
