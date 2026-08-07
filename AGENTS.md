## Development

```
npm install
npm run build      # tsc -p tsconfig.json
npm run typecheck   # tsc --noEmit
npm run lint
npm run test        # vitest run
```

No dev server — this is a library package, consumed by `scenestealer-app`.

## Documentation

- [rclone RC (remote control) API](https://rclone.org/rc/) — what
  `RcloneStorageProvider` will drive once implemented.
- [Postiz API docs](https://docs.postiz.com/) — incomplete for the
  create-post response and per-platform `settings` shapes; `PostizPublishProvider`
  was built by reading Postiz's own source (github.com/gitroomhq/postiz-app)
  where the docs fell short.
- Sibling repo [`scenestealer-app`](https://github.com/scarlettmoonbell/scenestealer-app)'s
  `PLAN.md` for the full product context this package fits into.
