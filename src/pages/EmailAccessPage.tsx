import type { FormEvent } from 'react'
import { EmailAccessForm } from '../components/organisms/EmailAccessForm'
import { ReviewTemplate } from '../components/templates/ReviewTemplate'

type EmailAccessPageProps = {
  email: string
  error: string
  onEmailChange: (email: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function EmailAccessPage(props: EmailAccessPageProps) {
  return (
    <ReviewTemplate step={1}>
      <EmailAccessForm {...props} />
    </ReviewTemplate>
  )
}
