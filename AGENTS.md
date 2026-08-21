## Development

```
npm install
npm run build      # tsc -p tsconfig.json
npm run typecheck   # tsc --noEmit
npm run lint
npm run test        # vitest run
```

No dev server — this is a library package, consumed by `scenestealer-app`.

**`dist/` is committed, not gitignored** — deliberately, not an
oversight. This package is consumed as a `github:owner/repo#main` git
dependency (no npm registry publish), and pnpm resolves that specifier
via a tarball download rather than a real `git clone` — confirmed the
hard way that neither a `prepare` nor a `postinstall` script ever runs
in that case (no `.git` directory for pnpm to key off, `onlyBuiltDependencies`
allowlisting notwithstanding), leaving consumers with no `dist/` at all
otherwise. **Run `npm run build` and commit the result whenever `src/`
changes** — nothing else builds it for you. Worth automating in CI
later (build + auto-commit `dist/` on push to `main`) rather than
relying on remembering this by hand.

## Pre-commit hooks

`.pre-commit-config.yaml` mirrors `checks.yml`/`docs.yml`/`actionlint.yml`
locally, before a commit happens — see the comments at the top of that
file for exactly what's included. Install once per machine (`brew install
pipx && pipx install pre-commit`), then activate once per clone:
`pre-commit install`.

## Documentation

- [rclone RC (remote control) API](https://rclone.org/rc/) — what
  `RcloneStorageProvider` will drive once implemented.
- [Postiz API docs](https://docs.postiz.com/) — incomplete for the
  create-post response and per-platform `settings` shapes; `PostizPublishProvider`
  was built by reading Postiz's own source (github.com/gitroomhq/postiz-app)
  where the docs fell short.
- Sibling repo [`scenestealer-app`](https://github.com/scarlettmoonbell/scenestealer-app)'s
  `PLAN.md` for the full product context this package fits into.
