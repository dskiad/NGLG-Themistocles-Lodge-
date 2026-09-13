# Συμβολική Στοά Θεμιστοκλής υπ’ αριθμ. 96

Responsive Greek-language lodge website with a persistent editor for identity, officers, meeting dates and past masters. The editor has separate role, title, given-name and surname fields. The initial content preserves the supplied names, nine dates, member-application URL and footer credit.

Content is stored in the Sites-managed D1 database. Writes require platform authentication and are restricted to the owner of the saved record; the Site is initially owner-private. Optimistic revisions prevent stale edits from another tab or device overwriting a newer save. Unsaved session drafts are temporary browser state only.

## Artwork

The three lodge and grand-lodge assets were supplied by the user. The Themistocles bust photograph is by Sailko, CC BY 3.0, from Wikimedia Commons. The original photo is retained and CSS applies the watermark colour and opacity. The source and licence are linked in the footer.

## Validation

TypeScript checks, production build, content/date/link validation, asset presence and isolated SQLite save/ownership/conflict checks. Browser and WebMCP runtime validation were unavailable under the execution profile for this request.

Follow the Sites skills for build, migration, publication and future updates.
