/**
 * rollup.config.js — Build @alt-javascript/jsnosqlc-memory for browser ESM consumption.
 *
 * Output: dist/jsnosqlc-memory.esm.js
 *   - Bundles @alt-javascript/jsnosqlc-core inline (no bare-specifier resolution required)
 *   - format: esm (<script type="module"> compatible)
 *   - treeshake.moduleSideEffects: true — DriverManager.registerDriver() side-effect preserved
 *
 * Why inline core? On a static HTML page without import maps, bare specifier
 * '@alt-javascript/jsnosqlc-core' cannot be resolved by the browser natively.
 * Inlining avoids requiring an import map and keeps the quick-start to one <script> tag.
 */
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'index.js',
  plugins: [
    resolve({
      // Follow workspace symlinks so @alt-javascript/jsnosqlc-core is inlined
      browser: true,
      preferBuiltins: false,
    }),
  ],
  output: {
    file: 'dist/jsnosqlc-memory.esm.js',
    format: 'esm',
  },
  treeshake: false,
};
