<template>
  <div class="keyboard-wrapper" :class="localeClass">
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
    layouts: { type: Object, default: undefined },
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
        strokeColor: 'black'
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
    layoutCandidatesPageSize: { type: Number, default: 10 },
    layoutCandidatesCaseSensitiveMatch: { type: Boolean, default: false },
    disableCandidateNormalization: { type: Boolean, default: false },
    enableLayoutCandidatesKeyPress: { type: Boolean, default: true },
    // Localization
    rtl: { type: Boolean, default: false },
    // Debug & Development
    debug: { type: Boolean, default: false },
    // Additional Props
    keyboardClass: { type: String, default: 'simple-keyboard' },
    modelValue: { type: String, default: undefined },
    handwritingLooseness: { type: Number, default: 0.15 }
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
      allKeys: [],
      keyboard: null,
      drawingBoard: null,
      defaultLanguageMapping: {
        '{lang_en}': 'enUS',
        '{lang_cn}': 'zhCN',
        '{lang_hand}': 'hand',
        '{lang_cj}': 'zhHT'
      },
      suggestionsExpanded: false,
      layoutCandidatesInternal: undefined,
      originalRenderPage: false,
      singleShiftActive: false,
      capsLockActive: false,
      previewPinyin: '',
      shouldEmptyPinyinPreview: false
    }
  },
  computed: {
    localeClass () {
      return `locale-${this.layoutName}`
    }
  },
  watch: {
    previewPinyin () {
      this.updateDisabledPinyinKeys()
    },
    modelValue (newValue) {
      if (this.keyboard && !_.isUndefined(newValue)) {
        this.keyboard.setInput(newValue)
      }
    },
    layout: {
      handler () { this.reinitKeyboard() },
      deep: true
    },
    layoutName: function () {
      this.capsLockActive = false
      this.singleShiftActive = false
      this.reinitKeyboard()
    },
    theme: 'reinitKeyboard',
    display: {
      handler () { this.reinitKeyboard() },
      deep: true
    },
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
    getLayoutKeys () {
      const layout = _.cloneDeep(_.get(layouts, `${this.layoutName}.layout.${this.keyboard.options.layoutName}`, []))
      return _.filter(_.split(_.join(layout, ' '), ' '), key => !_.startsWith(key, '{') && !_.endsWith(key, '}'))
    },
    // Returns array of valid pinyin syllables for current layout
    getValidPinyinList () {
      const candidates = this.getLayoutCandidates() || []
      if (_.isPlainObject(layouts[this.layoutName]?.layoutCandidates)) {
        return _.keys(layouts[this.layoutName].layoutCandidates)
      }
      if (_.isArray(candidates)) {
        return _.uniq(_.map(candidates, item => _.isString(item) ? item : item.pinyin))
      }
      return []
    },
    isValidPinyinPrefix (pinyin) {
      const validList = this.getValidPinyinList()
      return _.some(validList, syllable => _.startsWith(syllable, pinyin))
    },
    updateDisabledPinyinKeys () {
      if (!_.includes(['zhCN', 'zhHT'], this.layoutName)) {
        return
      }
      this.removeButtonTheme(_.join(this.allKeys, ' '), 'disabled')
      let invalidKeys = []
      if (_.trim(this.previewPinyin).length !== 0) {
        invalidKeys = _.filter(this.allKeys, letter => !this.isValidPinyinPrefix(`${this.previewPinyin}${letter}`))
      }
      if (invalidKeys.length > 0) {
        this.addButtonTheme(_.join(invalidKeys, ' '), 'disabled')
      }
    },
    updateSuggestions (suggestions) {
      if (!_.get(this.keyboard, 'candidateBox', false)) {
        return
      }
      const container = this.$refs['keyboardContainer']
      if (!container) {
        return
      }
      const suggestionArea = container.querySelector('.hg-button-suggestion_area')
      if (!suggestionArea) {
        return
      }
      // Filter out empty or whitespace-only suggestions
      const filteredSuggestions = _.filter(suggestions, s => _.trim(s).length > 0)
      if (_.get(filteredSuggestions, 'length', 0) === 0) {
        suggestionArea.classList.remove('displayed')
        suggestionArea.classList.remove('expanded')
        this.suggestionsExpanded = false
        suggestionArea.innerHTML = ''
        return
      } else {
        suggestionArea.classList.add('displayed')
      }
      suggestionArea.innerHTML = ''
      const suggestionMenu = document.createElement('div')
      suggestionMenu.className = 'hg-suggestion_area-menu'
      suggestionArea.appendChild(suggestionMenu)
      _.each(filteredSuggestions, (item) => {
        this.createSuggestionElement(suggestionMenu, () => {}, item)
      })
    },
    async initHanzi () {
      const data = await import(`./hanzi/${this.localeForHandwriting}.json`)
      HanziLookup.init(this.localeForHandwriting, {substrokes: data.substrokes, chars: data.chars})
    },
    getLayoutCandidates () {
      if (_.get(this.layoutCandidatesInternal, 'length', 0) > 0) {
        return this.layoutCandidatesInternal
      } else if (this.layoutCandidates) {
        return this.layoutCandidates
      } else if (!this.enableLayoutCandidates) {
        return undefined
      }
      return _.get(layouts, `${this.layoutName}.layoutCandidates`, undefined)
    },
    setPreviewPinyin (string) {
      if (this.shouldEmptyPinyinPreview) {
        string = ' '
        this.shouldEmptyPinyinPreview = false
      }
      this.previewPinyin = string
      if (this.keyboard) {
        const display = { ...this.keyboard.options.display, '{preview_pinyin}': this.previewPinyin }
        this.keyboard.setOptions({ display })
        this.updateDisabledPinyinKeys()
      }
      this.updatePinyinSuggestions()
    },
    onKeyPress (button)  {
      if (button === '{shift}') {
        this.handleShift()
      } else if (button === '{lock}') {
        this.handleLock()
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
      } else if (button === '{space}') {
        this.setLayoutCandidates([])
        this.$emit('onSuggestionsUpdate', [])
      } else if (this.layoutName === 'hand' && button !== '{suggestion_area}' && button !== '{clear}') {
        this.onKeyPress('{clear}')
      } else if (_.includes(['zhCN', 'zhHT'], this.layoutName)) {
        // Prevent input for disabled keys
        if (!_.startsWith(button, '{') && !_.endsWith(button, '}')) {
          if (this.keyboard && this.keyboard.getButtonElement) {
            const btnElem = this.keyboard.getButtonElement(button)
            if (btnElem && btnElem.classList.contains('disabled')) {
              return
            }
          }
        }
        if (button === '{bksp}') {
          // If previewPinyin is not empty, remove last character from previewPinyin
          if (_.trim(this.previewPinyin).length > 0) {
            return this.setPreviewPinyin(this.previewPinyin.length > 1 ? this.previewPinyin.slice(0, -1) : ' ')
          }
          // If previewPinyin is empty, fall through to default behavior (remove from input)
        }
        // Only add to input if button is a capitalized letter (A-Z)
        if (!_.startsWith(button, '{') && !_.endsWith(button, '}')) {
          if (/^[A-Z]$/.test(button)) {
            const currentInput = this.keyboard.getInput()
            this.onChange(currentInput + button)
            if (this.singleShiftActive && !this.capsLockActive) {
              this.singleShiftActive = false
              if (this.keyboard) {
                this.keyboard.setOptions({ layoutName: 'default' })
              }
            }
          } else {
            return this.setPreviewPinyin(`${this.previewPinyin === ' ' ? '' : this.previewPinyin}${button}`)
          }
        }
      }
      this.$emit('onKeyPress', button)
    },
    updatePinyinSuggestions () {
      if (!_.includes(['zhCN', 'zhHT'], this.layoutName)) {
        return
      }
      const pinyin = this.previewPinyin
      if (!pinyin || _.trim(pinyin) === '') {
        this.setLayoutCandidates([])
        return this.$emit('onSuggestionsUpdate', [])
      }
      const candidates = this.getLayoutCandidates() || []
      const filtered = _.filter(
        _.split(_.join(_.compact(_.map(candidates, (val, key) => _.startsWith(key, pinyin) ? val : false)), ' '), ' '),
        s => _.trim(s).length > 0
      )
      this.setLayoutCandidates(filtered)
      this.$emit('onSuggestionsUpdate', filtered)
    },
    onChange (input) {
      if (_.includes(['zhCN', 'zhHT'], this.layoutName) && /[a-z]+$/.test(input)) {
        return
      }
      this.$emit('onChange', input)
      this.$emit('update:modelValue', input)
    },
    onChangeAll (inputs) {
      if (_.includes(['zhCN', 'zhHT'], this.layoutName) && _.every(inputs, input => /[a-z]+$/.test(input))) {
        return
      }
      this.$emit('onChangeAll', inputs)
    },
    onKeyReleased (button) {
      if (_.includes(['zhCN', 'zhHT'], this.layoutName) && /[a-z]+$/.test(button)) {
        return
      }
      this.$emit('onKeyReleased', button)
    },
    async onRender () {
      this.$emit('onRender')
      const elem = document.querySelector('.hg-button-canvas')
      if (_.isNull(elem) || _.isUndefined(elem)) {
        return
      }
      HanziLookup.options = _.merge(
        HanziLookup.options,
        this.drawingOptions || {}
      )
      this.drawingBoard = new HanziLookup.DrawingBoard(HanziLookup.options, elem, this.lookup)
      await this.initHanzi()
    },
    onInit () {
      this.$emit('onInit')
    },
    beforeInputUpdate (input, inputName) {
      if (_.includes(['zhCN', 'zhHT'], this.layoutName)) {
        const lastChar = typeof input === 'string' ? input.slice(-1) : ''
        if (/^[a-z]$/.test(lastChar)) {
          return false
        }
      }
      this.$emit('beforeInputUpdate', input, inputName)
    },
    initializeKeyboard () {
      const container = this.$refs.keyboardContainer
      if (!container) {
        return
      }
      this.suggestionsExpanded = false
      this.layoutCandidatesInternal = []
      this.setPreviewPinyin(' ')
      const mergedLayouts = {}
      _.forOwn(layouts, (layoutObj, langKey) => {
        const baseLayout = _.get(layoutObj, 'layout', _.get(layouts, `${langKey}.layout`, undefined))
        const candidates = _.merge(_.get(layoutObj, 'layoutCandidates', undefined), _.get(this.layouts, `${langKey}.layoutCandidates`, undefined))
        mergedLayouts[langKey] = {
          layout: baseLayout,
          layoutCandidates: candidates
        }
      })
      const currentLayoutObj = mergedLayouts[this.layoutName] || {}
      const options = {
        ..._.pick(this, _.keys(this.$props)),
        layout: currentLayoutObj.layout,
        display: this.display || defaultDisplay,
        layoutCandidates: currentLayoutObj.layoutCandidates,
        layoutCandidatesCaseSensitiveMatch: this.layoutCandidatesCaseSensitiveMatch || (!_.isUndefined(currentLayoutObj.layoutCandidates) && !_.includes(['zhCN', 'zhHT', 'hand'], this.layoutName)),
        onChange: this.onChange,
        onChangeAll: this.onChangeAll,
        onKeyPress: this.onKeyPress,
        onKeyReleased: this.onKeyReleased,
        onRender: this.onRender,
        onInit: this.onInit,
        beforeInputUpdate: this.beforeInputUpdate
      }
      options.layoutName = _.includes(['default', 'shift', 'alt', 'alt-shift'], options.layoutName) ? options.layoutName : 'default'
      this.keyboard = new Keyboard(container, options)
      if (!_.isUndefined(this.modelValue)) {
        this.keyboard.setInput(this.modelValue)
      }
      this.allKeys = this.getLayoutKeys()
      if (_.isFunction(_.get(this.keyboard, 'candidateBox.renderPage', false)) && !_.isEmpty(currentLayoutObj.layoutCandidates)) {
        this.keyboard.candidateBox.renderPage = this.renderPageFromLibrary
      }
    },
    switchLayout (newLayoutName) {
      this.capsLockActive = false
      this.singleShiftActive = false
      this.$emit('onLayoutChange', newLayoutName)
    },
    moveCursorLeft () {
      if (this.keyboard) {
        this.keyboard.setCaretPosition(Math.max(0, this.keyboard.getCaretPosition() - 1))
      }
    },
    moveCursorRight () {
      if (this.keyboard) {
        const currentInput = this.keyboard.getInput()
        this.keyboard.setCaretPosition(Math.min(currentInput.length, this.keyboard.getCaretPosition() + 1))
      }
    },
    handleShift () {
      if (!this.keyboard) {
        return
      }
      if (!this.capsLockActive) {
        const currentLayout = this.keyboard.options.layoutName
        this.singleShiftActive = currentLayout === 'default'
        this.keyboard.setOptions({ layoutName: currentLayout === 'default' ? 'shift' : 'default' })
      }
    },
    handleLock () {
      if (!this.keyboard) {
        return
      }
      this.capsLockActive = !this.capsLockActive
      this.singleShiftActive = false
      if (this.capsLockActive) {
        this.keyboard.setOptions({ layoutName: 'shift' })
      } else {
        this.keyboard.setOptions({ layoutName: 'default' })
      }
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
        const btns = _.split(buttons, ' ')
        _.each(btns, (btn) => {
          const btnElem = this.keyboard.getButtonElement(btn)
          if (btnElem && !btnElem.classList.contains(className)) {
            btnElem.classList.add(className)
          }
        })
      }
    },
    removeButtonTheme (buttons, className) {
      if (this.keyboard) {
        const btns = _.split(buttons, ' ')
        _.each(btns, (btn) => {
          const btnElem = this.keyboard.getButtonElement(btn)
          if (btnElem && btnElem.classList.contains(className)) {
            btnElem.classList.remove(className)
          }
        })
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
      }
      const analyzedChar = new HanziLookup.AnalyzedCharacter(strokes)
      const looseness = this.layoutName === 'hand' ? this.handwritingLooseness : 1
      const matcher = new HanziLookup.Matcher(this.localeForHandwriting, looseness)
      this.showResults([])
      matcher.match(analyzedChar, this.suggestionsLimit, matches => {
        this.showResults(matches)
      })
    },
    customCandidatesBox () {
      this.keyboard.candidateBox.renderPage()
    },
    showResults (matches) {
      const suggestions = _.map(matches, 'character')
      if (_.isEmpty(suggestions)) {
        this.setLayoutCandidates([])
        this.$emit('onSuggestionsUpdate', [])
        return
      }
      this.setLayoutCandidates(suggestions)
      this.$emit('onSuggestionsUpdate', suggestions)
    },
    createSuggestionElement (suggestionArea, onItemSelected, candidateListItem) {
      const candidateListLIElement = document.createElement('div')
      const getMouseEvent = () => {
        const mouseEvent = new (this.keyboard.candidateBox.options.useTouchEvents ? TouchEvent : MouseEvent)('click')
        Object.defineProperty(mouseEvent, 'target', { value: candidateListLIElement })
        return mouseEvent
      }
      candidateListLIElement.className = 'hg-suggestion-button'
      candidateListLIElement.innerHTML = this.keyboard.candidateBox.options.display?.[candidateListItem] || candidateListItem
      const onClickOrTouch = (event) => {
        this.setPreviewPinyin(' ')
        if (_.includes(['zhCN', 'zhHT'], this.layoutName)) {
          const currentInput = this.keyboard.getInput()
          this.onChange(currentInput + candidateListItem)
        }
        if (this.keyboard) {
          this.shouldEmptyPinyinPreview = true
        }
        onItemSelected(candidateListItem, event || getMouseEvent())
        this.setLayoutCandidates([])
        this.$emit('onSuggestionsUpdate', [])
      }
      if (this.keyboard.candidateBox.options.useTouchEvents) {
        candidateListLIElement.ontouchstart = onClickOrTouch
      } else {
        candidateListLIElement.onclick = onClickOrTouch
      }
      suggestionArea.appendChild(candidateListLIElement)
    },
    // eslint-disable-next-line no-unused-vars
    renderPageFromLibrary ({candidateListPages, targetElement, pageIndex, nbPages, onItemSelected}) {
      const suggestionArea = targetElement.querySelector('.hg-button-suggestion_area')
      if (!suggestionArea) {
        return
      }
      suggestionArea.innerHTML = ''
      const suggestionMenu = document.createElement('div')
      suggestionMenu.className = 'hg-suggestion_area-menu'
      suggestionArea.appendChild(suggestionMenu)
      let candidatesToRender = []

      const pageSize = this.layoutCandidatesPageSize || 10
      if (this.suggestionsExpanded) {
        candidatesToRender = _.flatten(candidateListPages)
        suggestionArea.classList.add('expanded')
      } else {
        candidatesToRender = _.slice(candidateListPages[pageIndex], 0, pageSize)
        suggestionArea.classList.remove('expanded')
      }
      _.each(candidatesToRender, (candidateListItem) => {
        this.createSuggestionElement(suggestionMenu, onItemSelected, candidateListItem)
      })
      let expandBtn = suggestionArea.querySelector('.expand-btn')
      const shouldShowExpand = _.flatten(candidateListPages).length > pageSize
      if (!expandBtn) {
        expandBtn = document.createElement('div')
        expandBtn.className = 'expand-btn'
        expandBtn.textContent = ''
        suggestionArea.appendChild(expandBtn)
      }
      if (shouldShowExpand) {
        expandBtn.classList.add('displayed')
      } else {
        expandBtn.classList.remove('displayed')
      }
      if (!_.isBoolean(this.suggestionsExpanded)) {
        this.suggestionsExpanded = false
      }
      expandBtn.onclick = () => {
        this.suggestionsExpanded = !this.suggestionsExpanded
        let candidatesToRender = []
        const pageSize = this.layoutCandidatesPageSize || 10
        if (this.suggestionsExpanded) {
          candidatesToRender = _.flatten(candidateListPages)
          suggestionArea.classList.add('expanded')
        } else {
          candidatesToRender = _.slice(candidateListPages[pageIndex], 0, pageSize)
          suggestionArea.classList.remove('expanded')
        }
        suggestionMenu.innerHTML = ''
        _.each(candidatesToRender, (candidateListItem) => {
          this.createSuggestionElement(suggestionMenu, onItemSelected, candidateListItem)
        })
      }
    },
    setLayoutCandidates (suggestions) {
      this.layoutCandidatesInternal = suggestions
      if (_.get(this.keyboard, 'candidateBox', false)) {
        this.keyboard.candidateBox.renderPage = this.renderPageFromLibrary
        this.updateSuggestions(suggestions)
        this.keyboard.showCandidatesBox('', _.join(suggestions, ' '), this.$refs['keyboardContainer'])
      }
    }
  }
}
</script>

