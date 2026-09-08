import Dexie, { type EntityTable } from 'dexie'
import { normalizeMoodTags, type MoodTag } from './tags'

export interface MoodEntry {
  id?: number
  date: string
  startTime: string
  endTime: string
  activity: string
  mood: number
  energy?: number
  tags: MoodTag[]
  notes: string
  createdAt: string
  updatedAt: string
}

class MoodDatabase extends Dexie {
  entries!: EntityTable<MoodEntry, 'id'>

  constructor() {
    super('stimmungsprotokoll')
    this.version(1).stores({
      entries: '++id, date, mood, startTime, updatedAt'
    })
    this.version(2).stores({
      entries: '++id, date, mood, startTime, updatedAt, *tags'
    }).upgrade(transaction => transaction.table('entries').toCollection().modify(entry => {
      entry.tags = normalizeMoodTags(entry.tags)
    }))
    this.version(3).stores({
      entries: '++id, date, mood, energy, startTime, updatedAt, *tags'
    })
  }
}

export const db = new MoodDatabase()
