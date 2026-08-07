# SceneStealer — Connectors

Storage and publish connectors for [SceneStealer](https://github.com/scarlettmoonbell/scenestealer-app) — the atomic,
reusable layer with no tenant, billing, or dashboard concepts. Genuinely
useful to anyone who wants "pull video from cloud storage X, push it to
social platform Y" outside SceneStealer itself.

Two things live here, both thin wrappers over existing open-source tools
rather than hand-rolled per-provider integrations:

- **`src/storage/`** — a `StorageProvider` interface backed by
  [rclone](https://github.com/rclone/rclone) (MIT), which already natively
  supports every backend this project needs: Google Drive, Dropbox,
  OneDrive/SharePoint, Box, S3, Azure Blob, and GCS (plus 60+ more). This
  package generates a per-tenant rclone remote config and drives it over
  rclone's Remote Control (RC) HTTP API — it is not seven bespoke SDK
  integrations.
- **`src/publish/`** — a typed client for a self-hosted
  [Postiz](https://github.com/gitroomhq/postiz-app) instance, which already
  covers OAuth + publish mechanics for YouTube, Instagram, Facebook, and
  30+ other platforms. **Postiz is AGPL-3.0** and is always run as a
  separate, self-hosted service, called only over its network API — never
  forked or vendored into this repo — which is what keeps this package's
  own MIT license unaffected by Postiz's copyleft.

## Status

`PostizPublishProvider` is implemented (2026-07-20) — calls a self-hosted
Postiz instance's public API (`/public/v1/upload-from-url`, `/public/v1/posts`)
directly. Its request/response shapes came from reading Postiz's own source
on GitHub, not just its docs, which don't fully document the create-post
response or the per-platform `settings` shapes (a gap the project's own
maintainers acknowledge in
[issue #717](https://github.com/gitroomhq/postiz-app/issues/717)). Covered
by a real test suite (`postiz-provider.test.ts`, 13 cases) mocking `fetch` —
which caught one real bug during development: per-platform settings
validation ran *after* the upload call instead of before, so bad input
still triggered a network call first.

`RcloneStorageProvider` still throws `not implemented` — that's the
remaining Phase 1 scaffold item. See the parent project's
[build sequence](https://github.com/scarlettmoonbell/scenestealer-app/blob/main/ROADMAP.md)
for what's next.

## Operations

The deployable product that depends on this package is the sibling
[`scenestealer-app`](https://github.com/scarlettmoonbell/scenestealer-app)
repo — its `ROADMAP.md` tracks overall build sequencing across all four
SceneStealer repos. Infrastructure (including the self-hosted rclone and
Postiz instances this package talks to) is provisioned by the sibling
[`scenestealer-infra`](https://github.com/scarlettmoonbell/scenestealer-infra)
repo.

## Dependencies

**Runtime:** Node `>=22.12.0`, TypeScript `^5.7`.

**Key packages** (see `package.json` for the full list): no runtime
dependencies yet — `RcloneStorageProvider` will need an HTTP client once
implemented (native `fetch` is likely sufficient, no plan to add one for
that alone). Dev tooling: `typescript`, `eslint` + `@typescript-eslint`,
`prettier`, `vitest`.

**External services this package's implementations depend on at runtime**
(provisioned by `scenestealer-infra`, not by this repo):

- **rclone** (self-hosted, `rcd` remote-control mode) — storage access.
- **Postiz** (self-hosted) — social publishing.

**Consuming repo:**
[`scenestealer-app`](https://github.com/scarlettmoonbell/scenestealer-app)
depends on this package as a workspace/git dependency (formal npm
publishing deferred until there's external demand to consume it
independently of SceneStealer itself).

## License

MIT — see [`LICENSE`](LICENSE). Chosen deliberately, distinct from
`scenestealer-app`'s BSL 1.1: this package has no commercial logic in it,
so there's no reason to restrict its reuse.
