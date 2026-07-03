# SearchMark

Supercharge your browser's **native bookmarks**: fast fuzzy search, keyboard-first workflow, zero data collection.

[![GitHub release](https://img.shields.io/github/release/JonathanPiaget/Searchmark.svg?style=flat-square)](https://github.com/JonathanPiaget/Searchmark/releases)
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Data collected](https://img.shields.io/badge/data%20collected-none-brightgreen.svg?style=flat-square)](#privacy)

[<img height="72" src="./.github/assets/chrome-store.svg" alt="Available in the Chrome Web Store">](https://chromewebstore.google.com/detail/searchmark/ojcnjoecdiojbelkehfhibhljjaocfaf) [<img height="72" src="./.github/assets/firefox-addons.svg" alt="Available in the Firefox Addon Store">](https://addons.mozilla.org/en-US/firefox/addon/searchmark/)

## Why SearchMark?

**No separate silo.** Unlike Raindrop, Pocket, and other bookmark managers, SearchMark doesn't store your bookmarks in its own database - it works directly on your browser's native bookmarks. No account to create, no sync service to trust, no lock-in: uninstall it and your bookmarks are exactly where they always were.

**Keyboard-first.** Save, search, and organize without touching the mouse. Open the popup, pick a folder, save - all from the keyboard, on any page including the browser's own pages.

**Zero data collection.** SearchMark collects and transmits nothing. No analytics, no telemetry, no remote servers - everything runs locally in your browser.

## Features

**Quick Save**
Open the popup with `Ctrl+Shift+X` (`Cmd+Shift+X` on Mac) - the current page title and URL are pre-filled, ready to edit and save to the folder you pick.

**Folder Search**
Find bookmark folders by typing their names with real-time filtering. Toggle between fuzzy and exact matching. Navigate results with arrow keys, expand child folders, and see breadcrumb paths with highlighted matches.

**Bookmark Search**
Search bookmarks across all folders or within a specific one, with typo-tolerant fuzzy matching and highlighted results. Browse folder contents recursively or directly.

**One-Key Save for Later**
`Ctrl+Shift+B` (`Cmd+Shift+B` on Mac) instantly saves the current page to your "See Later" folder - no popup needed. Configure the target folder in the settings.

**Current Page Detection**
See the full path where the current page is already bookmarked, and delete it directly from the popup if needed.

**Dark Mode**
Auto, light, or dark theme - auto follows your system preference.

**Optional Notifications**
Get a native system notification after saving - opt-in, off by default.

**Multi-language**
English and French, with the architecture in place to add more.

## Privacy

SearchMark declares `data_collection_permissions: none` on Firefox and collects no data anywhere: no analytics, no tracking, no external requests. It only asks for the permissions it needs to work - `bookmarks`, `tabs`, `storage`, and optionally `notifications`.

## Development

### Setup
```bash
pnpm install
pnpm run dev          # Chrome
pnpm run dev:firefox  # Firefox
```

### Available Scripts
- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run test` - Run unit tests
- `pnpm run check` - Run linting and formatting
- `pnpm run compile` - Type-check
- `pnpm run zip` - Create distribution package

### Tech Stack
- **Framework**: [WXT](https://wxt.dev/) - Modern web extension framework
- **Frontend**: Vue.js 3 with TypeScript
- **Testing**: Vitest with mocked extension APIs
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
