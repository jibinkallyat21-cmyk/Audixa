import { useEffect } from 'react'
import { readStore } from '../../utils/store'

// Fills a tool with its demo data when it opens, but only while the client's "Demo data" switch is on (never for a real client file).
export default function AutoDemo({ run }) {
  useEffect(() => { const d = readStore('demo:loaded', null); if (d && !d.own) run() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
