import { Brand } from '../atoms/Brand'

export function SiteHeader() {
  return (
    <header className="topbar">
      <Brand />
      <div className="topbar-note">
        <span className="status-dot" />
        Portal de desarrollo profesional
      </div>
    </header>
  )
}
