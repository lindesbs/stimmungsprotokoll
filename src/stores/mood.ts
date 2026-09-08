import { defineStore } from 'pinia'
import { db, type MoodEntry } from '../lib/db'
import { normalizeMoodTags } from '../lib/tags'

export const useMoodStore = defineStore('mood', {
  state: () => ({
    entries: [] as MoodEntry[],
    loading: false
  }),
  getters: {
    byDate: (state) => (date: string) => state.entries
      .filter((entry) => entry.date === date)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    averageMood: (state) => {
      if (!state.entries.length) return 0
      return state.entries.reduce((sum, e) => sum + e.mood, 0) / state.entries.length
    }
  },
  actions: {
    async load() {
      this.loading = true
      try {
        this.entries = (await db.entries.toArray()).map(entry => ({
          ...entry,
          tags: normalizeMoodTags(entry.tags)
        }))
      } finally {
        this.loading = false
      }
    },
    async save(entry: MoodEntry) {
      const now = new Date().toISOString()
      const normalizedEntry = { ...entry, tags: normalizeMoodTags(entry.tags) }
      let id: number
      if (entry.id) {
        await db.entries.update(entry.id, { ...normalizedEntry, updatedAt: now })
        id = entry.id
      } else {
        const newId = await db.entries.add({ ...normalizedEntry, createdAt: now, updatedAt: now })
        if (newId === undefined) throw new Error('Eintrag konnte nicht gespeichert werden.')
        id = newId
      }
      await this.load()
      return id
    },
    async remove(id: number) {
      await db.entries.delete(id)
      await this.load()
    },
    async clearAll() {
      await db.entries.clear()
      this.entries = []
    },
    async replaceAll(entries: MoodEntry[]) {
      await db.transaction('rw', db.entries, async () => {
        await db.entries.clear()
        await db.entries.bulkAdd(entries.map(({ id, ...rest }) => ({
          ...rest,
          tags: normalizeMoodTags(rest.tags)
        })))
      })
      await this.load()
    }
  }
})
