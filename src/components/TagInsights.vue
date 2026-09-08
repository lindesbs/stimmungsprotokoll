<script setup lang="ts">
import { computed, ref } from 'vue'
import type { MoodEntry } from '../lib/db'
import { MOOD_TAGS } from '../lib/tags'

const props = defineProps<{ weekEntries: MoodEntry[]; allEntries: MoodEntry[] }>()
const scope = ref<'week' | 'month'>('week')

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const scopedEntries = computed(() => {
  if (scope.value === 'week') return props.weekEntries
  const start = new Date()
  start.setDate(start.getDate() - 29)
  const startDate = formatDate(start)
  const endDate = formatDate(new Date())
  return props.allEntries.filter(entry => entry.date >= startDate && entry.date <= endDate)
})

const overallAverage = computed(() => {
  if (!scopedEntries.value.length) return 0
  return scopedEntries.value.reduce((sum, entry) => sum + entry.mood, 0) / scopedEntries.value.length
})

const energyAverage = computed(() => {
  const entries = scopedEntries.value.filter(entry => entry.energy !== undefined)
  if (!entries.length) return null
  return entries.reduce((sum, entry) => sum + entry.energy!, 0) / entries.length
})

const tagStats = computed(() => MOOD_TAGS.map(tag => {
  const entries = scopedEntries.value.filter(entry => entry.tags.includes(tag.id))
  const average = entries.length
    ? entries.reduce((sum, entry) => sum + entry.mood, 0) / entries.length
    : 0

  return {
    ...tag,
    count: entries.length,
    average,
    difference: average - overallAverage.value
  }
}).filter(stat => stat.count > 0))

function comparisonText(count: number, difference: number) {
  if (count < 3) return 'Noch zu wenig Daten für einen Vergleich'
  if (Math.abs(difference) < 0.15) return 'Etwa wie das Mittel dieses Zeitraums'
  return `${Math.abs(difference).toFixed(1)} Punkte ${difference > 0 ? 'über' : 'unter'} dem Mittel dieses Zeitraums`
}
</script>

<template>
  <section class="card insights-card no-print" aria-labelledby="insights-title">
    <div class="section-head">
      <div>
        <h2 id="insights-title">Kategorien im Überblick</h2>
        <span>Gemeinsames Auftreten, keine Ursache</span>
      </div>
      <div class="insights-scope" aria-label="Zeitraum auswählen">
        <button :class="{ active: scope === 'week' }" :aria-pressed="scope === 'week'" @click="scope='week'">Woche</button>
        <button :class="{ active: scope === 'month' }" :aria-pressed="scope === 'month'" @click="scope='month'">30 Tage</button>
      </div>
    </div>

    <div v-if="scopedEntries.length" class="insights-summary">
      <span><strong>{{ scopedEntries.length }}</strong> {{ scopedEntries.length === 1 ? 'Eintrag' : 'Einträge' }}</span>
      <span><strong>{{ overallAverage.toFixed(1) }}/10</strong> Stimmung</span>
      <span v-if="energyAverage !== null"><strong>{{ energyAverage.toFixed(1) }}/10</strong> Energie</span>
    </div>

    <p v-if="!scopedEntries.length" class="insights-empty">In diesem Zeitraum gibt es noch keine Einträge.</p>
    <p v-else-if="!tagStats.length" class="insights-empty">
      Sobald Kategorien verwendet werden, erscheinen hier vorsichtige Vergleiche.
    </p>

    <div v-else class="insights-grid">
      <article v-for="stat in tagStats" :key="stat.id" class="insight-item" :data-tag="stat.id">
        <div class="insight-label"><span aria-hidden="true">{{ stat.icon }}</span><strong>{{ stat.label }}</strong></div>
        <strong class="insight-value">{{ stat.average.toFixed(1) }}/10</strong>
        <span>{{ stat.count }} {{ stat.count === 1 ? 'Eintrag' : 'Einträge' }}</span>
        <small>{{ comparisonText(stat.count, stat.difference) }}</small>
      </article>
    </div>
  </section>
</template>
