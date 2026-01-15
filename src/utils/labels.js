export const ACHIEVEMENT_TYPE_LABELS = {
  precision_series: 'Precisionsserier',
  application_series: 'Tillämpningsserier',
  competition_result: 'Tävlingsresultat',
  qualification_result: 'Kvalifikation',
  team_event: 'Lag-event',
  event: 'Event',
  custom: 'Övrigt',
  special_achievement: 'Specialprestation',
  standard_medal: 'Standardmedalj',
  running_shooting_course: 'Springskytte',
  shooting_round: 'Skytterunda',
  speed_shooting_series: 'Snabbskytteserie',
  competition_performance: 'Tävlingsprestation',
  air_pistol_precision: 'Luftpistol precision',
  cumulative_competition_score: 'Kumulativt tävlingsresultat',
}

export const ACHIEVEMENT_TYPES = Object.keys(ACHIEVEMENT_TYPE_LABELS)

export function getAchievementTypeLabel(type) {
  return ACHIEVEMENT_TYPE_LABELS[type] || type
}
