import { useEffect, useMemo, useState } from 'react'
import { getRulebookVersionForYear } from '../config/appInfo.js'

/**
 * Kompakt, enradig disclaimer-komponent.
 * - Mobil-först, WCAG-tillgänglig (44px touch-mål, tydlig fokusring)
 * - Kan avfärdas; avfärdandet knyts till regelboksversionen så att texten visas igen vid ny version
 * - Använder design-tokens och klasser från src/index.css
 */
export default function Disclaimer({
  id = 'disclaimer-global',
  variant = 'info', // 'info' | 'warning'
  text = 'OBS: Fristående app; ej godkänd av Svenska Pistolskytteförbundet. Vid skillnader gäller alltid senaste officiella regelbok.',
  linkUrl,
  linkLabel,
  dismissible = true,
  className = '',
  year = new Date().getFullYear(),
}) {
  const version = useMemo(() => getRulebookVersionForYear(year), [year])
  const computedLinkLabel = useMemo(
    () => linkLabel ?? (version ? `Läs regelboken (v${version})` : 'Läs regelboken'),
    [linkLabel, version]
  )

  const dismissKey = useMemo(
    () => `dismiss:${id}${version ? `@${version}` : ''}`,
    [id, version]
  )

  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    setHidden(localStorage.getItem(dismissKey) === '1')
  }, [dismissKey])

  const onClose = () => {
    setHidden(true)
    localStorage.setItem(dismissKey, '1')
  }

  if (hidden) return null

  const base =
    'relative flex items-center gap-2 rounded-md border px-3 py-2 text-sm bg-bg-secondary min-h-11'
  const tone =
    variant === 'warning'
      ? 'border-review text-foreground'
      : 'border-border text-muted-foreground'

  return (
    <div
      role="status"
      aria-live="polite"
      className={[base, tone, className].filter(Boolean).join(' ')}
    >
      <span
        aria-hidden="true"
        className={
          variant === 'warning'
            ? 'inline-block w-2 h-2 rounded-full bg-review'
            : 'inline-block w-2 h-2 rounded-full bg-primary opacity-60'
        }
      />
      <div className="flex-1">
        <span>{text}</span>
        {linkUrl ? (
          <a
            className="underline underline-offset-2 ml-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary rounded-sm"
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Öppna officiell regelbok i ny flik"
          >
            {computedLinkLabel}
          </a>
        ) : null}
      </div>
      {dismissible ? (
        <button
          type="button"
          onClick={onClose}
          className="ml-2 inline-flex items-center justify-center rounded h-11 w-11 md:h-6 md:w-6 hover:bg-bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
          aria-label="Stäng meddelande"
        >
          <span aria-hidden="true">×</span>
        </button>
      ) : null}
    </div>
  )
}
