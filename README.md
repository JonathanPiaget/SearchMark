# SearchMark

A browser extension for efficient bookmark management with search capabilities.

[![GitHub release](https://img.shields.io/github/release/JonathanPiaget/Searchmark.svg?style=flat-square)](https://github.com/JonathanPiaget/Searchmark/releases)
[![License](https://img.shields.io/badge/License-MIT-lightrey.svg?style=flat-square)](https://opensource.org/licenses/MIT)

[<img height="72" src="./.github/assets/chrome-store.svg" alt="Available in the Chrome Web Store">](https://chromewebstore.google.com/detail/searchmark/ojcnjoecdiojbelkehfhibhljjaocfaf) [<img height="72" src="./.github/assets/firefox-addons.svg" alt="Available in the Firefox Addon Store">](https://addons.mozilla.org/en-US/firefox/addon/searchmark/)

## Features

**Quick Save**
Save bookmarks using global keyboard shortcuts without opening browser menus. Press `Cmd+Shift+S` (Mac) or `Ctrl+Shift+S` (Windows/Linux) to open the popup for custom folder selection, or `Cmd+Shift+B` (Mac) or `Ctrl+Shift+B` (Windows/Linux) to quickly save to your bookmark toolbar.

**Folder Search**
Find bookmark folders by typing their names. Navigate results with arrow keys and expand folders with children. The interface highlights matching text and shows folder paths for easy identification.

**Dark Mode**
Automatic theme detection follows your system preferences, or manually toggle between light and dark modes. Access theme settings via the extension options page for fine-grained control (Auto/Light/Dark).

**Multi-language Support**
Currently supports English and French, with the architecture in place to easily add additional languages in the future.

## Planned Features

1. Display in which folder the current tab is saved
2. Full-text search across bookmark titles, URLs and folders
3. Enable creating new folders during save process
4. Customize hot keys and default folder for quick save
5. Add a note to a bookmark
6. Find a way to do a trash for deleted bookmarks
7. List broken URLs bookmarks
8. Auto backup locally on any change
9. Add a button "see later" or similar to add in a dedicated folder
10. Add more languages
11. Add tags to bookmarks

## Development

### Setup
```bash
pnpm install
pnpm run dev
```

### Available Scripts
- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run check` - Run linting and formatting
- `pnpm run zip` - Create distribution package

### Tech Stack
- **Framework**: [WXT](https://wxt.dev/) - Modern web extension framework
- **Frontend**: Vue.js 3 with TypeScript
- **Styling**: Scoped CSS with shared components
- **Internationalization**: @wxt-dev/i18n
- **Code Quality**: Biome for linting and formatting

### Code Quality
This project uses [pre-commit](https://pre-commit.com/) hooks.

```bash
pre-commit install          # Install hooks
pre-commit run --all-files  # Run manually
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/JonathanPiaget/Searchmark/issues).
