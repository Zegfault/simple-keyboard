import _ from "lodash";
import ScrollBooster from "scrollbooster";
import "./Keyboard.css";

// Services
import { getDefaultLayout } from "../services/KeyboardLayout";
import PhysicalKeyboard from "../services/PhysicalKeyboard";
import Utilities from "../services/Utilities";
import CNSuggestions from "./CNSuggestions";

/**
 * Root class for simple-keyboard
 * This class:
 * - Parses the options
 * - Renders the rows and buttons
 * - Handles button functionality
 */
class SimpleKeyboard {
  /**
   * Creates an instance of SimpleKeyboard
   * @param {Array} params If first parameter is a string, it is considered the container class. The second parameter is then considered the options object. If first parameter is an object, it is considered the options object.
   */
  constructor(...params) {
    const { keyboardDOMClass, keyboardDOM, options = {} } = this.handleParams(
      params
    );
    this.touchMoveTimeout = false;
    this.canSelectSuggestedWord = true;
    this.currentAccentOverlay = false;
    this.accentsMapping = {
      lowercase: {
        a: ["á", "ã", "â", "à", "ä", "æ"],
        e: ["é", "ê", "è", "ë"],
        i: ["í", "î", "ì", "ï"],
        o: ["ó", "õ", "ô", "ò", "ö", "œ"],
        u: ["ú", "û", "ù", "ü"],
        y: ["ý", "ÿ"],
        n: ["ñ"],
        c: ["ç"]
      },
      uppercase: {
        A: ["Á", "Ã", "Â", "À", "Ä", "Æ"],
        E: ["É", "Ê", "È", "Ë"],
        I: ["Í", "Î", "Ì", "Ï"],
        O: ["Ó", "Õ", "Ô", "Ò", "Ö", "Œ"],
        U: ["Ú", "Û", "Ù", "Ü"],
        Y: ["Ý", "Ÿ"],
        N: ["Ñ"],
        C: ["Ç"]
      }
    };
    this.currentWord = "";
    this.selectedInput = false;
    this.numberOfSuggestionsPerLine = 10;
    this.currentSuggestionPage = 1;
    this.numberOfSuggestionsPages = 1;
    /**
     * Initializing Utilities
     */
    this.utilities = new Utilities({
      getOptions: this.getOptions,
      getCaretPosition: this.getCaretPosition,
      getCaretPositionEnd: this.getCaretPositionEnd,
      dispatch: this.dispatch
    });

    /**
     * Caret position
     */
    this.caretPosition = null;

    /**
     * Caret position end
     */
    this.caretPositionEnd = null;

    /**
     * Processing options
     */
    this.keyboardDOM = keyboardDOM;

    /**
     * @type {object}
     * @property {object} layout Modify the keyboard layout.
     * @property {string} layoutName Specifies which layout should be used.
     * @property {object} display Replaces variable buttons (such as {bksp}) with a human-friendly name (e.g.: “backspace”).
     * @property {boolean} mergeDisplay By default, when you set the display property, you replace the default one. This setting merges them instead.
     * @property {string} theme A prop to add your own css classes to the keyboard wrapper. You can add multiple classes separated by a space.
     * @property {array} buttonTheme A prop to add your own css classes to one or several buttons.
     * @property {array} buttonAttributes A prop to add your own attributes to one or several buttons.
     * @property {boolean} debug Runs a console.log every time a key is pressed. Displays the buttons pressed and the current input.
     * @property {boolean} newLineOnEnter Specifies whether clicking the “ENTER” button will input a newline (\n) or not.
     * @property {boolean} tabCharOnTab Specifies whether clicking the “TAB” button will input a tab character (\t) or not.
     * @property {string} inputName Allows you to use a single simple-keyboard instance for several inputs.
     * @property {number} maxLength Restrains all of simple-keyboard inputs to a certain length. This should be used in addition to the input element’s maxlengthattribute.
     * @property {object} maxLength Restrains simple-keyboard’s individual inputs to a certain length. This should be used in addition to the input element’s maxlengthattribute.
     * @property {boolean} syncInstanceInputs When set to true, this option synchronizes the internal input of every simple-keyboard instance.
     * @property {boolean} physicalKeyboardHighlight Enable highlighting of keys pressed on physical keyboard.
     * @property {boolean} preventMouseDownDefault Calling preventDefault for the mousedown events keeps the focus on the input.
     * @property {boolean} preventMouseUpDefault Calling preventDefault for the mouseup events.
     * @property {boolean} stopMouseDownPropagation Stops pointer down events on simple-keyboard buttons from bubbling to parent elements.
     * @property {boolean} stopMouseUpPropagation Stops pointer up events on simple-keyboard buttons from bubbling to parent elements.
     * @property {string} physicalKeyboardHighlightTextColor Define the text color that the physical keyboard highlighted key should have.
     * @property {string} physicalKeyboardHighlightBgColor Define the background color that the physical keyboard highlighted key should have.
     * @property {function(button: string):string} onKeyPress Executes the callback function on key press. Returns button layout name (i.e.: “{shift}”).
     * @property {function(input: string):string} onChange Executes the callback function on input change. Returns the current input’s string.
     * @property {function} onRender Executes the callback function every time simple-keyboard is rendered (e.g: when you change layouts).
     * @property {function} onInit Executes the callback function once simple-keyboard is rendered for the first time (on initialization).
     * @property {function(inputs: object):object} onChangeAll Executes the callback function on input change. Returns the input object with all defined inputs.
     * @property {boolean} useButtonTag Render buttons as a button element instead of a div element.
     * @property {boolean} disableCaretPositioning A prop to ensure characters are always be added/removed at the end of the string.
     * @property {object} inputPattern Restrains input(s) change to the defined regular expression pattern.
     * @property {boolean} useTouchEvents Instructs simple-keyboard to use touch events instead of click events.
     * @property {boolean} autoUseTouchEvents Enable useTouchEvents automatically when touch device is detected.
     * @property {boolean} useMouseEvents Opt out of PointerEvents handling, falling back to the prior mouse event logic.
     * @property {function} destroy Clears keyboard listeners and DOM elements.
     * @property {boolean} disableButtonHold Disable button hold action.
     * @property {function} onKeyReleased Executes the callback function on key release.
     * @property {array} modules Module classes to be loaded by simple-keyboard.
     */
    this.options = options;
    // NOTE: specifies which keys should be enabled
    this.fieldTypes = this.options.fieldTypes || {
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
        "-",
        "{bksp}",
        "{space}",
        "{shift}",
        "{lang}"
      ],
      numeric: [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "0",
        "{bksp}",
        "{lang}"
      ],
      alphanumeric: []
    };
    this.fieldTypes.alphanumeric = _.uniq(
      _.concat(this.fieldTypes.alpha, this.fieldTypes.numeric)
    );
    this.fieldTypes.email = _.concat(this.fieldTypes.alphanumeric, [
      "@",
      ".",
      "_"
    ]);

    this.inputLanguage = _.get(this.options, "defaultLanguage", "ENG");
    this.accentsMapping = _.get(
      this.options,
      "accentsMapping",
      this.accentsMapping
    );
    this.options.layoutName = this.options.layoutName || "default";
    this.options.theme = this.options.theme || "hg-theme-default";
    this.options.inputName = this.options.inputName || "default";
    this.options.preventMouseDownDefault =
      this.options.preventMouseDownDefault || false;

    /**
     * @type {object} Classes identifying loaded plugins
     */
    this.keyboardPluginClasses = "";

    /**
     * Bindings
     */
    Utilities.bindMethods(SimpleKeyboard, this);

    /**
     * simple-keyboard uses a non-persistent internal input to keep track of the entered string (the variable `keyboard.input`).
     * This removes any dependency to input DOM elements. You can type and directly display the value in a div element, for example.
     * @example
     * // To get entered input
     * const input = keyboard.getInput();
     *
     * // To clear entered input.
     * keyboard.clearInput();
     *
     * @type {object}
     * @property {object} default Default SimpleKeyboard internal input.
     * @property {object} myInputName Example input that can be set through `options.inputName:"myInputName"`.
     */
    this.input = {};
    this.input[this.options.inputName] = "";

    /**
     * @type {string} DOM class of the keyboard wrapper, normally "simple-keyboard" by default.
     */
    this.keyboardDOMClass = keyboardDOMClass;

    /**
     * @type {object} Contains the DOM elements of every rendered button, the key being the button's layout name (e.g.: "{enter}").
     */
    this.buttonElements = {};

    /**
     * Simple-keyboard Instances
     * This enables multiple simple-keyboard support with easier management
     */
    if (!window["SimpleKeyboardInstances"])
      window["SimpleKeyboardInstances"] = {};

    this.currentInstanceName = this.utilities.camelCase(this.keyboardDOMClass);
    window["SimpleKeyboardInstances"][this.currentInstanceName] = this;

