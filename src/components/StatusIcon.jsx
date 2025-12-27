import React from 'react'
import Icon from './Icon'

const ICON_FOR_STATUS = {
  review: 'Search',
  placeholder: 'CircleDashed',
  locked: 'Lock',
  available: 'CirclePlus',
  eligible: 'CircleCheck',
  unlocked: 'Trophy',
}

export default function StatusIcon({ status, className = 'w-4 h-4', colorVar }) {
  const name = ICON_FOR_STATUS[status] || 'Circle'
  return (
    <Icon
      name={name}
      className={className}
      style={colorVar ? { color: `var(${colorVar})` } : undefined}
      aria-hidden="true"
      focusable="false"
    />
  )
}
