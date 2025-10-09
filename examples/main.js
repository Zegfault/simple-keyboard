import { createApp } from 'vue'
import SimpleKeyboard from '../src/SimpleKeyboard.vue'
import './hg-theme-dark.scss'

const customEnUSLayout = {
  layout: {
    default: [
      '{lang_cn} {lang_hand} {lang_cj} {suggestion_area} {arrowleft} {arrowright} {bksp}',
      'q w e r t y u i o p',
      'a s d f g h j k l',
      '{shift} z x c v b n m {shift}',
      '{space} {confirm}'
    ],
    shift: [
      '{lang_cn} {lang_hand} {lang_cj} {suggestion_area} {arrowleft} {arrowright} {bksp}',
      'Q W E R T Y U I O P',
      'A S D F G H J K L',
      '{shift} Z X C V B N M {shift}',
      '{space} {confirm}'
    ]
  },
  layoutCandidates: {
    a: 't',
    b: 'e',
    c: 's',
    d: 't'
  }
}

const app = createApp({
  components: {
    SimpleKeyboard
  },
  data () {
    return {
      inputText: '',
      selectedInputElement: this.$refs.input,
      selectedTheme: 'hg-theme-default',
      selectedLayout: 'enUS',
      layouts: {
        enUS: customEnUSLayout
      },
      layoutCandidates: undefined
    }
  },
  mounted () {
    this.$refs.input.focus()
  },
  methods: {
    onFocus (event) {
      this.selectedInputElement = event.target
    },
    onLayoutChange (layoutName) {
      this.selectedLayout = layoutName
      // console.log('Layout changed to:', layoutName)
    }
  }
})

app.mount('#app')
