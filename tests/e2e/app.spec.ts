import { expect, test, type Page } from '@playwright/test'
import { entry } from '../fixtures'

async function start(page: Page) {
  await page.clock.setFixedTime(new Date('2026-10-05T12:00:00Z'))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Stimmungsprotokoll', exact: true })).toBeVisible()
}

async function importEntries(page: Page, data: unknown, accept = true) {
  page.once('dialog', dialog => accept ? dialog.accept() : dialog.dismiss())
  await page.locator('input[type=file]').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) })
}

async function seed(page: Page) {
  await start(page)
  await importEntries(page, [entry(), entry({ date: '2026-10-05', startTime: '08:00', mood: 2, activity: 'Ruhe', tags: ['sleep'], notes: 'Nur für mich' }),
    entry({ date: '2026-10-06', activity: 'Arbeit', tags: ['stress'], mood: 4 }),
    entry({ date: '2026-09-30', activity: 'September', mood: 6 })])
  await expect(page.getByRole('status')).toContainText('Backup wurde importiert.')
}

test('Schnelleintrag bleibt nach Neuladen erhalten; Bearbeiten und Rückgängig', async ({ page }) => {
  await start(page)
  await page.getByRole('button', { name: '+ Stimmung eintragen' }).click()
  await page.locator('.mood-choice').filter({ has: page.getByRole('radio', { name: 'Gut', exact: true }) }).click()
  await page.getByRole('button', { name: 'Jetzt speichern' }).click()
  await expect(page.locator('article.entry')).toContainText('8/10')
  await page.reload()
  await expect(page.locator('article.entry')).toHaveCount(1)
  await page.getByRole('button', { name: 'Bearbeiten', exact: true }).click()
  await page.locator('.mood-choice').filter({ has: page.getByRole('radio', { name: 'Okay', exact: true }) }).click()
  await page.getByRole('button', { name: 'Änderungen speichern' }).click()
  await expect(page.locator('article.entry')).toContainText('5/10')
  await page.getByRole('button', { name: 'Rückgängig' }).click()
  await expect(page.locator('article.entry')).toContainText('8/10')
})

test('Backup exportieren, ersetzen, abbrechen und fehlerhafte Daten ablehnen', async ({ page }) => {
  await seed(page)
  await page.getByRole('button', { name: 'Menü öffnen' }).click()
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Backup erstellen', exact: true }).click()
  const stream = await (await downloaded).createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  const backup = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  expect(backup).toHaveLength(4)
  await importEntries(page, [entry({ activity: 'Abgebrochen' })], false)
  await expect(page.locator('input[type=file]')).toHaveValue('')
  await expect(page.locator('article.entry')).toHaveCount(2)
  await importEntries(page, [{ ...entry(), date: '2026-02-30' }])
  await expect(page.locator('input[type=file]')).toHaveValue('')
  await expect(page.locator('article.entry')).toHaveCount(2)
  await importEntries(page, [entry({ activity: 'Ersetzt' })])
  await expect(page.locator('article.entry')).toHaveCount(1)
  await expect(page.locator('article.entry')).toContainText('Ersetzt')
  await importEntries(page, backup)
  await page.reload()
  await expect(page.locator('article.entry')).toHaveCount(2)
})

