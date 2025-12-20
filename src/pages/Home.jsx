import React from 'react'
import { Link } from 'react-router-dom'
import { useMedalDatabase } from '../hooks/useMedalDatabase'

export default function Home() {
  const { medalDatabase, loading } = useMedalDatabase()

  return (
    <div className="space-y-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-text-primary mb-4">
          Medal Skill-Tree Explorer
        </h1>
        <p className="text-lg text-text-secondary">
          Track your SHB medal achievements and plan your progression
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/skill-tree"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <h3 className="text-xl font-bold mb-2">🎯 Skill Tree</h3>
          <p className="text-text-secondary">
            Explore medals in an interactive tree view
          </p>
        </Link>

        <Link
          to="/medals"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <h3 className="text-xl font-bold mb-2">📊 Medal List</h3>
          <p className="text-text-secondary">
            Browse all medals with filters and search
          </p>
        </Link>

        <Link
          to="/settings"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
        >
          <h3 className="text-xl font-bold mb-2">📝 Settings</h3>
          <p className="text-text-secondary">
            Log achievements and manage your profile
          </p>
        </Link>
      </section>

      {!loading && medalDatabase && (
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Status</h2>
          <p className="text-text-secondary">
            ✓ {medalDatabase.getAllMedals().length} medals loaded
          </p>
        </section>
      )}
    </div>
  )
}
