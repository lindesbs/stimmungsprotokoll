# Stimmungsprotokoll

Das Stimmungsprotokoll ist eine deutschsprachige, offlinefähige Web-App. Sie hilft dabei, die eigene Stimmung schnell und mit möglichst wenig Aufwand festzuhalten. Die ruhige, übersichtliche Bedienung ist besonders für Tage gedacht, an denen Konzentration und Energie gering sind.

> Das Stimmungsprotokoll ist ein persönliches Hilfsmittel und kein Medizinprodukt. Es stellt keine Diagnose und ersetzt keine medizinische oder psychotherapeutische Beratung.

## Das Wichtigste auf einen Blick

- Eine Stimmung lässt sich mit einer einzigen Auswahl speichern.
- Alle weiteren Angaben sind freiwillig.
- Die App funktioniert nach dem ersten Laden auch offline.
- Es wird kein Benutzerkonto benötigt.
- Die Einträge bleiben auf dem verwendeten Gerät und werden nicht automatisch übertragen.

## Stimmung eintragen

Für einen schnellen Eintrag genügt es, genau ein Stimmungsfeld auszuwählen und zu speichern. Optional können weitere Informationen ergänzt werden:

- Schmerzen
- Schlaf
- Bewegung
- Medikamente
- Soziales
- Stress
- Energie
- Aktivität
- Uhrzeit
- persönliche Bemerkung

Nach dem Speichern erscheint eine Bestätigung. Ein versehentlich gespeicherter Eintrag kann für kurze Zeit rückgängig gemacht werden.

## Verlauf und Zusammenhänge

Die App zeigt die gespeicherten Einträge in einer Tages- und Wochenansicht. Dazu gehören:

- der Stimmungsverlauf einer Woche
- ein Wochenmittelwert
- die zeitliche Verteilung der Einträge
- Vergleiche mit den gewählten Kategorien
- eine Druck- und PDF-Ansicht

### Monatsübersicht

Über **Monat** wird ein Kalender mit dem durchschnittlichen Stimmungswert jedes Tages angezeigt. Die Pfeile wechseln den Monat. Ein Klick auf einen Tag öffnet dessen Einträge. Tage ohne Einträge bleiben ohne Stimmungswert; das Monatsmittel berücksichtigt nur gespeicherte Einträge. Das Diagramm stellt die Einträge zeitlich dar, auch über Monats- und Jahresgrenzen hinweg.

### Suchen und filtern

Unter **Suche & Export** lassen sich alle gespeicherten Einträge nach Zeitraum, Kategorie, Stimmungsbereich und Text durchsuchen. Die Textsuche berücksichtigt Aktivitäten, persönliche Notizen und Kategorien. Alle Filter wirken gemeinsam. **Filter zurücksetzen** zeigt wieder alle Einträge. Über **Bearbeiten** kann ein Treffer direkt geöffnet werden.

### PDF-Bericht und CSV-Export

1. Öffne **☰ → Drucken / PDF** für die gerade ausgewählte Woche bzw. den Monat oder **Suche & Export** für alle Einträge.
2. Wähle den gewünschten Zeitraum und gegebenenfalls weitere Filter. Die Vorschau zeigt genau die Einträge, die exportiert werden.
3. Persönliche Notizen sind zunächst ausgeschlossen. Aktiviere bei Bedarf **Persönliche Notizen im Bericht und CSV einschließen**.
4. Wähle **PDF / Drucken** und im Druckdialog des Browsers **Als PDF speichern**. Der Bericht enthält Zeitraum, aktive Filter, Mittelwert, Stimmungsverlauf und eine Tabelle mit Aktivität, Stimmung, Energie und Kategorien. Lange Berichte verteilen sich auf mehrere Seiten.
5. Alternativ lädt **CSV herunterladen** die ausgewählten Einträge für Excel oder LibreOffice herunter. **☰ → CSV exportieren** öffnet ebenfalls die Auswahl.

