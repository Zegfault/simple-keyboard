import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      vue: 'vue/dist/vue.esm-bundler.js'
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'VueSimpleKeyboard',
      fileName: (format) => `vue-simple-keyboard.${format}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['vue', 'simple-keyboard'],
      output: {
        globals: {
          vue: 'Vue',
          'simple-keyboard': 'SimpleKeyboard'
        }
      }
    }
  }
})
