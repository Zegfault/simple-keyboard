import _ from "lodash";
import Keyboard from "../lib";
import "./css/BasicDemo.css";

const setDOM = () => {
  document.querySelector("#root").innerHTML = `
    <input class="input" id="input-test" field-type="alpha" placeholder="alpha" />
    <input class="input" id="input-test2" field-type="numeric" placeholder="numeric" />
    <input class="input" id="input-test3" field-type="alphanumeric" placeholder="alphanumeric" />
    <input class="input" id="input-test4" field-type="email" placeholder="email" />
    <div class="simple-keyboard"></div>
  `;
};

class Demo {
  constructor() {
    setDOM();
    // Demo Start
    this.keyboard = new Keyboard({
      theme: "hg-theme-default mgto-keyboard-theme",
      defaultLanguage: "ENG",
      layout: {
        default: [
          "1 2 3 4 5 6 7 8 9 0",
          "q w e r t y u i o p",
          "a s d f g h j k l -",
          "{shift} z x c v b n m . _",
          "{lang} @ {space} {bksp}"
        ],
        shift: [
          "1 2 3 4 5 6 7 8 9 0",
          "Q W E R T Y U I O P",
          "A S D F G H J K L -",
          "{shift} Z X C V B N M . _",
          "{lang} @ {space} {bksp}"
        ],
        zhHT: [
          "1 2 3 4 5 6 7 8 9 0",
          "q w e r t y u i o p",
          "a s d f g h j k l -",
          "{shift} z x c v b n m . _",
          "{lang} @ {space} {bksp}"
        ],
        zhHTshift: [
          "1 2 3 4 5 6 7 8 9 0",
          "Q W E R T Y U I O P",
          "A S D F G H J K L -",
          "{shift} Z X C V B N M . _",
          "{lang} @ {space} {bksp}"
        ]
      },
      mergeDisplay: true,
      display: {
        "{enter}": "enter",
        "{bksp}": "delete",
        "{lang}": "ENG",
        "{space}": "Space / barra de espaço"
      },
      accentsMapping: {
        lowercase: {
          a: ["á", "ã", "â", "à", "ä", "æ", "å"],
          e: ["é", "ê", "è", "ë"],
          i: ["í", "î", "ì", "ï"],
          o: ["ó", "õ", "ô", "ò", "ö", "œ", "ø"],
          u: ["ú", "û", "ù", "ü"],
          y: ["ý", "ÿ"],
          n: ["ñ"],
          d: ["ð"],
          s: ["ß"],
          c: ["ç"]
        },
        uppercase: {
          A: ["Á", "Ã", "Â", "À", "Ä", "Æ", "Å"],
          E: ["É", "Ê", "È", "Ë"],
          I: ["Í", "Î", "Ì", "Ï"],
          O: ["Ó", "Õ", "Ô", "Ò", "Ö", "Œ", "Ø"],
          U: ["Ú", "Û", "Ù", "Ü"],
          Y: ["Ý", "Ÿ"],
          N: ["Ñ"],
          D: ["Ð"],
          S: ["ß"],
          C: ["Ç"]
        }
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
