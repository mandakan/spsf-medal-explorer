import React, { useId, useState } from 'react'
import Icon from './Icon'

/**
 * Formats an age category for display
 * @param {Object} category - Age category object with ageMin, ageMax, description
 * @returns {string} Formatted age range string
 */
function formatAgeRange(category) {
  if (category.description) return category.description
  const min = category.ageMin ?? 0
  const max = category.ageMax ?? 999
  if (max >= 999) return `${min}+ år`
  if (min === 0) return `Under ${max + 1} år`
  return `${min}-${max} år`
}

/**
 * Extracts threshold values for display in table
 * @param {Object} category - Age category with pointThresholds or thresholds
 * @param {string} type - 'precision' or 'application'
 * @returns {Object} Threshold values by weapon group
 */
function getThresholdValues(category, type) {
  if (type === 'precision') {
    const pt = category.pointThresholds || {}
    return {
      A: pt.A?.min ?? '-',
      B: pt.B?.min ?? '-',
      C: pt.C?.min ?? '-'
    }
  }
  // Application series - show time thresholds
  const th = category.thresholds || {}
  return {
    A: typeof th.A?.maxTimeSeconds === 'number' ? `${th.A.maxTimeSeconds}s` : '-',
    B: typeof th.B?.maxTimeSeconds === 'number' ? `${th.B.maxTimeSeconds}s` : '-',
    C: typeof th.C?.maxTimeSeconds === 'number' ? `${th.C.maxTimeSeconds}s` : '-'
  }
}

/**
 * Badge showing the user's current age category
 */
function AgeCategoryBadge({ matchedCategory }) {
  if (!matchedCategory) return null

  const ageText = formatAgeRange(matchedCategory)

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
      role="status"
      aria-label={`Din ålderskategori: ${ageText}`}
    >
      <Icon name="User" className="w-3 h-3" aria-hidden="true" />
      <span>{ageText}</span>
    </span>
  )
}

/**
 * Expandable table showing all age thresholds
 */
function AgeThresholdsTable({ ageCategories, matchedAgeCategory, type }) {
  const [expanded, setExpanded] = useState(false)
  const tableId = useId()

  if (!ageCategories || ageCategories.length === 0) return null

  const isPrecision = type === 'precision_series'
  const headerLabel = isPrecision ? 'Poängkrav per ålderskategori' : 'Tidskrav per ålderskategori'
  const valueHeader = isPrecision ? 'Min poäng' : 'Max tid'

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
        aria-controls={tableId}
        className={[
          'inline-flex items-center gap-1 text-xs text-muted-foreground',
          'hover:text-foreground focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-primary rounded px-1 py-0.5',
          'min-h-[44px] min-w-[44px]'
        ].join(' ')}
      >
        <Icon
          name={expanded ? 'ChevronDown' : 'ChevronRight'}
          className="w-3 h-3"
          aria-hidden="true"
        />
        <span>Visa alla ålderskategorier</span>
      </button>

      {expanded && (
        <div
          id={tableId}
          className="mt-2 overflow-x-auto"
          role="region"
          aria-label={headerLabel}
        >
          <table className="w-full text-xs border-collapse">
            <caption className="sr-only">{headerLabel}</caption>
            <thead>
              <tr className="border-b border-border">
                <th
                  scope="col"
                  className="text-left py-1 px-2 font-medium text-muted-foreground"
                >
                  Ålderskategori
                </th>
                <th
                  scope="col"
                  className="text-center py-1 px-2 font-medium text-muted-foreground"
                  aria-label={`${valueHeader} vapengrupp A`}
                  title="Vapengrupp A: Grovkalibriga pistoler och revolvrar"
                >
                  A
                </th>
                <th
                  scope="col"
                  className="text-center py-1 px-2 font-medium text-muted-foreground"
                  aria-label={`${valueHeader} vapengrupp B`}
                  title="Vapengrupp B: .22 sportpistol och revolver"
                >
                  B
                </th>
                <th
                  scope="col"
                  className="text-center py-1 px-2 font-medium text-muted-foreground"
                  aria-label={`${valueHeader} vapengrupp C`}
                  title="Vapengrupp C: Finkalibriga pistoler och revolvrar"
                >
                  C
                </th>
              </tr>
            </thead>
            <tbody>
              {ageCategories.map((cat, idx) => {
                const isMatched = cat.name === matchedAgeCategory
                const values = getThresholdValues(cat, isPrecision ? 'precision' : 'application')
                const rowClass = isMatched
                  ? 'bg-primary/10 font-medium'
                  : idx % 2 === 0
                    ? 'bg-bg-secondary/50'
                    : ''

                return (
                  <tr
                    key={cat.name || idx}
                    className={rowClass}
                    aria-current={isMatched ? 'true' : undefined}
                  >
                    <td className="py-1 px-2 text-left">
                      <span className="inline-flex items-center gap-1">
                        {formatAgeRange(cat)}
                        {isMatched && (
                          <>
                            <Icon
                              name="ArrowLeft"
                              className="w-3 h-3 text-primary"
                              aria-hidden="true"
                            />
                            <span className="sr-only">(din kategori)</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-1 px-2 text-center tabular-nums">{values.A}</td>
                    <td className="py-1 px-2 text-center tabular-nums">{values.B}</td>
                    <td className="py-1 px-2 text-center tabular-nums">{values.C}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
            {matchedAgeCategory && (
              <span className="sr-only">
                Din ålderskategori är markerad i tabellen.
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Combined age discount display with badge and expandable table
 * Shows age-based threshold information for requirements that have ageCategories
 *
 * @param {Object} props
 * @param {Array} props.ageCategories - Array of age category objects
 * @param {string} props.matchedAgeCategory - Name of the matched age category
 * @param {number} props.age - User's age at evaluation time
 * @param {string} props.type - Requirement type ('precision_series' or 'application_series')
 */
export default function AgeDiscountInfo({ ageCategories, matchedAgeCategory, age, type }) {
  if (!ageCategories || ageCategories.length === 0) return null

  // Find the matched category object for the badge
  const matchedCategory = ageCategories.find(c => c.name === matchedAgeCategory)

  return (
    <div className="mt-1">
      <div className="flex items-center gap-2 flex-wrap">
        <AgeCategoryBadge matchedCategory={matchedCategory} />
        {matchedCategory && (
          <span className="sr-only">
            Åldersrabatt tillämpas baserat på din ålder ({age} år).
          </span>
        )}
      </div>
      <AgeThresholdsTable
        ageCategories={ageCategories}
        matchedAgeCategory={matchedAgeCategory}
        type={type}
      />
    </div>
  )
}
