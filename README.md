# Stimmungsprotokoll PWA

Eine deutschsprachige, offlinefähige Progressive Web App zum schnellen Festhalten von Stimmung, Energie, Aktivitäten und begleitenden Kategorien. Die Anwendung ist bewusst auf einen möglichst kurzen, reizarmen Eingabeweg ausgelegt.

> Die Anwendung ist ein persönliches Protokollwerkzeug und kein Medizinprodukt. Sie stellt keine Diagnose und gibt keine Therapieempfehlungen.

## Installation für Nutzerinnen und Nutzer

Die Anwendung wird über eine HTTPS-Webadresse verteilt und direkt aus dem Browser installiert. Eine ausführliche Schritt-für-Schritt-Anleitung für Android, iPhone/iPad, Windows, macOS und Linux steht in [INSTALLATION.md](INSTALLATION.md).

Für die Weitergabe genügt normalerweise:

1. App unter einer festen HTTPS-Adresse bereitstellen, zum Beispiel `https://stimmung.example.de`.
2. Adresse als Link oder QR-Code weitergeben.
3. Nutzerinnen und Nutzer öffnen die Adresse und folgen der Installationsanleitung.

Es muss keine Installationsdatei verschickt werden. Die erste Nutzung benötigt eine Internetverbindung; danach funktionieren Eingabe und Auswertung auch offline.

## Aktueller Funktionsumfang

### Schnelle Eingabe

- genau ein auswählbares Stimmungsfeld
- Speichern ohne weitere Pflichtangaben
- optionale Kategorien: Schmerzen, Schlaf, Bewegung, Medikamente, Soziales und Stress
- optionale Detailangaben zu Uhrzeit, Aktivität, genauer Stimmung, Energie und Bemerkung
- Schutz vor doppeltem Speichern
- sichtbare Speicherbestätigung mit acht Sekunden verfügbarer Rückgängig-Funktion

### Verlauf und Auswertung

- Tagesansicht von Montag bis Sonntag
- direkter Sprung zum heutigen Tag
- Wochenmittelwert und grafischer Stimmungsverlauf
- Wochenraster mit 24 Stunden
- Kategorievergleiche für die aktuelle Woche oder die letzten 30 Tage
- Anzeige der verwendeten Datenmenge
- vorsichtige Formulierungen ohne Ursache-Wirkungs-Behauptungen
- Druck- und PDF-Ansicht

### Erinnerung und Unterstützung

- optionale lokale Tageserinnerung
- „Heute nicht“ ohne Serie, Punkte oder negative Wertung
- unaufdringlicher Hilfehinweis nach einer sehr niedrigen Stimmung
- dauerhaft erreichbare Krisenhilfe mit TelefonSeelsorge und weiterführenden Hilfen

Die lokale Erinnerung erscheint beim Öffnen oder während der Nutzung der App. Ein garantierter Hinweis bei vollständig geschlossener App würde eine zusätzliche Push-Infrastruktur benötigen.

### Daten und Sicherheit

- lokale Speicherung in IndexedDB über Dexie
- kein Benutzerkonto und kein Anwendungs-Backend
- JSON-Backup und Wiederherstellung
- Prüfung und Sicherheitsabfrage vor dem Ersetzen vorhandener Daten
- Backup-Hinweis nach fünf Einträgen, wenn noch kein Backup besteht oder es älter als 30 Tage ist
- vollständiges Löschen aller lokalen Einträge
- barrierearme, große Bedienelemente und tastaturbedienbare Einzelauswahl

## Wo werden die Daten gespeichert?

Alle Protokolleinträge liegen ausschließlich im IndexedDB-Speicher des verwendeten Browsers. Einstellungen wie Erinnerungszeit und Datum des letzten Backups werden in `localStorage` gespeichert.

Die Daten werden nicht automatisch zwischen Geräten oder Browsern synchronisiert. Folgende Aktionen können zum Verlust des lokalen Datenbestands führen:

- Löschen der Website- oder Browserdaten
- Zurücksetzen des Browserprofils
- Entfernen der installierten Web-App einschließlich ihrer Daten
- Wechsel auf ein anderes Gerät, einen anderen Browser oder eine andere Domain

Vor solchen Änderungen sollte über **Backup** eine JSON-Datei erstellt werden. Die Backup-Datei enthält sensible Gesundheitsinformationen und ist nicht verschlüsselt; sie sollte entsprechend sicher aufbewahrt werden.

Der Hosting-Anbieter erhält keine Protokolleinträge. Wie bei jeder Website können beim Aufruf jedoch technische Verbindungsdaten wie IP-Adresse, Zeitpunkt und angefragte Dateien in Serverprotokollen erscheinen.

## Empfohlene Verteilung

### Kleine oder private Nutzergruppe

Für Tests, Familie, Selbsthilfegruppen oder einen kleinen Nutzerkreis ist statisches HTTPS-Hosting unter einer festen Subdomain die einfachste Lösung:

