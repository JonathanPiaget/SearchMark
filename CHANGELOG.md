# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.10.0]

### Added
- Navigate search results with arrow keys directly from the search field

### Fixed
- Folder dropdown not scrolling to top when re-focusing the bookmark toolbar option
- Loading flicker on Firefox by deferring the initial bookmark load

## [1.9.0]

### Added
- Bookmark toolbar pinned as a quick option in the folder selector when saving
- Tooltip explaining how the fuzzy search toggle works
- Crossed magnifier icon for the "no results" state
- Key icons shown alongside the Shift/Space labels in the expand hint

### Changed
- Replaced emoji icons with the Lucide icon set throughout the popup
- Redesigned theme color tokens for a more consistent look in light and dark modes

### Fixed
- Match count footer now uses the match count as its denominator instead of the total folder count

## [1.8.0]

### Added
- Folder dropdown header redesigned with kbd-style shortcut keys for navigation hints
- Results footer in folder dropdown showing the match count and navigation key hints

### Fixed
- Popup now grows to fit the folder dropdown so all results stay reachable

## [1.7.1]

### Fixed
- Toolbar badge not appearing on Firefox (MV2 uses `browserAction` API instead of `action`)

## [1.7.0]

### Added
- Toolbar icon badge indicates when the current page is already bookmarked
- Enlarged extension icon artwork for better visibility

## [1.6.0]

### Added
- Delete bookmarks directly from search results
- Full folder path displayed in search results (e.g., "Bookmarks Bar > Dev > Frontend")
- Folder path tooltip on hover for bookmark cards
- Hover effects on SeeLaterButton and ThemeToggle icons

## [1.5.1]

### Fixed
- Clear button now only visible when there's a search query (was showing unnecessarily)

## [1.5.0]

### Added
- Fuzzy search for folder selection with toggle option
- Fuzzy search for bookmarks search
- Clear button for bookmark search input
- Clear selection button in FolderSelector

### Fixed
- Folder dropdown scroll lag by using Vue template refs
