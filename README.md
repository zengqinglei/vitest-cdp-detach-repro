# vitest-cdp-detach-repro

Minimal reproduction: `@vitest/browser` never detaches the Playwright CDP session
created for `cdp()` from `vitest/browser`, so every test file that calls `cdp()`
leaves an attached DevTools session on the page.

Versions: vitest 5.0.5, @vitest/browser-playwright 5.0.5, playwright 1.64.1, Chromium (headless).

## Cause

`packages/browser/src/node/projectParent.ts` (compiled: `node_modules/@vitest/browser/dist/index.js`):

```js
removeCDPHandler(rpcId) {
	this.cdpHandlers.delete(rpcId);
}
```

`cdpHandlers` holds `Promise<BrowserServerCDPHandler>`; the handler's `.session` is the
object returned by `provider.getCDPSession()`, which for Playwright wraps
`page.context().newCDPSession(page)` and already exposes `detach`. Nothing calls it
when the tester connection closes (it is only used by the Chromium GC helper).

## Run

```
npm install && npx playwright install chromium
npm run repro
```

`npm run repro` runs `vitest run` with `DEBUG=pw:protocol` and counts the
`SEND ►` lines for `Target.attachToTarget` and `Target.detachFromTarget`.
There are 5 test files, each calling `cdp().send('Runtime.evaluate', ...)`. Files run
sequentially (`fileParallelism: false`) on one page, so the page outlives each file's
tester connection.

## Result (measured)

| | attachToTarget | detachFromTarget |
|---|---|---|
| stock 5.0.5 | 5 | **0** |
| patched | 5 | 4 |

Expected: every attach is paired with a detach. With the patch below, 4 of 5 are detached;
the 5th session's handler is removed while the browser is already shutting down.
(If files run in parallel on separate pages, all removals happen at shutdown and the
effect is not observable, which is why the config runs files sequentially.)

## Patch tested

```diff
 removeCDPHandler(rpcId) {
-	this.cdpHandlers.delete(rpcId);
+	const h = this.cdpHandlers.get(rpcId);
+	this.cdpHandlers.delete(rpcId);
+	Promise.resolve(h).then(x => x?.session?.detach?.()).catch(() => {});
 }
```
