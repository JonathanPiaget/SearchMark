# SearchMark

A browser extension for efficient bookmark management with search capabilities.

[![GitHub release](https://img.shields.io/github/release/JonathanPiaget/Searchmark.svg?style=flat-square)](https://github.com/JonathanPiaget/Searchmark/releases)
[![License](https://img.shields.io/badge/License-MIT-lightrey.svg?style=flat-square)](https://opensource.org/licenses/MIT)

[<img height="72" src="./.github/assets/chrome-store.svg" alt="Available in the Chrome Web Store">](https://chromewebstore.google.com/detail/searchmark/ojcnjoecdiojbelkehfhibhljjaocfaf) [<img height="72" src="./.github/assets/firefox-addons.svg" alt="Available in the Firefox Addon Store">](https://addons.mozilla.org/en-US/firefox/addon/searchmark/)

## Features

**Quick Save**
Save bookmarks quickly by opening the extension popup. The popup auto-fills the current page title and URL for easy editing before saving to your chosen folder.

**Folder Search**
Find bookmark folders by typing their names with real-time filtering. Toggle between fuzzy and exact matching for flexible search. Navigate results with arrow keys and expand child folders. The interface highlights matching text and shows breadcrumb paths for easy identification.

**Bookmark Search**
Search for bookmarks across all folders or within a specific folder. Toggle fuzzy search for typo-tolerant matching. Filter results in real-time with highlighted matches. View folder contents with the option to display recursive or direct content only.

**Current Page Detection**
See the full path where the current page is already bookmarked, and quickly delete it directly from the popup if needed.

**Save for Later**
Quickly save pages to a dedicated "See later" folder with one click. Configure your preferred quick-save folder in the extension settings.

**Dark Mode**
Automatic theme detection follows your system preferences, or manually toggle between light and dark modes. Access theme settings via the extension options page for fine-grained control (Auto/Light/Dark).

**Multi-language Support**
Currently supports English and French, with the architecture in place to easily add additional languages in the future.

## Planned Features

1. Enable creating new folders during save process
2. Customize hot keys and default folder for quick save
3. Add a note to a bookmark
4. Find a way to do a trash for deleted bookmarks
5. List broken URLs bookmarks
6. Auto backup locally on any change
7. Add more languages
8. Add tags to bookmarks

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
