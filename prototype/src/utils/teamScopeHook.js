// The execution team portal's data: the demo client's own data while the demo is loaded, otherwise the fixed sample data.
import { useMemo } from 'react'
import { teamFiles, teamPortfolioStats, teamActionCards, teamTasks, teamRecentActivity, teamNotifications, teamStatusNotifications, teamLongPendingItems, teamMeetings, teamMeetingsCompletedCount, teamConversations, teamAuditTrail } from '../data/sampleData'
import { useDemoLoaded } from './demoData'
import { useTBSubmissions } from './tbSubmissionStore'
import { useIssuedLists } from './requirementsStore'
import { useQueries } from './queriesStore'
import { useAuditLog } from './auditLog'
import { buildTeamScope } from './teamScope'

const SAMPLE_BADGES = { notifications: 8, messages: 3, meetings: 3 }
const SAMPLE_ESCALATIONS = null // the dashboard keeps its own sample list

export function useTeamScope() {
  const demo = useDemoLoaded()
  const tbs = useTBSubmissions(), issued = useIssuedLists(), { queries } = useQueries(), log = useAuditLog()
  return useMemo(() => {
    const file = teamFiles.find((f) => f.isDemo)
    if (demo && file) return buildTeamScope({ file, tb: tbs[file.slug], issued, queries, log })
    return { demo: false, auditTrail: teamAuditTrail, files: teamFiles.filter((f) => f.isDemo), stats: teamPortfolioStats, tasks: teamTasks, actionCards: teamActionCards, activity: teamRecentActivity, notifications: teamNotifications, statusNotifications: teamStatusNotifications, longPending: teamLongPendingItems, meetings: teamMeetings, completedMeetings: teamMeetingsCompletedCount, conversations: teamConversations, escalations: SAMPLE_ESCALATIONS, navBadges: SAMPLE_BADGES, counts: null }
  }, [demo, tbs, issued, queries, log])
}
