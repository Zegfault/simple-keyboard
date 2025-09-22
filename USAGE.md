# Quick Usage Guide

## Installation

```bash
npm install vue-simple-keyboard-component
```

## Basic Vue 3 Usage (Script Setup)

```vue
<template>
  <div>
    <input v-model="text" placeholder="Type here..." />
    <SimpleKeyboard v-model="text" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SimpleKeyboard from 'vue-simple-keyboard-component'

const text = ref('')
</script>
```

## Vue 3 Options API

```vue
<template>
  <div>
    <input v-model="text" />
    <SimpleKeyboard
      v-model="text"
      @on-key-press="handleKeyPress"
    />
  </div>
</template>

<script>
import SimpleKeyboard from 'vue-simple-keyboard-component'

export default {
  components: {
    SimpleKeyboard
  },
  data() {
    return {
      text: ''
    }
  },
  methods: {
    handleKeyPress(button) {
      console.log('Pressed:', button)
    }
  }
}
</script>
```

## CDN Usage

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  <script src="https://unpkg.com/vue-simple-keyboard-component/dist/vue-simple-keyboard.umd.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/vue-simple-keyboard-component/dist/vue-simple-keyboard-component.css">
</head>
<body>
  <div id="app">
    <input v-model="text" />
    <simple-keyboard v-model="text"></simple-keyboard>
  </div>

  <script>
    const { createApp } = Vue
    const { SimpleKeyboard } = VueSimpleKeyboard

    createApp({
      components: { SimpleKeyboard },
      data() { return { text: '' } }
    }).mount('#app')
  </script>
</body>
</html>
```

## Key Features

- ✅ Full simple-keyboard API support
- ✅ Vue 3 reactive v-model binding
- ✅ TypeScript support (optional)
- ✅ ES modules and UMD builds
- ✅ All keyboard events supported
- ✅ Custom layouts and themes
- ✅ Multiple input support
