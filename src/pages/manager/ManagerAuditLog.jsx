import ManagerLayout from '../../components/manager/ManagerLayout'
import PageTransition from '../../components/shared/PageTransition'
import AuditLogView from '../../components/execution/AuditLogView'

export default function ManagerAuditLog() {
  return <ManagerLayout title="Audit Log"><PageTransition><AuditLogView /></PageTransition></ManagerLayout>
}
