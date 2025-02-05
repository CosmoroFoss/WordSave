# ![Logo](/assets/images/wordsave_book_logo32.png) Wordsave Chrome Extension
![Version](https://img.shields.io/badge/version-1.0-blue)
![License](https://img.shields.io/badge/license-MPL-green)

Save your words in a pocket dictionary!

## Usage

Wordsave uses indexedDB for storing word objects.

The extension is currently only supported on Chrome and Chromium browsers and is not intended to be used on mobile. It uses dictionaryapi.dev for word lookups and built-in Chrome text-to-speech API for voice synthesis.

### What's with the quality with some of the word definitions?

The dictionaryapi uses the Wiktionary freely available word definitions, which are created and maintained by internet volunteers. If there is enough demand, the API may be changed to a more reputable online dictionary like Merriam-Webster.

Support the API developer here:

[<img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" height="72px" alt="Buy DictionaryAPI a Coffee">](https://buymeacoffee.com/meetdeveloper)

## Development setup

Wordsave uses tailwind for certain styles

```bash
npm install tailwindcss
npx tailwindcss init
```

Replace contents of tailwind.config.js with

```
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./**/*.{html,js}", // Include all HTML and JS files
    "!./node_modules/**", // Exclude the entire node_modules folder
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

To compile:

```bash
npx tailwindcss -o css/tailwind.css --minify
```

### Load the extension locally

1. Open the Chrome browser, go into settings and click Extensions, or open a new tab and go to `chrome://extensions`
2. Enable the "Developer Mode" toggle
3. Click "Load the unpacked extension..." and select the project folder

## License

This project is licensed under the Mozilla Public License. Feel free to use, modify, distribute for commercial and non-commercial uses.