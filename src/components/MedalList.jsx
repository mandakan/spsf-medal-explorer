import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react'
import { FixedSizeList as List } from 'react-window'

function MedalIcon({ iconUrl, alt }) {
  const [loaded, setLoaded] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setLoaded(true)
      }
    }, { rootMargin: '200px' })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="w-10 h-10 flex items-center justify-center rounded bg-gray-200 dark:bg-slate-700 overflow-hidden">
      {loaded && iconUrl ? (
        <img src={iconUrl} alt={alt} className="w-full h-full object-contain" loading="lazy" />
      ) : (
        <div className="w-6 h-6 bg-gray-300 dark:bg-slate-600 rounded animate-pulse" />
      )}
    </div>
  )
}

function Row({ data, index, style }) {
  const { medals, onSelect } = data
  const medal = medals[index]
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(medal)}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect?.(medal) }}
      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={style}
      aria-label={`${medal.displayName || medal.name} ${medal.tier || ''}`}
    >
      <MedalIcon iconUrl={medal.iconUrl || medal.icon} alt={medal.displayName || medal.name} />
      <div className="min-w-0">
        <div className="font-medium text-text-primary truncate">{medal.displayName || medal.name}</div>
        <div className="text-sm text-text-secondary truncate">{medal.type} • {medal.tier}</div>
      </div>
    </div>
  )
}

export default function MedalList({ medals, onSelect, height = 800, itemSize = 60 }) {
  const itemData = useMemo(() => ({ medals, onSelect }), [medals, onSelect])
  const itemCount = medals?.length || 0

  const RowMemo = useCallback((props) => <Row {...props} />, [])

  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-md overflow-hidden">
      <List
        height={height}
        itemCount={itemCount}
        itemSize={itemSize}
        width="100%"
        itemData={itemData}
      >
        {RowMemo}
      </List>
    </div>
  )
}
