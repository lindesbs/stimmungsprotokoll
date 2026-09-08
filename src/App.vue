<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useMoodStore } from './stores/mood'
import type { MoodEntry } from './lib/db'
import { getMoodTag } from './lib/tags'
import AppSettings from './components/AppSettings.vue'
import EntryForm from './components/EntryForm.vue'
import MoodChart from './components/MoodChart.vue'
import TagInsights from './components/TagInsights.vue'
import WeekGrid from './components/WeekGrid.vue'

const REMINDER_KEY = 'stimmungsprotokoll-reminder'
const BACKUP_KEY = 'stimmungsprotokoll-last-backup'

interface ReminderPreferences {
  enabled: boolean
  time: string
  lastShownDate: string
}

type UndoAction =
  | { kind: 'created'; id: number }
  | { kind: 'updated'; entry: MoodEntry }

function loadReminderPreferences(): ReminderPreferences {
  try {
    const saved = JSON.parse(localStorage.getItem(REMINDER_KEY) ?? '') as Partial<ReminderPreferences>
    return {
      enabled: Boolean(saved.enabled),
      time: /^\d{2}:\d{2}$/.test(saved.time ?? '') ? saved.time! : '19:00',
      lastShownDate: typeof saved.lastShownDate === 'string' ? saved.lastShownDate : ''
    }
  } catch {
    return { enabled: false, time: '19:00', lastShownDate: '' }
  }
}

const store = useMoodStore()
const current = ref(new Date())
const selectedDate = ref(formatDate(new Date()))
const editing = ref<MoodEntry | null>(null)
const showForm = ref(false)
const saving = ref(false)
const view = ref<'day'|'week'>('day')
const reminderPreferences = loadReminderPreferences()
const reminderEnabled = ref(reminderPreferences.enabled)
const reminderTime = ref(reminderPreferences.time)
const lastReminderDate = ref(reminderPreferences.lastShownDate)
const showReminder = ref(false)
const lastBackup = ref(localStorage.getItem(BACKUP_KEY) ?? '')
const showLowMoodSupport = ref(false)
const toastMessage = ref('')
const undoAction = ref<UndoAction | null>(null)
const importInput = ref<HTMLInputElement | null>(null)
let reminderTimer: number | undefined
let toastTimer: number | undefined

onMounted(async () => {
  try {
    await store.load()
  } catch {
    showToast('Die lokalen Daten konnten nicht geladen werden. Bitte prüfe die Browser-Einstellungen.')
  }
  checkReminder()
  reminderTimer = window.setInterval(checkReminder, 60_000)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  if (reminderTimer) window.clearInterval(reminderTimer)
  if (toastTimer) window.clearTimeout(toastTimer)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

function formatDate(d: Date) {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}
function parseDate(s: string) { const [y,m,d] = s.split('-').map(Number); return new Date(y,m-1,d) }
function mondayOf(d: Date) { const x = new Date(d); const day = (x.getDay()+6)%7; x.setDate(x.getDate()-day); x.setHours(0,0,0,0); return x }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate()+n); return x }
function deDate(d: Date, opts: Intl.DateTimeFormatOptions = {}) { return new Intl.DateTimeFormat('de-DE', opts).format(d) }

const weekStart = computed(() => mondayOf(current.value))
const weekDays = computed(() => Array.from({length:7}, (_,i) => {
  const d = addDays(weekStart.value, i)
  return { date: formatDate(d), label: deDate(d,{weekday:'short', day:'2-digit', month:'2-digit'}) }
}))
const weekEntries = computed(() => {
  const dates = new Set(weekDays.value.map(d => d.date))
  return store.entries.filter(e => dates.has(e.date))
})
const dayEntries = computed(() => store.byDate(selectedDate.value))
const weekAverage = computed(() => weekEntries.value.length ? weekEntries.value.reduce((s,e)=>s+e.mood,0)/weekEntries.value.length : 0)
const weekLabel = computed(() => `${deDate(weekStart.value,{day:'2-digit',month:'2-digit'})} – ${deDate(addDays(weekStart.value,6),{day:'2-digit',month:'2-digit',year:'numeric'})}`)
const backupDue = computed(() => {
  if (store.entries.length < 5) return false
  const last = Date.parse(lastBackup.value)
  return !Number.isFinite(last) || Date.now() - last > 30 * 24 * 60 * 60 * 1000
})

