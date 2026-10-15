import ManagerLayout from '../../components/manager/ManagerLayout'
import PageTransition from '../../components/shared/PageTransition'
import QueryTrackerView from '../../components/execution/QueryTrackerView'

export default function ManagerQueryTracker() {
  return <ManagerLayout title="Query Tracker"><PageTransition><QueryTrackerView /></PageTransition></ManagerLayout>
}
