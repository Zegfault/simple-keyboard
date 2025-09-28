import SimpleKeyboard from './SimpleKeyboard.vue'

// Default export for ESM compatibility
export default SimpleKeyboard
// Named export for named import usage
export { SimpleKeyboard }

export const install = (app) => {
  app.component('SimpleKeyboard', SimpleKeyboard)
}
