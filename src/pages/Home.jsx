import React from 'react'
import { Link } from 'react-router-dom'
import { useMedalDatabase } from '../hooks/useMedalDatabase'
import Disclaimer from '../components/Disclaimer'
import { LINKS } from '../config/links'

export default function Home() {
  const { medalDatabase, loading } = useMedalDatabase()

  return (
    <div className="space-y-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Skyttemärken
        </h1>
        <p className="text-lg text-muted-foreground">
          Dokumentera dina skyttemärken och medaljer med aktiviteter, utforska framtida märken och planera progression
        </p>
      </section>

      <Disclaimer
        id="disclaimer-home"
        variant="info"
        linkUrl={LINKS.RULEBOOK}
      />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/skill-tree"
          className="card p-6 shadow hover:shadow-lg transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
        >
          <h3 className="text-xl font-bold mb-2 text-foreground">🎯 Märken</h3>
          <p className="text-muted-foreground">
            Utforska märken i ett interaktivt träd
          </p>
        </Link>

        <Link
          to="/medals"
          className="card p-6 shadow hover:shadow-lg transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
        >
          <h3 className="text-xl font-bold mb-2 text-foreground">📊 Märkeslista</h3>
          <p className="text-muted-foreground">
            Översikt över alla märken med filter och sökning
          </p>
        </Link>

        <Link
          to="/settings"
          className="card p-6 shadow hover:shadow-lg transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
        >
          <h3 className="text-xl font-bold mb-2 text-foreground">📝 Inställningar</h3>
          <p className="text-muted-foreground">
            Hanter din profil
          </p>
        </Link>
      </section>

      {!loading && medalDatabase && (
        <section className="card p-6 shadow">
          <h2 className="text-xl font-bold mb-4">Status</h2>
          <p className="text-muted-foreground">
            ✓ {medalDatabase.getAllMedals().length} märken laddade
          </p>
        </section>
      )}
    </div>
  )
}
