# Custom Theming Guide for SimpleKeyboard

This guide explains how to create a custom CSS/SCSS theme for the SimpleKeyboard component. You’ll learn which classes to target, how to override default styles, and best practices for building a unique look for your keyboard.

## 1. Keyboard Structure & Key Classes

The keyboard is rendered with the following main structure and classes:

- `.keyboard-wrapper`: Outer container for the keyboard.
- `.hg-theme-default`: Default theme wrapper. All keyboard content is inside this.
- `.hg-row`: Each row of keyboard buttons.
- `.hg-button`: Base class for all buttons. Modifier classes include:
  - `.hg-activeButton`, `.hg-standardBtn`, `.hg-selectedButton`, `.hg-functionBtn`, `.hg-button-bksp`, `.hg-button-enter`, `.hg-button-shift`, `.hg-button-numpadadd`, `.hg-button-numpadenter`, `.hg-button-numpad0`, `.hg-button-com`, `.hg-button-big_space`, `.hg-button-arrowleft`, `.hg-button-arrowright`, `.disabled`
- `.hg-button-suggestion_area`: Area for candidate suggestions (IME support).
  - `.hg-suggestion_area-menu`: Container for suggestion buttons.
  - `.hg-suggestion-button`: Individual suggestion button.
  - `.expand-btn`: Button to expand/collapse the suggestion area.

## 2. Overriding the Default Theme

To create your own theme, you can override the default classes in your own CSS or SCSS file. For example, to change the background color and button style:

```scss
.keyboard-wrapper {
  .hg-theme-default {
    background-color: #222; // dark background
    .hg-button {
      background: #444;
      color: #fff;
      border-radius: 8px;
      &:hover {
        background: #666;
      }
      &.hg-selectedButton {
        background: #1976d2;
        color: #fff;
      }
      &.hg-functionBtn {
        background: #333;
        color: #ffeb3b;
      }
    }
    .hg-row {
      margin-bottom: 8px;
    }
    .hg-button-suggestion_area {
      background: #333;
      border-color: #1976d2;
      .hg-suggestion-button {
        background: #1976d2;
        color: #fff;
      }
      .expand-btn {
        background-color: #1976d2;
      }
    }
  }
}
```

## 3. Using a Custom Theme Class

You can pass a custom theme class via the `theme` prop:

```vue
<SimpleKeyboard theme="my-custom-theme" />
```

Then, define your styles:

```scss
.keyboard-wrapper {
  .my-custom-theme {
    // ...your custom styles here...
  }
}
```

## 4. Overriding SVG Icons

Some buttons use background images for icons (e.g., Enter, Delete, Shift). You can override these by targeting the relevant classes:

```scss
.hg-button.hg-functionBtn.hg-button-enter {
  background-image: url('/your-icons/enter.svg');
}
.hg-button.hg-functionBtn.hg-button-bksp {
  background-image: url('/your-icons/delete.svg');
}
.hg-button.hg-functionBtn.hg-button-shift {
  background-image: url('/your-icons/shift.svg');
}
```

## 5. Responsive Design

The keyboard uses flexbox for rows and buttons. You can adjust sizing and spacing for mobile or desktop layouts by overriding the relevant classes.

## 6. Best Practices

- Use SCSS nesting to keep your styles organized.
- Always scope your theme under `.keyboard-wrapper` to avoid affecting other elements.
- Test your theme with different layouts and languages.
- Override only the classes you need for your design.

## 7. Troubleshooting

- If your styles aren’t applying, check that your theme class matches the `theme` prop.
- Use browser dev tools to inspect the keyboard and see which classes are applied.
- If you use custom icons, ensure the paths are correct and accessible.
