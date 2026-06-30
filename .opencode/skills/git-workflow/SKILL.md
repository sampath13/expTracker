---
name: git-workflow
description: Use when committing, branching, creating PRs, writing commit messages, resolving merge conflicts, or any git operation in this repo. Enforces commit conventions, branch naming, PR checklist, and the monorepo-aware workflow. Use for all git operations in expTracker.
---

# Git Workflow — expTracker

## Branch Naming

```
<type>/<tier>/<short-description>
```

| Type | When |
|---|---|
| `feat/` | New feature or story |
| `fix/` | Bug fix |
| `chore/` | Maintenance, deps, config |
| `docs/` | Documentation only |
| `refactor/` | Code restructuring, no behavior change |
| `test/` | Adding or fixing tests |

| Tier | Apps affected |
|---|---|
| `mobile/` | `apps/mobile/` |
| `api/` | `apps/api/` |
| `ocr/` | `apps/ocr-service/` |
| `threader/` | `apps/threader/` |
| `infra/` | `docker/`, `.github/`, `scripts/` |
| `docs/` | `docs/`, `stories/`, `threads/` |
| `*` | Cross-cutting (multiple apps) |

```
Examples:
  feat/mobile/camera-blur-detection
  feat/api/jwt-auth-endpoints
  fix/ocr/chinese-receipt-parsing
  chore/api/update-ef-core-10
  feat/*/monorepo-scaffold
  docs/*/architecture-decisions
```

## Commit Messages

Follow [Conventional Commits 1.0.0](https://www.conventionalcommits.org/).

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | When |
|---|---|
| `feat` | New feature (bumps MINOR version) |
| `fix` | Bug fix (bumps PATCH version) |
| `chore` | Maintenance, deps, build config |
| `docs` | Documentation only |
| `refactor` | Code change that neither fixes nor adds a feature |
| `test` | Adding or fixing tests |
| `ci` | CI/CD pipeline changes |
| `perf` | Performance improvement |
| `style` | Formatting, linting, whitespace (no logic change) |

### Scopes

Use the app/service name:

| Scope | Affects |
|---|---|
| `mobile` | `apps/mobile/` |
| `api` | `apps/api/` |
| `ocr` | `apps/ocr-service/` |
| `threader` | `apps/threader/` |
| `docker` | `docker/` |
| `docs` | `docs/`, `stories/`, `threads/` |
| `scripts` | `scripts/` |
| `ci` | `.github/workflows/` |

Omit scope for truly cross-cutting changes. Use `!` before `:` for breaking changes.

### Examples

```
✅ Good:
  feat(mobile): add on-device blur detection before upload
  feat(api): add JWT refresh token rotation
  fix(ocr): handle multi-line items on narrow Chinese receipts
  chore(docker): bump postgres image to 16.4
  docs(api): document two-DB separation logic
  test(api): add price lookup service unit tests
  ci: add multi-tier test matrix to PR workflow
  refactor(api)!: split into 3-tier solution with Core/Infrastructure
  style(mobile): apply eslint auto-fixes

❌ Bad:
  fixed stuff
  WIP
  update code
  feat: add feature        (missing scope)
  feat(api): add feature.  (no period at end of description)
  FEAT(api): add feature   (lowercase type)
```

### The Description Line

- Use imperative mood: "add" not "added", "fix" not "fixed"
- Lowercase after the colon
- No period at the end
- Max 72 characters (wrap body at 72)

## PR Workflow

### Before Opening a PR

- [ ] Branch is up to date with `main` (rebase, don't merge)
- [ ] All tests pass locally for affected tier(s)
- [ ] Linter/formatter passes (`npm run lint`, `dotnet format`, `ruff check`)
- [ ] No secrets, keys, or tokens in diff
- [ ] No `console.log`, `Debug.WriteLine`, `print()` left in
- [ ] New code follows the relevant clean-code skill (`typescript-clean-code` / `csharp-clean-code` / `python-clean-code`)
- [ ] File locations follow `monorepo-structure` conventions
- [ ] No commented-out code (delete it — git remembers)

### PR Title Format

```
<type>(<scope>): <summary>
```

Must match the Conventional Commits format. Squash-merge PRs use this as the merge commit message.

### PR Body Template

```markdown
## What
Brief description of the change.

## Why
Context — which story/epic/thread this addresses.

## Apps affected
- [ ] mobile
- [ ] api
- [ ] ocr-service
- [ ] threader
- [ ] infra

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Checklist
- [ ] No secrets committed
- [ ] Follows folder structure conventions
- [ ] Follows language clean-code conventions
- [ ] Breaking changes documented
```

## Monorepo-Aware Rules

### One PR = One App (usually)

When changes are isolated to one tier, keep the PR scoped. Cross-cutting changes (shared types, docker, CI) are the exception.

### Don't Mix Unrelated Changes

```
❌ PR: "Add camera feature AND fix OCR bug AND update README"
✅ PR 1: "feat(mobile): add camera blur detection"
✅ PR 2: "fix(ocr): fix Chinese receipt parsing"
✅ PR 3: "docs: update README with setup instructions"
```

### Conflict Prevention

```bash
# Pull latest main before starting work
git checkout main && git pull origin main

# Create branch from latest main
git checkout -b feat/mobile/my-feature

# Push regularly (even WIP)
git push -u origin feat/mobile/my-feature

# Before merging: rebase on main
git fetch origin main
git rebase origin/main
# Resolve conflicts, then force-push branch
git push --force-with-lease
```

## Version Tags

No version tags until first release. After MVP:
```
v<major>.<minor>.<patch>
v1.0.0 — initial MVP release
```

## Commit Granularity

```
✅ One logical change per commit — reviewer can follow the story
❌ One massive commit with "everything"
✅ Separate commits for: scaffold → logic → tests → lint fixes
❌ Commit with: "feat + fix + wip + test"
```

## Useful Commands

```bash
# See what you're about to commit
git diff --cached

# See commit history for a specific app
git log --oneline -- apps/api/

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Amend last commit message
git commit --amend -m "better message"

# Stash WIP, switch branch, come back
git stash push -m "wip: camera work"
git stash pop

# Clean merged branches locally
git branch --merged | grep -v "main" | xargs git branch -d
```
