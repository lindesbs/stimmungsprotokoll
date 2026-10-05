<script setup lang="ts">
import { computed } from 'vue'
import type { MoodEntry } from '../lib/db'
import { displayDate, monthDays } from '../lib/entries'
import MoodChart from './MoodChart.vue'

const props = defineProps<{ month: Date; entries: MoodEntry[] }>()
defineEmits<{ select: [date: string] }>()
const days = computed(() => monthDays(props.month, props.entries))
const offset = computed(() => (new Date(props.month.getFullYear(), props.month.getMonth(), 1).getDay() + 6) % 7)
const monthlyEntries = computed(() => props.entries.filter(entry => entry.date >= days.value[0].date
  && entry.date <= days.value[days.value.length - 1].date))
const average = computed(() => monthlyEntries.value.length
  ? (monthlyEntries.value.reduce((total, entry) => total + entry.mood, 0) / monthlyEntries.value.length).toFixed(1) : '–')
</script>

<template>
  <section class="card month-overview" aria-labelledby="month-heading">
    <h2 id="month-heading">Monatsübersicht</h2>
    <p>{{ monthlyEntries.length }} Einträge · Monatsmittel: {{ average }}<template v-if="monthlyEntries.length">/10</template></p>
    <p>Die Zahlen zeigen den Tagesmittelwert. Wähle einen Tag, um seine Einträge zu öffnen.</p>
    <div class="month-calendar">
      <strong v-for="weekday in ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']" :key="weekday" aria-hidden="true">{{ weekday }}</strong>
      <span v-for="space in offset" :key="`space-${space}`" aria-hidden="true"></span>
      <button v-for="day in days" :key="day.date" class="month-day"
        :class="{ 'has-entries': day.count > 0 }"
        :aria-label="`${displayDate(day.date)}: ${day.count} Einträge${day.average !== null ? ', Mittelwert ' + day.average.toFixed(1) + ' von 10' : ''}`"
        @click="$emit('select', day.date)">
        <strong>{{ day.day }}</strong>
        <span>{{ day.average === null ? '–' : day.average.toFixed(1) }}</span>
        <small>{{ day.count || 'keine' }}<span class="month-count-label"> Einträge</span></small>
      </button>
    </div>
    <MoodChart :entries="monthlyEntries" />
  </section>
</template>
