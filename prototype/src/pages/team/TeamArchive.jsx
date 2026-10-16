import AuditTeamLayout from '../../components/team/AuditTeamLayout'
import PageTransition from '../../components/shared/PageTransition'
import ArchiveView from '../../components/execution/ArchiveView'

export default function TeamArchive() {
  return <AuditTeamLayout title="Archive and Closure"><PageTransition><ArchiveView /></PageTransition></AuditTeamLayout>
}
