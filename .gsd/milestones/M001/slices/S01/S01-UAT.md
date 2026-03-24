# S01: Core Interfaces and Filter Builder — UAT

## What to Verify

After S01, the core package builds and tests pass. There's nothing user-interactive yet — all verification is automated.

## Test Steps

```bash
cd packages/core
npm install
npm test
```

**Expected output:** 26 tests passing, 0 failing.

## Notes

- The compliance suite (`test/driverCompliance.js`) will not run standalone — it needs a driver. It will be exercised in S02 (memory driver).
- Filter builder can be tried interactively:
  ```javascript
  import Filter from './Filter.js';
  const ast = Filter.where('age').gt(18).and('name').eq('Alice').build();
  console.log(JSON.stringify(ast, null, 2));
  ```
