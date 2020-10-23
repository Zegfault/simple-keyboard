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
    document.addEventListener("keydown", event => {
      // NOTE: If we are in CN or if a special key has been typed
      // TODO: hugo - check if there is an input with the focus
      if (
        (this.keyboard.getCurrentInputMethod() === "CN" ||
          event.key.length > 1) &&
        event.preventDefault
      ) {
        event.preventDefault();
        this.keyboard.handleButtonClicked(
          this.keyboard.convertInputToKeyboardKey(event.key || `{bksp}`)
        );
        return false;
      }
    });

    // Update simple-keyboard when input is changed directly
    document.querySelector(".input").addEventListener("input", event => {
      console.warn("received input event -", event);
      event.target.readOnly = this.keyboard.getCurrentInputMethod() === "CN";
      if (event.target.readOnly) {
        this.keyboard.handleButtonClicked(event.data || `{bksp}`);
        if (event.preventDefault) {
          event.preventDefault();
        }
        return false;
      }
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
      if (!suggestions) {
        this.keyboard.setSuggestions([]);
        return this.keyboard.hideSuggestions();
      }
      this.keyboard.setSuggestions(suggestions);
      this.keyboard.showSuggestions();
    });
    CNSuggestions.events.on(`setSuggestions`, suggestions => {
      this.keyboard.setSuggestions(suggestions);
    });
  }

  onChange(input) {
    // TODO: hugo - instead of getting the input like this, would need to add some classes to the inputs
    const inputElem = document.querySelector(".input");
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

  handleSpaceKey(button = false) {
    // TODO: hugo - handle "when having a suggestion and then typing a number -> should take the Nth suggestion if available"
    const buttonIsANumberKey = _.isNumber(_.toNumber(button));
    if (button === `{enter}`) {
      this.keyboard.enterSuggestedWord(this.keyboard.previewPinyin.innerHTML);
    } else if (
      this.keyboard.suggestionAreaDOM.firstElementChild &&
      this.keyboard.suggestionAreaDOM.firstElementChild.firstElementChild &&
      !buttonIsANumberKey
    ) {
      this.keyboard.enterSuggestedWord(
        this.keyboard.suggestionAreaDOM.firstElementChild.firstElementChild
          .innerHTML
      );
      if (button === `{space}`) {
        return;
      }
    }
    if (button && button !== `{space}` && button !== `{enter}`) {
      this.keyboard.previewPinyin.innerHTML = `${this.keyboard.previewPinyin.innerHTML}${button}`;
    }
    if (this.keyboard.previewPinyin.innerHTML.length > 0) {
      this.keyboard.enterSuggestedWord(
        this.keyboard.previewPinyin.innerHTML,
        buttonIsANumberKey ? button : false
      );
    } else if (button !== `{enter}`) {
      console.log("will add a space");
      this.keyboard.enterSuggestedWord(" ");
    }
    return this.keyboard.setPinyinPreview("");
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
      return this.handleSpaceKey(button);
    }
    // console.log("current word: ---", this.keyboard.currentWord);
    const foundSuggestions = CNSuggestions.charProcessor(
      button,
      _.trim(this.keyboard.currentWord)
    );
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
    // console.warn("beep", foundSuggestions);
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
