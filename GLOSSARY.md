# SearchMark

A browser extension that works directly on the browser's native bookmarks: save the current tab into a folder found by typing its name, search bookmarks, and save for later in one keystroke. Nothing is stored outside the browser's bookmark tree and extension storage.

## Language

### Bookmark tree

**Bookmark**:
A node of the browser's bookmark tree that has a URL.
_Avoid_: link, item, entry

**Folder**:
A node of the browser's bookmark tree without a URL. Folders contain bookmarks and other folders.
_Avoid_: directory, parent, node

**Bookmark toolbar**:
The browser's built-in folder shown as the toolbar: "Bookmarks Bar" in Chrome, "Bookmarks Toolbar" in Firefox. It is where the See Later folder is created by default.
_Avoid_: bookmarks bar, toolbar folder, root folder

**Path**:
The titles of a folder's ancestors and of the folder itself, joined with " > ", starting at a child of the bookmark toolbar's level. A bookmark's path is the path of the folder that holds it.
_Avoid_: parentPath, folderPath, breadcrumb, location

### Saving

**Current tab**:
The active tab of the current browser window. It is what the Save view pre-fills and what Quick Save saves.
_Avoid_: current page, active tab

**Quick Save**:
Saving the current tab into the See Later folder with no further input, from the popup button or the `Ctrl/Cmd+Shift+B` command.
_Avoid_: save for later, one-key save, see later action

**See Later folder**:
The folder Quick Save targets. Either chosen by the user in settings, or created by SearchMark in the bookmark toolbar under the title "See Later" in the current language. SearchMark never renames it; it recognizes it under its title in any supported language.
_Avoid_: quick save folder, read later, default folder

**Existing bookmark**:
A bookmark whose URL equals the current tab's URL. The Save view lists them so the user can see where the page is already saved and delete it.
_Avoid_: duplicate, already saved, location

### Finding

**Save view** / **Search view**:
The two popup screens, switched with `Alt+←` / `Alt+→`. Save view saves the current tab; Search view browses and searches bookmarks.
_Avoid_: tab, page, mode

**Folder search**:
Typing in the folder picker to find a folder by title. Results show each folder's path with the matching letters highlighted.
_Avoid_: folder filter, autocomplete

**Bookmark filter**:
Typing in the Search view to narrow bookmarks by title, either inside the selected folder or across all bookmarks when no folder is selected.
_Avoid_: bookmark search, global search

**Fuzzy matching** / **Exact matching**:
The two ways a typed query is compared to a title. Both ignore case and accents ("developpement" finds "Développement"). Fuzzy accepts skipped letters as long as they stay in order, and tolerates typos (a swapped, wrong, extra or missing letter) in each word of the query, the longer the word the more typos; exact requires a substring. In both modes the matched letters are highlighted in the result; for a typo-corrected word the whole word is highlighted. Each of folder search and bookmark filter remembers its own choice.
_Avoid_: fuzzy search, strict, substring mode

**Typo tier**:
The second pass of fuzzy matching, run on titles fuzzysort rejected: each query word must be within its typo budget (0 typos under 5 letters, 1 from 5, 2 from 9) of the start of some title word. Its matches rank after fuzzysort's. See `docs/adr/0001-typo-tier-next-to-fuzzysort.md`.
_Avoid_: typo-tolerant matching, typo matcher, second pass

**Recursive**:
Listing a folder's bookmarks including those in its subfolders. User-facing label: "Include subfolders".
_Avoid_: deep, nested, flattened

### Settings

**Language**:
The language SearchMark's interface is shown in: either "Auto", which follows the browser's language, or one chosen by the user. The extension's name and its shortcut labels in the browser always follow the browser's language.
_Avoid_: locale, lang, display language
