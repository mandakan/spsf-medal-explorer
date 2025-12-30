import React, { useMemo, useCallback, useRef, useState } from 'react'
import StatusIcon from './StatusIcon'
import { StatusPill } from './StatusPill'


function Row({ data, index, style }) {
  const { medals, onSelect, statusesById } = data
  const medal = medals[index]
  const isPlaceholder = typeof medal?.isPlaceholder === 'function' ? medal.isPlaceholder() : (medal?.status === 'placeholder')
  const underReview = !isPlaceholder && (typeof medal?.isUnderReview === 'function' ? medal.isUnderReview() : (medal?.status === 'under_review'))
  const status = statusesById?.[medal.id]
  const isUnlocked = !isPlaceholder && status?.status === 'unlocked'
  const unlockedYear = (() => {
    if (!isUnlocked) return null
    const iso = status?.unlockedDate
    if (!iso) return null
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? null : d.getFullYear()
  })()
  const name = medal.displayName || medal.name
  const ariaLabel = isPlaceholder
    ? `${name} • Plats­hållare`
    : `${name}${underReview ? ' • Under granskning' : ''}${isUnlocked && unlockedYear ? ' • Upplåst ' + unlockedYear : ''}`
  return (
    <div
      role="listitem"
      tabIndex={0}
      onClick={() => onSelect?.(medal)}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect?.(medal) }}
      className="flex items-center gap-3 px-3 py-2 hover:bg-black/5 dark:hover:bg-white/6 focus-visible:bg-black/10 dark:focus-visible:bg-white/10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={style}
      aria-label={ariaLabel}
    >
      <div className="relative w-10 h-10 flex items-center justify-center rounded bg-bg-secondary" aria-hidden="true">
        <StatusIcon status={status?.status || 'locked'} className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <div className="font-medium text-text-primary grid grid-cols-[1fr_auto] items-start gap-x-2">
          <span className={['clamp-2 min-w-0', isPlaceholder ? 'name--placeholder' : ''].join(' ')}>{name}</span>

          <div className="shrink-0 flex items-center gap-2 justify-self-start">
            {isPlaceholder ? (
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-900 border border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-700"
                aria-label="Status: plats­hållare"
              >
                <StatusIcon status="placeholder" className="w-3.5 h-3.5" />
                Plats­hållare
              </span>
            ) : (
              <span className="relative inline-flex">
                <StatusPill status={status?.status || 'locked'} />
                {underReview && (
                  <span className="pill-flag pointer-events-none" aria-hidden="true">
                    <StatusIcon status="review" className="w-2.5 h-2.5 text-white" />
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
        {/* Secondary line removed: replaced by status pill next to title */}
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

export default function MedalList({ medals, onSelect, height = 800, itemSize = 72, statusesById }) {
  const itemData = useMemo(() => ({ medals, onSelect, statusesById }), [medals, onSelect, statusesById])
  const itemCount = medals?.length || 0

  const RowMemo = useCallback((props) => <Row {...props} />, [])

  return (
    <div className="border border-border rounded-md overflow-hidden">
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
