import { createApp } from 'vue'
// import _ from 'lodash'
import SimpleKeyboard from '../src/SimpleKeyboard.vue'

const app = createApp({
  components: {
    SimpleKeyboard
  },
  data () {
    return {
      inputText: '',
      selectedTheme: 'hg-theme-default',
      selectedLayout: 'enUS',
      eventLogs: [],
      layout: undefined,
      layoutCandidates: undefined
    }
  },
  methods: {
    onKeyPress (button) {
      this.addLog('Key Press', button)
      console.log('Button pressed:', button)
    },
    onChange (input) {
      this.addLog('Change', input)
      console.log('Input changed:', input)
    },
    onLayoutChange (layoutName) {
      this.selectedLayout = layoutName
      this.addLog('Layout Change', layoutName)
      // console.log('Layout changed to:', layoutName)
    },
    addLog (type, data) {
      this.eventLogs.unshift({
        type,
        data: String(data),
        timestamp: new Date().toLocaleTimeString()
      })
      if (this.eventLogs.length > 20) {
        this.eventLogs = this.eventLogs.slice(0, 20)
      }
      console.warn('add log',  this.eventLogs)
    }
  }
})

app.mount('#app')
