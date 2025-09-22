# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2025-09-19

### Security
- **FIXED**: Resolved esbuild security vulnerability (GHSA-67mh-4wv8-2f99)
- **FIXED**: Updated all dependencies to latest versions to address security issues

### Updated Dependencies
- **vite**: `^5.4.20` → `^7.1.6` (Major update)
- **@vitejs/plugin-vue**: `^5.2.4` → `^6.0.1` (Major update)
- **@types/node**: `^20.19.17` → `^24.5.2` (Major update)
- **vue**: `^3.5.21` (already latest)
- **typescript**: `^5.9.2` (already latest)
- **simple-keyboard**: `^3.8.83` (already latest)

### Breaking Changes
- **Node.js**: Now requires Node.js 20.19+ (due to Vite 7 upgrade)
- **Browser Target**: Updated to newer baseline browsers (Chrome 107+, Edge 107+, Firefox 104+, Safari 16.0+)
- **CSS Filename**: Built CSS file now named `vue-simple-keyboard-component.css` instead of `style.css`

### Updated
- Updated CDN links in examples to reflect new CSS filename
- Updated documentation with new CSS filename
- Verified all examples work with Vite 7
- All builds tested and working correctly

### Notes
- No breaking changes to the Vue component API
- All existing component props and events remain the same
- Build output sizes remain similar (ES: 9.24 kB, UMD: 6.33 kB)
- Development server performance improved with Vite 7

## [1.0.0] - 2025-09-19

### Added
- Initial release of Vue Simple Keyboard Component
- Full Vue 3 wrapper for simple-keyboard library
- Support for all simple-keyboard options as Vue props
- Reactive v-model binding
- Complete event handling
- ES modules and UMD builds
- TypeScript support (optional)
- Comprehensive documentation and examples
