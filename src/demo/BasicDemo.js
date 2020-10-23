import _ from "lodash";
import Keyboard from "../lib";
import "./css/BasicDemo.css";

const setDOM = () => {
  document.querySelector("#root").innerHTML = `
    <input class="input" placeholder="Tap on the virtual keyboard to start" />
    <div class="simple-keyboard"></div>
  `;
};

class Demo {
  constructor() {
    setDOM();
    // Demo Start
    this.keyboard = new Keyboard({
      onChange: input => this.onChange(input),
      onKeyPress: button => this.onKeyPress(button),
      onSuggestedWordClicked: suggestedWord =>
        this.onSuggestedWordClicked(suggestedWord),
      theme: "hg-theme-default mgto-keyboard-theme",
      layout: {
        default: [
          "` 1 2 3 4 5 6 7 8 9 0 - = {bksp}",
          "{tab} q w e r t y u i o p [ ] \\",
          "{lock} a s d f g h j k l ; ' {enter}",
          "{shift} z x c v b n m , . /",
          "{lang} @ {space}"
        ],
        shift: [
          "~ ! @ # $ % ^ & * ( ) _ + {bksp}",
          "{tab} Q W E R T Y U I O P { } |",
          '{lock} A S D F G H J K L : " {enter}',
          "{shift} Z X C V B N M < > ?",
          "{lang} @ {space}"
        ]
      },
      mergeDisplay: true,
      display: {
        "{enter}": "enter",
        "{bksp}": "delete",
        "{lang}": "CN"
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

  onSuggestedWordClicked(suggestedWord) {
    // console.warn("onSuggestedWordClicked - ", suggestedWord);
    const selectedInput = this.keyboard.getSelectedInput();
    const inputVal = document.querySelector(selectedInput).value;
    document.querySelector(selectedInput).value = `${inputVal}${suggestedWord}`;
  }

  onChange(input) {
    const inputElem = document.querySelector(this.keyboard.getSelectedInput());
    const currentInputMethod = this.keyboard.getCurrentInputMethod();
    if (currentInputMethod === "EN") {
      // console.log("Input changed - before", inputElem.value);
      inputElem.value = input;
      // console.log("Input changed - after", inputElem.value);
    } else if (
      input.length > 1 &&
      this.keyboard.isAlphabetical(_.last(input))
    ) {
      this.keyboard.setCurrentWord(input);
      this.keyboard.setPinyinPreview(this.keyboard.currentWord);
    }
  }

  handleCNKeyPress(button) {
    if (button === `{ctrl}` || button === `{alt}`) {
      return console.log(`Key ignored`);
    }
    if (
      button !== `{bksp}` &&
      (button === "{space}" ||
        button === "{enter}" ||
        !this.keyboard.isAlphabetical(button))
    ) {
      return this.keyboard.handleSpaceKey(button);
    }
    // console.log("current word: ---", this.keyboard.currentWord);
    const foundSuggestions = this.keyboard.findSuggestions(button);
    if (
      button === `{bksp}` &&
      this.keyboard.previewPinyin.innerHTML.length === 0
    ) {
      // NOTE: backspace
      document.querySelector(".input").value = document
        .querySelector(".input")
        .value.slice(0, -1);
      return;
    }
    this.keyboard.setPinyinPreview(_.trim(_.first(foundSuggestions)));
  }

  onKeyPress(button) {
    console.log("Button pressed", button);
    if (button === "{lang}") {
      return this.keyboard.handleLangKey();
    }
    if (button === "{shift}" || button === "{lock}") {
      return this.keyboard.handleShift();
    }
    if (this.keyboard.getCurrentInputMethod() === "CN") {
      this.handleCNKeyPress(button);
    }
  }
}

export default Demo;
