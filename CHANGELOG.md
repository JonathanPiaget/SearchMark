# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
