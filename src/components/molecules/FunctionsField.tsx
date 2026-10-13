type FunctionsFieldProps = {
  value: string
  onChange: (value: string) => void
}

export function FunctionsField({ value, onChange }: FunctionsFieldProps) {
  return (
    <>
      <label htmlFor="functions">¿Qué funciones has realizado?</label>
      <textarea
        id="functions"
        maxLength={5000}
        minLength={20}
        name="functions"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Describe tus principales funciones, responsabilidades y proyectos..."
        required
        rows={5}
        value={value}
      />
      <div className="textarea-footer">
        <span>Sé tan específico como quieras.</span>
        <span>{value.length} caracteres</span>
      </div>
    </>
  )
}
