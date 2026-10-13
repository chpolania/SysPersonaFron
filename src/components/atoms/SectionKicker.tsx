type SectionKickerProps = {
  step: '01' | '02' | '03'
}

export function SectionKicker({ step }: SectionKickerProps) {
  return (
    <div className="section-kicker">
      PASO {step} <span>/ 03</span>
    </div>
  )
}
