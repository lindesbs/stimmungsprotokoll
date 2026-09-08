<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { MoodEntry } from '../lib/db'
import { MOOD_TAGS, type MoodTag } from '../lib/tags'

const props = defineProps<{ date: string; entry?: MoodEntry | null; saving?: boolean }>()
const emit = defineEmits<{ save: [entry: MoodEntry]; cancel: [] }>()

const MOOD_CHOICES = [
  { value: 1, label: 'Sehr schlecht', emoji: '😞' },
  { value: 3, label: 'Schlecht', emoji: '🙁' },
  { value: 5, label: 'Okay', emoji: '😐' },
  { value: 8, label: 'Gut', emoji: '🙂' },
  { value: 10, label: 'Sehr gut', emoji: '😄' }
] as const

const ENERGY_CHOICES = [
  { value: 1, label: 'Sehr wenig' },
  { value: 3, label: 'Wenig' },
  { value: 5, label: 'Mittel' },
  { value: 8, label: 'Viel' },
  { value: 10, label: 'Sehr viel' }
] as const

function currentTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

const empty = (): MoodEntry => {
  const time = currentTime()
  return {
    date: props.date,
    startTime: time,
    endTime: time,
    activity: '',
    mood: 5,
    energy: undefined,
    tags: [],
    notes: '',
    createdAt: '',
    updatedAt: ''
  }
}

const form = reactive<MoodEntry>(empty())

watch(() => [props.entry, props.date] as const, () => {
  Object.assign(form, props.entry
    ? { ...props.entry, tags: [...(props.entry.tags ?? [])] }
    : empty())
}, { immediate: true, deep: true })

const emoji = computed(() => {
  if (form.mood <= 2) return '😞'
  if (form.mood <= 4) return '🙁'
  if (form.mood <= 6) return '😐'
  if (form.mood <= 8) return '🙂'
  return '😄'
})

function submit() {
  if (props.saving) return
  emit('save', {
    ...form,
    activity: form.activity.trim(),
    tags: [...form.tags],
    notes: form.notes.trim()
  })
}

function toggleTag(tag: MoodTag) {
  const index = form.tags.indexOf(tag)
  if (index === -1) form.tags.push(tag)
  else form.tags.splice(index, 1)
}

const selectedMoodChoice = computed(() => {
  if (form.mood <= 2) return 1
  if (form.mood <= 4) return 3
  if (form.mood <= 6) return 5
  if (form.mood <= 8) return 8
  return 10
})

const selectedEnergyChoice = computed(() => {
  if (form.energy === undefined) return undefined
  if (form.energy <= 2) return 1
  if (form.energy <= 4) return 3
  if (form.energy <= 6) return 5
  if (form.energy <= 8) return 8
  return 10
})
</script>

<template>
  <form class="card form" @submit.prevent="submit">
    <fieldset class="mood-fieldset">
      <legend>Wie geht es dir gerade?</legend>
      <p class="form-hint">Ein Gefühl auswählen reicht. Alles Weitere ist optional.</p>
      <div class="mood-picker">
        <label
          v-for="choice in MOOD_CHOICES"
          :key="choice.value"
          class="mood-choice"
          :class="{ selected: selectedMoodChoice === choice.value }"
        >
          <input
            class="mood-choice-input"
            type="radio"
            name="mood-quick-choice"
            :value="choice.value"
            :checked="selectedMoodChoice === choice.value"
            @change="form.mood = choice.value"
          />
          <span class="mood-choice-emoji" aria-hidden="true">{{ choice.emoji }}</span>
          <span class="mood-choice-label">{{ choice.label }}</span>
        </label>
      </div>
    </fieldset>

    <fieldset class="tag-fieldset">
      <legend>Was spielt gerade eine Rolle? <span>Optional</span></legend>
      <div class="tag-picker">
        <button
          v-for="tag in MOOD_TAGS"
          :key="tag.id"
          type="button"
          class="tag-chip"
          :class="{ selected: form.tags.includes(tag.id) }"
          :data-tag="tag.id"
          :aria-pressed="form.tags.includes(tag.id)"
          @click="toggleTag(tag.id)"
        >
          <span aria-hidden="true">{{ tag.icon }}</span>{{ tag.label }}
        </button>
      </div>
    </fieldset>

    <details class="entry-details" :open="Boolean(form.id)">
      <summary>Details hinzufügen <span>Optional</span></summary>
      <div class="details-content">
        <div class="form-grid two">
          <label>Von<input v-model="form.startTime" type="time" required /></label>
          <label>Bis<input v-model="form.endTime" type="time" required /></label>
        </div>
        <label>Aktivität<input v-model="form.activity" maxlength="180" placeholder="z. B. Spaziergang oder Arbeit" /></label>
        <label>Stimmung genauer einstellen: <strong>{{ form.mood }}/10 {{ emoji }}</strong>
          <input v-model.number="form.mood" class="mood-range" type="range" min="1" max="10" step="1" />
          <div class="range-labels"><span>1</span><span>5</span><span>10</span></div>
        </label>
        <fieldset class="energy-fieldset">
          <legend>Energie <span>Optional</span></legend>
          <div class="energy-picker">
            <label
              v-for="choice in ENERGY_CHOICES"
              :key="choice.value"
              class="energy-choice"
              :class="{ selected: selectedEnergyChoice === choice.value }"
            >
              <input
                class="mood-choice-input"
                type="radio"
                name="energy-choice"
                :value="choice.value"
                :checked="selectedEnergyChoice === choice.value"
                @change="form.energy = choice.value"
              />
              {{ choice.label }}
            </label>
          </div>
          <button v-if="form.energy !== undefined" type="button" class="clear-energy" @click="form.energy = undefined">Energieangabe entfernen</button>
        </fieldset>
        <label>Bemerkung<textarea v-model="form.notes" rows="3" placeholder="Nur wenn du möchtest"></textarea></label>
      </div>
    </details>

    <div class="actions">
      <button type="submit" class="primary quick-save" :disabled="saving">{{ saving ? 'Speichert…' : form.id ? 'Änderungen speichern' : 'Jetzt speichern' }}</button>
      <button type="button" class="ghost" :disabled="saving" @click="$emit('cancel')">Abbrechen</button>
    </div>
  </form>
</template>
