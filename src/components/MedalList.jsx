import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react'

function MedalIcon({ iconUrl, alt, unlocked }) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const ref = useRef(null)

  // Accept only URL-like values (http(s), absolute, relative, or data URI)
  const isUrlLike = (s) => !!s && /^(https?:\/\/|\/|\.{1,2}\/|data:image\/)/.test(s)
  const validSrc = isUrlLike(iconUrl) ? iconUrl : null

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setLoaded(true)
    }, { rootMargin: '200px' })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const showImg = loaded && validSrc && !errored

  return (
    <div
      ref={ref}
      className="relative w-10 h-10 flex items-center justify-center rounded bg-gray-200 dark:bg-slate-700 overflow-hidden"
      aria-hidden="true"
    >
      {unlocked && (
        <span className="absolute -top-1 -right-1 text-[10px]" aria-hidden="true" title="Upplåst">🏆</span>
      )}
      {showImg ? (
        <img
          src={validSrc}
          alt={alt}
          className="w-full h-full object-contain"
          loading="lazy"
          onError={() => setErrored(true)}
        />
      ) : (
        <div className="w-6 h-6 bg-gray-300 dark:bg-slate-600 rounded" />
      )}
    </div>
  )
}

function Row({ data, index, style }) {
  const { medals, onSelect, statusesById } = data
  const medal = medals[index]
  const underReview = typeof medal?.isUnderReview === 'function' ? medal.isUnderReview() : (medal?.reviewed !== true)
  const status = statusesById?.[medal.id]
  const isUnlocked = status?.status === 'unlocked'
  const unlockedYear = (() => {
    if (!isUnlocked) return null
    const iso = status?.unlockedDate
    if (!iso) return null
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? null : d.getFullYear()
  })()
  const ariaLabel = `${medal.displayName || medal.name} ${medal.tier || ''}${underReview ? ' • Under granskning' : ''}${isUnlocked && unlockedYear ? ' • Upplåst ' + unlockedYear : ''}`
  return (
    <div
      role="listitem"
      tabIndex={0}
      onClick={() => onSelect?.(medal)}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect?.(medal) }}
      className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={style}
      aria-label={ariaLabel}
    >
      <MedalIcon iconUrl={medal.iconUrl || medal.icon} alt={medal.displayName || medal.name} unlocked={isUnlocked} />
      <div className="min-w-0">
        <div className="font-medium text-text-primary truncate flex items-center gap-2">
          <span className="truncate">{medal.displayName || medal.name}</span>
          {underReview && (
            <span className="inline-flex items-center gap-1 text-xs text-review" title="Under granskning" aria-label="Under granskning">
              <span className="inline-block w-2 h-2 rounded-full bg-review" aria-hidden="true"></span>
              <span className="sr-only">Under granskning</span>
            </span>
          )}
        </div>
        <div className="text-sm text-text-secondary truncate">
          {medal.type} • {medal.tier}
          {isUnlocked && unlockedYear != null ? ` • Upplåst ${unlockedYear}` : ''}
        </div>
      </div>
    </div>
  )
}

function VirtualList({ height, itemCount, itemSize, width = '100%', itemData, children }) {
  const containerRef = useRef(null)
  const [scrollTop, setScrollTop] = useState(0)
  const overscan = 4

  const onScroll = (e) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  const totalHeight = itemCount * itemSize
  const startIndex = Math.max(0, Math.floor(scrollTop / itemSize) - overscan)
  const viewportCount = Math.ceil(height / itemSize) + overscan * 2
  const endIndex = Math.min(itemCount, startIndex + viewportCount)

  const items = []
  for (let i = startIndex; i < endIndex; i++) {
    const style = {
      position: 'absolute',
      top: i * itemSize,
      height: itemSize,
      width: '100%',
    }
    const element = children({ index: i, style, data: itemData })
    items.push(React.cloneElement(element, { key: i }))
  }

  return (
    <div
      ref={containerRef}
      style={{ height, width, overflowY: 'auto', position: 'relative', WebkitOverflowScrolling: 'touch' }}
      onScroll={onScroll}
      role="list"
      aria-label="Medal list"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {items}
      </div>
    </div>
  )
}

export default function MedalList({ medals, onSelect, height = 800, itemSize = 60, statusesById }) {
  const itemData = useMemo(() => ({ medals, onSelect, statusesById }), [medals, onSelect, statusesById])
  const itemCount = medals?.length || 0

  const RowMemo = useCallback((props) => <Row {...props} />, [])

  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-md overflow-hidden">
      <VirtualList
        height={height}
        itemCount={itemCount}
        itemSize={itemSize}
        width="100%"
        itemData={itemData}
      >
        {RowMemo}
      </VirtualList>
    </div>
  )
}
