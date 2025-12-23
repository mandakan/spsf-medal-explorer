import React from 'react'
import { Link } from 'react-router-dom'
import { useMedalDatabase } from '../hooks/useMedalDatabase'

export default function Home() {
  const { medalDatabase, loading } = useMedalDatabase()

  return (
    <div className="space-y-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-text-primary mb-4">
          Skyttemärken
        </h1>
        <p className="text-lg text-text-secondary">
          Dokumentera dina skyttemärken och medaljer med aktiviteter, utforska framtida märken och planera progression
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/skill-tree"
          className="bg-bg-secondary border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow hover:shadow-lg transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <h3 className="text-xl font-bold mb-2 text-text-primary">🎯 Märken</h3>
          <p className="text-text-secondary">
            Utforska märken i ett interaktivt träd
          </p>
        </Link>

        <Link
          to="/medals"
          className="bg-bg-secondary border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow hover:shadow-lg transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <h3 className="text-xl font-bold mb-2 text-text-primary">📊 Märkeslista</h3>
          <p className="text-text-secondary">
            Översikt över alla märken med filter och sökning
          </p>
        </Link>

        <Link
          to="/settings"
          className="bg-bg-secondary border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow hover:shadow-lg transition-shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <h3 className="text-xl font-bold mb-2 text-text-primary">📝 Inställningar</h3>
          <p className="text-text-secondary">
            Logga aktiviteter och hantera din profil
          </p>
        </Link>
      </section>

      {!loading && medalDatabase && (
        <section className="bg-bg-secondary border border-slate-200 dark:border-slate-700 rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold mb-4">Status</h2>
          <p className="text-text-secondary">
            ✓ {medalDatabase.getAllMedals().length} medljer laddade
          </p>
        </section>
      )}
    </div>
  )
}
