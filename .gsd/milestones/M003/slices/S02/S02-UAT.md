# S02: LocalStorage and SessionStorage drivers — UAT

**Milestone:** M003
**Written:** 2026-03-26T04:42:17.874Z

# S02 UAT — LocalStorage and SessionStorage Drivers\n\n## Verification\n\n### 1. Compliance suite passes for both drivers\n```\nnpm test --workspace=packages/localstorage\n```\nExpected: 51 passing.\n\n### 2. Cross-client isolation\nTwo clients sharing the same MockStorage store the same key — each sees only its own document.\n\n### 3. Cross-collection isolation\nTwo collections in the same client store the same docKey — each sees only its own document.\n\n### 4. find() scoped to collection\nfind() in collectionA returns only collectionA documents even when collectionB has matching docs.\n\n### 5. Root test suite unaffected\n```\nnpm test  # 106 tests passing\n```\n\n## Result: PASS
