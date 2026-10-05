import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { db } from '../../src/lib/db'
import { useMoodStore } from '../../src/stores/mood'
import { entry } from '../fixtures'

beforeEach(async () => { setActivePinia(createPinia()); await db.entries.clear() })
afterEach(() => vi.restoreAllMocks())

describe('Lokale Speicherung und Backup-Wiederherstellung', () => {
  it('speichert, lädt, aktualisiert und löscht ohne doppelte Einträge', async () => {
    const store = useMoodStore()
    const id = await store.save(entry())
    setActivePinia(createPinia())
    const reloaded = useMoodStore()
    await reloaded.load()
    expect(reloaded.entries[0]).toMatchObject({ id, activity: 'Spaziergang', mood: 8 })
    await reloaded.save({ ...reloaded.entries[0], mood: 3 })
    expect(await db.entries.count()).toBe(1)
    expect(reloaded.entries[0].mood).toBe(3)
    await reloaded.remove(id)
    expect(await db.entries.count()).toBe(0)
  })
  it('ersetzt Daten atomar und normalisiert ältere Kategorien', async () => {
    const store = useMoodStore()
    await store.save(entry())
    await store.replaceAll([entry({ id: 100, activity: 'Import', tags: undefined })])
    expect(store.entries).toHaveLength(1)
    expect(store.entries[0].activity).toBe('Import')
    expect(store.entries[0].tags).toEqual([])
    expect(store.entries[0].id).not.toBe(100)
  })
  it('behält vorhandene Daten bei einem fehlgeschlagenen Import', async () => {
    const store = useMoodStore()
    await store.save(entry())
    vi.spyOn(db.entries, 'bulkAdd').mockRejectedValueOnce(new Error('Speicherfehler'))
    await expect(store.replaceAll([entry({ activity: 'Import' })])).rejects.toThrow('Speicherfehler')
    await store.load()
    expect(store.entries).toHaveLength(1)
    expect(store.entries[0].activity).toBe('Spaziergang')
  })
})
