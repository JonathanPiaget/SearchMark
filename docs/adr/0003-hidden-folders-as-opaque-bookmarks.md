# Hidden folders as opaque bookmarks

Status: accepted (2026-11-02)

## Context

A hidden folder (see `GLOSSARY.md`) must disappear from the browser itself: bookmark manager, toolbar and omnibox suggestions, not only from SearchMark. The `bookmarks` API cannot keep a node outside the tree, so hiding means deleting the folder from the tree and keeping its content somewhere else. The user is most afraid of losing that content: it must follow browser sync and backups, and survive uninstalling the extension.

## Options

1. **`storage.local` with export/import**: invisible, but never synced, lost on uninstall, and the user carries the backup.
2. **`storage.sync` in 8 KB keys**: synced, but capped at 100 KB and 512 keys for the whole extension (a few hundred bookmarks), with quota errors to handle.
3. **Native bookmarks as containers**: serialize the subtree, compress and encode it into the URL of a `data:` bookmark titled "SearchMark" in "Other bookmarks". The browser syncs, exports and keeps it like any bookmark; the content is unreadable at a glance and the omnibox only offers it for the word "searchmark".

## Decision

Option 3. One hidden folder is one or more containers; a container above ~60 KB (Firefox caps a bookmark URL at 65 536 bytes) is split into several, chained by a folder id and chunk index in the URL. Hidden folder title and original location travel inside the payload, so unhiding needs no other state and nothing lives in extension storage. Encryption is optional and per user: one passphrase, never stored, verified by decrypting an existing container; an encrypted container exposes only format, version, folder id, chunk index and date in clear. The payload carries a version so the format can evolve.

## Consequences

- A "SearchMark" bookmark with an unreadable URL is visible in the bookmark manager; this is accepted as the price of free sync and backup.
- Browsing history still suggests the URLs; clearing it would need the `history` permission and is out of scope.
- A sync conflict can duplicate a container; every copy stays valid and settings list them all.
- Deleting a container by hand in the browser deletes the hidden folder, like any bookmark.
- Encoding without passphrase is discretion, not security: anyone who decodes base64 reads the content.
- Chrome has no documented bookmark URL cap; the 60 KB chunk size is set by Firefox and must be checked on Chrome once implemented.
