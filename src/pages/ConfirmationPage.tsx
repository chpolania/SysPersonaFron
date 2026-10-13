import type { AllowedPerson } from '../types/AllowedPerson'
import type { PointAllocation } from '../types/Interview'
import { SubmissionConfirmation } from '../components/organisms/SubmissionConfirmation'
import { ReviewTemplate } from '../components/templates/ReviewTemplate'

type ConfirmationPageProps = {
  person: AllowedPerson
  allocations: PointAllocation[]
  totalPoints: number
  onStartOver: () => void
}

export function ConfirmationPage(props: ConfirmationPageProps) {
  return (
    <ReviewTemplate step={3}>
      <SubmissionConfirmation {...props} />
    </ReviewTemplate>
  )
}