<style lang="scss">
.keyboard-wrapper {
  position: relative;
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
      border-width: 0;
      outline: 0;
      font-size: inherit;
      span {
        pointer-events: none;
      }
      &.hg-standardBtn {
        background: white;
      }
      &.hg-activeButton {
        background: #e3f0ff;
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
        // &.hg-button-lang_en, &.hg-button-lang_hand, &.hg-button-lang_cj, &.hg-button-lang_cn {
          // background-repeat: no-repeat;
          // background-position: center;
          // background-size: contain;
          // max-width: 10vw;
        // }
        // &.hg-button-lang_en {
        //   background-image: url(./images/lang-switch-latin.svg);
        // }
        // &.hg-button-lang_cn {
          //background-image: url(./images/lang-switch-chn.svg);
        // }
        // &.hg-button-lang_hand {
        //   background-image: url(./images/lang-switch-hand.svg);
        // }
        // &.hg-button-lang_cj {
        //   background-image: url(./images/lang-switch-cj.svg);
        // }
      }
      &.hg-button-big_space {
        opacity: 0;
        pointer-events: none;
        // width: 50%;
        // max-width: 50%;
        // min-width: 50%;
      }
      &.hg-button-arrowleft,
      &.hg-button-arrowright {
        span {
          width: 40px;
          height: 40px;
          background-image: url(./images/left-arrow.svg);
          background-repeat: no-repeat;
          background-position: center;
          background-size: 30% 32%;
          color: transparent;
          font-size: 0;
          transform: rotate(90deg);
        }
      }
      &.hg-button-arrowright {
        span {
          transform: rotate(-90deg);
        }
      }
      &.disabled {
        background-color: lightgrey;
        pointer-events: none;
        touch-action: none;
      }
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
    // Suggestion Area
    .hg-button-suggestion_area {
      width: 100%;
      z-index: 2;
      position: relative;
      opacity: 1;
      transition: opacity 0.3s;
      min-height: 36px;
      background: white;
      border: 1px solid #ddd;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-start;
      padding: 0px;
      z-index: 10;
      .hg-suggestion_area-menu {
        width: 100%;
        position: absolute;
        top: 0;
        left: 0;
        height: 36px;
        transition: height ease 0.3s;
        background-color: white;
        display: flex;
        flex-wrap: wrap;
        align-content: flex-start;
        > div {
          height: 36px;
          width: 100%;
          line-height: 36px;
        }
      }
      .hg-suggestion-button {
        width: 36px;
        height: 36px;
        min-width: 36px;
        max-width: 36px;
        font-size: 16px;
        text-align: center;
        line-height: 2;
        &:hover {
          background: #e6f3ff;
        }
        &:active {
          background: #cce7ff;
        }
      }
      .expand-btn {
        height: 36px;
        width: 36px;
        min-width: 36px;
        max-width: 36px;
        opacity: 0;
        background-color: black;
        background-image: url(./images/more-arrow.svg);
        background-repeat: no-repeat;
        background-position: center;
        color: transparent;
        font-size: 0px;
        margin: 0;
        border: none;
        cursor: pointer;
        position: absolute;
        top: 0;
        right: 0;
        z-index: 100;
        transition: opacity 0.3s, transform 0.3s;
        &.displayed {
          opacity: 1;
        }
      }
      &.expanded {
        .hg-suggestion_area-menu {
          height: 250px;
          overflow-y: scroll;
        }
        .expand-btn {
          transform: rotate(180deg);
        }
      }
      &.displayed {
        opacity: 1;
        background-color: white;
        color: black;
      }
      &:not(.expanded) li:nth-child(n + 10) {
        opacity: 0;
        pointer-events: none;
      }
    }
  }
  .hg-button.hg-functionBtn.hg-button-ctrl {
    max-width: 10%;
  }
  .simple-keyboard {
    .hg-button-canvas {
      width: 100%;
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



</style>
