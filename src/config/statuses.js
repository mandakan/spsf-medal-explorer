export const STATUS_ORDER = ['locked', 'available', 'eligible', 'unlocked']

const STATUSES = {
  locked: {
    id: 'locked',
    label: 'Låst',
    description: 'Förkrav ej uppfyllda.',
    icon: 'Lock',
    className: 'status-badge status--locked',
  },
  available: {
    id: 'available',
    label: 'Tillgänglig',
    description: 'Medaljen är tillgänglig att påbörja.',
    icon: 'Compass',
    className: 'status-badge status--available',
  },
  eligible: {
    id: 'eligible',
    label: 'Kvalificerad',
    description: 'Förkrav uppfyllda. Prestationskrav återstår.',
    icon: 'BadgeCheck',
    className: 'status-badge status--eligible',
  },
  unlocked: {
    id: 'unlocked',
    label: 'Upplåst',
    description: 'Medaljen är erhållen.',
    icon: 'Medal',
    className: 'status-badge status--unlocked',
  },
}

export function getStatusProps(status) {
  return STATUSES[status] || null
}
