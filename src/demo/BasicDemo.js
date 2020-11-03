import _ from "lodash";
import Keyboard from "../lib";
import "./css/BasicDemo.css";

const setDOM = () => {
  document.querySelector("#root").innerHTML = `
    <input class="input" id="input-test" placeholder="Tap on the virtual keyboard to start" />
    <div class="simple-keyboard"></div>
  `;
};

class Demo {
  constructor() {
    setDOM();
    // Demo Start
    this.keyboard = new Keyboard({
      theme: "hg-theme-default mgto-keyboard-theme",
      layout: {
        default: [
          "q w e r t y u i o p {bksp}",
          "a s d f g h j k l ' {enter}",
          "{shift} z x c v b n m , . ? {shift}",
          "{numbers} {space} @ {lang}"
        ],
        shift: [
          "Q W E R T Y U I O P {bksp}",
          'A S D F G H J K L " {enter}',
          "{shift} Z X C V B N M ; : ! {shift}",
          "{numbers} {space} @ {lang}"
        ],
        numbers: [
          "1 2 3 4 5 6 7 8 9 0 {bksp}",
          "! # $ ¥ % ^ & * ( )",
          "- _ = + [ ] { } < > {enter}",
          "\\ | ~ ` ' \" ; : , . ? /",
          "{numbers} {space} @ {lang}"
        ],
        zhHT: [
          "q w e r t y u i o p {bksp}",
          "a s d f g h j k l ' {enter}",
          "{shift} z x c v b n m , . ? {shift}",
          "{numbers} {space} @ {lang}"
        ],
        zhHTshift: [
          "Q W E R T Y U I O P {bksp}",
          'A S D F G H J K L " {enter}',
          "{shift} Z X C V B N M ; : ! {shift}",
          "{numbers} {space} @ {lang}"
        ],
        zhHTnumbers: [
          "1 2 3 4 5 6 7 8 9 0 {bksp}",
          "! # $ ¥ % ^ & * ( )",
          "- _ = + [ ] { } < > {enter}",
          "\\ | ~ ` ' \" ; : , . ? /",
          "{numbers} {space} @ {lang}"
        ],
        ptPT: [
          "q w e r t y u i o p {bksp}",
          "a s d f g h j k l ç {enter}",
          '{shift} z x c v b n m , . " {shift}',
          "{numbers} {space} @ {lang}"
        ],
        ptPTshift: [
          "Q W E R T Y U I O P {bksp}",
          "A S D F G H J K L Ç {enter}",
          "{shift} Z X C V B N M ; : ' {shift}",
          "{numbers} {space} @ {lang}"
        ],
        ptPTnumbers: [
          "1 2 3 4 5 6 7 8 9 0 {bksp}",
          "! # $ ¥ % ^ & * ( )",
          "- _ = + [ ] { } < > {enter}",
          "\\ | ~ ` ' \" ; : , . ? /",
          "{numbers} {space} @ {lang}"
        ]
      },
      mergeDisplay: true,
      display: {
        "{enter}": "enter",
        "{bksp}": "delete",
        "{lang}": "ENG",
        "{numbers}": "&123"
      },
      physicalKeyboardHighlight: true
    });
    this.keyboard.setCNSuggestionsListeners();
    this.keyboard.initKeydownListener();

    // Update simple-keyboard when input is changed directly
    document.querySelectorAll(".input").forEach(input => {
      input.addEventListener("focus", this.keyboard.onInputFocus);
      // Optional: Use if you want to track input changes
      // made without simple-keyboard
      input.addEventListener("input", this.keyboard.inputEventListener);
    });
  }
}

export default Demo;
