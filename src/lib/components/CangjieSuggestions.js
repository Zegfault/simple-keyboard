import events from "events";
import _ from "lodash";
import suggestionData from "./CangjieSuggestionsData";
suggestionData.simpList = suggestionData.simpList.split("");
suggestionData.cjList = suggestionData.cjList.split(" ");
class CNSuggestions {
  constructor() {
    this.events = new events.EventEmitter();
    this.events.setMaxListeners(100);
    console.log("Will init the CN trad suggestions");
    this.suggestions = suggestionData.simpList;
    this.lat2CJ = {
      Q: "手",
      W: "田",
      E: "水",
      R: "口",
      T: "廿",
      Y: "卜",
      U: "山",
      I: "戈",
      O: "人",
      P: "心",
      A: "日",
      S: "尸",
      D: "木",
      F: "火",
      G: "土",
      H: "竹",
      J: "十",
      K: "大",
      L: "中",
      Z: "重",
      X: "難",
      C: "金",
      V: "女",
      B: "月",
      N: "弓",
      M: "一"
    };
    this.lat2CJKeys = _.keys(this.lat2CJ);
    this.lat2CJValues = _.values(this.lat2CJ);
  }

  getSuggestions(idx) {
    return _.isNumber(idx) ? this.suggestions[idx] : this.suggestions;
  }

  getChar(n) {
    n = --n < 0 ? 9 : n;
    return this.suggestions[n];
  }

  convertCNTrad2Latin(str) {
    let convertedStr = "";
    _.forEach(str, char => {
      convertedStr =
        convertedStr + this.lat2CJKeys[this.lat2CJValues.indexOf(char)];
    });
    return _.replace(convertedStr, "undefined", "");
  }

  charProcessor(chr, buf) {
    let str;
    if (chr == `{bksp}`) {
      // backspace
      if (buf && (str = buf.slice(0, -1))) {
        this.events.emit(
          `displaySuggestionBox`,
          this.suggestions[str.toLowerCase()] || []
        );
        return [str, str.length];
      }
      this.events.emit(`displaySuggestionBox`, false);
      return ["", 0]; // total delete; some other cases
    }
    // non backspace
    str = buf + chr;
    const arr = [];
    const suggestion2Search = this.convertCNTrad2Latin(str);
    _.forEach(suggestionData.cjList, (val, i) => {
      if (_.startsWith(val, suggestion2Search)) {
        arr.push(suggestionData.simpList[i]);
      }
    });
    // arr = this.suggestions[_.get(this.lat2CJ, suggestion2Search, [])] || [];
    console.info(`Suggestion from pinyin: ${str} -> ${suggestion2Search}`, arr);
    if (arr.length) {
      // miao
      this.events.emit(
        `displaySuggestionBox`,
        typeof arr == "string"
          ? (this.suggestions[suggestion2Search] = arr.split(""))
          : arr
      );
      return [str, str.length];
    }
    console.info(`No suggestions`);
    this.events.emit(`displaySuggestionBox`, false);
    return [buf + chr, 0]; //non-chinese talk
  }
}

export default new CNSuggestions();
