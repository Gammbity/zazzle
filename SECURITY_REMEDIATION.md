# Security Remediation — Sprint 1

The repository previously tracked `.env.prod` containing production-shaped
secrets. The file has been untracked, but **git history still contains it**.
Treat every value inside it as compromised and rotate before the next deploy.

## Leaked values (treat as compromised)

From `.env.prod` as of the current HEAD — anyone with repo read access has seen these:

| Variable                 | Action                                       |
|--------------------------|----------------------------------------------|
| `POSTGRES_PASSWORD`      | Rotate DB user password; redeploy DB URL.    |
| `DJANGO_SECRET_KEY`      | Generate new key. Invalidates all sessions and signed cookies. |
| `DATABASE_URL`           | Regenerate to match new POSTGRES_PASSWORD.   |
| `REDIS_PASSWORD`         | Rotate; update `REDIS_URL` / `CELERY_*_URL`. |

Placeholder-tier values (`supersecretpassword`, `superdupersecretkey`) suggest
this may never have reached real production. Rotate anyway — a real deploy
pattern-matches these strings and they must not survive into prod.

## 1. Rotate secrets

Generate a fresh Django secret key:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Generate a strong DB password:

```bash
python -c "import secrets; print(secrets.token_urlsafe(40))"
```

Store new values in your secret manager (1Password / AWS Secrets Manager / etc.),
**never** back in the repo. Populate `.env.prod` locally on the deploy host only.

## 2. Purge the file from git history

`.env.prod` remains in every prior commit. Remove it with
[`git-filter-repo`](https://github.com/newren/git-filter-repo) (faster and safer
than the deprecated `filter-branch`):

```bash
# From a fresh clone of the repo:
git clone <repo-url> zazzle-clean
cd zazzle-clean

git filter-repo --invert-paths --path .env.prod

# Force-push all branches and tags:
git push origin --force --all
git push origin --force --tags
```

**Coordination required** — every collaborator must re-clone after the force
push; existing clones will diverge and any PRs in flight must be rebased.

If you are the sole developer or the repo is private and unpublished, this is
low-risk. If the repo has been public or forked, assume the secrets are
permanently exposed regardless of history rewrite and focus on rotation.

## 3. Verify

```bash
git log --all --full-history -- .env.prod   # should print nothing after rewrite
git grep "supersecretpassword" $(git rev-list --all)  # should return nothing
```

## 4. Going forward

- `.gitignore` now excludes `.env*` except `*.example` files — commit templates only.
- Pre-commit hook recommendation: add [`gitleaks`](https://github.com/gitleaks/gitleaks)
  or `detect-secrets` to CI (Sprint 6).
- Secrets should flow into production via the orchestrator's secret store,
  never via a committed file.
