import FrontOfficeLayout from '../../components/frontoffice/FrontOfficeLayout'
import PageTransition from '../../components/shared/PageTransition'
import AuditLogView from '../../components/execution/AuditLogView'

export default function FOAuditLog() {
  return <FrontOfficeLayout title="Audit Log"><PageTransition><AuditLogView /></PageTransition></FrontOfficeLayout>
}
