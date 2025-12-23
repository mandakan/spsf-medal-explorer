import React from 'react'
import { LINKS } from '../config/links'
import { APP_INFO, CURRENT_RULEBOOK_VERSION, getRulebookVersionForYear } from '../config/appInfo'

export default function About() {
  const upcoming2026 = getRulebookVersionForYear(2026)
  const base = (typeof document !== 'undefined' && document.querySelector('base')?.getAttribute('href')) || '/'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <article className="prose dark:prose-invert max-w-none">
        <header>
          <h1 className="text-3xl font-bold">{APP_INFO.APP_NAME}</h1>
          <p className="mt-2 text-text-secondary">
            Spåra dina skyttemärken och medaljer enligt
            Svenska Pistolskytteförbundets regler.
          </p>
        </header>

        <section aria-labelledby="about-author" className="mt-8">
          <h2 id="about-author" className="text-2xl font-semibold">Skapare</h2>
          <p className="mt-2">
            {APP_INFO.AUTHOR_NAME}
          </p>
        </section>

        <section aria-labelledby="about-links" className="mt-8">
          <h2 id="about-links" className="text-2xl font-semibold">Användbara länkar</h2>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>
              <a
                className="text-primary underline underline-offset-2 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary inline-flex items-center min-h-[44px]"
                href={LINKS.SPSF}
                target="_blank"
                rel="noreferrer noopener"
              >
                Svenska Pistolskytteförbundet (SPSF)
              </a>
            </li>
            <li>
              <a
                className="text-primary underline underline-offset-2 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary inline-flex items-center min-h-[44px]"
                href={LINKS.GITHUB_REPO}
                target="_blank"
                rel="noreferrer noopener"
              >
                GitHub-projekt
              </a>
            </li>
          </ul>
        </section>

        {LINKS.COFFEE ? (
          <section aria-labelledby="about-support" className="mt-8">
            <h2 id="about-support" className="text-2xl font-semibold">Stötta projektet</h2>
            <p className="mt-2">
              Gillar du appen? Bjud utvecklaren på en kaffe.
            </p>
            <p className="mt-2">
              <a
                className="inline-flex items-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                href={LINKS.COFFEE}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Köp en kaffe (öppnas i ny flik)"
              >
                <img
                  src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
                  alt="Köp en kaffe"
                  height="48"
                  style={{ height: 48 }}
                  loading="lazy"
                />
              </a>
            </p>
          </section>
        ) : null}

        <section aria-labelledby="about-version" className="mt-8">
          <h2 id="about-version" className="text-2xl font-semibold">Om versionen</h2>
          <p className="mt-2">
            Skytteboken upplaga / Rulebook version: <strong>{CURRENT_RULEBOOK_VERSION}</strong> (gäller nu)
          </p>
          <p className="mt-2 text-text-secondary">
            Exempel: 2024 använder version <strong>{getRulebookVersionForYear(2024)}</strong>.
            Från 2026 används version <strong>{upcoming2026}</strong>.
          </p>
        </section>

        <section aria-labelledby="about-license" className="mt-8">
          <h2 id="about-license" className="text-2xl font-semibold">Licens</h2>
          <p className="mt-2">
            Denna applikation är licensierad under <strong>{APP_INFO.LICENSE}</strong>.
            Se <a
              className="text-primary underline underline-offset-2 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
              href={`${base}LICENSE`}
              target="_blank"
              rel="noreferrer noopener"
            >LICENSE</a> för fullständig text.
          </p>
        </section>
      </article>
    </div>
  )
}
