<script setup lang="ts">
import type { MoodEntry } from '../lib/db'
import { getMoodTag } from '../lib/tags'

const props = defineProps<{ days: { date: string; label: string }[]; entries: MoodEntry[] }>()

function slotEntries(date: string, hour: number) {
  const prefix = String(hour).padStart(2, '0') + ':'
  return props.entries.filter(e => e.date === date && e.startTime.startsWith(prefix))
}
</script>

<template>
  <div class="week-grid-wrap">
    <table class="week-grid">
      <thead>
        <tr><th>Zeit</th><th v-for="day in days" :key="day.date">{{ day.label }}</th></tr>
      </thead>
      <tbody>
        <tr v-for="hour in 24" :key="hour">
          <th>{{ String(hour - 1).padStart(2, '0') }}–{{ String(hour % 24).padStart(2, '0') }}</th>
          <td v-for="day in days" :key="day.date">
            <div v-for="entry in slotEntries(day.date, hour - 1)" :key="entry.id" class="grid-entry">
              <div class="grid-entry-main"><strong>{{ entry.activity || 'Stimmung' }}</strong><span>{{ entry.mood }}/10</span></div>
              <div v-if="entry.tags.length" class="grid-tags">
                <span v-for="tag in entry.tags" :key="tag" :title="getMoodTag(tag).label" :aria-label="getMoodTag(tag).label">{{ getMoodTag(tag).icon }}</span>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
