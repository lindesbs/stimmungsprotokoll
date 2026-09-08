<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  reminderEnabled: boolean
  reminderTime: string
  lastBackup: string
  backupDue: boolean
  entryCount: number
}>()

const emit = defineEmits<{
  'update:reminderEnabled': [value: boolean]
  'update:reminderTime': [value: string]
  backup: []
  clear: []
}>()

const lastBackupLabel = computed(() => {
  if (!props.lastBackup) return 'Noch kein Backup erstellt'
  const date = new Date(props.lastBackup)
  if (Number.isNaN(date.getTime())) return 'Noch kein Backup erstellt'
  return `Letztes Backup: ${new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(date)}`
})

function changeReminder(event: Event) {
  emit('update:reminderEnabled', (event.target as HTMLInputElement).checked)
}

function changeTime(event: Event) {
  emit('update:reminderTime', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <details class="card settings-card no-print">
    <summary>Einstellungen & Datenschutz</summary>
    <div class="settings-content">
      <section aria-labelledby="reminder-heading">
        <h2 id="reminder-heading">Sanfte Erinnerung</h2>
        <label class="setting-toggle">
          <input type="checkbox" :checked="reminderEnabled" @change="changeReminder" />
          <span>Täglichen Hinweis anzeigen</span>
        </label>
        <label v-if="reminderEnabled" class="setting-time">
          Uhrzeit
          <input type="time" :value="reminderTime" @change="changeTime" />
        </label>
        <p class="setting-note">Der Hinweis erscheint lokal beim Öffnen oder während der Nutzung der App. Es gibt keine Serie und keine Bewertung ausgelassener Tage.</p>
      </section>

      <section aria-labelledby="data-heading">
        <h2 id="data-heading">Meine Daten</h2>
        <p>Alle {{ entryCount }} Einträge liegen ausschließlich in diesem Browser. Die Backup-Datei ist nicht verschlüsselt und sollte sicher aufbewahrt werden.</p>
        <p class="backup-status" :class="{ due: backupDue }">{{ lastBackupLabel }}<template v-if="backupDue"> · Backup empfohlen</template></p>
        <div class="settings-actions">
          <button type="button" class="ghost" @click="$emit('backup')">Backup jetzt erstellen</button>
          <button type="button" class="danger" :disabled="entryCount === 0" @click="$emit('clear')">Alle Einträge löschen</button>
        </div>
      </section>
    </div>
  </details>
</template>
