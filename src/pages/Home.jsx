import React, { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useMedalDatabase } from '../hooks/useMedalDatabase'
import Disclaimer from '../components/Disclaimer'
import Icon from '../components/Icon'
import BackupButton from '../components/BackupButton'
import { LINKS } from '../config/links'
import { BUILD } from '../config/buildInfo'
import { requestManualTourStart } from '../utils/onboardingTour'

export default function Home() {
  const { medalDatabase, loading } = useMedalDatabase()

  const handleStartMedalsGuide = useCallback(() => {
    requestManualTourStart('medals')
  }, [])

  const handleStartTreeGuide = useCallback(() => {
    requestManualTourStart('tree-view')
  }, [])

  return (
    <div className="space-y-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Skyttemärken
        </h1>
        <p className="text-lg text-muted-foreground">
          Dokumentera dina skyttemärken och medaljer med aktiviteter, utforska framtida märken och planera progression
        </p>

        <div className="mt-6 flex justify-center gap-3 flex-wrap">
          <Link
            to="/medals"
            onClick={handleStartMedalsGuide}
            className="btn btn-secondary min-h-[44px] inline-flex items-center justify-center"
          >
            Visa märkeslista-guide
          </Link>
          <Link
            to="/skill-tree"
            onClick={handleStartTreeGuide}
            className="btn btn-secondary min-h-[44px] inline-flex items-center justify-center"
          >
            Visa trädvy-guide
          </Link>
        </div>
      </section>

      <Disclaimer
        id="disclaimer-home"
        variant="info"
        linkUrl={LINKS.RULEBOOK}
      />

      {/* Backup Button Section */}
      <section>
        <BackupButton />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/skill-tree"
          className="card p-6 shadow hover:shadow-lg transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
        >
          <h3 className="text-xl font-bold mb-2 text-foreground flex items-center gap-2">
            <Icon name="Target" className="w-5 h-5 shrink-0 text-muted-foreground" />
            <span>Märken</span>
          </h3>
          <p className="text-muted-foreground">
            Utforska märken i ett interaktivt träd
          </p>
        </Link>

        <Link
          to="/medals"
          className="card p-6 shadow hover:shadow-lg transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
        >
          <h3 className="text-xl font-bold mb-2 text-foreground flex items-center gap-2">
            <Icon name="List" className="w-5 h-5 shrink-0 text-muted-foreground" />
            <span>Märkeslista</span>
          </h3>
          <p className="text-muted-foreground">
            Översikt över alla märken med filter och sökning
          </p>
        </Link>

        <Link
          to="/settings"
          className="card p-6 shadow hover:shadow-lg transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
        >
          <h3 className="text-xl font-bold mb-2 text-foreground flex items-center gap-2">
            <Icon name="Settings" className="w-5 h-5 shrink-0 text-muted-foreground" />
            <span>Inställningar</span>
          </h3>
          <p className="text-muted-foreground">
            Hantera din profil
          </p>
        </Link>
      </section>

      {!loading && medalDatabase && (
        <section className="card p-6 shadow">
          <h2 className="text-xl font-bold mb-4">Status</h2>
          <p className="text-muted-foreground">
            <Icon name="CheckCircle" className="inline w-4 h-4 align-text-bottom mr-1 text-muted-foreground" />
            {medalDatabase.getAllMedals().length} märken laddade
          </p>
          <p className="mt-2 text-muted-foreground">
            Version: <code>{BUILD.version}</code> • Build: <code>{BUILD.number}</code> • Commit: <code>{BUILD.commit}</code>
          </p>
        </section>
      )}
    </div>
  )
}
