import React from 'react'
import { LINKS } from '../config/links'
import { APP_INFO } from '../config/appInfo'

function GitHubIcon({ className = 'w-5 h-5', ...props }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...props}>
      <path
        fill="currentColor"
        d="M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.41-1.35-1.79-1.35-1.79-1.1-.75.08-.73.08-.73 1.22.09 1.86 1.25 1.86 1.25 1.08 1.85 2.83 1.31 3.52 1 .11-.79.42-1.31.76-1.61-2.66-.3-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23.96-.27 1.98-.4 3-.4s2.04.13 3 .4c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.62-5.47 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.22.69.83.58A12 12 0 0 0 12 .5Z"
      />
    </svg>
  )
}

function CoffeeIcon({ className = 'w-5 h-5', ...props }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...props}>
      <path
        fill="currentColor"
        d="M3 7h13a3 3 0 0 1 3 3v1a4 4 0 0 1-3 3.87V16a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7Zm16 3a1 1 0 0 0-1-1h-1v3.82A2 2 0 0 0 19 11v-1ZM5 18a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2V9H5v9ZM10 2a1 1 0 0 1 1 1c0 .83-.5 1.25-.8 1.5-.2.17-.2.17-.2.5a1 1 0 0 1-2 0c0-1 .5-1.5.8-1.75.2-.17.2-.17.2-.5a1 1 0 0 1 1-1Zm4 0a1 1 0 0 1 1 1c0 .83-.5 1.25-.8 1.5-.2.17-.2.17-.2.5a1 1 0 0 1-2 0c0-1 .5-1.5.8-1.75.2-.17.2-.17.2-.5a1 1 0 0 1 1-1Z"
      />
    </svg>
  )
}

export default function Footer() {
  const year = new Date().getFullYear()
  const author = APP_INFO?.AUTHOR_NAME || ''
  const license = APP_INFO?.LICENSE || 'MIT'
  const github = LINKS?.GITHUB_REPO
  const coffee = LINKS?.COFFEE
  const base = (typeof window !== 'undefined' && window.__BASE_URL__) || '/'
  const licenseHref = `${base}LICENSE`

  return (
    <footer role="contentinfo" className="w-full border-t border-gray-200 dark:border-gray-700 bg-bg-primary">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 text-center md:text-left">
            © {year} {author} •{' '}
            <a
              href={licenseHref}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Licensierad under {license}
            </a>
          </p>
          <nav className="flex items-center gap-2" aria-label="Sidfotslänkar">
            {github && (
              <a
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm min-h-[44px] text-blue-700 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label="Öppna GitHub-repositoriet"
              >
                <GitHubIcon />
                <span>Se källkod</span>
              </a>
            )}
            {coffee && (
              <a
                href={coffee}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm min-h-[44px] text-amber-700 dark:text-amber-400 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                aria-label="Köp mig en kaffe"
              >
                <CoffeeIcon />
                <span>Köp mig en kaffe</span>
              </a>
            )}
          </nav>
        </div>
      </div>
    </footer>
  )
}
