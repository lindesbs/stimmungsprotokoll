import { describe, expect, it } from 'vitest'
import { entriesToCsv, filterEntries, monthDays, type EntryFilter } from '../../src/lib/entries'
import { isBackupEntry } from '../../src/lib/backup'
import { entry } from '../fixtures'

const all: EntryFilter = { from: '', to: '', query: '', tag: '', minMood: 1, maxMood: 10 }
describe('Suche und Berichtszeiträume', () => {
  const entries = [entry({ date: '2026-10-06', mood: 3, tags: ['sleep'], notes: 'Müde' }),
    entry(), entry({ date: '2026-09-30' }), entry({ date: '2026-10-05', startTime: '09:00' })]
  it('bezieht beide Datumsgrenzen ein und sortiert chronologisch', () => {
    const result = filterEntries(entries, { ...all, from: '2026-10-05', to: '2026-10-06' })
    expect(result.map(e => e.date + ' ' + e.startTime)).toEqual(['2026-10-05 09:00', '2026-10-05 10:00', '2026-10-06 10:00'])
    expect(entries[0].date).toBe('2026-10-06')
  })
  it('kombiniert Kategorie, Stimmung und Text einschließlich Notizen', () => {
    expect(filterEntries(entries, { ...all, query: ' MÜDE ', tag: 'sleep', maxMood: 4 })).toHaveLength(1)
    expect(filterEntries(entries, { ...all, query: 'schlaf', minMood: 4 })).toHaveLength(0)
    expect(filterEntries(entries, { ...all, query: 'Bewegung' })).toHaveLength(3)
  })
  it('liefert bei umgekehrtem Zeitraum keine Einträge', () => {
    expect(filterEntries(entries, { ...all, from: '2026-10-06', to: '2026-10-05' })).toEqual([])
  })
})

describe('Monat', () => {
  it('berücksichtigt Schaltjahre und mittelt nur tatsächliche Einträge', () => {
    const days = monthDays(new Date(2024, 1, 29), [entry({ date: '2024-02-29', mood: 2 }), entry({ date: '2024-02-29', mood: 8 }), entry({ date: '2024-03-01' })])
    expect(days).toHaveLength(29)
    expect(days[28]).toEqual({ date: '2024-02-29', day: 29, count: 2, average: 5 })
    expect(days[0].average).toBeNull()
    expect(monthDays(new Date(2025, 1, 1), [])).toHaveLength(28)
  })
  it('verarbeitet den Jahreswechsel', () => {
    expect(monthDays(new Date(2026, 12, 1), [])[0].date).toBe('2027-01-01')
  })
})

describe('CSV', () => {
  it('enthält BOM, deutsche Kategorien und korrekt maskierte mehrzeilige Felder', () => {
    const csv = entriesToCsv([entry({ activity: 'Grüße; "Hallo"\nWelt', energy: undefined })])
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('"Grüße; ""Hallo""\nWelt";"8";"";"Bewegung"')
    expect(csv).not.toContain('Persönliche Notiz')
    expect(csv).not.toContain('"Notizen"')
  })
  it('exportiert Notizen nur nach Auswahl', () => {
    expect(entriesToCsv([entry()], true)).toContain('Persönliche Notiz')
  })
  it.each(['=1+1', '+SUM(A1)', '-1+2', '@SUM(A1)', '  =1', '\t=1'])('neutralisiert Tabellenformeln %s', text => {
    const csv = entriesToCsv([entry({ activity: text, notes: text })], true)
    expect(csv).toContain(`"'${text}"`)
  })
})

describe('Backup-Validierung', () => {
  it('akzeptiert aktuelle und ältere Backups ohne optionale Felder', () => {
    expect(isBackupEntry(entry())).toBe(true)
    const { tags, energy, ...legacy } = entry()
    expect(isBackupEntry(legacy)).toBe(true)
  })
  it.each([{ date: '2026-02-30' }, { startTime: '25:10' }, { mood: NaN }, { energy: 11 }, { tags: 'sleep' }, { notes: null }])('weist ungültige Daten zurück: %j', overrides => {
    expect(isBackupEntry({ ...entry(), ...overrides })).toBe(false)
  })
})
