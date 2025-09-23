import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import strip from '@rollup/plugin-strip'

export default defineConfig({
  plugins: [
    vue(),
    visualizer({
      filename: 'stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ],
  resolve: {
    alias: {
      vue: 'vue/dist/vue.esm-bundler.js'
    }
  },
  build: {
    minify: true,
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'VueSimpleKeyboard',
      fileName: (format, entryName) => `vue-simple-keyboard-${entryName}.${format}.js`,
      formats: ['es', 'umd'],
      cssFileName: 'vue-simple-keyboard'
    },
    rollupOptions: {
      external: ['vue', 'simple-keyboard'],
      output: {
        globals: {
          vue: 'Vue',
          'simple-keyboard': 'SimpleKeyboard'
        }
      },
      plugins: [
        strip({
          include: ['**/*.js', '**/*.vue'],
          functions: ['console.*', 'assert.*', 'debugger']
        })
      ]
    }
  }
})
