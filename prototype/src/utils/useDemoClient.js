// The demo client's own data for the working tools: its approved (or submitted) trial balance, last year's audited trial balance and the file details.
// Tools use this instead of their generic demo files when the demo client is selected.
import { useMemo } from 'react'
import { useDemoLoaded, useDemoAuditor, useDemoOwn, DEMO_FILE } from './demoData'
import { useTBSubmissions } from './tbSubmissionStore'

export function useDemoClient() {
  const loaded = useDemoLoaded(), auditor = useDemoAuditor(), own = useDemoOwn()
  const tb = useTBSubmissions()[DEMO_FILE.slug]
  return useMemo(() => ({
    loaded, own, slug: DEMO_FILE.slug, client: DEMO_FILE.client, auditor, file: DEMO_FILE,
    ready: !!(loaded && tb?.ledgers?.length), tb: tb || null, ledgers: tb?.ledgers || [], pyLedgers: tb?.pyLedgers || [], approved: tb?.status === 'Approved',
    isDemo: (slug) => loaded && slug === DEMO_FILE.slug,
  }), [loaded, auditor, tb, own])
}

// The label of the button that fills a tool with sample data. For a real client file it says plainly that the rows are not the client's own.
export const demoLabel = (dc) => (dc.ready ? (dc.own ? 'Fill with sample data (not your file)' : "Use the client's data") : 'Use demo data')
