import AuditTeamLayout from '../team/AuditTeamLayout'
import PageTransition from '../shared/PageTransition'

// Full page when opened on its own; just the content when embedded inside a workspace procedure.
export default function Shell({ embedded, title, children }) {
  if (embedded) return <>{children}</>
  return <AuditTeamLayout title={title}><PageTransition>{children}</PageTransition></AuditTeamLayout>
}
