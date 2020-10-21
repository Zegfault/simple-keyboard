import _ from "lodash";
import Keyboard from "../lib";
import CNSuggestions from "./CNSuggestions";
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
    this.setListeners();
    /**
     * Demo Start
     */
    this.inputLanguage = "CN";
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
          "{ctrl} @ {space}"
        ],
        shift: [
          "~ ! @ # $ % ^ & * ( ) _ + {bksp}",
          "{tab} Q W E R T Y U I O P { } |",
          '{lock} A S D F G H J K L : " {enter}',
          "{shift} Z X C V B N M < > ?",
          "{ctrl} @ {space}"
        ]
      },
      mergeDisplay: true,
      display: {
        "{enter}": "enter",
        "{bksp}": "delete",
        "{ctrl}": "CN"
      },
      physicalKeyboardHighlight: true
    });
    this.keyboard.suggestionAreaDOM.firstElementChild;
    // this.suggestionAreaDOM = this.keyboard.keyboardDOM.firstChild();
    /**
     * Update simple-keyboard when input is changed directly
     */
    document.querySelector(".input").addEventListener("input", event => {
      console.warn("received input event -", event.target.value);
      this.keyboard.setInput(event.target.value);
    });
  }

  onSuggestedWordClicked(suggestedWord) {
    // console.warn("onSuggestedWordClicked - ", suggestedWord);
    document.querySelector(".input").value = `${
      document.querySelector(".input").value
    }${suggestedWord}`;
  }

  setListeners() {
    CNSuggestions.events.on(`displaySuggestionBox`, suggestions => {
      console.warn(`received event: displaySuggestionBox with: `, suggestions);
      if (!suggestions) {
        this.keyboard.setSuggestions([]);
        return this.keyboard.hideSuggestions();
      }
      this.keyboard.setSuggestions(suggestions);
      this.keyboard.showSuggestions();
    });
    CNSuggestions.events.on(`setSuggestions`, suggestions => {
      console.warn(`received event: setSuggestions with: `, suggestions);
      this.keyboard.setSuggestions(suggestions);
    });
  }

  onChange(input) {
    // TODO: hugo - instead of getting the input like this, would need to add some classes to the inputs
    if (this.inputLanguage === "EN") {
      console.log(
        "Input changed - before",
        document.querySelector(".input").value
      );
      document.querySelector(".input").value = input;
      console.log("Input changed - after", input);
    } else if (this.inputLanguage === "CN") {
      this.keyboard.currentWord = input;
    }
  }

  toggleLanguage() {
    this.inputLanguage = this.inputLanguage === "EN" ? "CN" : "EN";
  }

  handleSpaceKey(button = false) {
    if (
      this.keyboard.suggestionAreaDOM.firstElementChild &&
      this.keyboard.suggestionAreaDOM.firstElementChild.firstElementChild
    ) {
      console.warn(`Should add to input the first suggestion`);
      return this.keyboard.enterSuggestedWord(
        this.keyboard.suggestionAreaDOM.firstElementChild.firstElementChild
          .innerHTML
      );
    }
    if (button && button !== `{space}`) {
      this.keyboard.previewPinyin.innerHTML = `${this.keyboard.previewPinyin.innerHTML}${button}`;
    }
    if (this.keyboard.previewPinyin.innerHTML.length > 0) {
      // console.log("will add the first suggested word");
      this.keyboard.enterSuggestedWord(this.keyboard.previewPinyin.innerHTML);
    } else {
      // console.log("will add a space");
      this.keyboard.enterSuggestedWord(" ");
    }
    return this.keyboard.setPinyinPreview("");
  }

  onKeyPress(button) {
    // console.log("Button pressed", button);
    if (button === "{ctrl}") {
      this.toggleLanguage();
      this.keyboard.setOptions({
        display: {
          "{ctrl}": this.inputLanguage
        }
      });
    } else if (button === "{shift}" || button === "{lock}") {
      this.handleShift();
    } else if (this.inputLanguage === "CN") {
      if (
        button !== `{bksp}` &&
        (button === "{space}" || !this.keyboard.isAlphabetical(button))
      ) {
        return this.handleSpaceKey(button);
      }
      const foundSuggestions = CNSuggestions.charProcessor(
        button,
        _.trim(this.keyboard.currentWord)
      );
      if (
        button === `{bksp}` &&
        this.keyboard.previewPinyin.innerHTML.length === 0
      ) {
        // NOTE: backspace
        // TODO: hugo - delete the last pinyin preview char or char in the input
        document.querySelector(".input").value = document
          .querySelector(".input")
          .value.slice(0, -1);
        return;
      }
      this.keyboard.setPinyinPreview(_.trim(_.first(foundSuggestions)));
      console.warn("beep", foundSuggestions);
    }
  }

  handleShift() {
    const currentLayout = this.keyboard.options.layoutName;
    this.keyboard.setOptions({
      layoutName: currentLayout === "default" ? "shift" : "default"
    });
  }
}

export default Demo;
