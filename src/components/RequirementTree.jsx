import React, { useMemo, useState } from 'react'

function StatusIcon({ met }) {
  return (
    <span
      aria-hidden="true"
      className={met ? 'text-foreground' : 'text-muted-foreground'}
      style={{ minWidth: 16, display: 'inline-block' }}
    >
      {met ? '✓' : '○'}
    </span>
  )
}

function GroupHeader({ id, label, met, summary, expanded, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls={id}
      className={[
        'w-full text-left inline-flex items-center justify-between',
        'px-2 py-2 rounded',
        'hover:bg-bg-secondary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'min-h-[44px]'
      ].join(' ')}
    >
      <span className="inline-flex items-center gap-2">
        <StatusIcon met={met} />
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {summary ? <span className="text-xs text-muted-foreground">({summary})</span> : null}
      </span>
      <span aria-hidden="true" className="ml-2">{expanded ? '▼' : '▶'}</span>
    </button>
  )
}

function LeafRow({ leaf }) {
  const label = leaf.description || leaf.type || 'Krav'
  const progressText = leaf.progress && Number.isFinite(leaf.progress.current) && Number.isFinite(leaf.progress.required)
    ? `${leaf.progress.current}/${leaf.progress.required}`
    : null
  const yearText = leaf.windowYear != null ? `• År ${leaf.windowYear}` : null

  return (
    <div className="px-2 py-1 flex items-baseline gap-2">
      <StatusIcon met={!!leaf.isMet} />
      <span className={leaf.isMet ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
      <span className="text-xs text-muted-foreground">
        {progressText}{progressText && yearText ? ' ' : ''}{yearText}
      </span>
    </div>
  )
}

function countMet(children = []) {
  const total = children.length
  const met = children.reduce((acc, n) => acc + (n.isMet ? 1 : 0), 0)
  return { met, total }
}

function RequirementNode({ node, path = 'root', level = 0, defaultExpanded = level === 0 }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const headerId = `${path}-group`
  const isGroup = node?.node === 'and' || node?.node === 'or'

  if (!node) return null

  if (!isGroup) {
    return (
      <li className="border-l border-border pl-3">
        <LeafRow leaf={node.leaf || { isMet: false, description: 'Okänt krav' }} />
      </li>
    )
  }

  const children = node.children || []
  const { met, total } = countMet(children)
  const label = node.node === 'and' ? 'Alla följande' : 'Minst en av följande'
  const summary = `${met}/${total} uppfyllda`

  return (
    <li className="border-l border-border pl-3">
      <GroupHeader
        id={headerId}
        label={label}
        met={!!node.isMet}
        summary={summary}
        expanded={expanded}
        onToggle={() => setExpanded(e => !e)}
      />
      {expanded && (
        <ul id={headerId} role="group" className="ml-2">
          {children.map((child, idx) => (
            <RequirementNode
              key={`${path}-${idx}`}
              node={child}
              path={`${path}-${idx}`}
              level={level + 1}
              defaultExpanded={level < 1}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function RequirementTree({ tree }) {
  const root = useMemo(() => tree || null, [tree])
  if (!root) return null
  return (
    <div className="bg-background border border-border rounded p-3" role="region" aria-label="Krav">
      <ul className="text-sm text-muted-foreground space-y-1">
        <RequirementNode node={root} />
      </ul>
    </div>
  )
}
