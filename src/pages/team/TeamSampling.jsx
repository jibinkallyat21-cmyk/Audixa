import AuditTeamLayout from '../../components/team/AuditTeamLayout'
import PageTransition from '../../components/shared/PageTransition'
import SamplingVouchingView from '../../components/execution/SamplingVouchingView'

export default function TeamSampling() {
  return <AuditTeamLayout title="Sampling & Vouching"><PageTransition><SamplingVouchingView /></PageTransition></AuditTeamLayout>
}
