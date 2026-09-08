export const MOOD_TAGS = [
  { id: 'pain', label: 'Schmerzen', icon: '🩹' },
  { id: 'sleep', label: 'Schlaf', icon: '🌙' },
  { id: 'movement', label: 'Bewegung', icon: '👟' },
  { id: 'medication', label: 'Medikamente', icon: '💊' },
  { id: 'social', label: 'Soziales', icon: '👥' },
  { id: 'stress', label: 'Stress', icon: '⚡' }
] as const

export type MoodTag = typeof MOOD_TAGS[number]['id']

const moodTagIds = new Set<string>(MOOD_TAGS.map(tag => tag.id))

export function isMoodTag(value: unknown): value is MoodTag {
  return typeof value === 'string' && moodTagIds.has(value)
}

export function normalizeMoodTags(value: unknown): MoodTag[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter(isMoodTag))]
}

export function getMoodTag(id: MoodTag) {
  return MOOD_TAGS.find(tag => tag.id === id)!
}
