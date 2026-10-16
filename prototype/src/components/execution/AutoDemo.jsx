import { useEffect } from 'react'
import { readStore } from '../../utils/store'

// Fills a tool with its demo data when it opens, but only while the client's "Demo data" switch is on.
export default function AutoDemo({ run }) {
  useEffect(() => { if (readStore('demo:loaded', null)) run() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
