type EmailFieldProps = {
  email: string
  error: string
  onChange: (value: string) => void
}

export function EmailField({ email, error, onChange }: EmailFieldProps) {
  return (
    <>
      <label htmlFor="email">Correo electrónico</label>
      <div className={`input-wrap ${error ? 'has-error' : ''}`}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m4 7 8 6 8-6" />
        </svg>
        <input
          autoComplete="email"
          id="email"
          name="email"
          onChange={(event) => onChange(event.target.value)}
          placeholder="nombre@empresa.com"
          required
          type="email"
          value={email}
        />
      </div>
      {error && <p className="error-message" role="alert">{error}</p>}
    </>
  )
}
