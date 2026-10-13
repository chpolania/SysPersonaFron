import type { FormEvent } from 'react'
import type { AllowedPerson } from '../types/AllowedPerson'
import { FunctionsForm } from '../components/organisms/FunctionsForm'
import { ReviewTemplate } from '../components/templates/ReviewTemplate'

type FunctionsPageProps = {
  person: AllowedPerson
  value: string
  isSubmitting: boolean
  error: string
  onChange: (value: string) => void
  onBack: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function FunctionsPage(props: FunctionsPageProps) {
  return (
    <ReviewTemplate step={2}>
      <FunctionsForm {...props} />
    </ReviewTemplate>
  )
}
