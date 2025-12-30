import React from 'react'
import Icon from './Icon'
import { getStatusColorVar } from '../config/statusColors.js'
import { ICON_FOR_STATUS } from '../constants/statusIcons.js'

export default function StatusIcon({ status, className = 'w-4 h-4' }) {
  const name = ICON_FOR_STATUS[status] || 'Circle'
  const colorVar = getStatusColorVar(status)
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
