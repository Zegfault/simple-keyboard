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
    console.warn("onSuggestedWordClicked - ", suggestedWord);
    document.querySelector(".input").value = `${
      document.querySelector(".input").value
    }${suggestedWord}`;
  }

  setListeners() {
    CNSuggestions.events.on(`displaySuggestionBox`, suggestions => {
      console.warn(`received event: displaySuggestionBox with: `, suggestions);
      if (!suggestions) {
        return this.keyboard.hideSuggestions();
      }
      this.keyboard.setSuggestions(suggestions);
      this.keyboard.showSuggestions();
      // TODO: hugo - show suggestion box with the received suggestions in it
    });
    CNSuggestions.events.on(`setSuggestions`, suggestions => {
      console.warn(`received event: setSuggestions with: `, suggestions);
      // TODO: hugo - set suggestions in the box
      this.keyboard.setSuggestions(suggestions);
    });
  }

  onChange(input) {
    // TODO: hugo - instead of getting the input like this, would need to add some classes to the inputs
    if (this.inputLanguage === "EN") {
      document.querySelector(".input").value = input;
      console.log("Input changed", input);
    } else if (this.inputLanguage === "CN") {
      this.keyboard.currentWord = input;
    }
  }

  toggleLanguage() {
    this.inputLanguage = this.inputLanguage === "EN" ? "CN" : "EN";
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
      if (button === "{space}") {
        console.warn(`Should add to input the first suggestion`);
        this.keyboard.enterSuggestedWord(
          this.keyboard.suggestionAreaDOM.firstElementChild.firstElementChild
        );
        return;
      }
      // TODO: hugo - find a way to get the current word
      const foundSuggestions = CNSuggestions.charProcessor(
        button,
        this.keyboard.currentWord
      );
      console.warn(foundSuggestions);
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
