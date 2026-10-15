import AuditTeamLayout from '../../components/team/AuditTeamLayout'
import PageTransition from '../../components/shared/PageTransition'
import AuditLogView from '../../components/execution/AuditLogView'

export default function TeamAuditLog() {
  return <AuditTeamLayout title="Audit Log"><PageTransition><AuditLogView /></PageTransition></AuditTeamLayout>
}
