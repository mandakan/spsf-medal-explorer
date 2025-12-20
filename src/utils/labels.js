export const ACHIEVEMENT_TYPE_LABELS = {
  precision_series: 'Precision series',
  application_series: 'Application series',
  competition_result: 'Competition result',
  qualification_result: 'Qualification',
  team_event: 'Team event',
  event: 'Event',
  custom: 'Custom',
  special_achievement: 'Special achievement',
  standard_medal: 'Standard medal',
}

export function getAchievementTypeLabel(type) {
  return ACHIEVEMENT_TYPE_LABELS[type] || type
}
