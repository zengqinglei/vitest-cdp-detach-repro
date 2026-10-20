import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    include: ['tests/*.test.ts'],
    // one page, files run sequentially: the page outlives each file's tester connection
    fileParallelism: false,
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      isolate: true,
      instances: [{ browser: 'chromium' }],
    },
  },
})
