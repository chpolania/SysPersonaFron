import type { AllowedPerson } from '../../types/AllowedPerson'
import type { PointAllocation } from '../../types/Interview'
import { SectionKicker } from '../atoms/SectionKicker'
import { TextButton } from '../atoms/TextButton'
import { ProfileChip } from '../molecules/ProfileChip'

type SubmissionConfirmationProps = {
  person: AllowedPerson
  allocations: PointAllocation[]
  totalPoints: number
  onStartOver: () => void
}

export function SubmissionConfirmation({
  person,
  allocations,
  totalPoints,
  onStartOver,
}: SubmissionConfirmationProps) {
  return (
    <div className="form-content success-content">
      <div className="success-icon" aria-hidden="true">✓</div>
      <SectionKicker step="03" />
      <h2>Gracias por compartir<br />tu experiencia.</h2>
      <p className="form-description">
        Registramos la distribución que asignaste a las actividades. El total
        suma exactamente 1000 puntos. Las asociaciones con otros roles son
        sugerencias basadas en las funciones de referencia.
      </p>
      <ProfileChip person={person} />
      <div className="score-total" role="status">
        <span>Total distribuido</span>
        <strong>{totalPoints} <small>/ 1000</small></strong>
      </div>
      <div className="evaluation-list">
        {allocations.map((allocation, index) => (
          <article className="evaluation-item" key={allocation.questionId}>
            <div className="evaluation-heading">
              <span>Pregunta {index + 1}</span>
              <strong>{allocation.points} pts</strong>
            </div>
            <p className="question-activity">
              Función {allocation.functionId}: {allocation.activity}
            </p>
            <p className="question-context">
              Subproceso {allocation.subprocessId}: {allocation.subprocessName}
            </p>
            <span
              className={`scope-badge ${
                allocation.isOtherRole ? 'is-outside' : ''
              }`}
            >
              {allocation.isOtherRole
                ? `Posible actividad de otro rol: ${allocation.roleName}`
                : `Relacionada con tu rol: ${allocation.roleName}`}
            </span>
            <p className="question-context">
              Macroproceso {allocation.contextId}: {allocation.contextName}
            </p>
            <h3>{allocation.question}</h3>
            <p className="answer-summary">{allocation.answer}</p>
          </article>
        ))}
      </div>
      <TextButton onClick={onStartOver} type="button">
        Volver al inicio
      </TextButton>
    </div>
  )
}
