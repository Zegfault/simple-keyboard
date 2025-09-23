<template>
  <div class="keyboard-wrapper" :class="keyboardFullClass">
    <div ref="keyboardContainer" :class="keyboardClass" />
  </div>
</template>
<script>
import _ from 'lodash'
import Keyboard from 'simple-keyboard'
import 'simple-keyboard/build/css/index.css'
import layouts from './layouts'
import defaultDisplay from './display'
import HanziLookup from './hanzi/hanzilookup'

export default {
  name: 'SimpleKeyboard',
  props: {
    // Layout & Display
    layout: { type: Object, default: undefined },
    languageMapping: { type: Object, default: undefined },
    layoutName: { type: String, default: 'default' },
    localeForHandwriting: { type: String, default: 'zhCN' },
    suggestionsLimit: { type: Number, default: 9999 },
    display: { type: Object, default: undefined },
    mergeDisplay: { type: Boolean, default: false },
    excludeFromLayout: { type: Object, default: undefined },
    drawingOptions: {
      type: Object,
      default: () => ({
        drawingGrid: true,
        strokeColor: 'blue'
      })
    },
    numberOfSuggestionsPerLine: { type: Number, default: 10 },
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
    'beforeInputUpdate',
    'onLayoutChange',
    'onSuggestionsUpdate'
  ],
  data () {
    return {
      keyboard: null,
      drawingBoard: new HanziLookup(),
      defaultLanguageMapping: {
        '{lang_en}': 'enUS',
        '{lang_cn}': 'zhCN',
        '{lang_hand}': 'hand',
        '{lang_cj}': 'zhHT'
      },
      suggestionsExpanded: false
    }
  },
  computed: {
    keyboardFullClass () {
      return `locale-${this.layoutName}`
    }
  },
  watch: {
    modelValue (newValue) {
      if (this.keyboard && !_.isUndefined(newValue)) {
        this.keyboard.setInput(newValue)
      }
    },
    layout: {
      handler () { this.reinitKeyboard() },
      deep: true
    },
    layoutName: 'reinitKeyboard',
    display: {
      handler () { this.reinitKeyboard() },
      deep: true
    },
    theme: 'reinitKeyboard',
    buttonTheme: {
      handler () { this.reinitKeyboard() },
      deep: true
    },
    buttonAttributes: {
      handler () { this.reinitKeyboard() },
      deep: true
    }
  },
  mounted () {
    this.initializeKeyboard()
  },
  beforeUnmount () {
    this.destroy()
  },
  methods: {
    async initHanzi () {
      this.drawingBoard.options = _.merge(this.drawingBoard.options, this.drawingOptions || {})
      const data = await import(`./hanzi/${this.localeForHandwriting}.json`)
      this.drawingBoard.init(this.localeForHandwriting, {substrokes: data.substrokes, chars: data.chars})
    },
    getLayoutCandidates () {
      if (this.layoutCandidates) {
        // console.warn('Using custom layoutCandidates')
        return this.layoutCandidates
      } else if (!this.enableLayoutCandidates) {
        // console.warn('Layout candidates disabled')
        return undefined
      }
      const candidatesToUse = _.get(layouts, `${this.layoutName}.layoutCandidates`, undefined)
      // if (!_.isUndefined(candidatesToUse)) {
      //   console.warn(`Using built-in layoutCandidates for ${this.layoutName}`, candidatesToUse)
      // }
      return candidatesToUse
    },
    initializeKeyboard () {
      const container = this.$refs.keyboardContainer
      if (!container) {
        return
      }
      const layout = this.layout || _.get(layouts, `${this.layoutName}.layout`, undefined)
      const display = this.display || defaultDisplay
      const layoutCandidates = this.getLayoutCandidates()
      const layoutCandidatesCaseSensitiveMatch = this.layoutCandidatesCaseSensitiveMatch || (!_.isUndefined(layoutCandidates) && _.includes(['enUS'], this.layoutName))
      const options = {
        layout: layout,
        layoutName: this.layoutName,
        display: display,
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
        layoutCandidates: this.getLayoutCandidates(),
        layoutCandidatesPageSize: this.layoutCandidatesPageSize,
        layoutCandidatesCaseSensitiveMatch: layoutCandidatesCaseSensitiveMatch,
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
          if (button === '{shift}' || button === '{lock}') {
            this.handleShift()
          } else if (_.startsWith(button, '{lang_')) {
            const mapping = this.languageMapping || this.defaultLanguageMapping
            this.$emit('onLayoutChange', mapping[button])
          } else if (button === '{arrowleft}') {
            this.moveCursorLeft()
          } else if (button === '{arrowright}') {
            this.moveCursorRight()
          } else if (button === '{canvas}') {
            // this.$emit('onCanvasPress')
          } else if (button === '{undo}') {
            this.drawingBoard.undoStroke()
            this.drawingBoard.redraw()
            this.lookup()
          } else if (button === '{clear}') {
            this.drawingBoard.clearCanvas()
            this.drawingBoard.redraw()
            this.lookup()
          } else if (button.startsWith('suggestion:')) {
            // Handle suggestion clicks
            const suggestion = button.replace('suggestion:', '')
            this.addSuggestionToInput(suggestion)
          } else {
            console.warn(`unhandled button: ${button}`)
          }
          this.$emit('onKeyPress', button)
        },
        onKeyReleased: (button) => {
          this.$emit('onKeyReleased', button)
        },
        onRender: async () => {
          this.$emit('onRender')
          const elem = document.querySelector('.hg-button-canvas')
          if (_.isNull(elem) || _.isUndefined(elem)) {
            return
          }
          await this.initHanzi()
          this.drawingBoard = this.drawingBoard.DrawingBoard(elem, this.lookup)
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
    switchLayout (newLayoutName) {
      this.$emit('onLayoutChange', newLayoutName)
    },
    moveCursorLeft () {
      if (this.keyboard) {
        const newPosition = Math.max(0, this.keyboard.getCaretPosition() - 1)
        this.keyboard.setCaretPosition(newPosition)
      }
    },
    moveCursorRight () {
      if (this.keyboard) {
        const currentInput = this.keyboard.getInput()
        const newPosition = Math.min(currentInput.length, this.keyboard.getCaretPosition() + 1)
        this.keyboard.setCaretPosition(newPosition)
      }
    },
    handleShift () {
      if (!this.keyboard) return
      const currentLayout = this.keyboard.options.layoutName
      const shiftToggle = currentLayout === 'default' ? 'shift' : 'default'
      this.keyboard.setOptions({ layoutName: shiftToggle })
    },
    setInput (input, inputName) {
      if (this.keyboard) {
        this.keyboard.setInput(input, inputName)
      }
    },
    getInput (inputName) {
      return this.keyboard ? this.keyboard.getInput(inputName) : ''
    },
    setOptions (options) {
      if (this.keyboard) {
        this.keyboard.setOptions(options)
      }
    },
    addButtonTheme (buttons, className) {
      if (this.keyboard) {
        this.keyboard.addButtonTheme(buttons, className)
      }
    },
    removeButtonTheme (buttons, className) {
      if (this.keyboard) {
        this.keyboard.removeButtonTheme(buttons, className)
      }
    },
    clearInput (inputName) {
      if (this.keyboard) {
        this.keyboard.clearInput(inputName)
      }
    },
    destroy () {
      if (this.keyboard) {
        this.keyboard.destroy()
        this.keyboard = null
      }
    },
    reinitKeyboard () {
      if (this.keyboard) {
        this.destroy()
        this.$nextTick(() => {
          this.initializeKeyboard()
        })
      }
    },
    lookup () {
      let strokes = this.drawingBoard.cloneStrokes()
      if (_.get(strokes, 'length', 0) === 1 && _.get(strokes, '[0].length', 0) === 2) {
        strokes = []
        console.debug('Will reset drawing strokes')
      }
      const analyzedChar = this.drawingBoard.AnalyzedCharacter(strokes)
      const matcher = this.drawingBoard.Matcher(this.localeForHandwriting)
      this.showResults([])
      matcher.doMatch(analyzedChar, this.suggestionsLimit, matches => {
        this.showResults(matches)
      })
    },
    showResults (matches) {
      const suggestions = _.map(matches, 'character')
      if (_.isEmpty(suggestions)) {
        this.setSuggestions([])
        return this.hideSuggestions()
      }
      this.setSuggestions(suggestions)
      this.showSuggestions()
    },
    setSuggestions (suggestions) {
      const suggestionArea = document.querySelector('.hg-button-suggestion_area')
      if (!suggestionArea) {
        return
      }
      suggestionArea.innerHTML = ''
      if (suggestions && suggestions.length > 0) {
        const maxPerLine = this.numberOfSuggestionsPerLine
        const expanded = this.suggestionsExpanded
        const visibleSuggestions = expanded ? suggestions : suggestions.slice(0, maxPerLine)
        _.each(visibleSuggestions, (suggestion) => {
          const suggestionButton = document.createElement('button')
          suggestionButton.className = 'hg-button hg-suggestion-button'
          suggestionButton.textContent = suggestion
          suggestionButton.addEventListener('click', () => {
            this.addSuggestionToInput(suggestion)
          })
          suggestionArea.appendChild(suggestionButton)
        })
        if (suggestions.length > maxPerLine) {
          const expandBtn = document.createElement('button')
          expandBtn.className = 'expand-btn displayed'
          expandBtn.textContent = expanded ? 'Show Less' : 'Show More'
          expandBtn.addEventListener('click', () => {
            this.suggestionsExpanded = !this.suggestionsExpanded
            this.setSuggestions(suggestions)
            if (this.suggestionsExpanded) {
              suggestionArea.classList.add('expanded')
            } else {
              suggestionArea.classList.remove('expanded')
            }
          })
          suggestionArea.appendChild(expandBtn)
          suggestionArea.classList.add('has-more')
        } else {
          suggestionArea.classList.remove('has-more')
        }
        this.showSuggestions()
        this.$emit('onSuggestionsUpdate', suggestions)
      } else {
        this.hideSuggestions()
        this.$emit('onSuggestionsUpdate', [])
      }
    },
    addSuggestionToInput (suggestion) {
      if (!this.keyboard) {
        return
      }
      const currentInput = this.keyboard.getInput()
      const newInput = currentInput + suggestion
      this.keyboard.setInput(newInput)
      this.$emit('onChange', newInput)
      this.$emit('update:modelValue', newInput)
      this.drawingBoard.clearCanvas()
      this.drawingBoard.redraw()
      this.hideSuggestions()
    },
    showSuggestions () {
      const suggestionArea = document.querySelector('.hg-button-suggestion_area')
      if (suggestionArea) {
        suggestionArea.classList.add('displayed')
      }
    },
    hideSuggestions () {
      const suggestionArea = document.querySelector('.hg-button-suggestion_area')
      if (suggestionArea) {
        suggestionArea.classList.remove('displayed')
      }
    }
  }
}
</script>

<style lang="scss">
.keyboard-wrapper {
  position: relative;
  .suggestion-area {
    z-index: 2;
    background-color: white;
    + .hg-row {
      padding-top: 5vw;
    }
  }
  .expand-btn {
    height: 36px;
    width: 36px;
    opacity: 0;
    transition: opacity 0.3s, transform 0.3s;
    background-image: url(./images/more-arrow.svg);
    background-repeat: no-repeat;
    background-position: center;
    color: transparent;
    font-size: 0px;
    margin: 0;
    height: 5vw;
    &.displayed {
      opacity: 1;
    }
    &.top-right {
      position: absolute;
      top: 0;
      right: 0;
      width: 9.325%;
      min-width: 9.325%;
      max-width: 9.325%;
      z-index: 2;
    }
  }
  .hg-theme-default {
    width: 100%;
    user-select: none;
    box-sizing: border-box;
    overflow: hidden;
    touch-action: manipulation;
    font-family: "HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue",
      Helvetica, Arial, "Lucida Grande", sans-serif;
    background-color: #ececec;
    padding: 5px;
    border-radius: 5px;
    /* When using option "useButtonTag" */
    button.hg-button {
      border-width: 0;
      outline: 0;
      font-size: inherit;
    }
    .hg-row {
      display: flex;
      &:not(:last-child) {
        margin-bottom: 5px;
      }
      > div:last-child {
        margin-right: 0;
      }
      .hg-button:not(:last-child) {
        margin-right: 5px;
      }
      .hg-button-container {
        margin-right: 5px;
        display: flex;
      }
    }
    .hg-button {
      display: inline-block;
      flex-grow: 1;
      cursor: pointer;
      box-shadow: 0px 0px 3px -1px rgba(0, 0, 0, 0.3);
      height: 40px;
      border-radius: 5px;
      box-sizing: border-box;
      padding: 5px;
      background: white;
      border-bottom: 1px solid #b5b5b5;
      display: flex;
      align-items: center;
      justify-content: center;
      -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
      span {
        pointer-events: none;
      }
      &.hg-activeButton, &.hg-standardBtn {
        background: #efefef;
      }
      &.hg-button-numpadadd, &.hg-button-numpadenter {
        height: 85px;
      }
      &.hg-button-numpad0 {
        width: 105px;
      }
      &.hg-button-com {
        max-width: 85px;
      }
      &.hg-standardBtn {
        position: relative;
        &.hg-button-at {
          max-width: 45px;
        }
        &[data-skbtn=".com"] {
          max-width: 82px;
        }
        &[data-skbtn="@"] {
          max-width: 60px;
        }
      }
      &.hg-selectedButton {
        background: rgba(5, 25, 70, 0.53);
        color: white;
      }
      &.hg-functionBtn {
        &.hg-button-bksp, &.hg-button-enter, &.hg-button-shift {
          background-repeat: no-repeat;
          background-color: grey;
          background-position: center;
          background-size: 4vw;
          color: transparent;
        }
        &.hg-button-enter {
          background-image: url(./images/enter.svg);
          background-size: 23.7% 32%;
        }
        &.hg-button-bksp {
          background-image: url(./images/delete.svg);
          background-size: 30% 32%;
          max-width: 10vw;
        }
        &.hg-button-shift {
          background-image: url(./images/shift.svg);
          background-size: 30.2% 30%;
        }
        &.hg-button-lang_en, &.hg-button-lang_hand, &.hg-button-lang_cj, &.hg-button-lang_cn {
          background-repeat: no-repeat;
          background-position: center;
          background-size: contain;
          max-width: 10vw;
        }
        &.hg-button-lang_en {
          background-image: url(./images/lang-switch-latin.svg);
        }
          &.hg-button-lang_cn {
          background-image: url(./images/lang-switch-chn.svg);
        }
        &.hg-button-lang_hand {
          background-image: url(./images/lang-switch-hand.svg);
        }
        &.hg-button-lang_cj {
          background-image: url(./images/lang-switch-cj.svg);
        }
      }
      &.disabled {
        background-color: lightgrey;
        pointer-events: none;
        touch-action: none;
      }
    }
    .hg-suggestion-button {
      background: #f0f8ff;
      border: 1px solid #4682b4;
      margin: 2px;
      min-width: 40px;
      font-size: 16px;
      &:hover {
        background: #e6f3ff;
      }
      &:active {
        background: #cce7ff;
      }
    }
    &.hg-layout-numeric .hg-button {
      width: 33.3%;
      height: 60px;
      align-items: center;
      display: flex;
      justify-content: center;
    }
  }
  .hg-button.hg-functionBtn.hg-button-ctrl {
    max-width: 10%;
  }
  .hg-button-preview_pinyin,
  .hg-button-suggestion_area {
    position: relative;
    opacity: 0;
    transition: opacity 0.3s;
    min-height: 50px;
    background: white;
    border: 1px solid #ddd;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
    padding: 5px;
    &.displayed {
      opacity: 1;
    }
    .expand-btn {
      background-color: black;
    }
    .suggestions-area, .suggestions-menu {
      color: black;
    }
  }
  .simple-keyboard {
    .hg-button-canvas {
      width: 783px;
      height: 335px;
      cursor: crosshair;
      clear: both;
      overflow: hidden;
      background-color: #fafafa;
      flex-grow: 0;
    }
    canvas {
      pointer-events: auto;
      touch-action: auto;
    }
  }

  &.expanded .expand-btn {
    transform: rotate(180deg);
  }
  ::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    background-color: #f5f5f5;
  }
  ::-webkit-scrollbar {
    width: 6px;
    background-color: #f5f5f5;
  }
  ::-webkit-scrollbar-thumb {
    background-color: #000000;
  }
}

.hg-button-suggestion_area {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  opacity: 0;
  transition: background-color 0.3s, opacity 0.3s;
  height: 5vw;
  margin-bottom: 5px;
  background-color: transparent;
  &.has-more {
    ul {
      max-width: 100%;
    }
  }
  &.expanded {
    overflow-y: scroll;
    ul {
      height: auto;
      max-height: 100%;
    }
    .suggestions-menu {
      .prev, .next, .pagination {
        display: block;
      }
    }
    .expand-btn {
      transform: rotate(180deg);
    }
  }
  .expand-btn {
    height: 36px;
    width: 100%;
    opacity: 0;
    transition: opacity 0.3s, transform 0.3s;
    background-image: url(./images/more-arrow.svg);
    background-repeat: no-repeat;
    background-position: center;
    color: transparent;
    font-size: 0px;
    margin: 0;
    height: 5vw;
    &.displayed {
      opacity: 1;
    }
  }
  &.displayed {
    opacity: 1;
    background-color: white;
    color: black;
    &.has-more {
      height: 5vw;
      transition: height ease 0.3s;
      &.expanded {
        height: 100%;
      }
    }
  }
  &:not(.expanded) li:nth-child(n + 10) {
    opacity: 0;
    pointer-events: none;
  }
  .suggestions-menu {
    position: absolute;
    right: 0;
    top: 0;
    width: 9.325%;
    min-width: 9.325%;
    max-width: 9.325%;
    height: 100%;
    text-align: center;
    color: white;
    > div {
      height: 36px;
      width: 100%;
      line-height: 36px;
    }
    .prev, .next, .pagination {
      display: none;
      pointer-events: none;
      opacity: 0;
    }
    .disabled {
      color: grey;
    }
  }
}


</style>
