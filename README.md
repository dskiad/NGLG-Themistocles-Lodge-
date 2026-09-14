# Συμβολική Στοά Θεμιστοκλής υπ’ αριθμ. 96

Responsive Greek-language lodge website with a persistent editor for identity, officers, meeting dates and past masters. The editor has separate role, title, given-name and surname fields. The initial content preserves the supplied names, nine dates, member-application URL and footer credit.

Content is stored in the Sites-managed D1 database. Writes require platform authentication and are restricted to the owner of the saved record; the Site is initially owner-private. Optimistic revisions prevent stale edits from another tab or device overwriting a newer save. Unsaved session drafts are temporary browser state only.

## Artwork

The three lodge and grand-lodge assets were supplied by the user. The Themistocles bust photograph is by Sailko, CC BY 3.0, from Wikimedia Commons. The original photo is retained and CSS applies the watermark colour and opacity. The source and licence are linked in the footer.

## GitHub Pages: a second, independent copy of the site

`docs/` is a self-contained, GitHub-only copy of the site — separate from the app above (which runs on the Sites platform) and from its D1 database. It has two live pages once GitHub Pages is enabled for this repo:

- **`docs/index.html`** — the public page. It fetches `docs/data/content.json` at load time and renders it client-side (`docs/app.js`), mirroring `app/lodge-site.tsx`'s markup and CSS classes so `docs/styles.css` (a trimmed copy of `app/globals.css`) applies unchanged.
- **`docs/editor.html`** — an editor for that same JSON file (`docs/editor.js`). It has no server of its own: it reads and writes `docs/data/content.json` straight through the GitHub REST API, authenticated with a personal access token pasted in by the owner and kept only in that browser's `localStorage`. Saving commits directly to `main`, which re-triggers the Pages deploy below, so the public page picks up the change once the new deploy finishes (well under a minute). Use a fine-grained token scoped to just this repository with "Contents: read and write" permission. The page itself is gated by a passcode (`PASSCODE` in `docs/editor.js`, stored in `sessionStorage` once entered) — this is a basic deterrent only, not real security: the page's source (and passcode) is publicly readable, so the token is what actually controls who can write.

Both pages are deployed by `.github/workflows/pages.yml` on every push to `main` that touches `docs/**`. This whole `docs/` setup is independent of the Sites-hosted app and its database — the two are not kept in sync automatically.

## Validation

TypeScript checks, production build, content/date/link validation, asset presence and isolated SQLite save/ownership/conflict checks. Browser and WebMCP runtime validation were unavailable under the execution profile for this request.

Follow the Sites skills for build, migration, publication and future updates.
