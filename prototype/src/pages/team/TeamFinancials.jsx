import AuditTeamLayout from '../../components/team/AuditTeamLayout'
import PageTransition from '../../components/shared/PageTransition'
import FinancialStatementsView from '../../components/execution/FinancialStatementsView'

export default function TeamFinancials() {
  return <AuditTeamLayout title="Financial Statements"><PageTransition><FinancialStatementsView /></PageTransition></AuditTeamLayout>
}
