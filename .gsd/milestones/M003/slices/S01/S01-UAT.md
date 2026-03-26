# S01: Rollup ESM browser bundles for core and memory — UAT

**Milestone:** M003
**Written:** 2026-03-26T04:38:10.629Z

# S01 UAT — Rollup ESM Browser Bundles\n\n## Verification\n\n### 1. Build produces bundles\n```\nnpm run build:browser\n```\nExpected: Two lines of rollup output, no warnings, exit 0.\n\n### 2. Bundle contains registration side-effect\n```\ngrep 'DriverManager.registerDriver(_driver)' packages/memory/dist/jsnosqlc-memory.esm.js\n```\nExpected: match on line 753.\n\n### 3. Smoke import confirms driver is registered\n```js\nimport { DriverManager } from './packages/memory/dist/jsnosqlc-memory.esm.js';\nconsole.log(DriverManager.getDrivers().length); // 1\n```\n\n### 4. Full API works from single import\nget, store, insert, find, update, delete all verified via smoke test.\n\n### 5. Root tests still pass\n```\nnpm test  # 55 tests passing\n```\n\n## Result: PASS
