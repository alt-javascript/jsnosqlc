/**
 * rollup.config.js — Build @alt-javascript/jsnosqlc-core for browser ESM consumption.
 *
 * Output: dist/jsnosqlc-core.esm.js
 *   - Self-contained (no external deps — core has none)
 *   - format: esm (import/export, <script type="module"> compatible)
 *   - treeshake.moduleSideEffects: true — preserve DriverManager static init
 */
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'index.js',
  plugins: [
    resolve({ browser: true, preferBuiltins: false }),
  ],
  output: {
    file: 'dist/jsnosqlc-core.esm.js',
    format: 'esm',
  },
  treeshake: {
    moduleSideEffects: true,
  },
};
