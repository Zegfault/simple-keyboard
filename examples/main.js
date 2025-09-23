import { createApp } from 'vue'
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
      layout: undefined,
      layoutCandidates: undefined
    }
  },
  methods: {
    onLayoutChange (layoutName) {
      this.selectedLayout = layoutName
      // console.log('Layout changed to:', layoutName)
    }
  }
})

app.mount('#app')
