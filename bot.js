// AFK-Bot: sneakt dauerhaft, respawnt, geht nach dem Tod /home, leert einen Spawner
// und verkauft regelmäßig das ganze Inventar mit /sell.
// Einstellungen kommen aus Umgebungsvariablen (siehe README), Defaults sind Platzhalter.
const mineflayer = require('mineflayer')
const { Vec3 } = require('vec3')
const { once } = require('events')
const { killedByPlayer, afterSpawn } = require('./logic')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const env = (k, d) => process.env[k] ?? d

const CFG = {
  host: env('MC_HOST', 'play.example.net'),
  port: Number(env('MC_PORT', '25565')),
  version: env('MC_VERSION', '1.21.4'), // muss zur Server-Version passen
  username: env('MC_USERNAME', 'bot@example.com'), // Microsoft-Account
  homeCmd: env('HOME_CMD', '/home spawner'),
  sellCmd: env('SELL_CMD', '/sell all'), // verkauft das gesamte Inventar (Befehl je nach Server)
  sellEveryMs: Number(env('SELL_EVERY_SEC', '300')) * 1000, // 0 = nie verkaufen
  maxPlayerReturns: Number(env('MAX_PLAYER_RETURNS', '3')), // Rückkehr-Versuche nach Tod durch Spieler
  spawner: new Vec3(...env('SPAWNER_POS', '0,64,0').split(',').map(Number)),
  emptySlot: Number(env('EMPTY_SLOT', '49')), // Slot des "alles nehmen/droppen"-Buttons
  emptyEveryMs: Number(env('EMPTY_EVERY_SEC', '60')) * 1000,
  reconnectMs: Number(env('RECONNECT_SEC', '20')) * 1000,
  debugSlots: env('DEBUG_SLOTS', '0') === '1', // 1 = Slots des Spawner-GUIs in die Konsole schreiben
}

// Zustand überlebt Reconnects (start() erzeugt jedes Mal einen neuen Bot).
let playerDeaths = 0
const DEATH_WINDOW_MS = 10_000

function start() {
  const bot = mineflayer.createBot({
    host: CFG.host,
    port: CFG.port,
    version: CFG.version,
    username: CFG.username,
    auth: 'microsoft',
    profilesFolder: './auth', // Login-Token, damit der Code nur einmal nötig ist
  })
  let busy = false
  let lastDeathAt = 0
  let lastKillMsgAt = 0

  bot.on('death', () => {
    lastDeathAt = Date.now()
    console.log('tot, respawne ...')
  })

  // Todesnachricht vom Server: kam sie von einem Spieler? (Zeitpunkt merken, Reihenfolge zum
  // death-Event ist nicht garantiert, deshalb vergleicht der Spawn-Handler beide Zeitstempel.)
  bot.on('message', (msg) => {
    const players = Object.keys(bot.players)
    if (killedByPlayer(msg.toString(), bot.username, players)) lastKillMsgAt = Date.now()
  })

  // Login und jeder Respawn: sneaken, kurz warten, dann ggf. nach Hause.
  bot.on('spawn', async () => {
    bot.setControlState('sneak', true)
    await sleep(3000) // gibt der Todesnachricht Zeit anzukommen
    const died = Date.now() - lastDeathAt < 30_000
    const byPlayer = died && Math.abs(lastKillMsgAt - lastDeathAt) < DEATH_WINDOW_MS
    const decision = afterSpawn({ died, byPlayer, playerDeaths, maxReturns: CFG.maxPlayerReturns })
    playerDeaths = decision.playerDeaths
    if (byPlayer) {
      console.log(`von Spieler getötet (${playerDeaths}/${CFG.maxPlayerReturns}) -> ${decision.goHome ? 'gehe nach Hause' : 'bleibe hier'}`)
    }
    if (decision.goHome) bot.chat(CFG.homeCmd)
  })

  // Manche Server setzen den Sneak-Status zurück.
  const keepSneak = setInterval(() => bot.setControlState('sneak', true), 5000)

  const emptyLoop = setInterval(async () => {
    if (busy || !bot.entity) return
    busy = true
    try {
      const block = bot.blockAt(CFG.spawner)
      if (block && bot.entity.position.distanceTo(CFG.spawner) < 5) {
        bot.activateBlock(block)
        const [win] = await Promise.race([once(bot, 'windowOpen'), sleep(5000).then(() => [null])])
        if (win) {
          if (CFG.debugSlots) {
            console.log(win.slots.map((s, i) => s && `${i}: ${s.name}`).filter(Boolean))
          }
          await bot.clickWindow(CFG.emptySlot, 0, 0)
          await sleep(500)
          bot.closeWindow(win)
        }
      }
    } catch (e) {
      console.log('leeren fehlgeschlagen:', e.message)
    }
    busy = false
  }, CFG.emptyEveryMs)

  const sellLoop = CFG.sellEveryMs > 0 && setInterval(async () => {
    if (busy || !bot.entity) return
    busy = true
    bot.chat(CFG.sellCmd)
    await sleep(2000) // nicht mit dem Leeren-Klick überlappen
    busy = false
  }, CFG.sellEveryMs)

  bot.on('kicked', (r) => console.log('gekickt:', r))
  bot.on('error', (e) => console.log('fehler:', e.message))
  bot.once('end', (r) => {
    clearInterval(keepSneak)
    clearInterval(emptyLoop)
    if (sellLoop) clearInterval(sellLoop)
    console.log(`getrennt: ${r} - neu in ${CFG.reconnectMs / 1000}s`)
    setTimeout(start, CFG.reconnectMs)
  })
}

start()
