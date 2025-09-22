# Vue Simple Keyboard Component

A Vue 3 component wrapper for the [simple-keyboard](https://github.com/hodgef/simple-keyboard) virtual keyboard library.

## Features

- ✅ Vue 3 support with Composition API
- ✅ Full TypeScript support (optional)
- ✅ All simple-keyboard options supported as props
- ✅ Reactive v-model binding
- ✅ Event handling for all keyboard events
- ✅ Built with Vite for optimal bundle size
- ✅ Tree-shakeable ES modules

## Installation

```bash
npm install vue-simple-keyboard-component
```

## Basic Usage

```vue
<template>
  <div>
    <input v-model="inputText" placeholder="Type here..." />
    <SimpleKeyboard
      v-model="inputText"
      @on-key-press="onKeyPress"
      @on-change="onChange"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SimpleKeyboard from 'vue-simple-keyboard-component'

const inputText = ref('')

function onKeyPress(button) {
  console.log('Button pressed:', button)
}

function onChange(input) {
  console.log('Input changed:', input)
}
</script>
```

## Props

The component accepts all the options from simple-keyboard as props:

### Layout & Display
- `layout` - Modify the keyboard layout
- `layoutName` - Specifies which layout should be used (default: 'default')
- `display` - Replaces variable buttons with human-friendly names
- `mergeDisplay` - Merges display with default instead of replacing
- `excludeFromLayout` - Exclude buttons from layout

### Styling & Theming
- `theme` - CSS classes for keyboard wrapper (default: 'hg-theme-default')
- `buttonTheme` - CSS classes for specific buttons
- `buttonAttributes` - HTML attributes for specific buttons
- `useButtonTag` - Render buttons as button elements instead of div
- `baseClass` - Custom base class for keyboard wrapper

### Input Handling
- `inputName` - Use single keyboard instance for multiple inputs
- `maxLength` - Restrict input length
- `inputPattern` - Restrict input to regex pattern
- `newLineOnEnter` - Add newline on ENTER (default: false)
- `tabCharOnTab` - Add tab character on TAB (default: false)
- `syncInstanceInputs` - Sync internal input across instances

### Mouse & Touch Events
- `useMouseEvents` - Use mouse events instead of pointer events
- `useTouchEvents` - Use touch events instead of click events
- `autoUseTouchEvents` - Auto-detect touch devices (default: true)
- `clickOnMouseDown` - Trigger click on mousedown
- `preventMouseDownDefault` - Prevent default mousedown behavior
- `preventMouseUpDefault` - Prevent default mouseup behavior
- `stopMouseDownPropagation` - Stop mousedown event propagation
- `stopMouseUpPropagation` - Stop mouseup event propagation
- `disableButtonHold` - Disable button hold action

### Physical Keyboard Integration
- `physicalKeyboardHighlight` - Highlight keys pressed on physical keyboard
- `physicalKeyboardHighlightPress` - Press highlighted keys
- `physicalKeyboardHighlightTextColor` - Text color for highlighted keys
- `physicalKeyboardHighlightBgColor` - Background color for highlighted keys

### Other Options
- `debug` - Enable debug mode (default: false)
- `rtl` - Right-to-left support
- `keyboardClass` - CSS class for keyboard container (default: 'simple-keyboard')

## Events

The component emits all simple-keyboard events:

- `@update:modelValue` - Emitted when input changes (for v-model)
- `@on-change` - Emitted when input changes
- `@on-change-all` - Emitted with all inputs
- `@on-key-press` - Emitted when key is pressed
- `@on-key-released` - Emitted when key is released
- `@on-render` - Emitted when keyboard is rendered
- `@on-init` - Emitted when keyboard is initialized
- `@before-input-update` - Emitted before input update

## Methods

Access keyboard methods through template refs:

```vue
<template>
  <SimpleKeyboard ref="keyboard" v-model="inputText" />
  <button @click="clearKeyboard">Clear</button>
</template>

<script setup>
import { ref } from 'vue'
import SimpleKeyboard from 'vue-simple-keyboard-component'

const keyboard = ref()
const inputText = ref('')

function clearKeyboard() {
  keyboard.value.clearInput()
}
</script>
```

Available methods:
- `setInput(input, inputName?)` - Set keyboard input
- `getInput(inputName?)` - Get keyboard input
- `setOptions(options)` - Update keyboard options
- `addButtonTheme(buttons, className)` - Add theme to buttons
- `removeButtonTheme(buttons, className)` - Remove theme from buttons
- `clearInput(inputName?)` - Clear keyboard input
- `destroy()` - Destroy keyboard instance

## Advanced Usage

### Custom Layout

```vue
<template>
  <SimpleKeyboard
    v-model="inputText"
    :layout="customLayout"
    :display="customDisplay"
  />
</template>

<script setup>
import { ref } from 'vue'

const inputText = ref('')

const customLayout = {
  'default': [
    '1 2 3',
    '4 5 6',
    '7 8 9',
    '{clear} 0 {backspace}'
  ]
}

const customDisplay = {
  '{clear}': 'Clear',
  '{backspace}': '⌫'
}
</script>
```

### Multiple Inputs

```vue
<template>
  <div>
    <input v-model="input1" data-input="input1" />
    <input v-model="input2" data-input="input2" />
    <SimpleKeyboard
      :input-name="currentInput"
      @on-change-all="onChangeAll"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const input1 = ref('')
const input2 = ref('')
const currentInput = ref('input1')

function onChangeAll(inputs) {
  input1.value = inputs.input1 || ''
  input2.value = inputs.input2 || ''
}
</script>
```

## Development

```bash
# Install dependencies
npm install

# Run development server with examples
npm run dev

# Build for production
npm run build

# Preview built files
npm run preview
```

## License

ISC License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
