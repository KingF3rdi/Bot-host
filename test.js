const assert = require('assert')
const { killedByPlayer, afterSpawn } = require('./logic')

const online = ['AfkBot', 'Steve', 'Zo', 'Alex_1']

// Todesnachrichten
assert(killedByPlayer('AfkBot was slain by Steve', 'AfkBot', online))
assert(killedByPlayer('[Rank] AfkBot was shot by Alex_1 using Bow', 'AfkBot', online))
assert(!killedByPlayer('AfkBot fell from a high place', 'AfkBot', online))
assert(!killedByPlayer('AfkBot was slain by Zombie', 'AfkBot', online)) // kein Spieler namens Zombie
assert(!killedByPlayer('Steve was slain by Alex_1', 'AfkBot', online)) // andere Person gestorben
assert(!killedByPlayer('AfkBot was slain by Zoe', 'AfkBot', online)) // "Zo" zu kurz / kein ganzes Wort
assert(!killedByPlayer('Steveo was slain', 'AfkBot', online))

// Entscheidung nach dem Spawn: max. 3 Rückkehr-Versuche nach Spielertod
assert.deepStrictEqual(afterSpawn({ died: false, byPlayer: false, playerDeaths: 0, maxReturns: 3 }), { goHome: true, playerDeaths: 0 })
assert.deepStrictEqual(afterSpawn({ died: true, byPlayer: false, playerDeaths: 3, maxReturns: 3 }), { goHome: true, playerDeaths: 3 })
let deaths = 0
const results = []
for (let i = 0; i < 5; i++) {
  const r = afterSpawn({ died: true, byPlayer: true, playerDeaths: deaths, maxReturns: 3 })
  deaths = r.playerDeaths
  results.push(r.goHome)
}
assert.deepStrictEqual(results, [true, true, true, false, false])

console.log('OK')
