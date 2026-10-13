type ProgressIndicatorProps = {
  step: 1 | 2 | 3
}

export function ProgressIndicator({ step }: ProgressIndicatorProps) {
  const labels = ['Acceso', 'Tus funciones', 'Entrevista']

  return (
    <div
      className="progress"
      aria-label={`Paso ${step} de 3`}
    >
      {labels.map((label, index) => {
        const stepNumber = index + 1
        const className =
          stepNumber < step
            ? 'is-complete'
            : stepNumber === step
              ? 'is-current'
              : ''

        return (
          <div className="progress-item" key={label}>
            <div className={`progress-step ${className}`}>
              <span className="step-number">
                {stepNumber < step ? '✓' : `0${stepNumber}`}
              </span>
              <span className="step-label">{label}</span>
            </div>
            {stepNumber < labels.length && (
              <div
                className={`progress-line ${stepNumber < step ? 'is-complete' : ''}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
