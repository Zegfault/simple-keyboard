<template>
  <div ref="keyboardContainer" :class="keyboardClass"></div>
</template>


<script>
import _ from 'lodash'
import Keyboard from 'simple-keyboard'
import 'simple-keyboard/build/css/index.css'

export default {
  name: 'SimpleKeyboard',
  props: {
    // Layout & Display
    layout: { type: Object, default: undefined },
    layoutName: { type: String, default: 'default' },
    display: { type: Object, default: undefined },
    mergeDisplay: { type: Boolean, default: false },
    excludeFromLayout: { type: Object, default: undefined },

    // Styling & Theming
    theme: { type: String, default: 'hg-theme-default' },
    buttonTheme: { type: Object, default: undefined },
    buttonAttributes: { type: Object, default: undefined },
    useButtonTag: { type: Boolean, default: false },
    baseClass: { type: String, default: undefined },

    // Input Handling
    inputName: { type: String, default: undefined },
    maxLength: { type: [Number, Object], default: undefined },
    inputPattern: { type: [RegExp, Object], default: undefined },
    newLineOnEnter: { type: Boolean, default: false },
    tabCharOnTab: { type: Boolean, default: false },
    syncInstanceInputs: { type: Boolean, default: false },

    // Caret & Text Positioning
    disableCaretPositioning: { type: Boolean, default: false },
    updateCaretOnSelectionChange: { type: Boolean, default: false },

    // Mouse & Touch Events
    useMouseEvents: { type: Boolean, default: false },
    useTouchEvents: { type: Boolean, default: false },
    autoUseTouchEvents: { type: Boolean, default: true },
    clickOnMouseDown: { type: Boolean, default: false },
    preventMouseDownDefault: { type: Boolean, default: false },
    preventMouseUpDefault: { type: Boolean, default: false },
    stopMouseDownPropagation: { type: Boolean, default: false },
    stopMouseUpPropagation: { type: Boolean, default: false },
    disableButtonHold: { type: Boolean, default: false },

    // Physical Keyboard Integration
    physicalKeyboardHighlight: { type: Boolean, default: false },
    physicalKeyboardHighlightPress: { type: Boolean, default: false },
    physicalKeyboardHighlightPressUseClick: { type: Boolean, default: false },
    physicalKeyboardHighlightPressUsePointerEvents: { type: Boolean, default: false },
    physicalKeyboardHighlightPreventDefault: { type: Boolean, default: false },
    physicalKeyboardHighlightTextColor: { type: String, default: undefined },
    physicalKeyboardHighlightBgColor: { type: String, default: undefined },

    // Layout Candidates (IME Support)
    enableLayoutCandidates: { type: Boolean, default: true },
    layoutCandidates: { type: Object, default: undefined },
    layoutCandidatesPageSize: { type: Number, default: 10000 },
    layoutCandidatesCaseSensitiveMatch: { type: Boolean, default: false },
    disableCandidateNormalization: { type: Boolean, default: false },
    enableLayoutCandidatesKeyPress: { type: Boolean, default: false },

    // Localization
    rtl: { type: Boolean, default: false },

    // Debug & Development
    debug: { type: Boolean, default: false },

    // Additional Props
    keyboardClass: { type: String, default: 'simple-keyboard' },
    modelValue: { type: String, default: undefined }
  },
  emits: [
    'update:modelValue',
    'onChange',
    'onChangeAll',
    'onKeyPress',
    'onKeyReleased',
    'onRender',
    'onInit',
    'beforeInputUpdate'
  ],
  data() {
    return {
      keyboard: null
    }
  },
  mounted() {
    this.initializeKeyboard()
  },
  beforeUnmount() {
    this.destroy()
  },
  watch: {
    modelValue(newValue) {
      if (this.keyboard && newValue !== undefined) {
        this.keyboard.setInput(newValue)
      }
    },
    layout: {
      handler() { this.reinitKeyboard() },
      deep: true
    },
    layoutName: 'reinitKeyboard',
    display: {
      handler() { this.reinitKeyboard() },
      deep: true
    },
    theme: 'reinitKeyboard',
    buttonTheme: {
      handler() { this.reinitKeyboard() },
      deep: true
    },
    buttonAttributes: {
      handler() { this.reinitKeyboard() },
      deep: true
    }
  },
  methods: {
    initializeKeyboard() {
      const container = this.$refs.keyboardContainer
      if (!container) {
        return
      }
      const options = {
        ...(this.layout && { layout: this.layout }),
        layoutName: this.layoutName,
        ...(this.display && { display: this.display }),
        mergeDisplay: this.mergeDisplay,
        ...(this.excludeFromLayout && { excludeFromLayout: this.excludeFromLayout }),
        theme: this.theme,
        ...(this.buttonTheme && { buttonTheme: this.buttonTheme }),
        ...(this.buttonAttributes && { buttonAttributes: this.buttonAttributes }),
        useButtonTag: this.useButtonTag,
        ...(this.baseClass && { baseClass: this.baseClass }),
        ...(this.inputName && { inputName: this.inputName }),
        ...(this.maxLength && { maxLength: this.maxLength }),
        ...(this.inputPattern && { inputPattern: this.inputPattern }),
        newLineOnEnter: this.newLineOnEnter,
        tabCharOnTab: this.tabCharOnTab,
        syncInstanceInputs: this.syncInstanceInputs,
        disableCaretPositioning: this.disableCaretPositioning,
        updateCaretOnSelectionChange: this.updateCaretOnSelectionChange,
        useMouseEvents: this.useMouseEvents,
        useTouchEvents: this.useTouchEvents,
        autoUseTouchEvents: this.autoUseTouchEvents,
        clickOnMouseDown: this.clickOnMouseDown,
        preventMouseDownDefault: this.preventMouseDownDefault,
        preventMouseUpDefault: this.preventMouseUpDefault,
        stopMouseDownPropagation: this.stopMouseDownPropagation,
        stopMouseUpPropagation: this.stopMouseUpPropagation,
        disableButtonHold: this.disableButtonHold,
        physicalKeyboardHighlight: this.physicalKeyboardHighlight,
        physicalKeyboardHighlightPress: this.physicalKeyboardHighlightPress,
        physicalKeyboardHighlightPressUseClick: this.physicalKeyboardHighlightPressUseClick,
        physicalKeyboardHighlightPressUsePointerEvents: this.physicalKeyboardHighlightPressUsePointerEvents,
        physicalKeyboardHighlightPreventDefault: this.physicalKeyboardHighlightPreventDefault,
        ...(this.physicalKeyboardHighlightTextColor && { physicalKeyboardHighlightTextColor: this.physicalKeyboardHighlightTextColor }),
        ...(this.physicalKeyboardHighlightBgColor && { physicalKeyboardHighlightBgColor: this.physicalKeyboardHighlightBgColor }),
        enableLayoutCandidates: this.enableLayoutCandidates,
        ...(this.layoutCandidates && { layoutCandidates: this.layoutCandidates }),
        layoutCandidatesPageSize: this.layoutCandidatesPageSize,
        layoutCandidatesCaseSensitiveMatch: this.layoutCandidatesCaseSensitiveMatch,
        disableCandidateNormalization: this.disableCandidateNormalization,
        enableLayoutCandidatesKeyPress: this.enableLayoutCandidatesKeyPress,
        rtl: this.rtl,
        debug: this.debug,
        onChange: (input) => {
          this.$emit('onChange', input)
          this.$emit('update:modelValue', input)
        },
        onChangeAll: (inputs) => {
          this.$emit('onChangeAll', inputs)
        },
        onKeyPress: (button) => {
          this.$emit('onKeyPress', button)
          if (button === '{shift}' || button === '{lock}') {
            this.handleShift()
          }
        },
        onKeyReleased: (button) => {
          this.$emit('onKeyReleased', button)
        },
        onRender: () => {
          this.$emit('onRender')
        },
        onInit: () => {
          this.$emit('onInit')
        },
        beforeInputUpdate: (input, inputName) => {
          this.$emit('beforeInputUpdate', input, inputName)
        }
      }
      options.layoutName = _.includes(['default', 'shift', 'alt', 'alt-shift'], options.layoutName) ? options.layoutName : 'default'
      this.keyboard = new Keyboard(container, options)
      if (this.modelValue !== undefined) {
        this.keyboard.setInput(this.modelValue)
      }
    },
    handleShift() {
      if (!this.keyboard) return
      const currentLayout = this.keyboard.options.layoutName
      const shiftToggle = currentLayout === 'default' ? 'shift' : 'default'
      this.keyboard.setOptions({ layoutName: shiftToggle })
    },
    setInput(input, inputName) {
      if (this.keyboard) {
        this.keyboard.setInput(input, inputName)
      }
    },
    getInput(inputName) {
      return this.keyboard ? this.keyboard.getInput(inputName) : ''
    },
    setOptions(options) {
      if (this.keyboard) {
        this.keyboard.setOptions(options)
      }
    },
    addButtonTheme(buttons, className) {
      if (this.keyboard) {
        this.keyboard.addButtonTheme(buttons, className)
      }
    },
    removeButtonTheme(buttons, className) {
      if (this.keyboard) {
        this.keyboard.removeButtonTheme(buttons, className)
      }
    },
    clearInput(inputName) {
      if (this.keyboard) {
        this.keyboard.clearInput(inputName)
      }
    },
    destroy() {
      if (this.keyboard) {
        this.keyboard.destroy()
        this.keyboard = null
      }
    },
    reinitKeyboard() {
      if (this.keyboard) {
        this.destroy()
        this.$nextTick(() => {
          this.initializeKeyboard()
        })
      }
    }
  }
}
</script>

<style scoped>
/* Component specific styles can be added here */
</style>
