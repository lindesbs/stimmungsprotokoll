<script setup lang="ts">
import { computed } from 'vue'
import type { MoodEntry } from '../lib/db'

const props = defineProps<{ entries: MoodEntry[] }>()
const points = computed(() => {
  const sorted = [...props.entries].sort((a,b) => (a.date+a.startTime).localeCompare(b.date+b.startTime))
  if (!sorted.length) return ''
  return sorted.map((e, i) => {
    const x = sorted.length === 1 ? 50 : (i / (sorted.length - 1)) * 100
    const y = 100 - ((e.mood - 1) / 9) * 100
    return `${x},${y}`
  }).join(' ')
})
</script>

<template>
  <div class="card chart-card">
    <div class="section-head"><h2>Stimmungsverlauf</h2><span>{{ entries.length }} Einträge</span></div>
    <div v-if="!entries.length" class="empty">Noch keine Einträge in dieser Woche.</div>
    <svg v-else viewBox="0 0 100 100" preserveAspectRatio="none" class="chart" aria-label="Stimmungsverlauf">
      <line v-for="y in [0,25,50,75,100]" :key="y" x1="0" :y1="y" x2="100" :y2="y" class="gridline" />
      <polyline :points="points" fill="none" class="line" vector-effect="non-scaling-stroke" />
    </svg>
  </div>
</template>
