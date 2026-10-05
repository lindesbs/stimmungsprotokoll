import type { MoodEntry } from './db'

function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function isBackupEntry(value: unknown): value is MoodEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Record<string, unknown>
  const time = (value: unknown) => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
  const score = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 10
  return validDate(entry.date) && time(entry.startTime) && time(entry.endTime)
    && typeof entry.activity === 'string' && score(entry.mood)
    && (entry.energy === undefined || score(entry.energy))
    && (entry.tags === undefined || (Array.isArray(entry.tags) && entry.tags.every(tag => typeof tag === 'string')))
    && typeof entry.notes === 'string' && typeof entry.createdAt === 'string' && typeof entry.updatedAt === 'string'
}
