import { type FormEvent } from 'react'
import type { InterviewAnswer, InterviewQuestion } from '../../types/Interview'
import { PrimaryButton } from '../atoms/PrimaryButton'
import { SectionKicker } from '../atoms/SectionKicker'
import { TextButton } from '../atoms/TextButton'
import { ProfileChip } from '../molecules/ProfileChip'
import type { AllowedPerson } from '../../types/AllowedPerson'

type QuestionsFormProps = {
  person: AllowedPerson
  questions: InterviewQuestion[]
  answers: InterviewAnswer[]
  isSubmitting: boolean
  error: string
  onAnswerChange: (questionId: string, answer: number | '') => void
  onBack: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function QuestionsForm({
  person,
  questions,
  answers,
  isSubmitting,
  error,
  onAnswerChange,
  onBack,
  onSubmit,
}: QuestionsFormProps) {
  const totalPoints = answers.reduce(
    (total, answer) => total + (answer.answer === '' ? 0 : answer.answer),
    0,
  )
  const hasAllAnswers = answers.every(
    (answer) => answer.answer !== '' && Number.isInteger(answer.answer),
  )
  const isAllocationValid = hasAllAnswers && totalPoints === 1000

  return (
    <form className="form-content" onSubmit={onSubmit}>
      <SectionKicker step="03" />
      <h2>Queremos conocer<br />más de tu experiencia.</h2>
      <p className="form-description">
        Distribuye exactamente 1000 puntos entre las actividades que describen
        tus respuestas. Cada respuesta debe ser un número entero entre 0 y 1000.
      </p>
      <ProfileChip person={person} />

      <div className="question-list">
        {questions.map((question, index) => (
          <div className="question-field" key={question.id}>
            <label htmlFor={question.id}>
              <span className="question-number">0{index + 1}</span>
              {question.question}
            </label>
            <div className="numeric-answer">
              <input
                aria-label={`Puntos para la pregunta ${index + 1}`}
                id={question.id}
                max={1000}
                min={0}
                onChange={(event) =>
                  onAnswerChange(
                    question.id,
                    event.currentTarget.value === '' ||
                      !Number.isFinite(event.currentTarget.valueAsNumber)
                      ? ''
                      : event.currentTarget.valueAsNumber,
                  )
                }
                placeholder="0"
                required
                step={1}
                type="number"
                value={
                  answers.find((answer) => answer.questionId === question.id)
                    ?.answer ?? ''
                }
              />
              <span>puntos</span>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="error-message api-error" role="alert">{error}</p>}

      <p
        className={`allocation-total ${isAllocationValid ? 'is-complete' : ''}`}
        aria-live="polite"
      >
        <span>Total asignado</span>
        <strong>{totalPoints} / 1000</strong>
      </p>
      {!isAllocationValid && (
        <p className="allocation-hint">
          {totalPoints < 1000
            ? `Asigna ${1000 - totalPoints} puntos más para completar el total.`
            : `Reduce ${totalPoints - 1000} puntos para que el total sea 1000.`}
        </p>
      )}
      <PrimaryButton disabled={isSubmitting || !isAllocationValid} type="submit">
        {isSubmitting ? 'Guardando respuestas…' : 'Enviar respuestas'}
      </PrimaryButton>
      <TextButton disabled={isSubmitting} onClick={onBack} type="button">
        ← Volver a mis funciones
      </TextButton>
    </form>
  )
}