    /**
     * Instance vars
     */
    this.allKeyboardInstances = window["SimpleKeyboardInstances"];
    this.keyboardInstanceNames = Object.keys(window["SimpleKeyboardInstances"]);
    this.isFirstKeyboardInstance =
      this.keyboardInstanceNames[0] === this.currentInstanceName;

    /**
     * Physical Keyboard support
     */
    this.physicalKeyboard = new PhysicalKeyboard({
      dispatch: this.dispatch,
      getOptions: this.getOptions
    });

    /**
     * Rendering keyboard
     */
    if (this.keyboardDOM) this.render();
    else {
      console.warn(`".${keyboardDOMClass}" was not found in the DOM.`);
      throw new Error("KEYBOARD_DOM_ERROR");
    }

    /**
     * Modules
     */
    this.modules = {};
    this.loadModules();
  }

  /**
   * parseParams
   */
  handleParams = params => {
    let keyboardDOMClass;
    let keyboardDOM;
    let options;

    /**
     * If first parameter is a string:
     * Consider it as an element's class
     */
    if (typeof params[0] === "string") {
      keyboardDOMClass = params[0].split(".").join("");
      keyboardDOM = document.querySelector(`.${keyboardDOMClass}`);
      options = params[1];

      /**
       * If first parameter is an HTMLDivElement
       * Consider it as the keyboard DOM element
       */
    } else if (params[0] instanceof HTMLDivElement) {
      /**
       * This element must have a class, otherwise throw
       */
      if (!params[0].className) {
        console.warn("Any DOM element passed as parameter must have a class.");
        throw new Error("KEYBOARD_DOM_CLASS_ERROR");
      }

      keyboardDOMClass = params[0].className.split(" ")[0];
      keyboardDOM = params[0];
      options = params[1];

      /**
       * Otherwise, search for .simple-keyboard DOM element
       */
    } else {
      keyboardDOMClass = "simple-keyboard";
      keyboardDOM = document.querySelector(`.${keyboardDOMClass}`);
      options = params[0];
    }

    return {
      keyboardDOMClass,
      keyboardDOM,
      options
    };
  };

  /**
   * Getters
   */
  getOptions = () => this.options;
  getCaretPosition = () => this.caretPosition;
  getCaretPositionEnd = () => this.caretPositionEnd;

  /**
   * Setters
   */
  setCaretPosition(position, endPosition) {
    this.caretPosition = position;
    this.caretPositionEnd = endPosition || position;
  }

  /**
   * Handles clicks made to keyboard buttons
   * @param  {string} button The button's layout name.
   */
  handleButtonClicked(button) {
    const debug = this.options.debug;
    /**
     * Ignoring placeholder buttons
     */
    if (button === "{//}") return false;

    /**
     * Calling onKeyPress
     */
    if (typeof this.options.onKeyPress === "function") {
      this.options.onKeyPress(button);
    } else {
      this.onKeyPress(button);
    }

    if (!this.input[this.options.inputName])
      this.input[this.options.inputName] = "";

    const updatedInput = this.utilities.getUpdatedInput(
      button,
      this.input[this.options.inputName],
      this.caretPosition,
      this.caretPositionEnd
    );

    if (
      // If input will change as a result of this button press
      this.input[this.options.inputName] !== updatedInput &&
      // This pertains to the "inputPattern" option:
      // If inputPattern isn't set
      (!this.options.inputPattern ||
        // Or, if it is set and if the pattern is valid - we proceed.
        (this.options.inputPattern && this.inputPatternIsValid(updatedInput)))
    ) {
      /**
       * If maxLength and handleMaxLength yield true, halting
       */
      if (
        this.options.maxLength &&
        this.utilities.handleMaxLength(this.input, updatedInput)
      ) {
        return false;
      }

      this.input[this.options.inputName] = this.utilities.getUpdatedInput(
        button,
        this.input[this.options.inputName],
        this.caretPosition,
        this.caretPositionEnd,
        true
      );

      if (debug) console.log("Input changed:", this.input);

      if (this.options.debug) {
        console.log(
          "Caret at: ",
          this.getCaretPosition(),
          this.getCaretPositionEnd(),
          `(${this.keyboardDOMClass})`
        );
      }

      /**
       * Enforce syncInstanceInputs, if set
       */
      if (this.options.syncInstanceInputs) this.syncInstanceInputs();

      /**
       * Calling onChange
       */
      if (typeof this.options.onChange === "function")
        this.options.onChange(this.input[this.options.inputName]);

      /**
       * Calling onChangeAll
       */
      if (typeof this.options.onChangeAll === "function")
        this.options.onChangeAll(this.input);
    }

    if (debug) {
      console.log("Key pressed:", button);
    }
  }

  /**
   * Handles button mousedown
   */
  /* istanbul ignore next */
  handleButtonMouseDown(button, e) {
    /**
     * Handle event options
     */
    if (this.options.preventMouseDownDefault) e.preventDefault();
    if (this.options.stopMouseDownPropagation) e.stopPropagation();

    /**
     * Add active class
     */
    if (e) e.target.classList.add(this.activeButtonClass);

    if (this.holdInteractionTimeout) clearTimeout(this.holdInteractionTimeout);
    if (this.holdTimeout) clearTimeout(this.holdTimeout);

    /**
     * @type {boolean} Whether the mouse is being held onKeyPress
     */
    this.isMouseHold = true;

    /**
     * @type {object} Time to wait until a key hold is detected
     */
    if (!this.options.disableButtonHold) {
      this.holdTimeout = setTimeout(() => {
        if (
          (this.isMouseHold &&
            // TODO: This needs to be configurable through options
            ((!button.includes("{") && !button.includes("}")) ||
              button === "{delete}" ||
              button === "{backspace}" ||
              button === "{bksp}" ||
              button === "{space}" ||
              button === "{tab}")) ||
          button === "{arrowright}" ||
          button === "{arrowleft}" ||
          button === "{arrowup}" ||
          button === "{arrowdown}"
        ) {
          if (this.options.debug) console.log("Button held:", button);

          this.handleButtonHold(button, e);
        }
        clearTimeout(this.holdTimeout);
      }, 500);
    }
  }

  /**
   * Handles button mouseup
   */
  handleButtonMouseUp(button = null, e = null) {
    if (e) {
      /**
       * Handle event options
       */
      if (this.options.preventMouseUpDefault) e.preventDefault();
      if (this.options.stopMouseUpPropagation) e.stopPropagation();
    }

    /**
     * Remove active class
     */
    if (
      this.currentAccentOverlayButton &&
      this.currentAccentOverlayButton !== button
    ) {
      if (!_.isNull(button)) {
        this.recurseButtons(buttonElement => {
          if (buttonElement.dataset.skbtn !== this.currentAccentOverlayButton) {
            buttonElement.classList.remove(this.activeButtonClass);
          }
        });
      } else {
        _.forEach(this.currentAccentOverlay.children, childElement => {
          childElement.classList.remove(this.activeButtonClass);
        });
        // this.displayAccentsOverlay(false, false, false);
      }
    } else if (!this.currentAccentOverlayButton) {
      this.recurseButtons(buttonElement => {
        buttonElement.classList.remove(this.activeButtonClass);
      });
    }

    this.isMouseHold = false;
    if (this.holdInteractionTimeout) clearTimeout(this.holdInteractionTimeout);

    /**
     * Calling onKeyReleased
     */
    if (button && typeof this.options.onKeyReleased === "function")
      this.options.onKeyReleased(button);
  }

  /**
   * Handles container mousedown
   */
  handleKeyboardContainerMouseDown(e) {
    /**
     * Handle event options
     */
    if (this.options.preventMouseDownDefault) e.preventDefault();
  }

  keyHasAccents(button) {
    if (this.options.layoutName === "zhHT") {
      console.warn(
        `in zhHT, will not take accents in consideration`,
        this.inputLanguage,
        this.options.layoutName
      );
      return false;
    }
    return _.get(
      this.accentsMapping,
      `${
        this.options.layoutName.includes("shift") ? "uppercase" : "lowercase"
      }.${button}`,
      false
    );
  }

  removeAccentsOverlay() {
    // console.warn("removeAccentsOverlay");
    if (this.currentAccentOverlay) {
      this.currentAccentOverlay.remove();
      this.currentAccentOverlay = false;
      this.currentAccentOverlayButton = false;
    }
  }

  handleAccentKey(accent) {
    this.enterSuggestedWord(accent);
    this.removeAccentsOverlay();
  }

  createAccentsOverlay(button, accents) {
    if (this.currentAccentOverlay) {
      this.removeAccentsOverlay();
    }
    const keyButton = document.querySelector(
      `.hg-button.hg-standardBtn[data-skbtn="${button}"]`
    );
    this.currentAccentOverlayButton = button;
    this.currentAccentOverlay = document.createElement("div");
    this.currentAccentOverlay.className = "accents-overlay";
    _.forEach(accents, accent => {
      const accentKey = document.createElement("div");
      accentKey.className = "accent-key";
      accentKey.innerHTML = `${accent}`;
      accentKey.onmousedown = event => {
        event.target.classList.add("hg-activeButton");
      };
      accentKey.onclick = event => {
        this.handleAccentKey(accent);
        event.target.classList.remove("hg-activeButton");
        this.recurseButtons(buttonElement => {
          buttonElement.classList.remove(this.activeButtonClass);
        });
      };
      this.currentAccentOverlay.appendChild(accentKey);
    });
    keyButton.appendChild(this.currentAccentOverlay);
  }

  displayAccentsOverlay(button, display, accents = false) {
    // console.warn(
    //   `Will display:${display} accents overlay for button ${button}`
    // );
    return display
      ? this.createAccentsOverlay(button, accents)
      : this.removeAccentsOverlay();
  }

  /**
   * Handles button hold
   */
  /* istanbul ignore next */
  handleButtonHold(button) {
    if (this.holdInteractionTimeout) clearTimeout(this.holdInteractionTimeout);

    /**
     * @type {object} Timeout dictating the speed of key hold iterations
     */
    this.holdInteractionTimeout = setTimeout(() => {
      if (this.isMouseHold) {
        // console.warn("MOUSE HOLD", button);
        const accents = this.keyHasAccents(button);
        if (accents) {
          // console.warn(`${button} key has accents !`, accents);
          return this.displayAccentsOverlay(button, true, accents);
        }
        // console.warn("key has no accents");
        this.removeAccentsOverlay();
        this.handleButtonClicked(button);
        this.handleButtonHold(button);
      } else {
        clearTimeout(this.holdInteractionTimeout);
      }
    }, 100);
  }

  /**
   * Send a command to all simple-keyboard instances (if you have several instances).
   */
  syncInstanceInputs() {
    this.dispatch(instance => {
      instance.replaceInput(this.input);
      instance.setCaretPosition(this.caretPosition, this.caretPositionEnd);
    });
  }

  /**
   * Clear the keyboard’s input.
   * @param {string} [inputName] optional - the internal input to select
   */
  clearInput(inputName) {
    inputName = inputName || this.options.inputName;
    this.input[inputName] = "";

    /**
     * Reset caretPosition
     */
    this.setCaretPosition(0);

    /**
     * Enforce syncInstanceInputs, if set
     */
    if (this.options.syncInstanceInputs) this.syncInstanceInputs();
  }

  /**
   * Get the keyboard’s input (You can also get it from the onChange prop).
   * @param  {string} [inputName] optional - the internal input to select
   */
  getInput(inputName) {
    inputName = inputName || this.options.inputName;

    /**
     * Enforce syncInstanceInputs, if set
     */
    if (this.options.syncInstanceInputs) this.syncInstanceInputs();

    return this.input[inputName];
  }

  /**
   * Set the keyboard’s input.
   * @param  {string} input the input value
   * @param  {string} inputName optional - the internal input to select
   */
  setInput(input, inputName) {
    inputName = inputName || this.options.inputName;
    this.input[inputName] = input;

    /**
     * Enforce syncInstanceInputs, if set
     */
    if (this.options.syncInstanceInputs) this.syncInstanceInputs();
  }

  /**
   * Replace the input object (`keyboard.input`)
   * @param  {object} inputObj The input object
   */
  replaceInput(inputObj) {
    this.input = inputObj;
  }

  /**
   * Set new option or modify existing ones after initialization.
   * @param  {object} options The options to set
   */
  setOptions(options = {}) {
    const changedOptions = this.changedOptions(options);
    this.options = Object.assign(this.options, options);

    if (changedOptions.length) {
      if (this.options.debug) {
        console.log("changedOptions", changedOptions);
      }

      /**
       * Some option changes require adjustments before re-render
       */
      this.onSetOptions(options);

      /**
       * Rendering
       */
      this.render();
    }
  }

  /**
   * Detecting changes to non-function options
   * This allows us to ascertain whether a button re-render is needed
   */
  changedOptions(newOptions) {
    return Object.keys(newOptions).filter(
      optionName =>
        JSON.stringify(newOptions[optionName]) !==
        JSON.stringify(this.options[optionName])
    );
  }

  /**
   * Executing actions depending on changed options
   * @param  {object} options The options to set
   */
  onSetOptions(options) {
    if (options.inputName) {
      /**
       * inputName changed. This requires a caretPosition reset
       */
      if (this.options.debug) {
        console.log("inputName changed. caretPosition reset.");
      }
      this.setCaretPosition(null);
    }
  }

  /**
   * Remove all keyboard rows and reset keyboard values.
   * Used internally between re-renders.
   */
  clear() {
    this.keyboardDOM.innerHTML = "";
    this.keyboardDOM.className = this.keyboardDOMClass;
    this.buttonElements = {};
  }

  /**
   * Send a command to all simple-keyboard instances at once (if you have multiple instances).
   * @param  {function(instance: object, key: string)} callback Function to run on every instance
   */
  dispatch(callback) {
    if (!window["SimpleKeyboardInstances"]) {
      console.warn(
        `SimpleKeyboardInstances is not defined. Dispatch cannot be called.`
      );
      throw new Error("INSTANCES_VAR_ERROR");
    }

    return Object.keys(window["SimpleKeyboardInstances"]).forEach(key => {
      callback(window["SimpleKeyboardInstances"][key], key);
    });
  }

  /**
   * Adds/Modifies an entry to the `buttonTheme`. Basically a way to add a class to a button.
   * @param  {string} buttons List of buttons to select (separated by a space).
   * @param  {string} className Classes to give to the selected buttons (separated by space).
   */
  addButtonTheme(buttons, className) {
    if (!className || !buttons) return false;

    buttons.split(" ").forEach(button => {
      className.split(" ").forEach(classNameItem => {
        if (!this.options.buttonTheme) this.options.buttonTheme = [];

        let classNameFound = false;

        /**
         * If class is already defined, we add button to class definition
         */
        this.options.buttonTheme.map(buttonTheme => {
          if (buttonTheme.class.split(" ").includes(classNameItem)) {
            classNameFound = true;

            const buttonThemeArray = buttonTheme.buttons.split(" ");
            if (!buttonThemeArray.includes(button)) {
              classNameFound = true;
              buttonThemeArray.push(button);
              buttonTheme.buttons = buttonThemeArray.join(" ");
            }
          }
          return buttonTheme;
        });

        /**
         * If class is not defined, we create a new entry
         */
        if (!classNameFound) {
          this.options.buttonTheme.push({
            class: classNameItem,
            buttons: buttons
          });
        }
      });
    });

    this.render();
  }

  /**
   * Removes/Amends an entry to the `buttonTheme`. Basically a way to remove a class previously added to a button through buttonTheme or addButtonTheme.
   * @param  {string} buttons List of buttons to select (separated by a space).
   * @param  {string} className Classes to give to the selected buttons (separated by space).
   */
  removeButtonTheme(buttons, className) {
    /**
     * When called with empty parameters, remove all button themes
     */
    if (!buttons && !className) {
      this.options.buttonTheme = [];
      this.render();
      return false;
    }

    /**
     * If buttons are passed and buttonTheme has items
     */
    if (
      buttons &&
      Array.isArray(this.options.buttonTheme) &&
      this.options.buttonTheme.length
    ) {
      const buttonArray = buttons.split(" ");
      buttonArray.forEach(button => {
        this.options.buttonTheme.map((buttonTheme, index) => {
          /**
           * If className is set, we affect the buttons only for that class
           * Otherwise, we afect all classes
           */
          if (
            (className && className.includes(buttonTheme.class)) ||
            !className
          ) {
            const filteredButtonArray = buttonTheme.buttons
              .split(" ")
              .filter(item => item !== button);

            /**
             * If buttons left, return them, otherwise, remove button Theme
             */
            if (filteredButtonArray.length) {
              buttonTheme.buttons = filteredButtonArray.join(" ");
            } else {
              this.options.buttonTheme.splice(index, 1);
              buttonTheme = null;
            }
          }

          return buttonTheme;
        });
      });

      this.render();
    }
  }

  /**
   * Get the DOM Element of a button. If there are several buttons with the same name, an array of the DOM Elements is returned.
   * @param  {string} button The button layout name to select
   */
  getButtonElement(button) {
    let output;

    const buttonArr = this.buttonElements[button];
    if (buttonArr) {
      if (buttonArr.length > 1) {
        output = buttonArr;
      } else {
        output = buttonArr[0];
      }
    }

    return output;
  }

  /**
   * This handles the "inputPattern" option
   * by checking if the provided inputPattern passes
   */
  inputPatternIsValid(inputVal) {
    const inputPatternRaw = this.options.inputPattern;
    let inputPattern;

    /**
     * Check if input pattern is global or targeted to individual inputs
     */
    if (inputPatternRaw instanceof RegExp) {
      inputPattern = inputPatternRaw;
    } else {
      inputPattern = inputPatternRaw[this.options.inputName];
    }

    if (inputPattern && inputVal) {
      const didInputMatch = inputPattern.test(inputVal);

      if (this.options.debug) {
        console.log(
          `inputPattern ("${inputPattern}"): ${
            didInputMatch ? "passed" : "did not pass!"
          }`
        );
      }

      return didInputMatch;
    } else {
      /**
       * inputPattern doesn't seem to be set for the current input, or input is empty. Pass.
       */
      return true;
    }
  }

  /**
   * Handles simple-keyboard event listeners
   */
  setEventListeners() {
    /**
     * Only first instance should set the event listeners
     */
    if (this.isFirstKeyboardInstance || !this.allKeyboardInstances) {
      if (this.options.debug) {
        console.log(`Caret handling started (${this.keyboardDOMClass})`);
      }

      /**
       * Event Listeners
       */
      document.addEventListener("keyup", this.handleKeyUp);
      document.addEventListener("keydown", this.handleKeyDown);
      document.addEventListener("mouseup", this.handleMouseUp);
      document.addEventListener("touchend", this.handleTouchEnd);
    }
  }

  /**
   * Event Handler: KeyUp
   */
  handleKeyUp(event) {
    this.caretEventHandler(event);

    if (this.options.physicalKeyboardHighlight) {
      this.physicalKeyboard.handleHighlightKeyUp(event);
    }
  }

  /**
   * Event Handler: KeyDown
   */
  handleKeyDown(event) {
    if (this.options.physicalKeyboardHighlight) {
      this.physicalKeyboard.handleHighlightKeyDown(event);
    }
  }

  /**
   * Event Handler: MouseUp
   */
  handleMouseUp(event) {
    this.caretEventHandler(event);
  }

  /**
   * Event Handler: TouchEnd
   */
  /* istanbul ignore next */
  handleTouchEnd(event) {
    this.caretEventHandler(event);
  }

  /**
   * Called by {@link setEventListeners} when an event that warrants a cursor position update is triggered
   */
  caretEventHandler(event) {
    let targetTagName;
    if (event.target.tagName) {
      targetTagName = event.target.tagName.toLowerCase();
    }

    this.dispatch(instance => {
      const isKeyboard =
        event.target === instance.keyboardDOM ||
        (event.target && instance.keyboardDOM.contains(event.target));

      if (instance.isMouseHold) {
        instance.isMouseHold = false;
      }

      if (
        (targetTagName === "textarea" || targetTagName === "input") &&
        !instance.options.disableCaretPositioning
      ) {
        /**
         * Tracks current cursor position
         * As keys are pressed, text will be added/removed at that position within the input.
         */
        instance.setCaretPosition(
          event.target.selectionStart,
          event.target.selectionEnd
        );

        if (instance.options.debug) {
          console.log(
            "Caret at: ",
            instance.getCaretPosition(),
            instance.getCaretPositionEnd(),
            event && event.target.tagName.toLowerCase(),
            `(${instance.keyboardDOMClass})`
          );
        }
      } else if (instance.options.disableCaretPositioning || !isKeyboard) {
        /**
         * If we toggled off disableCaretPositioning, we must ensure caretPosition doesn't persist once reactivated.
         */
        instance.setCaretPosition(null);
      }
    });
  }

  /**
   * Execute an operation on each button
   */
  recurseButtons(fn) {
    if (!fn) return false;

    Object.keys(this.buttonElements).forEach(buttonName =>
      this.buttonElements[buttonName].forEach(fn)
    );
  }

  /**
   * Destroy keyboard listeners and DOM elements
   */
  destroy() {
    if (this.options.debug)
      console.log(
        `Destroying simple-keyboard instance: ${this.currentInstanceName}`
      );

    /**
     * Remove document listeners
     */
    document.removeEventListener("keyup", this.handleKeyUp);
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("mouseup", this.handleMouseUp);
    document.removeEventListener("touchend", this.handleTouchEnd);
    document.onpointerup = null;
    document.ontouchend = null;
    document.ontouchcancel = null;
    document.onmouseup = null;

    /**
     * Remove buttons
     */
    let deleteButton = buttonElement => {
      buttonElement.onpointerdown = null;
      buttonElement.onpointerup = null;
      buttonElement.onpointercancel = null;
      buttonElement.ontouchstart = null;
      buttonElement.ontouchend = null;
      buttonElement.ontouchcancel = null;
      buttonElement.onclick = null;
      buttonElement.onmousedown = null;
      buttonElement.onmouseup = null;

      buttonElement.remove();
      buttonElement = null;
    };

    this.recurseButtons(deleteButton);

    this.recurseButtons = null;
    deleteButton = null;

    /**
     * Remove wrapper events
     */
    this.keyboardDOM.onpointerdown = null;
    this.keyboardDOM.ontouchstart = null;
    this.keyboardDOM.onmousedown = null;

    /**
     * Clearing keyboard wrapper
     */
    this.clear();

    /**
     * Remove instance
     */
    window["SimpleKeyboardInstances"][this.currentInstanceName] = null;
    delete window["SimpleKeyboardInstances"][this.currentInstanceName];

    /**
     * Reset initialized flag
     */
    this.initialized = false;
  }

  /**
   * Process buttonTheme option
   */
  getButtonThemeClasses(button) {
    const buttonTheme = this.options.buttonTheme;
    let buttonClasses = [];

    if (Array.isArray(buttonTheme)) {
      buttonTheme.forEach(themeObj => {
        if (
          themeObj.class &&
          typeof themeObj.class === "string" &&
          themeObj.buttons &&
          typeof themeObj.buttons === "string"
        ) {
          const themeObjClasses = themeObj.class.split(" ");
          const themeObjButtons = themeObj.buttons.split(" ");

          if (themeObjButtons.includes(button)) {
            buttonClasses = [...buttonClasses, ...themeObjClasses];
          }
        } else {
          console.warn(
            `Incorrect "buttonTheme". Please check the documentation.`,
            themeObj
          );
        }
      });
    }

    return buttonClasses;
  }

  /**
   * Process buttonAttributes option
   */
  setDOMButtonAttributes(button, callback) {
    const buttonAttributes = this.options.buttonAttributes;

    if (Array.isArray(buttonAttributes)) {
      buttonAttributes.forEach(attrObj => {
        if (
          attrObj.attribute &&
          typeof attrObj.attribute === "string" &&
          attrObj.value &&
          typeof attrObj.value === "string" &&
          attrObj.buttons &&
          typeof attrObj.buttons === "string"
        ) {
          const attrObjButtons = attrObj.buttons.split(" ");

          if (attrObjButtons.includes(button)) {
            callback(attrObj.attribute, attrObj.value);
          }
        } else {
          console.warn(
            `Incorrect "buttonAttributes". Please check the documentation.`,
            attrObj
          );
        }
      });
    }
  }

  getSelectedInput() {
    return this.selectedInput || ".input";
  }

  onTouchDeviceDetected() {
    /**
     * Processing autoTouchEvents
     */
    this.processAutoTouchEvents();

    /**
     * Disabling contextual window on touch devices
     */
    this.disableContextualWindow();
  }

  /**
   * Disabling contextual window for hg-button
   */
  /* istanbul ignore next */
  disableContextualWindow() {
    window.oncontextmenu = event => {
      if (event.target.classList.contains("hg-button")) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };
  }

  /**
   * Process autoTouchEvents option
   */
  processAutoTouchEvents() {
    if (this.options.autoUseTouchEvents) {
      this.options.useTouchEvents = true;

      if (this.options.debug) {
        console.log(
          `autoUseTouchEvents: Touch device detected, useTouchEvents enabled.`
        );
      }
    }
  }

  /**
   * Executes the callback function once simple-keyboard is rendered for the first time (on initialization).
   */
  onInit() {
    if (this.options.debug) {
      console.log(`${this.keyboardDOMClass} Initialized`);
    }
    /**
     * setEventListeners
     */
    this.setEventListeners();

    if (typeof this.options.onInit === "function") {
      this.options.onInit();
    }
  }

  /**
   * Executes the callback function before a simple-keyboard render.
   */
  beforeFirstRender() {
    /**
     * Performing actions when touch device detected
     */
    if (this.utilities.isTouchDevice()) {
      this.onTouchDeviceDetected();
    }

    if (typeof this.options.beforeFirstRender === "function")
      this.options.beforeFirstRender();

    /**
     * Notify about PointerEvents usage
     */
    if (
      this.isFirstKeyboardInstance &&
      this.utilities.pointerEventsSupported() &&
      !this.options.useTouchEvents &&
      !this.options.useMouseEvents
    ) {
      if (this.options.debug) {
        console.log("Using PointerEvents as it is supported by this browser");
      }
    }

    /**
     * Notify about touch events usage
     */
    if (this.options.useTouchEvents) {
      if (this.options.debug) {
        console.log(
          "useTouchEvents has been enabled. Only touch events will be used."
        );
      }
    }
  }

  /**
   * Executes the callback function before a simple-keyboard render.
   */
  beforeRender() {
    if (typeof this.options.beforeRender === "function")
      this.options.beforeRender();
  }

  /**
   * Executes the callback function every time simple-keyboard is rendered (e.g: when you change layouts).
   */
  onRender() {
    if (typeof this.options.onRender === "function") this.options.onRender();
  }

  /**
   * Executes the callback function once all modules have been loaded
   */
  onModulesLoaded() {
    if (typeof this.options.onModulesLoaded === "function")
      this.options.onModulesLoaded(this);
  }

  /**
   * Register module
   */
  registerModule = (name, initCallback) => {
    if (!this.modules[name]) this.modules[name] = {};

    initCallback(this.modules[name]);
  };

  /**
   * Load modules
   */
  loadModules() {
    if (Array.isArray(this.options.modules)) {
      this.options.modules.forEach(KeyboardModule => {
        const keyboardModule = new KeyboardModule();

        /* istanbul ignore next */
        if (
          keyboardModule.constructor.name &&
          keyboardModule.constructor.name !== "Function"
        ) {
          const classStr = `module-${this.utilities.camelCase(
            keyboardModule.constructor.name
          )}`;
          this.keyboardPluginClasses =
            this.keyboardPluginClasses + ` ${classStr}`;
        }

        keyboardModule.init(this);
      });

      this.keyboardPluginClasses =
        this.keyboardPluginClasses + " modules-loaded";

      this.render();
      this.onModulesLoaded();
    }
  }

  /**
   * Get module prop
   */
  getModuleProp(name, prop) {
    if (!this.modules[name]) return false;

    return this.modules[name][prop];
  }

  /**
   * getModulesList
   */
  getModulesList() {
    return Object.keys(this.modules);
  }

  /**
   * Parse Row DOM containers
   */
  parseRowDOMContainers(
    rowDOM,
    rowIndex,
    containerStartIndexes,
    containerEndIndexes
  ) {
    const rowDOMArray = Array.from(rowDOM.children);
    let removedElements = 0;

    if (rowDOMArray.length) {
      containerStartIndexes.forEach((startIndex, arrIndex) => {
        const endIndex = containerEndIndexes[arrIndex];

        /**
         * If there exists a respective end index
         * if end index comes after start index
         */
        if (!endIndex || !(endIndex > startIndex)) {
          return false;
        }

        /**
         * Updated startIndex, endIndex
         * This is since the removal of buttons to place a single button container
         * results in a modified array size
         */
        const updated_startIndex = startIndex - removedElements;
        const updated_endIndex = endIndex - removedElements;

        /**
         * Create button container
         */
        const containerDOM = document.createElement("div");
        containerDOM.className += "hg-button-container";
        const containerUID = `${this.options.layoutName}-r${rowIndex}c${arrIndex}`;
        containerDOM.setAttribute("data-skUID", containerUID);

        /**
         * Taking elements due to be inserted into container
         */
        const containedElements = rowDOMArray.splice(
          updated_startIndex,
          updated_endIndex - updated_startIndex + 1
        );
        removedElements = updated_endIndex - updated_startIndex;

        /**
         * Inserting elements to container
         */
        containedElements.forEach(element => containerDOM.appendChild(element));

        /**
         * Adding container at correct position within rowDOMArray
         */
        rowDOMArray.splice(updated_startIndex, 0, containerDOM);

        /**
         * Clearing old rowDOM children structure
         */
        rowDOM.innerHTML = "";

        /**
         * Appending rowDOM new children list
         */
        rowDOMArray.forEach(element => rowDOM.appendChild(element));

        if (this.options.debug) {
          console.log(
            "rowDOMContainer",
            containedElements,
            updated_startIndex,
            updated_endIndex,
            removedElements + 1
          );
        }
      });
    }

    return rowDOM;
  }

  /**
   * getKeyboardClassString
   */
  getKeyboardClassString = (...baseDOMClasses) => {
    const keyboardClasses = [this.keyboardDOMClass, ...baseDOMClasses].filter(
      DOMClass => !!DOMClass
    );

    return keyboardClasses.join(" ");
  };

  setPinyinPreview(pinyin) {
    this.previewPinyin.innerHTML = pinyin;
    if (pinyin.length === 0) {
      this.setSuggestions([]);
      this.hideSuggestions();
      // console.warn("will empty the pinyin preview");
      // } else {
      //   console.warn(`setPinyinPreview - `, pinyin);
    }
    this.setCurrentWord(pinyin);
  }

  isAlphabetical(char) {
    return char.match(/^[a-zA-Z]+$/);
  }

  convertInputToKeyboardKey(input) {
    if (input === " " || input === "") {
      return `{space}`;
    }
    if (input === "Backspace" || input === "Delete") {
      return `{bksp}`;
    }
    if (input === "Control") {
      return `{ctrl}`;
    }
    if (input === "Shift") {
      return `{shift}`;
    }
    if (input === "CapsLock") {
      return `{lock}`;
    }
    if (input === "Enter") {
      return `{enter}`;
    }
    if (input === "Alt") {
      return `{alt}`;
    }
    return input;
  }

  toggleLanguage() {
    const selectedInput = this.getSelectedInput();
    const selectedInputValue = document.querySelector(selectedInput).value;
    const forceLayout = this.getForceLayoutForInput(selectedInput);
    if (this.inputLanguage === "ENG") {
      this.setLayoutName("zhHT");
    } else if (this.inputLanguage === "CN") {
      selectedInputValue.length === 0 && forceLayout === "shift"
        ? this.setLayoutName("shift")
        : this.setLayoutName("default");
    }
    this.clearInput();
    this.setCurrentWord("");
    this.setPinyinPreview("");
  }

  getLangKeyDisplayName() {
    return this.options.layoutName.includes("zhHT")
      ? "繁體"
      : this.inputLanguage;
  }

  getNumbersKeyDisplayName() {
    let numbersKeyDisplayName = `&123`;
    if (this.options.layoutName.includes("numbers")) {
      if (this.options.layoutName.includes(`zhHT`)) {
        numbersKeyDisplayName = `拼音`;
      } else {
        numbersKeyDisplayName = `ABC`;
      }
    }
    return numbersKeyDisplayName;
  }

  getSpaceKeyDisplayName() {
    return this.options.layoutName.includes("zhHT")
      ? "空格"
      : "Space / barra de espaço";
  }

  // NOTE: Forces the update of space key's text since it doesn't work properly with the setOptions sometimes
  forceUpdateSpaceKey() {
    document.querySelector(
      ".hg-button.hg-functionBtn.hg-button-space"
    ).innerHTML = this.getSpaceKeyDisplayName();
  }

  updateLangKeyIcon() {
    const langKey = document.querySelector(
      ".hg-button.hg-functionBtn.hg-button-lang"
    );
    if (this.options.layoutName.includes("zhHT")) {
      if (!_.includes(langKey.classList, "zhHT")) {
        langKey.classList.add("zhHT");
      }
    } else {
      langKey.classList.remove("zhHT");
    }
  }

  setKeysDisplayNames(layoutName = false) {
    const display = _.merge(this.options.display, {
      "{lang}": this.getLangKeyDisplayName(),
      "{numbers}": this.getNumbersKeyDisplayName(),
      "{space}": this.getSpaceKeyDisplayName()
    });
    if (layoutName) {
      this.setOptions({ layoutName, display });
    } else {
      this.setOptions({ display });
    }
    this.updateLangKeyIcon();
    this.forceUpdateSpaceKey();
    this.disableKeysBasedOnFieldType();
  }

  handleLangKey() {
    this.toggleLanguage();
  }

  setLayoutName(layoutName) {
    console.log(`Will change layout to: ${layoutName}`);
    if (layoutName === "default") {
      this.inputLanguage = "ENG";
    } else if (layoutName === "ptPT") {
      this.inputLanguage = "POR";
    } else if (layoutName === "zhHT") {
      this.inputLanguage = "CN";
    }
    this.setKeysDisplayNames(layoutName);
  }

  resetToNonShiftedLayout() {
    const currentLayout = this.options.layoutName;
    if (currentLayout === "default") {
      return;
    }
    if (currentLayout === "shift") {
      return this.setLayoutName("default");
    }
    if (currentLayout.includes("shift")) {
      return this.setLayoutName(
        currentLayout.substring(0, currentLayout.length - 5)
      );
    }
  }

  handleShift() {
    const currentLayout = this.options.layoutName;
    if (currentLayout !== "default" && currentLayout !== "shift") {
      // NOTE: if already on the shifted layout, switch the normal layout for that language
      if (currentLayout.includes("shift")) {
        return this.setLayoutName(
          currentLayout.substring(0, currentLayout.length - 5)
        );
      }
      if (currentLayout.includes("numbers")) {
        return this.setLayoutName(
          `${currentLayout.substring(0, currentLayout.length - 7)}shift`
        );
      }
      // NOTE: else we switch to the shifted layout
      return this.setLayoutName(`${currentLayout}shift`);
    }
    // NOTE: handles EN by default
    this.setLayoutName(currentLayout === "default" ? "shift" : "default");
  }

  getCurrentInputMethod() {
    // NOTE: If we are in EN or PT or in CN but with the caps lock active
    return this.inputLanguage === "ENG" ||
      this.inputLanguage === "POR" ||
      (this.inputLanguage === "CN" && this.options.layoutName === "shift")
      ? "ENG"
      : "CN";
  }

  setCurrentWord(word) {
    this.currentWord = _.join(
      _.filter(word, char => this.isAlphabetical(char)),
      ""
    );
    // console.log(`current word is now: ${this.currentWord}`);
  }

  toggleExpandSuggestionsBtn(display) {
    // NOTE: expandSuggestionsBtn not displayed anymore since we have another one on top
    if (display) {
      // this.expandSuggestionsBtn.classList.add(`displayed`);
      this.expandSuggestionsBtn2.classList.add(`displayed`);
      this.suggestionAreaDOM.classList.add(`has-more`);
    } else {
      // this.expandSuggestionsBtn.classList.remove(`displayed`);
      this.expandSuggestionsBtn2.classList.remove(`displayed`);
      this.suggestionAreaDOM.classList.remove(`has-more`);
    }
  }

  toggleMoreSuggestionsArea() {
    if (_.includes(this.suggestionAreaDOM.classList, `expanded`)) {
      this.keyboardWrapper.classList.remove(`expanded`);
      this.suggestionAreaDOM.classList.remove(`expanded`);
      this.scrollBooster.destroy();
      return;
    }
    if (this.suggestions.length > this.numberOfSuggestionsPerLine) {
      this.suggestionAreaDOM.classList.add(`expanded`);
      this.keyboardWrapper.classList.add(`expanded`);
      this.scrollBooster = new ScrollBooster({
        viewport: document.querySelector(".suggestion-area"),
        content: document.querySelector(".suggestion-area ul"),
        scrollMode: "native",
        direction: "vertical",
        onPointerUp: state => {
          return (this.canSelectSuggestedWord = !state.isMoving);
        },
        onPointerMove: state => {
          this.canSelectSuggestedWord = !state.isDragging;
        }
      });
    }
  }

  updateNumberOfSuggestionPages() {
    this.numberOfSuggestionsPages = this.suggestions
      ? Math.floor(this.suggestions.length / this.numberOfSuggestionsPerLine) -
        2
      : 1;
  }

  setCNSuggestionsListeners() {
    CNSuggestions.events.on(`displaySuggestionBox`, suggestions => {
      if (!suggestions) {
        this.setSuggestions([]);
        return this.hideSuggestions();
      }
      this.setSuggestions(suggestions);
      this.showSuggestions();
    });
    CNSuggestions.events.on(`setSuggestions`, suggestions => {
      this.setSuggestions(suggestions);
    });
  }

  keydownListener(event) {
    // NOTE: If we are in CN or if a special key has been typed
    if (
      (this.getCurrentInputMethod() === "CN" || event.key.length > 1) &&
      event.preventDefault
    ) {
      event.preventDefault();
      this.handleButtonClicked(
        this.convertInputToKeyboardKey(event.key || `{bksp}`)
      );
      return false;
    }
  }

  initKeydownListener() {
    document.addEventListener("keydown", this.keydownListener);
  }

  handleSpaceKey(button = false) {
    const buttonIsANumberKey = _.isNumber(_.toNumber(button));
    if (button === `{enter}`) {
      this.enterSuggestedWord(this.previewPinyin.innerHTML);
    } else if (
      this.suggestionAreaDOM.firstElementChild &&
      this.suggestionAreaDOM.firstElementChild.firstElementChild &&
      !buttonIsANumberKey
    ) {
      this.enterSuggestedWord(
        this.suggestionAreaDOM.firstElementChild.firstElementChild.innerHTML
      );
      if (button === `{space}`) {
        return;
      }
    }
    if (button && button !== `{space}` && button !== `{enter}`) {
      this.previewPinyin.innerHTML = `${this.previewPinyin.innerHTML}${button}`;
    }
    if (this.previewPinyin.innerHTML.length > 0) {
      if (button === `{space}`) {
        if (
          this.suggestionAreaDOM.firstElementChild.firstElementChild.innerHTML
            .length > 0
        ) {
          this.enterSuggestedWord(
            this.suggestionAreaDOM.firstElementChild.firstElementChild.innerHTML
          );
        } else {
          this.enterSuggestedWord(`${this.previewPinyin.innerHTML} `);
        }
      } else {
        this.enterSuggestedWord(
          this.previewPinyin.innerHTML,
          buttonIsANumberKey ? button : false
        );
      }
    } else if (button !== `{enter}`) {
      console.log("will add a space");
      this.enterSuggestedWord(" ");
    }
    return this.setPinyinPreview("");
  }

  findSuggestions(button) {
    return CNSuggestions.charProcessor(button, _.trim(this.currentWord));
  }

  inputEventListener(event) {
    console.warn("received input event -", event);
    event.target.readOnly = this.getCurrentInputMethod() === "CN";
    if (event.target.readOnly) {
      this.handleButtonClicked(event.data || `{bksp}`);
      if (event.preventDefault) {
        event.preventDefault();
      }
      return false;
    }

    this.setInput(event.target.value, event.target.id);
  }

  disableKeysBasedOnFieldType() {
    if (!this.selectedInput) {
      return;
    }
    this.selectedInputType = this.getFieldTypeForInput(this.selectedInput);
    // console.warn(`disableKeysBasedOnFieldType - ${this.selectedInputType}`);
    const fieldTypeEnabledBtns = _.get(
      this.fieldTypes,
      this.selectedInputType,
      []
    );
    // console.warn(
    //   `only those buttons should be enabled: `,
    //   fieldTypeEnabledBtns
    // );
    const btnElems = document.querySelectorAll(`.hg-button`);
    _.forEach(btnElems, btnElem => {
      btnElem.classList.remove("disabled");
    });
    _.forEach(btnElems, btnElem => {
      const btnKey = btnElem.getAttribute("data-skbtn");
      if (!_.includes(fieldTypeEnabledBtns, btnKey)) {
        btnElem.classList.add("disabled");
      }
    });
  }

  onInputFocus(event) {
    this.selectedInput = `#${event.target.id}`;
    this.setOptions(
      _.merge(this.options, {
        inputName: event.target.id
      })
    );
    this.resetToNonShiftedLayout();
    const selectedInputValue = document.querySelector(this.selectedInput).value;
    const forceLayout = this.getForceLayoutForInput(this.selectedInput);
    if (forceLayout && selectedInputValue.length === 0) {
      console.info(
        `Field ${this.selectedInput} has a force-layout option '${forceLayout}', will change the layout accordingly`
      );
      this.setLayoutName(forceLayout);
    }
    this.disableKeysBasedOnFieldType();
  }

  handleNumbersKey() {
    // console.warn(`this.options.layoutName = ${this.options.layoutName}`);
    let newLayout = "numbers";
    if (_.includes(["default", "shift"], this.options.layoutName)) {
      return this.setLayoutName(newLayout);
    }
    if (this.options.layoutName === "numbers") {
      newLayout = "default";
    } else if (this.options.layoutName.includes("numbers")) {
      newLayout = this.options.layoutName.substring(
        0,
        this.options.layoutName.length - 7
      );
    } else if (this.options.layoutName.includes("shift")) {
      newLayout = `${this.options.layoutName.substring(
        0,
        this.options.layoutName.length - 5
      )}numbers`;
    } else {
      newLayout = `${this.options.layoutName}numbers`;
    }
    this.setLayoutName(newLayout);
  }

  onKeyPress(button) {
    console.log("Button pressed", button);
    if (button === "{lang}") {
      return this.handleLangKey();
    }
    if (button === "{numbers}") {
      return this.handleNumbersKey();
    }
    if (button === "{shift}" || button === "{lock}") {
      return this.handleShift();
    }
    if (
      this.getCurrentInputMethod() === "CN" &&
      this.options.layoutName === "zhHT"
    ) {
      return this.handleCNKeyPress(button);
    }
    if (button === `{space}`) {
      return this.enterSuggestedWord(" ");
    }
    if (button === `{bksp}`) {
      return this.handleBackspace();
    }
    this.enterSuggestedWord(button);
  }

  getRegexForFielType(fieldType) {
    if (fieldType === "alpha") {
      return /[a-z]|[A-Z]|[\u4E00-\u9FCC\u3400-\u4DB5\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\ud840-\ud868][\udc00-\udfff]|\ud869[\udc00-\uded6\udf00-\udfff]|[\ud86a-\ud86c][\udc00-\udfff]|\ud86d[\udc00-\udf34\udf40-\udfff]|\ud86e[\udc00-\udc1d]/;
    } else if (fieldType === "alphanumeric") {
      return /[a-z]|[A-Z]|[0-9]|[\u4E00-\u9FCC\u3400-\u4DB5\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\ud840-\ud868][\udc00-\udfff]|\ud869[\udc00-\uded6\udf00-\udfff]|[\ud86a-\ud86c][\udc00-\udfff]|\ud86d[\udc00-\udf34\udf40-\udfff]|\ud86e[\udc00-\udc1d]/gi;
    } else if (fieldType === "numeric") {
      return /[0-9]/gi;
    }
    return "";
  }

  getFieldAttribute(input, attribute) {
    const inputElem = document.querySelector(input);
    const fieldAttribute = inputElem.getAttribute(attribute);
    return _.isNull(fieldAttribute) ? false : fieldAttribute;
  }

  getFieldTypeForInput(input) {
    return this.getFieldAttribute(input, "field-type");
  }

  getForceLayoutForInput(input) {
    return this.getFieldAttribute(input, "force-layout");
  }

  sanitizeInput(input, newInputVal) {
    const fieldType = this.getFieldTypeForInput(input);
    this.disableKeysBasedOnFieldType();
    if (!fieldType) {
      return newInputVal;
    }
    const regex = this.getRegexForFielType(fieldType);
    let newVal = [];
    _.forEach(newInputVal, char => {
      if (char.match(regex)) {
        newVal.push(char);
      }
    });
    newVal = _.join(newVal, "");
    return newVal;
  }

  onSuggestedWordClicked(suggestedWord) {
    // console.warn("onSuggestedWordClicked - ", suggestedWord);
    const selectedInput = this.getSelectedInput();
    const inputVal = document.querySelector(selectedInput).value;
    document.querySelector(selectedInput).value = this.sanitizeInput(
      selectedInput,
      `${inputVal}${suggestedWord}`
    );
  }

  onChange(input) {
    const inputElem = document.querySelector(this.getSelectedInput());
    const currentInputMethod = this.getCurrentInputMethod();
    const sanitizedInput = this.sanitizeInput(inputElem, input);
    if (currentInputMethod === "ENG") {
      // console.log("Input changed - before", inputElem.value);
      inputElem.value = sanitizedInput;
      // console.log("Input changed - after", inputElem.value);
    } else if (
      sanitizedInput.length > 1 &&
      this.isAlphabetical(_.last(sanitizedInput))
    ) {
      this.setCurrentWord(sanitizedInput);
      this.setPinyinPreview(this.currentWord);
    }
  }

  handleBackspace() {
    const selectedInput = this.getSelectedInput();
    const selectedInputEle = document.querySelector(selectedInput);
    selectedInputEle.value = selectedInputEle.value.slice(0, -1);
    const forceLayout = this.getForceLayoutForInput(selectedInput);
    if (selectedInputEle.value.length === 0 && forceLayout === "shift") {
      this.setLayoutName("shift");
    }
    this.triggerOnChangeEvent();
    return;
  }

  handleCNKeyPress(button) {
    if (button === `{ctrl}` || button === `{alt}`) {
      return console.log(`Key ignored`);
    }
    if (
      button !== `{bksp}` &&
      (button === "{space}" ||
        button === "{enter}" ||
        !this.isAlphabetical(button))
    ) {
      return this.handleSpaceKey(button);
    }
    // console.log("current word: ---", this.currentWord);
    const foundSuggestions = this.findSuggestions(button);
    if (button === `{bksp}` && this.previewPinyin.innerHTML.length === 0) {
      this.handleBackspace();
      return;
    }
    this.setPinyinPreview(_.trim(_.first(foundSuggestions)));
  }

  setSuggestions(suggestions) {
    const suggestionsList = this.suggestionAreaDOM.firstElementChild;
    suggestionsList.innerHTML = "";
    this.suggestions = suggestions;
    this.currentSuggestionPage = 1;
    this.updateSuggestionPagesMenu();
    if (
      !suggestions ||
      (suggestions && suggestions.length <= this.numberOfSuggestionsPerLine)
    ) {
      this.toggleExpandSuggestionsBtn(false);
    } else if (suggestions) {
      this.toggleExpandSuggestionsBtn(
        suggestionsList.length > this.numberOfSuggestionsPerLine
      );
    }
    _.forEach(suggestions, (suggestion, key) => {
      const suggestionElem = document.createElement("li");
      suggestionElem.innerHTML = suggestion;
      suggestionElem.onclick = () => {
        // console.warn("word clicked !", suggestion);
        this.enterSuggestedWord(suggestion);
      };
      suggestionsList.appendChild(suggestionElem);
      if (key === this.numberOfSuggestionsPerLine) {
        this.toggleExpandSuggestionsBtn(true);
      }
    });
    if (suggestions) {
      this.nbSuggestionsPages =
        suggestions.length / this.numberOfSuggestionsPerLine;
      let missingElementsOnLastLine =
        this.numberOfSuggestionsPerLine -
        (suggestions.length % this.numberOfSuggestionsPerLine);
      while (missingElementsOnLastLine > 0) {
        suggestionsList.appendChild(document.createElement("li"));
        missingElementsOnLastLine -= 1;
      }
    }
  }

  showSuggestions() {
    this.suggestionAreaDOM.classList.add("displayed");
  }

  hideSuggestions() {
    this.suggestionAreaDOM.classList.remove("displayed");
  }

  triggerOnChangeEvent() {
    document
      .querySelector(this.getSelectedInput())
      .dispatchEvent(new Event("change", { bubbles: true }));
  }

  enterSuggestedWord(suggestion, nthWord = false) {
    // NOTE: can't select a suggestion when scrolling through the suggestions area
    if (!this.canSelectSuggestedWord) {
      return;
    }
    if (nthWord) {
      suggestion = _.get(this.suggestions, `[${nthWord - 1}]`, nthWord);
    }
    if (typeof this.options.onSuggestedWordClicked === "function") {
      this.options.onSuggestedWordClicked(suggestion);
    } else {
      this.onSuggestedWordClicked(suggestion);
    }
    this.setSuggestions();
    this.clearInput();
    this.setPinyinPreview("");
    if (_.includes(this.suggestionAreaDOM.classList, `expanded`)) {
      this.keyboardWrapper.classList.remove(`expanded`);
      this.suggestionAreaDOM.classList.remove(`expanded`);
    }
    if (this.options.layoutName.search("shift") !== -1) {
      // console.info(
      //   `Current language is: ${this.inputLanguage}, will reset to non-shift layout`
      // );
      this.handleShift();
    }
    this.triggerOnChangeEvent();
  }

  scrollToSuggestionPage(page) {
    const suggestionsList = this.suggestionAreaDOM.firstElementChild;
    suggestionsList.scroll(0, (page - 1) * 36);
  }

  changeSuggestionsPage(changePage) {
    const potentialNextPage = this.currentSuggestionPage + changePage;
    if (
      potentialNextPage >= 1 &&
      potentialNextPage <= this.numberOfSuggestionsPages
    ) {
      this.currentSuggestionPage = potentialNextPage;
    }
    this.updateSuggestionPagesMenu();
    this.scrollToSuggestionPage(this.currentSuggestionPage);
  }

  updateSuggestionPagesMenu() {
    this.updateNumberOfSuggestionPages();
    this.suggestionsPagination.innerHTML = `${this.currentSuggestionPage} / ${this.numberOfSuggestionsPages}`;
    if (this.currentSuggestionPage - 1 <= 0) {
      this.previousSuggestionPageBtn.classList.add("disabled");
    } else {
      this.previousSuggestionPageBtn.classList.remove("disabled");
    }
    if (this.currentSuggestionPage + 1 > this.numberOfSuggestionsPages) {
      this.nextSuggestionPageBtn.classList.add("disabled");
    } else {
      this.nextSuggestionPageBtn.classList.remove("disabled");
    }
  }

  /**
   * Renders rows and buttons as per options
   */
  render() {
    /**
     * Clear keyboard
     */
    this.clear();

    /**
     * Calling beforeFirstRender
     */
    if (!this.initialized) {
      this.beforeFirstRender();
    }

    /**
     * Calling beforeRender
     */
    this.beforeRender();

    const layoutClass = `hg-layout-${this.options.layoutName}`;
    const layout = this.options.layout || getDefaultLayout();
    const useTouchEvents = this.options.useTouchEvents || false;
    const useTouchEventsClass = useTouchEvents ? "hg-touch-events" : "";
    const useMouseEvents = this.options.useMouseEvents || false;
    const disableRowButtonContainers = this.options.disableRowButtonContainers;

    /**
     * Adding themeClass, layoutClass to keyboardDOM
     */
    this.keyboardDOM.className = this.getKeyboardClassString(
      this.options.theme,
      layoutClass,
      this.keyboardPluginClasses,
      useTouchEventsClass
    );
    this.previewPinyin = document.createElement("div");
    this.previewPinyin.className = "preview-pinyin";
    this.keyboardDOM.appendChild(this.previewPinyin);
    this.keyboardWrapper = document.createElement("div");
    this.keyboardWrapper.className = "keyboard-wrapper";
    this.keyboardDOM.appendChild(this.keyboardWrapper);
    this.suggestionAreaDOM = document.createElement("div");
    this.suggestionAreaDOM.appendChild(document.createElement("ul"));
    this.suggestionAreaDOM.className = "suggestion-area";
    this.keyboardWrapper.appendChild(this.suggestionAreaDOM);
    this.suggestionsMenu = document.createElement("div");
    this.suggestionsMenu.className = "suggestions-menu";
    this.expandSuggestionsBtn = document.createElement("div");
    this.previousSuggestionPageBtn = document.createElement("div");
    this.previousSuggestionPageBtn.innerHTML = "prev";
    this.previousSuggestionPageBtn.className = "prev";
    this.previousSuggestionPageBtn.onclick = () => {
      this.changeSuggestionsPage(-1);
    };
    this.nextSuggestionPageBtn = document.createElement("div");
    this.nextSuggestionPageBtn.innerHTML = "next";
    this.nextSuggestionPageBtn.className = "next";
    this.nextSuggestionPageBtn.onclick = () => {
      this.changeSuggestionsPage(1);
    };
    this.suggestionsPagination = document.createElement("div");
    this.suggestionsPagination.className = "pagination";
    this.suggestionsPagination.innerHTML = "1 / 1";

    this.expandSuggestionsBtn.classList.add(`expand-btn`);
    this.expandSuggestionsBtn.innerHTML = "MORE";
    this.expandSuggestionsBtn.display = "none";
    this.expandSuggestionsBtn.onclick = () => {
      this.toggleMoreSuggestionsArea();
    };
    // this.expandSuggestionsBtnWrapper = document.createElement("div");
    // this.expandSuggestionsBtnWrapper.className = "expand-btn-wrapper";
    this.expandSuggestionsBtn2 = document.createElement("div");
    this.expandSuggestionsBtn2.className = `expand-btn top-right`;
    this.expandSuggestionsBtn2.innerHTML = "MORE";
    this.expandSuggestionsBtn2.display = "none";
    this.expandSuggestionsBtn2.onclick = () => {
      this.toggleMoreSuggestionsArea();
    };
    // this.expandSuggestionsBtnWrapper.appendChild(this.expandSuggestionsBtn2);
    this.keyboardWrapper.appendChild(this.expandSuggestionsBtn2);
    this.suggestionsMenu.appendChild(this.expandSuggestionsBtn);
    this.suggestionsMenu.appendChild(this.previousSuggestionPageBtn);
    this.suggestionsMenu.appendChild(this.nextSuggestionPageBtn);
    this.suggestionsMenu.appendChild(this.suggestionsPagination);
    this.suggestionAreaDOM.appendChild(this.suggestionsMenu);

    /**
     * Iterating through each row
     */
    layout[this.options.layoutName].forEach((row, rIndex) => {
      const rowArray = row.split(" ");

      /**
       * Creating empty row
       */
      let rowDOM = document.createElement("div");
      rowDOM.className += "hg-row";

      /**
       * Tracking container indicators in rows
       */
      const containerStartIndexes = [];
      const containerEndIndexes = [];

      /**
       * Iterating through each button in row
       */
      rowArray.forEach((button, bIndex) => {
        /**
         * Check if button has a container indicator
         */
        const buttonHasContainerStart =
          !disableRowButtonContainers &&
          typeof button === "string" &&
          button.length > 1 &&
          button.indexOf("[") === 0;

        const buttonHasContainerEnd =
          !disableRowButtonContainers &&
          typeof button === "string" &&
          button.length > 1 &&
          button.indexOf("]") === button.length - 1;

        /**
         * Save container start index, if applicable
         */
        if (buttonHasContainerStart) {
          containerStartIndexes.push(bIndex);

          /**
           * Removing indicator
           */
          button = button.replace(/\[/g, "");
        }

        if (buttonHasContainerEnd) {
          containerEndIndexes.push(bIndex);

          /**
           * Removing indicator
           */
          button = button.replace(/\]/g, "");
        }

        /**
         * Processing button options
         */
        const fctBtnClass = this.utilities.getButtonClass(button);
        const buttonDisplayName = this.utilities.getButtonDisplayName(
          button,
          this.options.display,
          this.options.mergeDisplay
        );

        /**
         * Creating button
         */
        const buttonType = this.options.useButtonTag ? "button" : "div";
        const buttonDOM = document.createElement(buttonType);
        buttonDOM.className += `hg-button ${fctBtnClass}`;

        /**
         * Adding buttonTheme
         */
        buttonDOM.classList.add(...this.getButtonThemeClasses(button));

        /**
         * Adding buttonAttributes
         */
        this.setDOMButtonAttributes(button, (attribute, value) => {
          buttonDOM.setAttribute(attribute, value);
        });

        this.activeButtonClass = "hg-activeButton";

        /**
         * Handle button click event
         */
        /* istanbul ignore next */
        if (
          this.utilities.pointerEventsSupported() &&
          !useTouchEvents &&
          !useMouseEvents
        ) {
          /**
           * Handle PointerEvents
           */
          buttonDOM.onpointerdown = e => {
            // console.warn("down", e);
            if (!_.includes(_.get(e, "target.classList", []), "accent-key")) {
              this.removeAccentsOverlay();
              // this.handleButtonClicked(button);
              this.handleButtonMouseDown(button, e);
            }
          };
          buttonDOM.onpointerup = e => {
            // console.warn("up", button, e);
            if (!this.currentAccentOverlay) {
              this.handleButtonClicked(button);
            }
            // this.handleButtonMouseDown(button, e);
            this.handleButtonMouseUp(button, e);
          };
          buttonDOM.onpointercancel = e => {
            this.handleButtonMouseUp(button, e);
          };
        } else {
          /**
           * Fallback for browsers not supporting PointerEvents
           */
          if (useTouchEvents) {
            /**
             * Handle touch events
             */
            buttonDOM.ontouchstart = e => {
              this.handleButtonClicked(button);
              this.handleButtonMouseDown(button, e);
            };
            buttonDOM.ontouchend = e => {
              this.handleButtonMouseUp(button, e);
            };
            buttonDOM.ontouchcancel = e => {
              this.handleButtonMouseUp(button, e);
            };
          } else {
            /**
             * Handle mouse events
             */
            buttonDOM.onclick = () => {
              this.isMouseHold = false;
              this.handleButtonClicked(button);
            };
            buttonDOM.onmousedown = e => {
              this.handleButtonMouseDown(button, e);
            };
            buttonDOM.onmouseup = e => {
              this.handleButtonMouseUp(button, e);
            };
          }
        }

        /**
         * Adding identifier
         */
        buttonDOM.setAttribute("data-skBtn", button);

        /**
         * Adding unique id
         * Since there's no limit on spawning same buttons, the unique id ensures you can style every button
         */
        const buttonUID = `${this.options.layoutName}-r${rIndex}b${bIndex}`;
        buttonDOM.setAttribute("data-skBtnUID", buttonUID);

        /**
         * Adding button label to button
         */
        const buttonSpanDOM = document.createElement("span");
        buttonSpanDOM.innerHTML = buttonDisplayName;
        buttonDOM.appendChild(buttonSpanDOM);

        /**
         * Adding to buttonElements
         */
        if (!this.buttonElements[button]) this.buttonElements[button] = [];

        this.buttonElements[button].push(buttonDOM);

        /**
         * Appending button to row
         */
        rowDOM.appendChild(buttonDOM);
      });

      /**
       * Parse containers in row
       */
      rowDOM = this.parseRowDOMContainers(
        rowDOM,
        rIndex,
        containerStartIndexes,
        containerEndIndexes
      );

      /**
       * Appending row to keyboard
       */
      this.keyboardWrapper.appendChild(rowDOM);
    });

    /**
     * Calling onRender
     */
    this.onRender();

    if (!this.initialized) {
      /**
       * Ensures that onInit and beforeFirstRender are only called once per instantiation
       */
      this.initialized = true;

      /**
       * Handling parent events
       */
      /* istanbul ignore next */
      if (
        this.utilities.pointerEventsSupported() &&
        !useTouchEvents &&
        !useMouseEvents
      ) {
        document.onpointerup = () => this.handleButtonMouseUp();
        this.keyboardDOM.onpointerdown = e =>
          this.handleKeyboardContainerMouseDown(e);
      } else if (useTouchEvents) {
        /**
         * Handling ontouchend, ontouchcancel
         */
        document.ontouchend = () => this.handleButtonMouseUp();
        document.ontouchcancel = () => this.handleButtonMouseUp();

        this.keyboardDOM.ontouchstart = e =>
          this.handleKeyboardContainerMouseDown(e);
      } else if (!useTouchEvents) {
        /**
         * Handling mouseup
         */
        document.onmouseup = () => this.handleButtonMouseUp();
        this.keyboardDOM.onmousedown = e =>
          this.handleKeyboardContainerMouseDown(e);
      }

      /**
       * Calling onInit
       */
      this.onInit();
    }
  }
}

export default SimpleKeyboard;