test('Monatsmittel, Monatsnavigation und Tagesauswahl', async ({ page }) => {
  await seed(page)
  await page.getByRole('button', { name: 'Monat', exact: true }).click()
  await expect(page.locator('.month-overview')).toContainText('3 Einträge · Monatsmittel: 4.7/10')
  await expect(page.locator('.month-day')).toHaveCount(31)
  await expect(page.getByRole('button', { name: '05.10.2026: 2 Einträge, Mittelwert 5.0 von 10', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Vorheriger Monat' }).click()
  await expect(page.locator('.month-day')).toHaveCount(30)
  await page.getByRole('button', { name: '30.09.2026: 1 Einträge, Mittelwert 6.0 von 10', exact: true }).click()
  await expect(page.locator('article.entry')).toContainText('September')
})

test('Kombinierte Suche, CSV mit und ohne Notizen sowie Filterfehler', async ({ page }) => {
  await seed(page)
  await page.getByRole('button', { name: 'Suche & Export', exact: true }).click()
  await page.getByLabel('Zeitraum von').fill('2026-10-05')
  await page.getByLabel('Zeitraum bis').fill('2026-10-05')
  await page.getByLabel('Kategorie', { exact: true }).selectOption('movement')
  await page.getByLabel('Stimmung mindestens').selectOption('7')
  await page.getByLabel('Suchtext').fill('persönliche')
  await expect(page.locator('.export-report [role=status]')).toContainText('1 Treffer')
  for (const includeNotes of [false, true]) {
    await page.getByLabel('Persönliche Notizen im Bericht und CSV einschließen').setChecked(includeNotes)
    const downloaded = page.waitForEvent('download')
    await page.getByRole('button', { name: 'CSV herunterladen' }).click()
    const download = await downloaded
    expect(download.suggestedFilename()).toBe('stimmungsprotokoll-2026-10-05-2026-10-05.csv')
    const stream = await download.createReadStream()
    const chunks: Buffer[] = []
    for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
    const csv = Buffer.concat(chunks).toString('utf8')
    expect(csv).toContain('Spaziergang')
    expect(csv).not.toContain('September')
    expect(csv.includes('Persönliche Notiz')).toBe(includeNotes)
  }
  await page.getByLabel('Zeitraum bis').fill('2026-10-04')
  await expect(page.getByRole('alert')).toContainText('Startdatum')
  await expect(page.getByRole('button', { name: 'PDF / Drucken' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'CSV herunterladen' })).toBeDisabled()
  await page.getByRole('button', { name: 'Filter zurücksetzen' }).click()
  await expect(page.locator('.export-report [role=status]')).toContainText('4 Treffer')
  await page.getByLabel('Stimmung mindestens').selectOption('9')
  await page.getByLabel('Stimmung höchstens').selectOption('2')
  await expect(page.getByRole('alert')).toContainText('minimale Stimmung')
})

test('PDF-Bericht enthält Diagramm und gewählte Einträge, blendet Bedienelemente aus', async ({ page }, testInfo) => {
  await seed(page)
  await page.getByRole('button', { name: 'Menü öffnen' }).click()
  await page.getByRole('button', { name: 'Drucken / PDF', exact: true }).click()
  await expect(page.getByLabel('Zeitraum von')).toHaveValue('2026-10-05')
  await expect(page.getByLabel('Zeitraum bis')).toHaveValue('2026-10-11')
  await expect(page.locator('.report-table')).not.toContainText('Persönliche Notiz')
  await page.evaluate(() => { window.print = () => { document.documentElement.dataset.printCalled = 'yes' } })
  await page.getByRole('button', { name: 'PDF / Drucken' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-print-called', 'yes')
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.app-header')).toBeHidden()
  await expect(page.locator('.explorer-controls')).toBeHidden()
  await expect(page.locator('.export-report svg')).toBeVisible()
  await expect(page.locator('.report-table')).toContainText('Spaziergang')
  await expect(page.locator('.report-table')).not.toContainText('September')
  const pdf = await page.pdf({ path: testInfo.outputPath('report-without-notes.pdf'), preferCSSPageSize: true })
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
  await page.emulateMedia({ media: 'screen' })
  await page.getByLabel('Persönliche Notizen im Bericht und CSV einschließen').check()
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.report-table')).toContainText('Persönliche Notiz')
  await page.pdf({ path: testInfo.outputPath('report-with-notes.pdf'), preferCSSPageSize: true })
})

test('Mehrseitiger PDF-Bericht und mobile Ansichten', async ({ page }, testInfo) => {
  await start(page)
  await importEntries(page, Array.from({ length: 50 }, (_, i) => entry({ activity: `Eintrag ${i + 1}`, notes: 'Längere Notiz mit mehreren Zeilen.\n'.repeat(5) })))
  await expect(page.locator('.save-toast')).toContainText('Backup wurde importiert.')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Monat', exact: true }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await page.getByRole('button', { name: 'Suche & Export', exact: true }).click()
  await page.getByLabel('Persönliche Notizen im Bericht und CSV einschließen').check()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await page.screenshot({ path: testInfo.outputPath('mobile-report.png'), fullPage: false })
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.report-table tbody tr')).toHaveCount(50)
  await page.pdf({ path: testInfo.outputPath('long-report.pdf'), preferCSSPageSize: true })
})

test('Leere Suche verhindert Export; Treffer aus einem anderen Monat lassen sich bearbeiten', async ({ page }) => {
  await seed(page)
  await page.getByRole('button', { name: 'Suche & Export', exact: true }).click()
  await page.getByLabel('Suchtext').fill('nicht vorhanden')
  await expect(page.locator('.export-report')).toContainText('Keine Einträge für diese Auswahl.')
  await expect(page.getByRole('button', { name: 'CSV herunterladen' })).toBeDisabled()
  await page.getByLabel('Suchtext').fill('September')
  await page.locator('.report-table').getByRole('button', { name: 'Bearbeiten' }).click()
  await expect(page.getByRole('heading', { name: 'Mittwoch, 30. September 2026' })).toBeVisible()
  await page.getByLabel('Aktivität', { exact: true }).fill('Geändert')
  await page.getByRole('button', { name: 'Änderungen speichern' }).click()
  await expect(page.locator('article.entry')).toHaveCount(1)
  await expect(page.locator('article.entry')).toContainText('Geändert')
})
