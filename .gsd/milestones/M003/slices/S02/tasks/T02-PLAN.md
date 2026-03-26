---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T02: Implement MockStorage (Web Storage API mock)

Create MockStorage.js — an in-memory Web Storage API-compatible object (getItem, setItem, removeItem, clear, length, key). No localStorage needed. The _store backing is a plain Map. Export it for test imports.

## Inputs

- None specified.

## Expected Output

- `packages/localstorage/MockStorage.js`

## Verification

node --input-type=module <<'EOF'
import MockStorage from './packages/localstorage/MockStorage.js';
const s = new MockStorage();
s.setItem('a', '1');
console.assert(s.getItem('a') === '1');
console.assert(s.length === 1);
s.removeItem('a');
console.assert(s.getItem('a') === null);
console.log('MockStorage OK');
EOF
