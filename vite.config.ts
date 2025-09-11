import { defineConfig } from 'vite';
import replace from '@rollup/plugin-replace';

export default defineConfig({
  resolve: {
    alias: {
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      path: 'path-browserify',
      util: 'util/',
      assert: 'assert/',
      fs: 'fs-extra',           // or fs: '?empty'
    },
  },
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
  optimizeDeps: {
    include: ['aws-amplify','@aws-amplify/auth'],
  },
  plugins: [
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
  ],
});