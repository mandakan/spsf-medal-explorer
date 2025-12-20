export type AchievementType =
  | 'competition'
  | 'application_series'
  | 'qualification'
  | 'team_event'
  | 'event'
  | 'custom'

export interface BaseAchievement {
  id: string
  medalId: string
  type: AchievementType | string
  date: string // ISO
  year: number
  weaponGroup: 'A' | 'B' | 'C' | 'R'
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CompetitionAchievement extends BaseAchievement {
  type: 'competition' | 'precision_series' | 'competition_result'
  score?: number
  points?: number
  competitionName?: string
}

export interface QualificationAchievement extends BaseAchievement {
  type: 'qualification' | 'qualification_result'
  weapon: string
  score: number
}

export interface TeamEventAchievement extends BaseAchievement {
  type: 'team_event'
  teamName: string
  position: number
  participants?: string[]
}

export interface EventAchievement extends BaseAchievement {
  type: 'event'
  eventName: string
}

export interface ApplicationSeriesAchievement extends BaseAchievement {
  type: 'application_series'
}

export interface CustomAchievement extends BaseAchievement {
  type: 'custom'
  eventName?: string
}

export type AnyAchievement =
  | CompetitionAchievement
  | QualificationAchievement
  | TeamEventAchievement
  | EventAchievement
  | ApplicationSeriesAchievement
  | CustomAchievement
