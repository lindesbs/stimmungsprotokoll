<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue'
import type { MoodEntry } from '../lib/db'
import { displayDate, downloadFile, entriesToCsv, filterEntries, type EntryFilter } from '../lib/entries'
import { getMoodTag, MOOD_TAGS } from '../lib/tags'
import MoodChart from './MoodChart.vue'

const props = defineProps<{ entries: MoodEntry[]; initialFrom?: string; initialTo?: string }>()
defineEmits<{ edit: [entry: MoodEntry] }>()
const filter = reactive<EntryFilter>({ from: props.initialFrom ?? '', to: props.initialTo ?? '',
  query: '', tag: '', minMood: 1, maxMood: 10 })
const includeNotes = ref(false)
const error = computed(() => filter.from && filter.to && filter.from > filter.to
  ? 'Das Startdatum muss vor oder auf dem Enddatum liegen.'
  : filter.minMood > filter.maxMood ? 'Die minimale Stimmung darf nicht über der maximalen liegen.' : '')
const results = computed(() => error.value ? [] : filterEntries(props.entries, filter))
const average = computed(() => results.value.length
  ? (results.value.reduce((total, entry) => total + entry.mood, 0) / results.value.length).toFixed(1) : '–')
const period = computed(() => {
  const from = filter.from || results.value[0]?.date
  const to = filter.to || results.value[results.value.length - 1]?.date
  return from && to ? `${displayDate(from)} – ${displayDate(to)}` : 'Alle gespeicherten Einträge'
})
const filename = computed(() => `stimmungsprotokoll-${filter.from || results.value[0]?.date || 'alle'}-${filter.to || results.value[results.value.length - 1]?.date || 'alle'}`)
function reset() {
  Object.assign(filter, { from: '', to: '', query: '', tag: '', minMood: 1, maxMood: 10 })
}
async function printReport() {
  if (error.value || !results.value.length) return
  await nextTick()
  await document.fonts?.ready
  window.print()
}
function exportCsv() {
  if (error.value || !results.value.length) return
  downloadFile(entriesToCsv(results.value, includeNotes.value), `${filename.value}.csv`, 'text/csv;charset=utf-8')
}
</script>

<template>
  <section class="entry-explorer" aria-label="Suche und Export">
    <div class="card explorer-controls no-print">
      <h2>Suche &amp; Export</h2>
      <p>Suche in allen gespeicherten Einträgen. PDF und CSV enthalten genau die angezeigten Treffer.</p>
      <div class="filter-fields">
        <label>Zeitraum von<input v-model="filter.from" type="date" /></label>
        <label>Zeitraum bis<input v-model="filter.to" type="date" /></label>
        <label>Suchtext<input v-model="filter.query" type="search" placeholder="Aktivität, Notiz oder Kategorie" /></label>
        <div><label for="filter-category">Kategorie</label><select id="filter-category" v-model="filter.tag"><option value="">Alle Kategorien</option>
          <option v-for="tag in MOOD_TAGS" :key="tag.id" :value="tag.id">{{ tag.label }}</option></select></div>
        <div><label for="filter-min-mood">Stimmung mindestens</label><select id="filter-min-mood" v-model.number="filter.minMood"><option v-for="mood in 10" :key="mood" :value="mood">{{ mood }}</option></select></div>
        <div><label for="filter-max-mood">Stimmung höchstens</label><select id="filter-max-mood" v-model.number="filter.maxMood"><option v-for="mood in 10" :key="mood" :value="mood">{{ mood }}</option></select></div>
      </div>
      <button class="ghost" @click="reset">Filter zurücksetzen</button>
      <p v-if="error" role="alert">{{ error }}</p>
      <label class="notes-option"><input v-model="includeNotes" type="checkbox" /> Persönliche Notizen im Bericht und CSV einschließen</label>
      <p>Die Dateien enthalten persönliche Angaben. Notizen werden nur auf Wunsch ausgegeben. CSV dient der Auswertung; zum Wiederherstellen verwende das JSON-Backup.</p>
      <div class="actions export-actions">
        <button class="primary" :disabled="!!error || !results.length" @click="printReport">PDF / Drucken</button>
        <button :disabled="!!error || !results.length" @click="exportCsv">CSV herunterladen</button>
      </div>
      <p>Für eine PDF-Datei im Druckdialog „Als PDF speichern“ wählen.</p>
    </div>

    <section class="export-report" aria-labelledby="report-heading">
      <h2 id="report-heading">Stimmungsbericht</h2>
      <p>{{ period }}</p>
      <p v-if="filter.query || filter.tag || filter.minMood !== 1 || filter.maxMood !== 10" class="report-filter-summary">
        Filter: <span v-if="filter.query">Suchtext „{{ filter.query }}“ · </span>
        <span v-if="filter.tag">Kategorie {{ getMoodTag(filter.tag).label }} · </span>
        Stimmung {{ filter.minMood }}–{{ filter.maxMood }}/10
      </p>
      <p role="status">{{ results.length }} Treffer · Mittelwert: {{ average }}<template v-if="results.length">/10</template></p>
      <p v-if="!results.length" class="empty">Keine Einträge für diese Auswahl.</p>
      <template v-else>
        <MoodChart :entries="results" />
        <div class="report-table-wrap">
          <table class="report-table" :class="{ 'with-notes': includeNotes }">
            <caption>Einträge im ausgewählten Zeitraum</caption>
            <thead><tr><th scope="col">Datum / Zeit</th><th scope="col">Aktivität</th><th scope="col">Stimmung</th><th scope="col">Energie</th><th scope="col">Kategorien</th><th v-if="includeNotes" scope="col">Notizen</th><th class="no-print" scope="col">Aktion</th></tr></thead>
            <tbody><tr v-for="entry in results" :key="entry.id">
              <td>{{ displayDate(entry.date) }}<br />{{ entry.startTime }}<template v-if="entry.endTime !== entry.startTime">–{{ entry.endTime }}</template></td>
              <td>{{ entry.activity || 'Stimmungseintrag' }}</td><td>{{ entry.mood }}/10</td><td>{{ entry.energy === undefined ? '–' : entry.energy + '/10' }}</td>
              <td>{{ entry.tags.map(tag => getMoodTag(tag).label).join(', ') || '–' }}</td>
              <td v-if="includeNotes" class="report-notes">{{ entry.notes || '–' }}</td>
              <td class="no-print"><button @click="$emit('edit', entry)">Bearbeiten</button></td>
            </tr></tbody>
          </table>
        </div>
        <p class="report-footnote">Persönliche Aufzeichnungen. Die Übersicht stellt keine Diagnose dar. Fehlende Einträge sind keine Stimmungswerte.</p>
      </template>
    </section>
  </section>
</template>
