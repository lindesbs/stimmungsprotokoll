<script setup lang="ts">
import { computed } from 'vue'
import type { MoodEntry } from '../lib/db'

const props = defineProps<{ entries: MoodEntry[] }>()
const sortedEntries = computed(() => [...props.entries].sort((a,b) => (a.date+a.startTime).localeCompare(b.date+b.startTime)))
const dateLabel = (date: string) => date.split('-').reverse().join('.')
const points = computed(() => {
  const sorted = sortedEntries.value
  if (!sorted.length) return ''
  // UTC arithmetic keeps calendar days equally spaced across daylight-saving changes.
  const time = (entry: MoodEntry) => Date.parse(`${entry.date}T${entry.startTime}:00Z`)
  const start = time(sorted[0]), duration = time(sorted[sorted.length - 1]) - start
  return sorted.map(e => {
    const x = duration === 0 ? 50 : ((time(e) - start) / duration) * 100
    const y = 100 - ((e.mood - 1) / 9) * 100
    return `${x},${y}`
  }).join(' ')
})
</script>

<template>
  <div class="card chart-card">
    <div class="section-head"><h2>Stimmungsverlauf</h2><span>{{ entries.length }} Einträge</span></div>
    <div v-if="!entries.length" class="empty">Noch keine Einträge in diesem Zeitraum.</div>
    <template v-else>
    <p class="chart-explanation">Stimmung von 1 (unten) bis 10 (oben). Die Linie verbindet vorhandene Einträge; dazwischen liegen keine Messwerte vor.</p>
    <svg viewBox="-2 -3 104 106" preserveAspectRatio="none" class="chart" role="img" :aria-label="`Stimmungsverlauf mit ${entries.length} Einträgen, Skala 1 bis 10`">
      <line v-for="y in [0,25,50,75,100]" :key="y" x1="0" :y1="y" x2="100" :y2="y" class="gridline" />
      <polyline :points="points" fill="none" class="line" vector-effect="non-scaling-stroke" />
      <circle v-for="(point, index) in points.split(' ')" :key="index" :cx="point.split(',')[0]" :cy="point.split(',')[1]" r="0.7" fill="#39424e" />
    </svg>
    <div class="chart-dates"><span>{{ dateLabel(sortedEntries[0].date) }}</span><span>{{ dateLabel(sortedEntries[sortedEntries.length - 1].date) }}</span></div>
    </template>
  </div>
</template>