PDF und CSV werden lokal im Browser erzeugt. Die Dateien enthalten persönliche Angaben und sind nicht verschlüsselt. CSV verwendet UTF-8 und Semikolons; beim manuellen Import in eine Tabellenkalkulation diese Einstellungen wählen. Texte, die als Tabellenformeln ausgeführt werden könnten, werden mit einem führenden Apostroph geschützt. CSV ist kein wiederherstellbares Backup; dafür weiterhin **Backup erstellen** verwenden.

Die Auswertungen beschreiben lediglich Auffälligkeiten in den eigenen Einträgen. Sie behaupten nicht, dass eine Kategorie die Ursache für eine bestimmte Stimmung ist.

## Erinnerungen und Unterstützung

Auf Wunsch zeigt die App einmal täglich beim Öffnen oder während der Nutzung eine Erinnerung an. Sie kann für den aktuellen Tag ohne Wertung übersprungen werden. Es gibt keine Serien, Punkte oder Bestrafungen für ausgelassene Tage.

Nach einer sehr niedrigen Stimmung erscheint ein zurückhaltender Hinweis auf Hilfsangebote. Informationen zur Krisenhilfe sind außerdem jederzeit erreichbar.

## Datenschutz und Datenspeicherung

Alle Protokolleinträge werden ausschließlich im lokalen Speicher des verwendeten Browsers abgelegt. Es gibt kein Benutzerkonto, keine automatische Cloud-Synchronisierung und kein Anwendungs-Backend, an das die Einträge übertragen werden.

Die Daten gehören immer zu der Kombination aus Gerät, Browser und Adresse der App. Sie können verloren gehen, wenn:

- Website- oder Browserdaten gelöscht werden,
- die App einschließlich ihrer Daten entfernt wird,
- der Browser zurückgesetzt oder gewechselt wird,
- ein anderes Gerät verwendet wird.

Deshalb sollte regelmäßig über **Backup** eine Sicherungsdatei erstellt werden. Diese Datei enthält persönliche Gesundheitsinformationen und ist nicht verschlüsselt. Sie sollte sicher und nur für die eigene Verwendung aufbewahrt werden.

Ein vorhandenes Backup kann in der App geprüft und wiederhergestellt werden. Vor dem Ersetzen bestehender Einträge wird eine Sicherheitsabfrage angezeigt.

## Installation

Die App wird direkt im Browser geöffnet und kann anschließend wie eine normale App auf dem Gerät installiert werden. Eine Anleitung für Android, iPhone, iPad, Windows, macOS und Linux befindet sich in der [Installationsanleitung](INSTALLATION.md).

Nach der Installation ist für neue Einträge und Auswertungen normalerweise keine Internetverbindung erforderlich. Gelegentlich sollte die App online geöffnet werden, damit Aktualisierungen geladen werden können.

## Entwicklung und Tests

Voraussetzung: eine aktuelle Node.js-LTS-Version. Im Repository-Verzeichnis:

```bash
npm ci
npm run dev
```

```bash
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm test` prüft Filter, CSV, Monatsberechnungen, Backup-Validierung und Speicherung mit einer IndexedDB-Testimplementierung. Die Playwright-Tests verwenden einen separaten Browser mit Beispieldaten und prüfen Speichern/Neuladen, Bearbeiten, Rückgängig, Backup-Import/-Export, Monatsnavigation, Filter, CSV-Downloads und PDF-Druck einschließlich mehrseitiger und mobiler Ansichten. Der Testserver startet automatisch auf Port 4174. PDF-Beispiele und Screenshots liegen nach dem Test unter `test-results/`.

Falls Chromium bereits installiert ist, kann `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e` verwendet werden. In der Codex-Cloud lässt sich ein nicht beschreibbarer npm-Standardcache durch `npm ci --cache /tmp/stimmungsprotokoll-npm-cache` ersetzen.

GitHub Actions führt die Prüfungen bei Pull Requests und vor dem Pages-Deployment aus. Der Pages-Build verwendet `BASE_PATH=/stimmungsprotokoll/ npm run build`.
