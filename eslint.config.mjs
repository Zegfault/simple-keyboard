import { defineConfig } from 'eslint/config'
import vue from 'eslint-plugin-vue'
import globals from 'globals'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

export default defineConfig([{
  extends: compat.extends('eslint:recommended', 'plugin:vue/recommended'),
  plugins: {
    vue
  },
  languageOptions: {
    globals: {
      ...globals.browser,
      ...globals.node,
      it: 'readonly',
      before: 'readonly',
      describe: 'readonly',
      Vue: 'readonly',
      window: 'readonly',
      screen: 'readonly'
    },
    ecmaVersion: 2020,
    sourceType: 'module',
    parserOptions: {
      ecmaVersion: 2020,
      ecmaFeatures: {
        jsx: true
      }
    }
  },
  rules: {
    'space-before-function-paren': 'error',
    'no-unused-vars': 'error',
    'no-case-declarations': 'off',
    'no-return-await': 'off',
    'vue/no-use-v-if-with-v-for': ['error', {
      allowUsingIterationVar: false
    }],
    'vue/comment-directive': 'off',
    'vue/multi-word-component-names': 0,
    'vue/require-v-for-key': 'off',
    'vue/no-multiple-template-root': 'off',
    'vue/no-v-html': 'off',
    'vue/require-prop-types': 'off',
    'vue/no-v-model-argument': 'off',
    'no-async-promise-executor': 'off',
    'vue/no-v-for-template-key': 'off',
    'vue/require-default-prop': 'off',
    'no-return-assign': 'off',
    'vue/max-attributes-per-line': ['error', {
      singleline: {
        max: 10
      },
      multiline: {
        max: 10
      }
    }],
    'vue/singleline-html-element-content-newline': 0,
    'no-empty': ['error', {
      allowEmptyCatch: true
    }],
    indent: ['error', 2, {
      SwitchCase: 1
    }],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'never'],
    'comma-dangle': ['error', 'never']
  }
}])
