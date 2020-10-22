import events from "events";
import _ from "lodash";
import suggestionData from "./CNSuggestionsData";
class CNSuggestions {
  constructor() {
    this.events = new events.EventEmitter();
    this.events.setMaxListeners(100);
    console.log("Will init the CN suggestions");
    this.suggestions = suggestionData;
  }

  getSuggestions(idx) {
    return _.isNumber(idx) ? this.suggestions[idx] : this.suggestions;
  }
  getChar(n) {
    n = --n < 0 ? 9 : n;
    return this.suggestions[n];
    // TODO: hugo - might need to handle the paging of the suggestions
    // return this.suggestions[self.getPage()*10+n]
  }

  charProcessor(chr, buf) {
    let num, str, arr;
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
    arr = this.suggestions[str.toLowerCase()] || [];
    if (arr.length) {
      // miao
      this.events.emit(
        `displaySuggestionBox`,
        typeof arr == "string"
          ? (this.suggestions[str.toLowerCase()] = arr.split(""))
          : arr
      );
      return [str, str.length];
    }
    if (!this.getSuggestions().length) {
      this.events.emit(`displaySuggestionBox`, false);
      return [buf + chr, 0]; //non-chinese talk
    }
    if (isFinite((num = parseInt(chr)))) {
      // miao3
      str = this.getChar(num);
      if (!str) {
        //miao9 - no such variant
        return [buf, buf.length];
      }
      this.events.emit(`displaySuggestionBox`, false);
      return [str, 0];
    }
    if ((arr = this.suggestions[chr.toLowerCase()] || []).length) {
      //nih
      str = this.getSuggestions()[0];
      const foundSuggestions =
        typeof arr == "string"
          ? (this.suggestions[str.toLowerCase()] = arr.split(""))
          : arr;
      this.events.emit(`setSuggestions`, foundSuggestions);
      // VirtualKeyboard.IME.setSuggestions((typeof arr =='string')? this.suggestions[str.toLowerCase()]=arr.split('') : arr)
      return [str + chr, 1];
    }
    // ni,
    str = this.getSuggestions()[0];
    this.events.emit(`displaySuggestionBox`, false);
    return [str + (chr.charCodeAt() == 10 ? "" : chr), 0];
  }
}

export default new CNSuggestions();
