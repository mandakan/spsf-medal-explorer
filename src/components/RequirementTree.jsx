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
  const yearValue = leaf.windowYear != null ? leaf.windowYear : (leaf.subtreeYear != null ? leaf.subtreeYear : null)
  const yearText = yearValue != null ? `• År ${yearValue}` : null

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

function RequirementNode({ node, path = 'root', level = 0, defaultExpanded = level === 0, noBorderTop = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const headerId = `${path}-group`
  const isGroup = node?.node === 'and' || node?.node === 'or'

  if (!node) return null

  const liClass = (level > 0 || !noBorderTop) ? 'border-l border-border pl-3' : 'pl-0'

  // Flatten single-child boolean groups to avoid redundant containers
  if (isGroup) {
    const children = node.children || []
    if (children.length === 1) {
      return (
        <RequirementNode
          node={children[0]}
          path={path}
          level={level}
          defaultExpanded={defaultExpanded}
          noBorderTop={noBorderTop}
        />
      )
    }
  }

  if (!isGroup) {
    const leaf = node.leaf || { isMet: false, description: 'Okänt krav' }
    if (leaf.subtree) {
      const headerIdLeaf = `${path}-leaf`
      const st = leaf.subtree
      const isBoolGroup = st && (st.node === 'and' || st.node === 'or')
      const hasChildren = Array.isArray(st?.children)
      const singleChild = isBoolGroup && hasChildren && st.children.length === 1

      // Flatten when not a boolean group or when only a single child exists
      if (!isBoolGroup || singleChild) {
        return (
          <li className={liClass}>
            <RequirementNode
              node={leaf.subtree}
              path={`${path}-sub`}
              level={level}
              defaultExpanded={level < 1}
              noBorderTop
            />
          </li>
        )
      }

      let summary = null
      const operatorLabel = st.node === 'and' ? 'Alla följande' : 'Minst en av följande'
      const labelText = leaf.description || operatorLabel
      if (hasChildren) {
        const { met: metCount, total } = countMet(st.children)
        const progressText = `${metCount}/${total} uppfyllda`
        summary = leaf.description ? `${operatorLabel} • ${progressText}` : progressText
      }

      return (
        <li className={liClass}>
          <GroupHeader
            id={headerIdLeaf}
            label={labelText}
            met={!!leaf.isMet}
            summary={summary}
            expanded={expanded}
            onToggle={() => setExpanded(e => !e)}
          />
          {expanded && (
            <ul id={headerIdLeaf} role="group" className="ml-2">
              <RequirementNode
                node={leaf.subtree}
                path={`${path}-sub`}
                level={level + 1}
                defaultExpanded={level < 1}
              />
            </ul>
          )}
        </li>
      )
    }
    return (
      <li className={liClass}>
        <LeafRow leaf={leaf} />
      </li>
    )
  }

  const children = node.children || []
  const { met, total } = countMet(children)
  const label = node.node === 'and' ? 'Alla följande' : 'Minst en av följande'
  const summary = `${met}/${total} uppfyllda`

  return (
    <li className={liClass}>
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

  // Flatten root while it is a boolean group with a single child
  const flattenedRoot = useMemo(() => {
    let n = root
    while (n && (n.node === 'and' || n.node === 'or') && Array.isArray(n.children) && n.children.length === 1) {
      n = n.children[0]
    }
    return n
  }, [root])

  const isTopLevelAnd = flattenedRoot.node === 'and'

  return (
    <div className="bg-background border border-border rounded p-3" role="region" aria-label="Krav">
      <ul className="text-sm text-muted-foreground space-y-1">
        {isTopLevelAnd
          ? (flattenedRoot.children || []).map((child, idx) => (
              <RequirementNode
                key={`root-${idx}`}
                node={child}
                path={`root-${idx}`}
                level={0}
                defaultExpanded
                noBorderTop
              />
            ))
          : <RequirementNode node={flattenedRoot} />
        }
      </ul>
    </div>
  )
}
