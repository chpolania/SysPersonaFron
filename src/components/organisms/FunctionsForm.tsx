import { type FormEvent } from 'react'
import type { AllowedPerson } from '../../types/AllowedPerson'
import { PrimaryButton } from '../atoms/PrimaryButton'
import { SectionKicker } from '../atoms/SectionKicker'
import { TextButton } from '../atoms/TextButton'
import { FunctionsField } from '../molecules/FunctionsField'
import { ProfileChip } from '../molecules/ProfileChip'

type FunctionsFormProps = {
  person: AllowedPerson
  value: string
  isSubmitting: boolean
  error: string
  onChange: (value: string) => void
  onBack: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function FunctionsForm({
  person,
  value,
  isSubmitting,
  error,
  onChange,
  onBack,
  onSubmit,
}: FunctionsFormProps) {
  return (
    <form className="form-content" onSubmit={onSubmit}>
      <SectionKicker step="02" />
      <h2>Tu experiencia<br />en el último año.</h2>
      <p className="form-description">
        Describe las funciones y responsabilidades que realizaste durante
        el último año. Con base en esta información prepararemos algunas
        preguntas de seguimiento.
      </p>
      <ProfileChip person={person} />
      <FunctionsField value={value} onChange={onChange} />
      {error && <p className="error-message api-error" role="alert">{error}</p>}
      <p className="score-explanation">
        Tus respuestas a las preguntas posteriores se evaluarán en conjunto
        sobre un total de 1000 puntos.
      </p>
      <PrimaryButton disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Preparando preguntas…' : 'Continuar a las preguntas'}
      </PrimaryButton>
      <TextButton disabled={isSubmitting} onClick={onBack} type="button">
        ← Volver al acceso
      </TextButton>
    </form>
  )
}
