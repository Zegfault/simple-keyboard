import { createApp } from 'vue'
import _ from 'lodash'
import SimpleKeyboard from '../src/SimpleKeyboard.vue'
import layout from "simple-keyboard-layouts/build/layouts/chinese";

const layouts = {
  chinese: layout.layout,
  default: {
    default: [
      '` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
      '{tab} q w e r t y u i o p [ ] \\',
      '{lock} a s d f g h j k l ; \'' + ' {enter}',
      '{shift} z x c v b n m , . / {shift}',
      '.com @ {space}'
    ],
    shift: [
      '~ ! @ # $ % ^ & * ( ) _ + {bksp}',
      '{tab} Q W E R T Y U I O P { } |',
      '{lock} A S D F G H J K L : " {enter}',
      '{shift} Z X C V B N M < > ? {shift}',
      '.com @ {space}'
    ]
  }
}


const layoutCandidates = {
  chinese: layout.layoutCandidates,
}

const app = createApp({
  components: {
    SimpleKeyboard
  },
  data() {
    return {
      inputText: '',
      selectedTheme: 'hg-theme-default',
      selectedLayout: 'default',
      debugMode: false,
      disableCaret: false,
      eventLogs: []
    }
  },
  computed: {
    layout() {
      return _.get(layouts, this.selectedLayout, layouts.default)
    },
    layoutCandidates() {
      return _.get(layoutCandidates, this.selectedLayout, undefined)
    }
  },
  methods: {
    onKeyPress(button) {
      this.addLog('Key Press', button)
      console.log('Button pressed:', button)
    },
    onChange(input) {
      this.addLog('Change', input)
      console.log('Input changed:', input)
    },
    addLog(type, data) {
      this.eventLogs.unshift({
        type,
        data: String(data),
        timestamp: new Date().toLocaleTimeString()
      })
      if (this.eventLogs.length > 20) {
        this.eventLogs = this.eventLogs.slice(0, 20)
      }
    }
  }
})

app.mount('#app')
