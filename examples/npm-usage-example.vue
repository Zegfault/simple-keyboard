<template>
  <div class="keyboard-demo">
    <h2>Vue Simple Keyboard Component Example</h2>

    <!-- Basic Usage -->
    <section>
      <h3>Basic Usage</h3>
      <input
        v-model="basicInput"
        class="demo-input"
        placeholder="Basic keyboard input..."
      />
      <SimpleKeyboard
        v-model="basicInput"
        @on-key-press="onKeyPress"
        @on-change="onChange"
      />
    </section>

    <!-- Custom Theme -->
    <section>
      <h3>Custom Theme</h3>
      <input
        v-model="themedInput"
        class="demo-input"
        placeholder="Themed keyboard input..."
      />
      <SimpleKeyboard
        v-model="themedInput"
        theme="hg-theme-default custom-theme"
        button-theme="{
          '{enter}': 'btn-primary',
          '{shift}': 'btn-secondary',
          '{bksp}': 'btn-danger'
        }"
      />
    </section>

    <!-- Numeric Layout -->
    <section>
      <h3>Custom Numeric Layout</h3>
      <input
        v-model="numericInput"
        class="demo-input"
        placeholder="Numeric input only..."
        type="number"
      />
      <SimpleKeyboard
        v-model="numericInput"
        :layout="numericLayout"
        :display="numericDisplay"
        :max-length="10"
      />
    </section>

    <!-- Multiple Inputs -->
    <section>
      <h3>Multiple Inputs</h3>
      <div>
        <label>First Name:</label>
        <input
          v-model="firstName"
          class="demo-input"
          @focus="setActiveInput('firstName')"
          placeholder="First name..."
        />
      </div>
      <div>
        <label>Last Name:</label>
        <input
          v-model="lastName"
          class="demo-input"
          @focus="setActiveInput('lastName')"
          placeholder="Last name..."
        />
      </div>
      <SimpleKeyboard
        :input-name="activeInput"
        @on-change-all="onChangeAll"
      />
    </section>

    <!-- Debug Mode -->
    <section>
      <h3>Debug Mode (Check Console)</h3>
      <input
        v-model="debugInput"
        class="demo-input"
        placeholder="Debug mode enabled..."
      />
      <SimpleKeyboard
        v-model="debugInput"
        :debug="true"
      />
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SimpleKeyboard from '../src/SimpleKeyboard.vue'

// Basic input
const basicInput = ref('')

// Themed input
const themedInput = ref('')

// Numeric input
const numericInput = ref('')
const numericLayout = {
  default: [
    '1 2 3',
    '4 5 6',
    '7 8 9',
    '{clear} 0 {bksp}'
  ]
}
const numericDisplay = {
  '{clear}': 'Clear',
  '{bksp}': '⌫'
}

// Multiple inputs
const firstName = ref('')
const lastName = ref('')
const activeInput = ref('firstName')

const setActiveInput = (inputName) => {
  activeInput.value = inputName
}

const onChangeAll = (inputs) => {
  firstName.value = inputs.firstName || ''
  lastName.value = inputs.lastName || ''
}

// Debug input
const debugInput = ref('')

// Event handlers
const onKeyPress = (button) => {
  console.log('Key pressed:', button)
}

const onChange = (input) => {
  console.log('Input changed:', input)
}
</script>

<style scoped>
.keyboard-demo {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

section {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

h2 {
  color: #333;
  text-align: center;
}

h3 {
  color: #555;
  margin-bottom: 15px;
}

.demo-input {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 4px;
  margin-bottom: 15px;
  box-sizing: border-box;
}

.demo-input:focus {
  outline: none;
  border-color: #007bff;
}

label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

/* Custom button themes */
.simple-keyboard .custom-theme .hg-button.btn-primary {
  background: #007bff;
  color: white;
}

.simple-keyboard .custom-theme .hg-button.btn-secondary {
  background: #6c757d;
  color: white;
}

.simple-keyboard .custom-theme .hg-button.btn-danger {
  background: #dc3545;
  color: white;
}
</style>
