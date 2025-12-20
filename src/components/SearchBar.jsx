import React, { useState } from 'react'

export default function SearchBar({
  value,
  onChange,
  suggestions,
  onSuggestionSelect,
  placeholder = 'Search medals…',
  inputRef,
}) {
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleFocus = () => {
    if ((suggestions || []).length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    onSuggestionSelect?.(suggestion)
    setShowSuggestions(false)
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white">
        <span className="text-gray-400" aria-hidden>🔍</span>
        <input
          type="text"
          ref={inputRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={handleFocus}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
          placeholder={placeholder}
          className="flex-1 outline-none text-text-primary placeholder-text-secondary"
          aria-label="Search medals"
        />
        {value ? (
          <button
            onClick={() => onChange?.('')}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            ✕
          </button>
        ) : null}
      </div>

      {showSuggestions && (suggestions || []).length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion}-${index}`}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0 text-text-primary text-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
