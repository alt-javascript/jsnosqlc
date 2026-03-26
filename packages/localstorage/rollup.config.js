/**
 * rollup.config.js — Build @alt-javascript/jsnosqlc-localstorage for browser ESM consumption.
 *
 * Output: dist/jsnosqlc-localstorage.esm.js
 *   - Bundles core and memory inline (same pattern as jsnosqlc-memory.esm.js)
 *   - format: esm (<script type="module"> compatible)
 *   - treeshake: false — preserves DriverManager.registerDriver() side-effects for both drivers
 */
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'index.js',
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
  ],
  output: {
    file: 'dist/jsnosqlc-localstorage.esm.js',
    format: 'esm',
  },
  treeshake: false,
};
