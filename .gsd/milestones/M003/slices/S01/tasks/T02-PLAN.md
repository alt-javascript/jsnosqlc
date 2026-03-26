---
estimated_steps: 5
estimated_files: 5
skills_used: []
---

# T02: Write rollup configs and build scripts for core and memory

1. Create packages/core/rollup.config.js: input=index.js, output={file:'dist/jsnosqlc-core.esm.js', format:'esm'}, treeshake:{moduleSideEffects:true}.
2. Create packages/memory/rollup.config.js: same pattern, externalise '@alt-javascript/jsnosqlc-core' (it will be bundled separately or imported by the page).
3. Add 'build:browser': 'rollup -c' to scripts in packages/core/package.json and packages/memory/package.json.
4. Add root-level 'build:browser' script that runs both workspace builds in sequence.
5. Update exports fields in both package.json files: add 'module' and 'browser' keys pointing at dist/.

## Inputs

- `packages/core/index.js`
- `packages/memory/index.js`

## Expected Output

- `packages/core/rollup.config.js`
- `packages/memory/rollup.config.js`
- `packages/core/dist/jsnosqlc-core.esm.js`
- `packages/memory/dist/jsnosqlc-memory.esm.js`

## Verification

npm run build:browser 2>&1 | tail -20