- eine kurze Adresse wie `stimmung.example.de`
- automatisches HTTPS-Zertifikat
- Weitergabe per Link und QR-Code
- Updates immer unter derselben Adresse
- optional eine vorgeschaltete Zugriffskontrolle, falls bereits eine passende Infrastruktur vorhanden ist

Eine nur schwer zu erratende URL ist kein echter Zugriffsschutz. Obwohl die Einträge lokal bleiben, kann jeder mit der Adresse die leere Anwendung öffnen.

### Cloudflare Pages

Das Projekt kann als statische Vite-Anwendung aus einem Git-Repository bereitgestellt werden:

| Einstellung | Wert |
| --- | --- |
| Build-Befehl | `npm run build` |
| Ausgabeverzeichnis | `dist` |
| Umgebungsvariablen | keine erforderlich |

Nach jeder Änderung im verbundenen Hauptbranch wird automatisch eine neue Version gebaut. Für eine langfristige Verteilung sollte eine eigene, unveränderte Domain verwendet werden.

### Eigener Webserver

Produktionsdateien erzeugen:

```bash
npm ci
npm run build
```

Anschließend wird ausschließlich der Inhalt des Ordners `dist/` auf den Webserver übertragen. Beispiel für Caddy:

```caddyfile
stimmung.example.de {
    root * /var/www/stimmungsprotokoll/dist
    try_files {path} /index.html
    file_server
}
```

Caddy stellt bei korrekt eingerichteter Domain automatisch HTTPS bereit.

### GitHub Pages

GitHub Pages ist für dieses Repository vollständig vorbereitet. Der Workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) baut und veröffentlicht die PWA automatisch nach jedem Push auf `main`. Er setzt beim Build den benötigten Repository-Unterpfad; Manifest, Service Worker, Icons und statische Dateien verwenden dadurch dieselbe Basisadresse.

Einmalig muss im GitHub-Repository unter **Settings → Pages → Build and deployment → Source** die Option **GitHub Actions** gewählt werden. Danach ist die Anwendung unter folgender Adresse erreichbar:

```text
https://lindesbs.github.io/stimmungsprotokoll/
```

Der Workflow kann außerdem unter **Actions → Deploy PWA to GitHub Pages → Run workflow** manuell gestartet werden. Der Build verwendet ausschließlich die im Repository enthaltenen Dateien und benötigt keine Secrets.

### App Stores und verwaltete Geräte

Für die normale Nutzung ist kein App Store erforderlich. Browser können die PWA direkt installieren. Eine spätere Veröffentlichung im Microsoft Store oder als verpackte Android-/iOS-App ist möglich, bringt aber zusätzliche Prüf-, Signierungs- und Pflegeprozesse mit sich.

In Organisationen können Administratoren die Web-App außerdem über Browser-Richtlinien verteilen. Das ist erst sinnvoll, wenn Domain, Datenschutz, Support und Updateprozess dauerhaft feststehen.

## Updates

Die PWA verwendet einen Service Worker mit automatischer Aktualisierung. Für ein Update:

1. neue Version bauen,
2. den Inhalt von `dist/` am bestehenden Hosting-Ziel ersetzen,
3. Domain und Pfad unverändert lassen.

Beim nächsten Online-Start lädt die App die neue Version. Ein erneutes Installieren ist normalerweise nicht erforderlich. Lokal gespeicherte Einträge bleiben bei normalen Programmupdates erhalten.

Ein Wechsel der Domain erzeugt aus Sicht des Browsers einen neuen, leeren Datenspeicher. Vor einem Domainwechsel müssen daher alle Nutzer ein Backup erstellen und es auf der neuen Adresse wieder importieren.

## Lokale Entwicklung

Voraussetzung ist eine aktuelle Node.js-LTS-Version.

```bash
npm install
npm run dev
```

Danach die von Vite ausgegebene lokale Adresse öffnen.

## Produktions-Build prüfen

```bash
npm run build
npm run preview
```

Der fertige statische Build liegt im Ordner `dist/`. Vor einer Verteilung sollte die Installation mindestens auf einem Android-Gerät mit Chrome und einem iPhone mit Safari geprüft werden.

## Qualitätssicherung

Ein kurzer Ablauf für Tests mit Nutzerinnen und Nutzern steht in [USABILITY_TEST.md](USABILITY_TEST.md). Im Mittelpunkt stehen Eingabedauer, Fehlbedienungen, Verständlichkeit, Lesbarkeit und das sichere Auffinden von Backup und Hilfe.

## Offizielle weiterführende Anleitungen

- [Web-App in Chrome installieren](https://support.google.com/chrome/answer/9658361)
- [Website auf iPhone oder iPad als App installieren](https://support.apple.com/en-euro/guide/iphone/iphea86e5236/ios)
- [Progressive Web Apps in Microsoft Edge verwenden](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/ux)
- [Safari-Web-Apps auf dem Mac](https://support.apple.com/en-gb/104996)
- [PWA-Installation und Manifest](https://web.dev/learn/pwa/installation)
- [Vite-Projekt mit Cloudflare Pages bereitstellen](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/)