function moveWeek(offset: number) {
  current.value = addDays(current.value, offset*7)
  selectedDate.value = formatDate(weekStart.value)
}
function goToday() {
  const today = new Date()
  current.value = today
  selectedDate.value = formatDate(today)
}
function openNew(date = selectedDate.value) { view.value = 'day'; selectedDate.value = date; editing.value = null; showForm.value = true }
function openEdit(entry: MoodEntry) { editing.value = entry; selectedDate.value = entry.date; showForm.value = true }
async function save(entry: MoodEntry) {
  if (saving.value) return
  const previous = editing.value
    ? { ...editing.value, tags: [...editing.value.tags] }
    : null
  saving.value = true
  try {
    const id = await store.save(entry)
    showForm.value = false
    editing.value = null
    showToast('Eintrag gespeichert.', previous
      ? { kind: 'updated', entry: previous }
      : { kind: 'created', id })
    if (entry.mood <= 2) showLowMoodSupport.value = true
  } catch {
    showToast('Der Eintrag konnte nicht gespeichert werden. Bitte versuche es noch einmal.')
  } finally {
    saving.value = false
  }
}
async function remove(entry: MoodEntry) {
  if (entry.id && confirm('Eintrag wirklich löschen?')) {
    await store.remove(entry.id)
    showToast('Eintrag wurde gelöscht.')
  }
}
function moodEmoji(m: number) { return m<=2?'😞':m<=4?'🙁':m<=6?'😐':m<=8?'🙂':'😄' }

function showToast(message: string, action: UndoAction | null = null) {
  if (toastTimer) window.clearTimeout(toastTimer)
  toastMessage.value = message
  undoAction.value = action
  toastTimer = window.setTimeout(() => {
    toastMessage.value = ''
    undoAction.value = null
  }, action ? 8_000 : 3_500)
}

async function undoLastSave() {
  const action = undoAction.value
  if (!action) return
  undoAction.value = null
  if (action.kind === 'created') await store.remove(action.id)
  else await store.save(action.entry)
  showToast('Änderung rückgängig gemacht.')
}

function persistReminderPreferences() {
  localStorage.setItem(REMINDER_KEY, JSON.stringify({
    enabled: reminderEnabled.value,
    time: reminderTime.value,
    lastShownDate: lastReminderDate.value
  }))
}

function currentClockTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function setReminderEnabled(value: boolean) {
  reminderEnabled.value = value
  showReminder.value = false
  if (value && currentClockTime() >= reminderTime.value) lastReminderDate.value = formatDate(new Date())
  persistReminderPreferences()
}

function setReminderTime(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return
  reminderTime.value = value
  persistReminderPreferences()
  checkReminder()
}

function checkReminder() {
  if (!reminderEnabled.value) return
  const today = formatDate(new Date())
  if (lastReminderDate.value === today || currentClockTime() < reminderTime.value) return
  showReminder.value = true
  lastReminderDate.value = today
  persistReminderPreferences()
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') checkReminder()
}

function openReminderEntry() {
  const today = new Date()
  current.value = today
  showReminder.value = false
  openNew(formatDate(today))
}

