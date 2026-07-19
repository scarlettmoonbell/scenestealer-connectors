# GitHub Actions Workflows

What each workflow in this directory does, when it runs, and why.

## checks.yml

**Triggers:** `pull_request` (no path filter — every PR) and
`workflow_call` (available for a future `deploy.yml` or similar to reuse,
matching the pattern used in `montage-a-trois`'s `checks.yml`, though there
is no caller yet — this is a library package with no deploy step of its
own).

- **checks** — `npm ci`, then `typecheck` (`tsc --noEmit`), `lint`
  (`eslint .`), `format` (`prettier --check .`), `build` (`tsc -p
  tsconfig.json`), `test` (`vitest run`).

**Not yet added, tracked as a known gap rather than silently skipped** (see
the parent project's `ROADMAP.md`): SHA-pinning every `uses:` line to its
resolved commit (the convention used in `montage-a-trois`), a Trivy
filesystem scan, and a gitleaks secret scan. Reasonable to defer on a
brand-new library repo with no runtime secrets in it yet — worth adding
before this package handles anything sensitive, or in step with the rest of
the SceneStealer repos hardening their CI together.

## dependabot.yml

Weekly version-update PRs for the `npm` ecosystem (root) and the
`github-actions` ecosystem (root). Dependabot **security alerts** should
also be enabled at the repo-settings level (Settings → Security) — not a
config file, so noted here rather than assumed.
