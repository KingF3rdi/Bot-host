# Bot-host: Minecraft-AFK-Bot (Mineflayer)

Läuft 24/7 ohne PC auf einem Node.js-Host (z. B. bot-hosting.net):
sneakt dauerhaft, respawnt automatisch, führt nach dem Tod den Home-Befehl aus,
leert regelmäßig einen Spawner, verkauft per `/sell` das gesamte Inventar und
verbindet sich bei Kick/Disconnect neu.

**Tod durch einen Spieler:** Der Bot kehrt höchstens `MAX_PLAYER_RETURNS` Mal (Standard 3)
per Home zurück. Beim 4. Spielertod bleibt er am Spawnpunkt stehen (der Zähler wird beim Neustart
des Servers zurückgesetzt). Jeder andere Tod (Mob, Fall, Lava ...) führt immer zurück nach Hause.

## Einstellungen (Umgebungsvariablen im Panel unter Startup)

| Variable | Beispiel | Bedeutung |
|---|---|---|
| `MC_HOST` | `play.example.net` | Server-Adresse |
| `MC_PORT` | `25565` | Port |
| `MC_VERSION` | `1.21.4` | muss zur Server-Version passen |
| `MC_USERNAME` | `bot@mail.de` | Microsoft-Account des Bots |
| `HOME_CMD` | `/home spawner` | Befehl nach Login/Respawn |
| `SPAWNER_POS` | `100,64,200` | Koordinaten des Spawners (x,y,z) |
| `SELL_CMD` | `/sell all` | Befehl, der das ganze Inventar verkauft (je nach Server z. B. `/sell inventory`) |
| `SELL_EVERY_SEC` | `300` | Abstand zwischen zwei Verkäufen, `0` = nie verkaufen |
| `MAX_PLAYER_RETURNS` | `3` | max. Rückkehr-Versuche nach Tod durch einen Spieler |
| `EMPTY_SLOT` | `49` | Slot des „alles nehmen“-Buttons im Spawner-GUI |
| `EMPTY_EVERY_SEC` | `60` | Abstand zwischen zwei Leerungen |
| `RECONNECT_SEC` | `20` | Wartezeit vor dem Neu-Verbinden |
| `DEBUG_SLOTS` | `1` | einmalig auf `1`, um die Slots des GUIs in der Konsole zu sehen |

Ohne gesetzte Variablen gelten Platzhalter (`play.example.net`), der Bot verbindet sich dann nicht.

## Start auf bot-hosting.net

1. Server mit **Node.js** anlegen, Repo-Dateien (`bot.js`, `package.json`) hochladen.
2. Startdatei auf `bot.js` stellen, Variablen oben setzen.
3. Starten. Beim ersten Mal erscheint in der Konsole ein **Microsoft-Login-Link mit Code**,
   mit dem Bot-Account bestätigen. Das Token liegt danach in `auth/` (nicht ins Repo committen).

Lokal: `npm install && node bot.js`. Test der Logik (ohne Server): `npm test`.

## Hinweise

- Vorher klären, ob AFK-Bots/Makros auf dem Server erlaubt sind, sonst droht ein Ban.
- Manche Server blocken Hosting-IPs (Anti-VPN).
- Nicht getestet gegen einen echten Server: Slot-Nummer, Home- und Sell-Befehl müssen angepasst werden.
- Die Erkennung „Tod durch Spieler“ liest die Todesnachricht im Chat (Bot-Name + Name eines anderen Spielers). Zeigt der Server keine Todesnachrichten an, zählt jeder Tod als normaler Tod.
