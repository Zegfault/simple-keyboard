import events from "events";
import _ from "lodash";
import suggestionData from "./CangjieSuggestionsData";
// suggestionData.simpList = suggestionData.simpList.split("");
// suggestionData.cjList = suggestionData.cjList.split(" ");
class CNSuggestions {
  constructor() {
    this.events = new events.EventEmitter();
    this.events.setMaxListeners(100);
    console.log("Will init the CN trad suggestions");
    this.suggestions = _.uniq(suggestionData);
    this.lat2CJ = {
      q: "手",
      w: "田",
      e: "水",
      r: "口",
      t: "廿",
      y: "卜",
      u: "山",
      i: "戈",
      o: "人",
      p: "心",
      a: "日",
      s: "尸",
      d: "木",
      f: "火",
      g: "土",
      h: "竹",
      j: "十",
      k: "大",
      l: "中",
      z: "重",
      x: "難",
      c: "金",
      v: "女",
      b: "月",
      n: "弓",
      m: "一"
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
    str = str.toLowerCase();
    let arr = [];
    const suggestion2Search = this.convertCNTrad2Latin(str);
    _.forEach(suggestionData, (val, i) => {
      if (_.startsWith(i, suggestion2Search)) {
        const tmp = val.split("");
        _.forEach(tmp, char => {
          arr.push({
            key: i,
            char
          });
        });
      }
    });
    arr = _.sortBy(arr, item => item.key.length);
    arr = _.map(arr, "char");
    // arr = this.suggestions[_.get(this.lat2CJ, suggestion2Search, [])] || [];
    // console.info(`Suggestion from pinyin: ${str} -> ${suggestion2Search}`, arr);
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
