import ManagerLayout from '../../components/manager/ManagerLayout'
import PageTransition from '../../components/shared/PageTransition'
import AllocationView from '../../components/execution/AllocationView'

export default function ManagerAllocation() {
  return <ManagerLayout title="File Allocation"><PageTransition><AllocationView /></PageTransition></ManagerLayout>
}
