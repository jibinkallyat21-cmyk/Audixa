import AuditTeamLayout from '../../components/team/AuditTeamLayout'
import PageTransition from '../../components/shared/PageTransition'
import TBReviewView from '../../components/execution/TBReviewView'

export default function TeamTBReview() {
  return <AuditTeamLayout title="TB Review"><PageTransition><TBReviewView /></PageTransition></AuditTeamLayout>
}
