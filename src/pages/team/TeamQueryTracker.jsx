import AuditTeamLayout from '../../components/team/AuditTeamLayout'
import PageTransition from '../../components/shared/PageTransition'
import QueryTrackerView from '../../components/execution/QueryTrackerView'

export default function TeamQueryTracker() {
  return <AuditTeamLayout title="Query Tracker"><PageTransition><QueryTrackerView /></PageTransition></AuditTeamLayout>
}
