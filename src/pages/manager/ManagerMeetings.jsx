import ManagerLayout from '../../components/manager/ManagerLayout'
import PageTransition from '../../components/shared/PageTransition'

export default function ManagerMeetings() {
  return (
    <ManagerLayout title="Meetings">
      <PageTransition>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-lg font-medium text-navy/60">Manager / Meetings</p>
        </div>
      </PageTransition>
    </ManagerLayout>
  )
}
