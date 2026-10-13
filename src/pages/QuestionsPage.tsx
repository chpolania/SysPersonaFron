import type { FormEvent } from 'react'
import type { AllowedPerson } from '../types/AllowedPerson'
import type { InterviewAnswer, InterviewQuestion } from '../types/Interview'
import { QuestionsForm } from '../components/organisms/QuestionsForm'
import { ReviewTemplate } from '../components/templates/ReviewTemplate'

type QuestionsPageProps = {
  person: AllowedPerson
  questions: InterviewQuestion[]
  answers: InterviewAnswer[]
  isSubmitting: boolean
  error: string
  onAnswerChange: (questionId: string, answer: number | '') => void
  onBack: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function QuestionsPage(props: QuestionsPageProps) {
  return (
    <ReviewTemplate step={3}>
      <QuestionsForm {...props} />
    </ReviewTemplate>
  )
}
