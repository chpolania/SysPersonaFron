export function Brand() {
  return (
    <a className="brand" href="/" aria-label="Nexo, inicio">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <path d="M7 23V9l18 14V9" />
          <circle cx="7" cy="9" r="2" />
          <circle cx="25" cy="23" r="2" />
        </svg>
      </span>
      <span>nexo<span className="brand-period">.</span></span>
    </a>
  )
}
