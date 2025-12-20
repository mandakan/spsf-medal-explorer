import React, { useState } from 'react'
import { useMedalDatabase } from '../hooks/useMedalDatabase'
import { useAllMedalStatuses } from '../hooks/useMedalCalculator'
import MedalCard from '../components/MedalCard'

export default function MedalsList() {
  const { medalDatabase } = useMedalDatabase()
  const statuses = useAllMedalStatuses()
  const [filter, setFilter] = useState('all')

  let filteredMedals = medalDatabase ? medalDatabase.getAllMedals() : []

  if (filter !== 'all' && medalDatabase) {
    filteredMedals = filteredMedals.filter(m => {
      const status = statuses[filter]?.find(s => s.medalId === m.id)
      return !!status
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-3xl font-bold text-text-primary">Medals</h1>
        
        <label className="inline-flex items-center gap-2 text-sm">
          <span className="text-text-secondary">Filter</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded"
          >
            <option value="all">All</option>
            <option value="unlocked">Unlocked</option>
            <option value="achievable">Achievable</option>
            <option value="locked">Locked</option>
          </select>
        </label>
      </div>

      {!medalDatabase && (
        <div className="text-text-secondary">Loading medals…</div>
      )}

      {medalDatabase && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMedals.map(medal => (
            <MedalCard key={medal.id} medal={medal} />
          ))}
        </div>
      )}
    </div>
  )
}
