import type { MoodEntry } from '../src/lib/db'

export function entry(overrides: Partial<MoodEntry> = {}): MoodEntry {
  return { date: '2026-10-05', startTime: '10:00', endTime: '10:30', activity: 'Spaziergang',
    mood: 8, energy: 5, tags: ['movement'], notes: 'Persönliche Notiz',
    createdAt: '2026-10-05T08:00:00Z', updatedAt: '2026-10-05T08:00:00Z', ...overrides }
}
