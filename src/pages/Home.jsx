import React from 'react'
import { useMedalDatabase } from '../hooks/useMedalDatabase'

export default function Home() {
  const { medalDatabase, loading, error } = useMedalDatabase()

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Loading medal database...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    )
  }

  const medalCount = medalDatabase?.medals.length || 0

  return (
    <div>
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-4 text-text-primary">
          Welcome to Medal Skill-Tree Explorer
        </h2>
        <p className="text-lg text-text-secondary">
          Track your SHB medal achievements and plan your progression
        </p>
      </section>

      <section className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-xl font-bold mb-4 text-text-primary">
          Database Status
        </h3>
        <p className="text-text-secondary">
          ✓ {medalCount} medals loaded successfully
        </p>
        <p className="text-text-secondary text-sm mt-2">
          Ready to explore the skill-tree!
        </p>
      </section>
    </div>
  )
}
