import ManagerLayout from '../../components/manager/ManagerLayout'
import PageTransition from '../../components/shared/PageTransition'
import ArchiveView from '../../components/execution/ArchiveView'

export default function ManagerArchive() {
  return <ManagerLayout title="Archive and Closure"><PageTransition><ArchiveView /></PageTransition></ManagerLayout>
}
