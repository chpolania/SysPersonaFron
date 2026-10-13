import type { AllowedPerson } from '../../types/AllowedPerson'

type ProfileChipProps = {
  person: AllowedPerson
}

export function ProfileChip({ person }: ProfileChipProps) {
  return (
    <div className="profile-chip">
      <span className="avatar">{person.name.charAt(0)}</span>
      <span>
        <strong>{person.name}</strong>
        <small>Proceso: {person.position}</small>
        {person.previousPosition &&
          person.previousPosition !== 'Perfil de prueba' && (
            <small>Cargo previo de referencia: {person.previousPosition}</small>
          )}
      </span>
    </div>
  )
}