function exportJson() {
  const blob = new Blob([JSON.stringify(store.entries,null,2)], {type:'application/json'})
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=`stimmungsprotokoll-${formatDate(new Date())}.json`; a.click(); URL.revokeObjectURL(url)
  lastBackup.value = new Date().toISOString()
  localStorage.setItem(BACKUP_KEY, lastBackup.value)
  showToast('Backup wurde erstellt.')
}
function isBackupEntry(value: unknown): value is MoodEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Record<string, unknown>
  return typeof entry.date === 'string'
    && typeof entry.startTime === 'string'
    && typeof entry.endTime === 'string'
    && typeof entry.activity === 'string'
    && typeof entry.mood === 'number'
    && entry.mood >= 1
    && entry.mood <= 10
    && (entry.energy === undefined || (typeof entry.energy === 'number' && entry.energy >= 1 && entry.energy <= 10))
    && typeof entry.notes === 'string'
    && typeof entry.createdAt === 'string'
    && typeof entry.updatedAt === 'string'
}
function importJson(e: Event) {
  const input = e.target as HTMLInputElement; const file = input.files?.[0]; if (!file) return
  const reader = new FileReader(); reader.onload = async () => {
    try {
      const data = JSON.parse(String(reader.result))
      if (!Array.isArray(data) || !data.every(isBackupEntry)) throw new Error()
      if (!confirm(`Das Backup enthält ${data.length} Einträge und ersetzt die aktuell gespeicherten Daten. Fortfahren?`)) {
        input.value = ''
        return
      }
      await store.replaceAll(data)
      showToast('Backup wurde importiert.')
    }
    catch { alert('Die Datei konnte nicht importiert werden.') }
    input.value=''
  }; reader.readAsText(file)
}
async function clearAllEntries() {
  if (!confirm('Alle Einträge in diesem Browser endgültig löschen? Ein Backup kann später wieder importiert werden.')) return
  await store.clearAll()
  lastBackup.value = ''
  localStorage.removeItem(BACKUP_KEY)
  showForm.value = false
  editing.value = null
  showToast('Alle Einträge wurden gelöscht.')
}
function printWeek() { view.value='week'; setTimeout(() => window.print(), 100) }
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div><h1>Stimmungsprotokoll</h1><p>Aktivitäten und Stimmung einfach festhalten</p></div>
      <div class="header-actions no-print">
        <a class="button ghost" href="#hilfe">Hilfe</a>
        <button class="ghost" @click="exportJson">Backup</button>
        <button class="ghost" @click="importInput?.click()">Import</button>
        <input ref="importInput" hidden type="file" accept="application/json" @change="importJson" />
        <button class="ghost" @click="printWeek">Drucken / PDF</button>
      </div>
    </header>

    <main>
      <section v-if="showReminder" class="card notice-card reminder-notice no-print" role="status">
        <div><strong>Wie geht es dir gerade?</strong><span>Ein kurzer Stimmungseintrag genügt.</span></div>
        <div class="notice-actions">
          <button class="primary" @click="openReminderEntry">Stimmung eintragen</button>
          <button class="ghost" @click="showReminder=false">Heute nicht</button>
        </div>
      </section>

      <section v-if="backupDue" class="card notice-card backup-notice no-print" role="status">
        <div><strong>Zeit für ein Backup</strong><span>Dein letztes Backup liegt über 30 Tage zurück oder wurde noch nicht erstellt.</span></div>
        <button class="ghost" @click="exportJson">Backup erstellen</button>
      </section>

      <section class="week-nav card no-print">
        <button aria-label="Vorherige Woche" @click="moveWeek(-1)">‹</button>
        <div><strong>{{ weekLabel }}</strong><small>Wochenmittel: {{ weekAverage ? weekAverage.toFixed(1) + '/10' : '–' }}</small><button class="today-link" @click="goToday">Heute</button></div>
        <button aria-label="Nächste Woche" @click="moveWeek(1)">›</button>
      </section>

      <nav class="tabs no-print">
        <button :class="{active:view==='day'}" :aria-pressed="view==='day'" @click="view='day'">Tagesansicht</button>
        <button :class="{active:view==='week'}" :aria-pressed="view==='week'" @click="view='week'">Wochenplan</button>
      </nav>

      <template v-if="view==='day'">
        <div class="days no-print">
          <button v-for="day in weekDays" :key="day.date" :class="{active:selectedDate===day.date}" :aria-pressed="selectedDate===day.date" @click="selectedDate=day.date">{{ day.label }}</button>
        </div>

        <section class="section-head">
          <div><h2>{{ deDate(parseDate(selectedDate), {weekday:'long', day:'2-digit', month:'long', year:'numeric'}) }}</h2><span>{{ dayEntries.length }} Einträge</span></div>
          <button class="primary no-print" @click="openNew()">+ Stimmung eintragen</button>
        </section>

        <EntryForm v-if="showForm" :date="selectedDate" :entry="editing" :saving="saving" @save="save" @cancel="showForm=false" />

        <section v-if="showLowMoodSupport" class="card low-mood-support no-print" role="note">
          <div><strong>Du musst damit nicht allein bleiben.</strong><span>Wenn du möchtest, findest du unten kostenfreie und anonyme Hilfe.</span></div>
          <a class="button ghost" href="#hilfe">Hilfe ansehen</a>
          <button class="close-button" aria-label="Hinweis schließen" @click="showLowMoodSupport=false">×</button>
        </section>

        <div v-if="!dayEntries.length && !showForm" class="card empty">Noch kein Eintrag. Ein kurzer Stimmungstipp genügt.</div>
        <article v-for="entry in dayEntries" :key="entry.id" class="entry card">
          <div class="time">
            {{ entry.startTime }}
            <template v-if="entry.endTime !== entry.startTime"><span>–</span>{{ entry.endTime }}</template>
          </div>
          <div class="entry-main">
            <h3>{{ entry.activity || 'Stimmungseintrag' }}</h3>
            <div v-if="entry.tags.length || entry.energy !== undefined" class="entry-tags">
              <span v-for="tag in entry.tags" :key="tag" class="tag-badge" :data-tag="tag">
                <span aria-hidden="true">{{ getMoodTag(tag).icon }}</span>{{ getMoodTag(tag).label }}
              </span>
              <span v-if="entry.energy !== undefined" class="tag-badge energy-badge"><span aria-hidden="true">🔋</span>Energie {{ entry.energy }}/10</span>
            </div>
            <p v-if="entry.notes">{{ entry.notes }}</p>
          </div>
          <div class="mood"><strong>{{ entry.mood }}/10</strong><span>{{ moodEmoji(entry.mood) }}</span></div>
          <div class="entry-actions no-print"><button @click="openEdit(entry)">Bearbeiten</button><button @click="remove(entry)">Löschen</button></div>
        </article>

        <MoodChart :entries="weekEntries" />
      </template>

      <template v-else>
        <section class="print-title"><h2>Wochenplan Stimmungsprotokoll</h2><p>{{ weekLabel }}</p></section>
        <WeekGrid :days="weekDays" :entries="weekEntries" />
      </template>

      <TagInsights :week-entries="weekEntries" :all-entries="store.entries" />

      <AppSettings
        :reminder-enabled="reminderEnabled"
        :reminder-time="reminderTime"
        :last-backup="lastBackup"
        :backup-due="backupDue"
        :entry-count="store.entries.length"
        @update:reminder-enabled="setReminderEnabled"
        @update:reminder-time="setReminderTime"
        @backup="exportJson"
        @clear="clearAllEntries"
      />

      <section id="hilfe" class="card support-card no-print" aria-labelledby="support-title">
        <div>
          <h2 id="support-title">Wenn es gerade schwer ist</h2>
          <p>Dieses Protokoll ersetzt keine medizinische oder therapeutische Hilfe. Die TelefonSeelsorge ist anonym, kostenfrei und rund um die Uhr erreichbar. Bei akuter Gefahr rufe bitte den Notruf 112.</p>
        </div>
        <div class="support-actions">
          <a class="button primary" href="tel:116123">TelefonSeelsorge 116 123</a>
          <a class="button ghost" href="https://gesund.bund.de/wege-im-gesundheitswesen/erwachsenenleben/notfaelle/psychische-krisen" target="_blank" rel="noopener">Weitere Hilfen</a>
        </div>
      </section>
    </main>

    <div v-if="toastMessage" class="save-toast no-print" role="status" aria-live="polite">
      <span>{{ toastMessage }}</span>
      <button v-if="undoAction" @click="undoLastSave">Rückgängig</button>
    </div>
  </div>
</template>
