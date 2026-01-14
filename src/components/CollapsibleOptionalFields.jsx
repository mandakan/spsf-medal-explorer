import React, { useState } from 'react'
import Icon from './Icon'

/**
 * Collapsible section for optional form fields.
 * Collapsed by default to save screen space and improve UX.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Optional form fields to show when expanded
 * @param {string} [props.label="Valfria fält"] - Label for the toggle button
 * @param {boolean} [props.defaultExpanded=false] - Whether to start expanded
 */
export default function CollapsibleOptionalFields({
  children,
  label = 'Valfria fält',
  defaultExpanded = false
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="border-t border-border pt-4">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="
          flex items-center justify-between w-full
          text-left text-sm font-medium text-text-secondary
          hover:text-text-primary transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
          rounded-md p-2 -m-2
          min-h-[44px]
        "
        aria-expanded={isExpanded}
        aria-controls="optional-fields-content"
      >
        <span className="flex items-center gap-2">
          <Icon
            name={isExpanded ? 'ChevronDown' : 'ChevronRight'}
            className="w-4 h-4 transition-transform"
            aria-hidden="true"
          />
          {label}
        </span>
        <span className="text-xs text-text-tertiary">
          {isExpanded ? 'Dölj' : 'Visa'}
        </span>
      </button>

      {isExpanded && (
        <div
          id="optional-fields-content"
          className="mt-4 space-y-4 animate-slide-down"
        >
          {children}
        </div>
      )}
    </div>
  )
}
