import _ from "lodash";
import Keyboard from "../lib";
import "./css/BasicDemo.css";

const setDOM = () => {
  document.querySelector("#root").innerHTML = `
    <input class="input" id="input-test3" field-type="alphanumeric" placeholder="alphanumeric" style="width:250px;" />
    <div class="simple-keyboard"></div>
  `;
};

class Demo {
  constructor() {
    setDOM();
    // const testField = document.querySelector("#input-test");
    // testField.addEventListener("blur", event => {
    //   console.warn(`BLUR !!!`);
    // });
    // Demo Start
    const beforeOptions = {
      theme: "hg-theme-default mgto-keyboard-theme",
      defaultLanguage: "ENG",
      layout: {
        default: [
          "{//} 1 2 3 4 5 6 7 8 9 0 {//}",
          "{//} q w e r t y u i o p {//}",
          "@ a s d f g h j k l - _",
          "{shift} z x c v b n m . {arrowleft} {arrowright}",
          "{lang_en} {lang_hand} {lang_cj} {space} {bksp}"
        ],
        shift: [
          "{//} 1 2 3 4 5 6 7 8 9 0 {//}",
          "{//} Q W E R T Y U I O P {//}",
          "@ A S D F G H J K L - _",
          "{shift} Z X C V B N M . {arrowleft} {arrowright}",
          "{lang_en} {lang_hand} {lang_cj} {space} {bksp}"
        ],
        zhHS: [
          "{//} 1 2 3 4 5 6 7 8 9 0 {//}",
          "{//} 手 田 水 口 廿 卜 山 戈 人 心 {//}",
          "@ 日 尸 木 火 土 竹 十 大 中 - _",
          "{shift} 重 難 金 女 月 弓 一 . {arrowleft} {arrowright}",
          "{lang_en} {lang_hand} {lang_cj} {space} {bksp}"
        ],
        zhHSshift: [
          "{//} 1 2 3 4 5 6 7 8 9 0 {//}",
          "{//} Q W E R T Y U I O P {//}",
          "@ A S D F G H J K L - _",
          "{shift} Z X C V B N M . {arrowleft} {arrowright}",
          "{lang_en} {lang_hand} {lang_cj} {space} {bksp}"
        ],
        hand: [
          "{undo} 1 2 3 4 5 6 7 8 9 0 {clear}",
          "{canvas}",
          "{lang_en} {lang_hand} {lang_cj} {space} {arrowleft} {arrowright} {bksp}"
        ]
      },
      mergeDisplay: true,
      display: {
        "{enter}": "enter",
        "{bksp}": "delete",
        "{lang}": "ENG",
        "{lang_en}": "ENG",
        "{lang_hand}": "HAND",
        "{lang_cj}": "CJ",
        "{space}": "Space / barra de espaço",
        "{clear}": "清除",
        "{undo}": "復原"
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
    };
    const newOptions = {
      drawingOptions: {
        drawingGrid: true,
        strokeColor: "blue"
      },
      fieldTypes: {
        alpha: [
          "a",
          "b",
          "c",
          "d",
          "e",
          "f",
          "g",
          "h",
          "i",
          "j",
          "k",
          "l",
          "m",
          "n",
          "o",
          "p",
          "q",
          "r",
          "s",
          "t",
          "u",
          "v",
          "w",
          "x",
          "y",
          "z",
          "A",
          "B",
          "C",
          "D",
          "E",
          "F",
          "G",
          "H",
          "I",
          "J",
          "K",
          "L",
          "M",
          "N",
          "O",
          "P",
          "Q",
          "R",
          "S",
          "T",
          "U",
          "V",
          "W",
          "X",
          "Y",
          "Z",
          "手",
          "田",
          "水",
          "口",
          "廿",
          "卜",
          "山",
          "戈",
          "人",
          "心",
          "日",
          "尸",
          "木",
          "火",
          "土",
          "竹",
          "十",
          "大",
          "中",
          "重",
          "難",
          "金",
          "女",
          "月",
          "弓",
          "一",
          "{bksp}",
          "{space}",
          "{shift}",
          "{lang}",
          "{lang_en}",
          "{lang_hand}",
          "{lang_cj}",
          "{clear}",
          "{undo}",
          "{canvas}",
          "{arrowleft}",
          "{arrowright}",
          "{confirm}",
          "{confirm_cn}",
          "{preview_pinyin}",
          "{suggestion_area}",
          "'",
          "-"
        ]
      },
      inputElementsSelector: `.input`,
      theme: "hg-theme-default lego-keyboard-theme",
      defaultLanguage: "ENG",
      layout: {
        default: [
          "{smaller_space} q w e r t y u i o p {bksp}",
          "{smaller_space} a s d f g h j k l - {small_space}",
          "{shift} z x c v b n m ' {big_space}",
          "{lang_cj} {lang_hand} {space} {arrowleft} {arrowright} {confirm}"
        ],
        shift: [
          "{smaller_space} Q W E R T Y U I O P {bksp}",
          "{smaller_space} A S D F G H J K L - {small_space}",
          "{shift} Z X C V B N M ' {big_space}",
          "{lang_cj} {lang_hand} {space} {arrowleft} {arrowright} {confirm}"
        ],
        zhHS: [
          "{preview_pinyin}",
          "{suggestion_area}",
          "{smaller_space} q w e r t y u i o p {bksp}",
          "{smaller_space} a s d f g h j k l - {small_space}",
          "{shift} z x c v b n m ' {big_space}",
          "{lang_en} {lang_hand} {space} {arrowleft} {arrowright} {confirm_cn}"
        ],
        zhHSshift: [
          "{preview_pinyin}",
          "{suggestion_area}",
          "{smaller_space} Q W E R T Y U I O P {bksp}",
          "{smaller_space} A S D F G H J K L - {small_space}",
          "{shift} Z X C V B N M ' {big_space}",
          "{lang_en} {lang_hand} {space} {arrowleft} {arrowright} {confirm_cn}"
        ],
        hand: [
          "{suggestion_area}",
          "{undo} {empty_space} {clear} {bksp}",
          "{canvas}",
          "{lang_en} {lang_hand} {lang_cj} {space} {arrowleft} {arrowright} {confirm_cn}"
        ]
      },
      mergeDisplay: true,
      display: {
        "{enter}": "enter",
        "{bksp}": "delete",
        "{lang}": "ENG",
        "{lang_en}": "ENG",
        "{lang_hand}": "HAND",
        "{lang_cj}": "CJ",
        "{space}": "Space",
        "{undo}": "還原",
        "{clear}": "清除",
        "{confirm}": "Confirm",
        "{confirm_cn}": "确定",
        "{big_space}": " ",
        "{small_space}": " ",
        "{smaller_space}": " ",
        "{empty_space}": " "
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
      physicalKeyboardHighlight: true,
      onChange: () => {
        // StateService.setInactivityTimeout()
      },
      onEnterSuggestedWord(word) {
        console.warn("onEnterSuggestedWord callback !", word);
      }
    };
    this.keyboard = new Keyboard(newOptions);
    this.keyboard.setCNSuggestionsListeners();
    this.keyboard.initKeydownListener();

    // Update simple-keyboard when input is changed directly
    document.querySelectorAll(".input").forEach(input => {
      input.addEventListener("click", this.keyboard.onInputFocus);
      // Optional: Use if you want to track input changes
      // made without simple-keyboard
      // input.addEventListener("input", this.keyboard.inputEventListener);

      // input.addEventListener("blur", this.keyboard.onInputBlur);
    });
  }
}

export default Demo;
