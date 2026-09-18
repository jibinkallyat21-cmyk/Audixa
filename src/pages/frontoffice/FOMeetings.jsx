import FrontOfficeLayout from '../../components/frontoffice/FrontOfficeLayout'
import PageTransition from '../../components/shared/PageTransition'

export default function FOMeetings() {
  return (
    <FrontOfficeLayout title="Meetings">
      <PageTransition>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-lg font-medium text-navy/60">Front Office / Meetings</p>
        </div>
      </PageTransition>
    </FrontOfficeLayout>
  )
}
