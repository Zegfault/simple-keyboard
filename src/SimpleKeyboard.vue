<template>
  <div ref="keyboardContainer" :class="keyboardClass" />
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
    layoutName: { type: String, default: 'default' },
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
  data () {
    return {
      keyboard: null,
      drawingBoard: new HanziLookup()
    }
  },
  watch: {
    modelValue (newValue) {
      if (this.keyboard && newValue !== undefined) {
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
      // const data = await import('./hanzi/mmah.json')
      // this.drawingBoard.init('mmah', {substrokes: data.substrokes, chars: data.chars})
      const data2 = await import('./hanzi/orig.json')
      this.drawingBoard.init('orig', {substrokes: data2.substrokes, chars: data2.chars})
    },
    getLayoutCandidates () {
      if (this.layoutCandidates) {
        console.warn('Using custom layoutCandidates')
        return this.layoutCandidates
      } else if (!this.enableLayoutCandidates) {
        console.warn('Layout candidates disabled')
        return undefined
      }
      const candidatesToUse = _.get(layouts, `${this.layoutName}.layoutCandidates`, undefined)
      // if (!_.isUndefined(candidatesToUse)) {
      // console.warn(`Using built-in layoutCandidates for ${this.layoutName}`, candidatesToUse)
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
          this.$emit('onKeyPress', button)
          if (button === '{shift}' || button === '{lock}') {
            this.handleShift()
          } else if (button === '{canvas}') {
            console.warn('clicked on canvas button')
            // this.$emit('onCanvasPress')
          } else if (button === '{undo}') {
            this.drawingBoard.undoStroke()
            this.drawingBoard.redraw()
            this.lookup()
          } else if (button === '{clear}') {
            this.drawingBoard.clearCanvas()
            this.drawingBoard.redraw()
            this.lookup()
          }
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
          console.warn('test onRender', this.layoutName, elem)
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
    // Decompose character from drawing board
      let strokes = this.drawingBoard.cloneStrokes()
      if (_.get(strokes, 'length', 0) === 1 && _.get(strokes, '[0].length', 0) === 2) {
        strokes = []
        console.debug('Will reset drawing strokes')
      }
      // TODO: hugo - doesn't return anything, to fix
      const analyzedChar = this.drawingBoard.AnalyzedCharacter(strokes)
      console.warn('test - Analyzed Character', analyzedChar)
      // // Look up with original HanziLookup data
      // let matcherOrig = new HanziLookup.Matcher("orig");
      // this.showResults([]);
      // matcherOrig.doMatch(analyzedChar, 10, matches => {
      //   this.showResults(matches);
      // });
      // Look up with MMAH data
      let matcherOrig = this.drawingBoard.Matcher('orig')
      this.showResults([])
      matcherOrig.doMatch(analyzedChar, 10, matches => {
        this.showResults(matches)
      })
    },
    showResults (matches) {
      const suggestions = _.map(matches, item => item.character)
      console.warn('test - Suggestions', suggestions)
      if (_.isEmpty(suggestions)) {
        this.setSuggestions([])
        this.hideSuggestions()
        return
      }
      this.setSuggestions(suggestions)
      this.showSuggestions()
    },
    setSuggestions (suggestions) {
      console.warn('test --- setSuggestions', suggestions)
    },
    showSuggestions () {
      if (!this.suggestionAreaDOM) {
        return
      }
      this.suggestionAreaDOM.classList.add('displayed')
    },
    hideSuggestions () {
      if (!this.suggestionAreaDOM) {
        return
      }
      this.suggestionAreaDOM.classList.remove('displayed')
    }
  }
}
</script>

<style lang="scss">
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
    &.hg-activeButton,
    &.hg-standardBtn .accents-overlay .accent-key.hg-activeButton {
      background: #efefef;
    }
    &.hg-button-numpadadd,
    &.hg-button-numpadenter {
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
      .accents-overlay {
        position: absolute;
        top: -80%;
        left: 0;
        z-index: 2;
        display: flex;
        .accent-key {
          display: inline-block;
          padding: 15px;
          line-height: 15px;
          background-color: white;
        }
      }
    }
    &.hg-selectedButton {
      background: rgba(5, 25, 70, 0.53);
      color: white;
    }
    &.hg-functionBtn {
      &.hg-button-bksp,
      &.hg-button-lang,
      &.hg-button-enter,
      &.hg-button-shift {
        background-repeat: no-repeat;
        background-color: grey;
        background-position: center;
        background-size: 4vw;
        color: transparent;
      }
      &.hg-button-enter {
        background-image: url(../../demo/images/enter.svg);
        background-size: 23.7% 32%;
      }
      &.hg-button-bksp {
        background-image: url(../../demo/images/delete.svg);
        background-size: 30% 32%;
        max-width: 10vw;
      }
      &.hg-button-shift {
        background-image: url(../../demo/images/shift.svg);
        background-size: 30.2% 30%;
      }
      &.hg-button-lang {
        background-image: url(../../demo/images/lang-switch-latin.svg);
        background-size: 30.2% 30%;
        max-width: 10vw;
        &.zhHS {
          background-image: url(../../demo/images/lang-switch-chn.svg);
          background-size: 30.2% 30%;
        }
      }
      &.hg-button-numbers {
        max-width: 10vw;
      }
    }
    &.disabled {
      background-color: lightgrey;
      pointer-events: none;
      touch-action: none;
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
html {
  background-color: black;
}
.hg-button-preview_pinyin,
.hg-button-suggestion_area {
  position: relative;
  .expand-btn {
    background-color: black;
  }
  .suggestions-area,
  .suggestions-menu {
    color: black;
  }
}
.suggestion-area {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  opacity: 0;
  transition: background-color 0.3s, opacity 0.3s;
  height: 5vw;
  margin-bottom: 5px;
  background-color: transparent;
  /* NOTE: hugo - added after */
  ul {
    height: 36px;
    width: 100%;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    align-content: flex-start;
    justify-content: flex-start;
    min-height: 5vw;
    li {
      flex: 1 0 10%;
      padding: 10px 0;
      display: inline-block;
      line-height: 1.5;
      text-align: center;
      color: black;
      height: 5vw;
      width: 9.325%;
      min-width: 9.325%;
      max-width: 9.325%;
      &:not(:first-child) {
        padding-left: 0px;
      }
      &:not(:last-child) {
        margin-right: 0.75%;
      }
    }
  }
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
      .prev,
      .next,
      .pagination {
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
    background-image: url(../../demo/images/more-arrow.svg);
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
    .prev,
    .next,
    .pagination {
      display: none;
      pointer-events: none;
      opacity: 0;
    }
    .disabled {
      color: grey;
    }
  }
}
.preview-pinyin {
  color: grey;
  min-height: 18px;
  font-size: 15px;
}
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
    background-image: url(../../demo/images/more-arrow.svg);
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
.simple-keyboard {
  canvas {
    pointer-events: none;
    touch-action: none;
  }
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
</style>
