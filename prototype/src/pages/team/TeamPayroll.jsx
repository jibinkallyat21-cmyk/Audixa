import AuditTeamLayout from '../../components/team/AuditTeamLayout'
import PageTransition from '../../components/shared/PageTransition'
import PayrollAssetsView from '../../components/execution/PayrollAssetsView'

export default function TeamPayroll() {
  return <AuditTeamLayout title="Payroll & Assets"><PageTransition><PayrollAssetsView /></PageTransition></AuditTeamLayout>
}
