import type { ReactNode } from 'react'
import { PageIntro } from '../molecules/PageIntro'
import { ProgressIndicator } from '../organisms/ProgressIndicator'
import { SiteFooter } from '../organisms/SiteFooter'
import { SiteHeader } from '../organisms/SiteHeader'

type ReviewTemplateProps = {
  children: ReactNode
  step: 1 | 2 | 3
}

export function ReviewTemplate({ children, step }: ReviewTemplateProps) {
  return (
    <main className="app-shell">
      <SiteHeader />
      <div className="page-content">
        <PageIntro
          title="Tu trabajo cuenta."
          emphasizedTitle="Hablemos de él."
          description="Un espacio para reconocer lo que haces y el impacto que generas cada día."
        />
        <section className="form-card" aria-live="polite">
          <div className="card-topline">
            <span>REVISIÓN DE DESEMPEÑO</span>
            <span>ASIGNACIÓN DE 1000 PUNTOS</span>
          </div>
          <ProgressIndicator step={step} />
          {children}
        </section>
        <SiteFooter />
      </div>
    </main>
  )
}
