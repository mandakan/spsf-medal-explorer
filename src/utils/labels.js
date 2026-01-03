const ACHIEVEMENT_TYPE_LABELS = {
  precision_series: 'Precisionsserier',
  application_series: 'Tillämpningsserier',
  competition_result: 'Tävlingsresultat',
  qualification_result: 'Qualification',
  team_event: 'Lag-event',
  event: 'Event',
  custom: 'Custom',
  special_achievement: 'Special achievement',
  standard_medal: 'Standardmedalj',
}

export function getAchievementTypeLabel(type) {
  return ACHIEVEMENT_TYPE_LABELS[type] || type
}
