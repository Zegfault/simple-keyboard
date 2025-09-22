import SimpleKeyboard from './SimpleKeyboard.vue'

// Export the component
export { SimpleKeyboard }

// Export as default for easier importing
export default SimpleKeyboard

// Vue plugin installation function
export const install = (app) => {
  app.component('SimpleKeyboard', SimpleKeyboard)
}