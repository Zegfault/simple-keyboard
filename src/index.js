import SimpleKeyboard from './SimpleKeyboard.vue'

// Export the component and plugin install function as named exports only
export { SimpleKeyboard }

export const install = (app) => {
  app.component('SimpleKeyboard', SimpleKeyboard)
}
