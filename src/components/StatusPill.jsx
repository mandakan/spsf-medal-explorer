import React from 'react'
import Icon from './Icon'
import { getStatusProps } from '../config/statuses'

export function StatusPill({ status, as: Tag = 'span', className = '', id, ...rest }) {
  const s = getStatusProps(status)
  if (!s) return null
  return (
    <Tag
      id={id}
      className={`${s.className} ${className}`.trim()}
      title={s.description}
      aria-label={`${s.label}. ${s.description}`}
      {...rest}
    >
      <Icon name={s.icon} className="w-4 h-4" />
      <span>{s.label}</span>
    </Tag>
  )
}

export default StatusPill
