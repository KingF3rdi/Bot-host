// Reine Logik ohne Netzwerk, damit sie ohne Minecraft-Server testbar ist (test.js).

// Wurde der Bot laut Nachricht von einem anderen Spieler getötet?
// Heuristik: Todesnachricht enthält den Bot-Namen UND den Namen eines anderen
// online befindlichen Spielers als ganzes Wort ("Bot was slain by Steve").
function killedByPlayer(text, botName, onlinePlayers) {
  if (!text.includes(botName)) return false
  const rest = text.split(botName).join(' ')
  return onlinePlayers.some((name) => {
    if (name === botName || name.length < 3) return false
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(^|[^A-Za-z0-9_])${escaped}($|[^A-Za-z0-9_])`).test(rest)
  })
}

// Entscheidet nach einem Spawn, ob der Bot den Home-Befehl ausführt.
// - Login oder Tod ohne Spieler: immer nach Hause.
// - Tod durch Spieler: nur die ersten maxReturns Male zurückkehren, danach bleiben.
function afterSpawn({ died, byPlayer, playerDeaths, maxReturns }) {
  if (!died || !byPlayer) return { goHome: true, playerDeaths }
  const deaths = playerDeaths + 1
  return { goHome: deaths <= maxReturns, playerDeaths: deaths }
}

module.exports = { killedByPlayer, afterSpawn }
