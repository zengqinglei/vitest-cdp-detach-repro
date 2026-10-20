import { cdp } from 'vitest/browser'
import { expect, test } from 'vitest'

test('uses cdp()', async () => {
  const res = await cdp().send('Runtime.evaluate', { expression: '1' })
  expect(res.result.value).toBe(1)
})
