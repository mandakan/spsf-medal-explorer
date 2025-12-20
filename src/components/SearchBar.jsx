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
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden>🔍</span>
        <input
          type="text"
          ref={inputRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={handleFocus}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
          placeholder={placeholder}
          className="input pl-8 min-h-[44px]"
          aria-label="Search medals"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls="search-suggestions"
          aria-haspopup="listbox"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange?.('')}
            className="btn btn-muted h-11 w-11 flex items-center justify-center ml-2"
            aria-label="Clear search"
          >
            ✕
          </button>
        ) : null}
      </div>

      {showSuggestions && (suggestions || []).length > 0 && (
        <div id="search-suggestions" role="listbox" aria-label="Search suggestions" className="absolute top-full left-0 right-0 mt-1 bg-bg-secondary border border-border rounded-lg shadow-lg z-10 text-foreground">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion}-${index}`}
              type="button"
              role="option"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-2 min-h-[44px] hover:bg-background border-b border-border last:border-b-0 text-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
