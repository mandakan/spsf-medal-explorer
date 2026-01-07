import React, { useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Icon from '../components/Icon'
import { requestManualTourStart } from '../utils/onboardingTour'
import { useOnboardingTour } from '../hooks/useOnboardingTour'

export default function Help() {
  const navigate = useNavigate()
  const location = useLocation()
  const tour = useOnboardingTour()

  const handleStartMedalsGuide = useCallback(() => {
    if (location.pathname === '/medals') {
      // Already on medals page, start immediately
      tour.start()
    } else {
      // Navigate and request manual start
      requestManualTourStart('medals')
      navigate('/medals')
    }
  }, [location.pathname, navigate, tour])

  const handleStartTreeGuide = useCallback(() => {
    if (location.pathname === '/skill-tree' || location.pathname === '/skill-tree/fullscreen') {
      // Already on tree page, start immediately
      tour.start()
    } else {
      // Navigate and request manual start
      requestManualTourStart('tree-view')
      navigate('/skill-tree')
    }
  }, [location.pathname, navigate, tour])

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
          Hjälp & Guider
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground">
          Välj en guide nedan för att lära dig hur du använder appen
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Medals Guide Card */}
        <article className="card p-6 shadow">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Icon
                name="List"
                className="w-6 h-6 text-primary"
                aria-hidden="true"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground mb-1">
                Märkeslista-guide
              </h2>
              <p className="text-sm text-muted-foreground">
                Lär dig hur du söker, filtrerar och utforskar märken
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-5">
            <h3 className="text-sm font-semibold text-foreground">
              Guiden visar dig:
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1.5" aria-label="Steg i märkeslista-guiden">
              <li className="flex items-start gap-2">
                <Icon name="CheckCircle" className="w-4 h-4 shrink-0 mt-0.5 text-success" aria-hidden="true" />
                <span>Hur du söker efter märken</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="CheckCircle" className="w-4 h-4 shrink-0 mt-0.5 text-success" aria-hidden="true" />
                <span>Använd snabbfilter för statusar</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="CheckCircle" className="w-4 h-4 shrink-0 mt-0.5 text-success" aria-hidden="true" />
                <span>Öppna och läs detaljerad information</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="CheckCircle" className="w-4 h-4 shrink-0 mt-0.5 text-success" aria-hidden="true" />
                <span>Filtrera efter ålder, kategori och mer</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={handleStartMedalsGuide}
            className="btn btn-primary w-full min-h-[44px] inline-flex items-center justify-center gap-2"
            aria-label="Starta märkeslista-guide"
          >
            <Icon name="PlayCircle" className="w-5 h-5" aria-hidden="true" />
            <span>Starta Guide</span>
          </button>
        </article>

        {/* Tree View Guide Card */}
        <article className="card p-6 shadow">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Icon
                name="Target"
                className="w-6 h-6 text-primary"
                aria-hidden="true"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground mb-1">
                Trädvy-guide
              </h2>
              <p className="text-sm text-muted-foreground">
                Upptäck hur du navigerar det interaktiva märkesträdet
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-5">
            <h3 className="text-sm font-semibold text-foreground">
              Guiden visar dig:
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1.5" aria-label="Steg i trädvy-guiden">
              <li className="flex items-start gap-2">
                <Icon name="CheckCircle" className="w-4 h-4 shrink-0 mt-0.5 text-success" aria-hidden="true" />
                <span>Hur du panorerar och zoomar i trädet</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="CheckCircle" className="w-4 h-4 shrink-0 mt-0.5 text-success" aria-hidden="true" />
                <span>Förstå färgkodning och status</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="CheckCircle" className="w-4 h-4 shrink-0 mt-0.5 text-success" aria-hidden="true" />
                <span>Klicka på märken för detaljer</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="CheckCircle" className="w-4 h-4 shrink-0 mt-0.5 text-success" aria-hidden="true" />
                <span>Använd zoomkontroller och helskärmsläge</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={handleStartTreeGuide}
            className="btn btn-primary w-full min-h-[44px] inline-flex items-center justify-center gap-2"
            aria-label="Starta trädvy-guide"
          >
            <Icon name="PlayCircle" className="w-5 h-5" aria-hidden="true" />
            <span>Starta Guide</span>
          </button>
        </article>
      </section>

      <section className="card p-6 shadow">
        <div className="flex items-start gap-3">
          <Icon
            name="Info"
            className="w-5 h-5 shrink-0 mt-0.5 text-muted-foreground"
            aria-hidden="true"
          />
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Kontextbaserad hjälp
            </h2>
            <p className="text-sm text-muted-foreground">
              Du hittar också snabblänkar till guider direkt på sidorna där de är relevanta.
              Titta efter "Visa guide"-länkarna bredvid sidtitlarna på Märkeslista och Märkesträd.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
