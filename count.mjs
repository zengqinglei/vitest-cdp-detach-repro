// Runs vitest with Playwright protocol logging and counts client->browser
// Target.attachToTarget / Target.detachFromTarget requests (lines containing "SEND ►").
import { spawnSync } from 'node:child_process'

const r = spawnSync('npx', ['vitest', 'run'], {
  env: { ...process.env, DEBUG: 'pw:protocol' },
  encoding: 'utf8',
  maxBuffer: 1 << 28,
})
const out = (r.stdout ?? '') + (r.stderr ?? '')
const count = (m) => out.split('\n').filter((l) => l.includes('SEND') && l.includes(`"method":"${m}"`)).length
const files = (out.match(/Test Files\s+(.*)/) ?? [])[1]
console.log(`vitest: ${files ?? 'unknown (see exit code ' + r.status + ')'}`)
console.log(`Target.attachToTarget   SENT: ${count('Target.attachToTarget')}`)
console.log(`Target.detachFromTarget SENT: ${count('Target.detachFromTarget')}`)
