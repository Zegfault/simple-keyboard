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

The `SimpleKeyboard` component accepts the following props:

### Layout & Display
- `layout` (Object): Keyboard layout definition.
- `languageMapping` (Object): Mapping for language switch buttons.
- `layoutName` (String, default: 'default'): Name of the active layout.
- `localeForHandwriting` (String, default: 'zhCN'): Locale for handwriting recognition.
- `suggestionsLimit` (Number, default: 9999): Max number of handwriting suggestions.
- `display` (Object): Button display mapping (human-friendly names).
- `mergeDisplay` (Boolean, default: false): Merge custom display with default.
- `excludeFromLayout` (Object): Exclude buttons from layout.
- `drawingOptions` (Object, default: `{ drawingGrid: true, strokeColor: 'blue' }`): Options for handwriting drawing board.
- `numberOfSuggestionsPerLine` (Number, default: 10): Max suggestions per line for handwriting.

### Styling & Theming
- `theme` (String, default: 'hg-theme-default'): CSS class for keyboard wrapper.
- `buttonTheme` (Object): CSS classes for specific buttons.
- `buttonAttributes` (Object): HTML attributes for specific buttons.
- `useButtonTag` (Boolean, default: false): Render buttons as `<button>` elements.
- `baseClass` (String): Custom base class for keyboard wrapper.

### Input Handling
- `inputName` (String): Name of the input field for multi-input support.
- `maxLength` (Number/Object): Restrict input length.
- `inputPattern` (RegExp/Object): Restrict input to regex pattern.
- `newLineOnEnter` (Boolean, default: false): Add newline on ENTER.
- `tabCharOnTab` (Boolean, default: false): Add tab character on TAB.
- `syncInstanceInputs` (Boolean, default: false): Sync input across keyboard instances.

### Caret & Text Positioning
- `disableCaretPositioning` (Boolean, default: false): Disable caret positioning.
- `updateCaretOnSelectionChange` (Boolean, default: false): Update caret on selection change.

### Mouse & Touch Events
- `useMouseEvents` (Boolean, default: false): Use mouse events instead of pointer events.
- `useTouchEvents` (Boolean, default: false): Use touch events instead of click events.
- `autoUseTouchEvents` (Boolean, default: true): Auto-detect touch devices.
- `clickOnMouseDown` (Boolean, default: false): Trigger click on mousedown.
- `preventMouseDownDefault` (Boolean, default: false): Prevent default mousedown behavior.
- `preventMouseUpDefault` (Boolean, default: false): Prevent default mouseup behavior.
- `stopMouseDownPropagation` (Boolean, default: false): Stop mousedown event propagation.
- `stopMouseUpPropagation` (Boolean, default: false): Stop mouseup event propagation.
- `disableButtonHold` (Boolean, default: false): Disable button hold action.

### Physical Keyboard Integration
- `physicalKeyboardHighlight` (Boolean, default: false): Highlight keys pressed on physical keyboard.
- `physicalKeyboardHighlightPress` (Boolean, default: false): Simulate key press for highlighted keys.
- `physicalKeyboardHighlightPressUseClick` (Boolean, default: false): Use click for highlight press.
- `physicalKeyboardHighlightPressUsePointerEvents` (Boolean, default: false): Use pointer events for highlight press.
- `physicalKeyboardHighlightPreventDefault` (Boolean, default: false): Prevent default for highlight press.
- `physicalKeyboardHighlightTextColor` (String): Text color for highlighted keys.
- `physicalKeyboardHighlightBgColor` (String): Background color for highlighted keys.

### Layout Candidates (IME Support)
- `enableLayoutCandidates` (Boolean, default: true): Enable IME candidate suggestions.
- `layoutCandidates` (Object): Custom candidate suggestions.
- `layoutCandidatesPageSize` (Number, default: 10000): Max candidate suggestions per page.
- `layoutCandidatesCaseSensitiveMatch` (Boolean, default: false): Case-sensitive candidate matching.
- `disableCandidateNormalization` (Boolean, default: false): Disable candidate normalization.
- `enableLayoutCandidatesKeyPress` (Boolean, default: false): Enable candidate selection by key press.

### Localization
- `rtl` (Boolean, default: false): Enable right-to-left layout.

### Debug & Development
- `debug` (Boolean, default: false): Enable debug mode.

### Additional Props
- `keyboardClass` (String, default: 'simple-keyboard'): CSS class for keyboard container.
- `modelValue` (String): Input value for v-model binding.

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
