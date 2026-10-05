import type { MoodEntry } from './db'
import { getMoodTag, type MoodTag } from './tags'

export function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function displayDate(date: string): string {
  const [year, month, day] = date.split('-')
  return `${day}.${month}.${year}`
}

export interface EntryFilter {
  from: string
  to: string
  query: string
  tag: MoodTag | ''
  minMood: number
  maxMood: number
}

export function filterEntries(entries: MoodEntry[], filter: EntryFilter): MoodEntry[] {
  const query = filter.query.trim().toLocaleLowerCase('de-DE')
  return entries.filter(entry => (!filter.from || entry.date >= filter.from)
    && (!filter.to || entry.date <= filter.to)
    && entry.mood >= filter.minMood && entry.mood <= filter.maxMood
    && (!filter.tag || entry.tags.includes(filter.tag))
    && (!query || [entry.activity, entry.notes, ...entry.tags.map(tag => getMoodTag(tag).label)]
      .join(' ').toLocaleLowerCase('de-DE').includes(query)))
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime) || (a.id ?? 0) - (b.id ?? 0))
}

export function monthDays(month: Date, entries: MoodEntry[]) {
  const year = month.getFullYear(), index = month.getMonth()
  return Array.from({ length: new Date(year, index + 1, 0).getDate() }, (_, i) => {
    const date = localDate(new Date(year, index, i + 1))
    const daily = entries.filter(entry => entry.date === date)
    return { date, day: i + 1, count: daily.length, average: daily.length
      ? daily.reduce((total, entry) => total + entry.mood, 0) / daily.length : null }
  })
}

// Quote every cell, preserve multiline text, and prevent spreadsheet formula execution.
function csvCell(value: string | number): string {
  const text = String(value)
  const safe = /^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

export function entriesToCsv(entries: MoodEntry[], includeNotes = false): string {
  const header = ['Datum', 'Von', 'Bis', 'Aktivität', 'Stimmung', 'Energie', 'Kategorien']
  if (includeNotes) header.push('Notizen')
  const rows: (string | number)[][] = entries.map(entry => {
    const row: (string | number)[] = [entry.date, entry.startTime, entry.endTime, entry.activity,
      entry.mood, entry.energy ?? '', entry.tags.map(tag => getMoodTag(tag).label).join(', ')]
    if (includeNotes) row.push(entry.notes)
    return row
  })
  return '\uFEFF' + [header, ...rows].map(row => row.map(csvCell).join(';')).join('\r\n') + '\r\n'
}

export function downloadFile(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
