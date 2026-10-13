import { type FormEvent } from 'react'
import { PrimaryButton } from '../atoms/PrimaryButton'
import { SectionKicker } from '../atoms/SectionKicker'
import { EmailField } from '../molecules/EmailField'
import { PrivacyNote } from '../molecules/PrivacyNote'

type EmailAccessFormProps = {
  email: string
  error: string
  onEmailChange: (email: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function EmailAccessForm({
  email,
  error,
  onEmailChange,
  onSubmit,
}: EmailAccessFormProps) {
  return (
    <form className="form-content" onSubmit={onSubmit}>
      <SectionKicker step="01" />
      <h2>Primero, confirmemos<br />que eres tú.</h2>
      <p className="form-description">
        Ingresa tu correo corporativo para comenzar tu revisión.
      </p>
      <EmailField email={email} error={error} onChange={onEmailChange} />
      <PrimaryButton type="submit">Continuar</PrimaryButton>
      <PrivacyNote />
    </form>
  )
}
