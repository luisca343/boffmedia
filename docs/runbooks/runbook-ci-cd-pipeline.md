# Runbook: GitLab CI/CD Pipeline

> **Status**: Validate stage working. Build stage failing — under investigation. Deploy stage untested.  
> **Last updated**: 2026-05-17  
> **BookStack target**: Infrastructure → DevOps → Runbooks → CI/CD Pipeline

---

## Overview

Three-stage pipeline: validate → build → deploy.

| Stage | Jobs | Trigger | Status |
|---|---|---|---|
| validate | `lint-typecheck` | Every push to master, every MR, every tag | ✅ Working |
| build | `build-web`, `build-api` | Master (file changes) or tag | ⚠ Failing — under investigation |
| deploy | `deploy-web`, `deploy-api` | Git tags only (Option B) | ⏳ Untested — depends on build |

**Deploy strategy**: Option B — manual Git tag. Merges to master do not deploy automatically. To release:
```bash
git tag v1.2.3 && git push origin v1.2.3
```

---

## Pipeline file

Location: `.gitlab-ci.yml` in the repo root.

### Stage: validate

Runs `tsc --noEmit` for both `api` and `web`. Blocks build if typecheck fails.

- Runs on: master pushes, MRs, tags
- Image: `node:20-alpine`
- Runner tag: `docker`
- Cache: `pnpm-lock.yaml`-keyed pnpm store

### Stage: build

Docker build + push to Docker Hub. Two jobs run in parallel:

| Job | Image tag | Dockerfile |
|---|---|---|
| `build-api` | `luisca343/boffmedia-server2:latest` + `:{CI_PIPELINE_IID}` | `apps/api/Dockerfile` |
| `build-web` | `luisca343/boffmedia-web2:latest` + `:{CI_PIPELINE_IID}` | `apps/web/Dockerfile` |

Web build injects env vars from GitLab CI/CD variables into `.env.production.local` before building.

### Stage: deploy

SSH into the production server, pull the new image, restart the container.

| Job | Container restarted |
|---|---|
| `deploy-api` | `boffmedia-server` |
| `deploy-web` | `boffmedia-web` |

Each deploy job only needs its own build job (`needs: build-api` / `needs: build-web`).

---

## GitLab CI/CD variables required

| Variable | Type | Notes |
|---|---|---|
| `DOCKERHUB_TOKEN` | Variable (masked) | Docker Hub access token |
| `DOCKERHUB_USERNAME` | Variable | `luisca343` |
| `SSH_PRIVATE_KEY` | File or Variable (protected) | Ed25519 private key for deploy SSH — see below |
| `DEPLOY_HOST` | Variable (protected) | Production server IP: `148.251.3.244` |
| `GOOGLE_CLIENT_ID` | Variable | Web build env |
| `GOOGLE_CLIENT_SECRET` | Variable (masked) | Web build env |
| `NEXT_PUBLIC_API` | Variable | Web build env |
| `NEXT_PUBLIC_SOCKET_URL` | Variable | Web build env |
| `NEXT_PUBLIC_MC_WORLD` | Variable | Web build env |
| `NEXT_PUBLIC_URL` | Variable | Web build env |
| `SECRET` | Variable (masked) | Web build env |
| `NEXTAUTH_SECRET` | Variable (masked) | Web build env |
| `NEXTAUTH_URL` | Variable | Web build env |
| `NEXT_PUBLIC_TWITCH_CLIENT_ID` | Variable | Web build env |
| `NEXT_PUBLIC_TWITCH_CLIENT_SECRET` | Variable (masked) | Web build env |

---

## SSH deploy key setup

The deploy uses an Ed25519 key pair. To set up on a new server:

```bash
# Generate key pair (run locally)
ssh-keygen -t ed25519 -C "gitlab-ci-deploy" -f ~/.ssh/gitlab_deploy_key -N ""

# Add public key to server
ssh root@148.251.3.244 "mkdir -p ~/.ssh && chmod 700 ~/.ssh"
cat ~/.ssh/gitlab_deploy_key.pub | ssh root@148.251.3.244 "cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"

# Add private key to GitLab
# Settings → CI/CD → Variables → SSH_PRIVATE_KEY → Type: File, Protected: yes
```

> **GitLab gotcha**: SSH private keys cannot be Masked (contain characters outside the allowed set). Set the variable type to **File** or leave Masked unchecked — Protected is sufficient.

---

## Rollback procedure

To roll back to a previous image:

```bash
# Option 1 — SSH and pull a specific pipeline IID tag
ssh root@148.251.3.244 \
  "docker pull luisca343/boffmedia-server2:1234 && \
   docker stop boffmedia-server && \
   docker run -d --name boffmedia-server luisca343/boffmedia-server2:1234"

# Option 2 — Re-run the deploy job from a previous pipeline in GitLab UI
# CI/CD → Pipelines → find previous passing pipeline → re-run deploy-api
```

---

## Known issues / pending

- **Build stage failing** (as of v0.0.2, 2026-05-17) — Docker build jobs failing for both web and api. Root cause under investigation. Validate stage passes cleanly.
- **Deploy stage untested** — will be verified once build stage is fixed
- **Web build env vars** — confirm all `NEXT_PUBLIC_*` variables are set in GitLab before build can succeed
