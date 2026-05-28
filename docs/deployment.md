# Infrastructure & Deployment

This project is deployed to **Google Cloud Run** with a fully automated CI/CD pipeline powered by **GitHub Actions**. The setup follows production-grade practices around container lifecycle, secret handling, and keyless authentication.

---

## Overview

| Concern            | Solution                                               |
| ------------------ | ------------------------------------------------------ |
| Container registry | Google Artifact Registry                               |
| Runtime            | Google Cloud Run (managed, serverless)                 |
| CI/CD              | GitHub Actions                                         |
| Authentication     | Workload Identity Federation (keyless, no static keys) |
| Secret management  | Google Secret Manager                                  |
| Migrations         | Cloud Run Job (separate from API, runs before deploy)  |
| Observability      | Cloud Logging (Cloud Run stdout/stderr)                |

---

## GCP Prerequisites

The following resources must exist in GCP before the CI/CD pipeline can run. Create them once, then GitHub Actions handles all subsequent deployments automatically.

### 1. Artifact Registry repository

```bash
gcloud artifacts repositories create portfolio \
  --repository-format docker \
  --location us-central1 \
  --project fast-feet-497419
```

### 2. Service accounts

**Deployer** — used by GitHub Actions to build, push, and deploy:

```bash
gcloud iam service-accounts create github-actions \
  --display-name "GitHub Actions deployer" \
  --project fast-feet-497419
```

Grant the minimum required roles:

```bash
PROJECT=fast-feet-497419
SA=github-actions@fast-feet-497419.iam.gserviceaccount.com

gcloud projects add-iam-policy-binding $PROJECT \
  --member "serviceAccount:$SA" --role "roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT \
  --member "serviceAccount:$SA" --role "roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT \
  --member "serviceAccount:$SA" --role "roles/iam.serviceAccountUser"
```

**Runtime** — the identity the Cloud Run service/job runs as:

```bash
gcloud iam service-accounts create fast-feet-runtime \
  --display-name "Fast Feet API runtime" \
  --project fast-feet-497419

gcloud projects add-iam-policy-binding fast-feet-497419 \
  --member "serviceAccount:fast-feet-runtime@fast-feet-497419.iam.gserviceaccount.com" \
  --role "roles/secretmanager.secretAccessor"
```

### 3. Workload Identity Federation

Create the pool and OIDC provider so GitHub can authenticate to GCP without a static key:

```bash
# Create pool
gcloud iam workload-identity-pools create github \
  --location global \
  --project fast-feet-497419

# Create OIDC provider (trusts tokens from GitHub Actions)
gcloud iam workload-identity-pools providers create-oidc github-actions \
  --workload-identity-pool github \
  --issuer-uri "https://token.actions.githubusercontent.com" \
  --attribute-mapping \
    "google.subject=assertion.sub,\
     attribute.repository=assertion.repository,\
     attribute.ref=assertion.ref" \
  --location global \
  --project fast-feet-497419

# Allow this repository to impersonate the deployer SA
gcloud iam service-accounts add-iam-policy-binding \
  github-actions@fast-feet-497419.iam.gserviceaccount.com \
  --role "roles/iam.workloadIdentityUser" \
  --member "principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/eduardozago/fast-feet-api"
```

Replace `PROJECT_NUMBER` with the numeric project ID (`gcloud projects describe fast-feet-497419 --format="value(projectNumber)"`).

### 4. Secret Manager secrets

Create each secret once. Subsequent versions can be added via the console or CLI without changing the Cloud Run configuration.

```bash
PROJECT=fast-feet-497419

echo -n "postgresql://..." | \
  gcloud secrets create DATABASE_URL --data-file=- --project $PROJECT

echo -n "$(base64 -w0 private.pem)" | \
  gcloud secrets create JWT_PRIVATE_KEY --data-file=- --project $PROJECT

echo -n "$(base64 -w0 public.pem)" | \
  gcloud secrets create JWT_PUBLIC_KEY --data-file=- --project $PROJECT

echo -n "https://nominatim.openstreetmap.org" | \
  gcloud secrets create NOMINATIM_API_URL --data-file=- --project $PROJECT

echo -n "FastFeet/1.0 (github.com/eduardozago/fast-feet-api)" | \
  gcloud secrets create NOMINATIM_API_USER_AGENT --data-file=- --project $PROJECT
```

#### Optional: bootstrap admin secrets

These two secrets are only needed once to provision the initial `ADMIN` account. After the first deploy, disable or delete them — the `BootstrapAdminService` is a no-op when the account already exists.

```bash
echo -n "admin@yourdomain.com" | \
  gcloud secrets create BOOTSTRAP_ADMIN_EMAIL --data-file=- --project $PROJECT

echo -n "YourSecurePassword" | \
  gcloud secrets create BOOTSTRAP_ADMIN_PASSWORD --data-file=- --project $PROJECT
```

---

## GitHub Secrets

Configure the following repository secrets at `Settings → Secrets and variables → Actions`:

| Secret                | Value                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `WIF_PROVIDER`        | Full WIF provider resource name: `projects/NUMBER/locations/global/workloadIdentityPools/github/providers/github-actions` |
| `WIF_SERVICE_ACCOUNT` | `github-actions@fast-feet-497419.iam.gserviceaccount.com`                                                                 |
| `JWT_PRIVATE_KEY`     | Base64-encoded RS256 private key (used by E2E tests in CI)                                                                |
| `JWT_PUBLIC_KEY`      | Base64-encoded RS256 public key (used by E2E tests in CI)                                                                 |

---

## Container Image

The application is packaged using a **4-stage Dockerfile** that separates concerns clearly:

```
build ──► migration
  │
  └──► prune ──► runtime
```

| Stage       | Base image          | Purpose                                                                                         |
| ----------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| `build`     | `node:24-alpine`    | Installs all dependencies, generates Prisma client, compiles TypeScript                         |
| `migration` | inherits from build | Runs `prisma migrate deploy`; deployed as a Cloud Run Job                                       |
| `prune`     | inherits from build | Strips `devDependencies` to produce a lean install for the final image                          |
| `runtime`   | `node:24-alpine`    | Copies compiled output and production `node_modules` from `prune`; runs as non-root `node` user |

**Key properties of the runtime image:**

- Non-root: runs as `USER node`
- `HEALTHCHECK` wired to `GET /health` via `wget`
- No source code, no dev tooling, no Prisma CLI
- Tagged with the Git commit SHA for full traceability

The migration and runtime images are built from a shared build layer. Buildx registry-backed caching (`--cache-from / --cache-to type=registry`) ensures subsequent builds only recompile changed layers.

---

## CI/CD Pipeline

### CI — runs on every pull request to `master` or `develop`

```
lint → unit tests + e2e tests (parallel)
```

The test suite is defined as a reusable workflow (`tests.yml`) invoked by both CI and CD — one source of truth for what counts as passing tests. Pull requests are blocked until all checks pass. Lint runs first to fail fast before the heavier test jobs.

E2E tests run against a real PostgreSQL 17 service container. Each test suite creates an isolated schema (`test_<uuid>`) and tears it down after the run — no shared state between suites.

### CD — runs on every push to `master`

```
tests → build-and-push → deploy
```

Each stage only starts if the previous one passed. No manual steps are involved — a merge to `master` is all it takes to ship.

```
git push (master)
      │
      ├── [tests]        lint → unit → e2e
      │
      ├── [build-and-push]
      │     ├── docker buildx build --target runtime  → tagged :<git-sha>
      │     ├── docker buildx build --target migration → tagged :-migration:<git-sha>
      │     └── push both to Artifact Registry
      │
      └── [deploy]
            ├── gcloud run jobs deploy fast-feet-api-migrate  (migration image)
            ├── gcloud run jobs execute fast-feet-api-migrate --wait
            │     └── waits for success; aborts pipeline on failure
            └── gcloud run deploy fast-feet-api  (runtime image)
                  └── new immutable revision created; 100% traffic routed
```

Migrations **must complete successfully** before the API revision is deployed. If the migration job fails, the pipeline stops and the current API revision keeps serving traffic.

---

## Provisioning the First Admin

`POST /accounts` requires an authenticated `ADMIN`, so the first admin cannot be created through the API. The `BootstrapAdminService` solves this by reading `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` from the environment on startup and calling `CreateAccountUseCase` once.

This is a **one-time, out-of-band step** — these secrets are intentionally excluded from the automated CD pipeline to avoid them being present after initial setup.

### Steps

**1.** Create the bootstrap secrets in Secret Manager (if not done in the prerequisites):

```bash
PROJECT=fast-feet-497419

echo -n "admin@yourdomain.com" | \
  gcloud secrets create BOOTSTRAP_ADMIN_EMAIL --data-file=- --project $PROJECT

echo -n "YourSecurePassword" | \
  gcloud secrets create BOOTSTRAP_ADMIN_PASSWORD --data-file=- --project $PROJECT
```

**2.** Deploy the service once with the bootstrap secrets injected, after the first migration has run:

```bash
gcloud run deploy fast-feet-api \
  --image     us-central1-docker.pkg.dev/fast-feet-497419/portfolio/fast-feet-api:<git-sha> \
  --region    us-central1 \
  --project   fast-feet-497419 \
  --platform  managed \
  --allow-unauthenticated \
  --port      8080 \
  --memory    512Mi \
  --cpu       1 \
  --min-instances 0 \
  --max-instances 3 \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,JWT_PRIVATE_KEY=JWT_PRIVATE_KEY:latest,JWT_PUBLIC_KEY=JWT_PUBLIC_KEY:latest,NOMINATIM_API_URL=NOMINATIM_API_URL:latest,NOMINATIM_API_USER_AGENT=NOMINATIM_API_USER_AGENT:latest,BOOTSTRAP_ADMIN_EMAIL=BOOTSTRAP_ADMIN_EMAIL:latest,BOOTSTRAP_ADMIN_PASSWORD=BOOTSTRAP_ADMIN_PASSWORD:latest"
```

On startup, `BootstrapAdminService` reads the vars, calls `CreateAccountUseCase`, and logs `Bootstrap admin provisioned: <email>`.

**3.** Disable or delete the bootstrap secrets — they are no longer needed:

```bash
# Preferred: disable the secret versions (preserves audit history)
gcloud secrets versions disable 1 --secret BOOTSTRAP_ADMIN_EMAIL --project $PROJECT
gcloud secrets versions disable 1 --secret BOOTSTRAP_ADMIN_PASSWORD --project $PROJECT

# Or delete them entirely
gcloud secrets delete BOOTSTRAP_ADMIN_EMAIL --project $PROJECT
gcloud secrets delete BOOTSTRAP_ADMIN_PASSWORD --project $PROJECT
```

**4.** All subsequent deployments go through the normal CD pipeline, which does not include the bootstrap secrets. The `BootstrapAdminService` is a silent no-op when the vars are absent.

> **Idempotent**: if you accidentally deploy with the bootstrap secrets again after the admin exists, `BootstrapAdminService` detects `AccountAlreadyExistsError` and skips silently — no duplicate is created.

---

## Keyless Authentication with Workload Identity Federation

Rather than storing a long-lived GCP service account key as a GitHub secret — a common but insecure practice — this project uses **Workload Identity Federation**.

How it works:

1. GitHub Actions generates a short-lived OIDC token signed by GitHub's identity provider
2. The token is exchanged with GCP's Security Token Service, which validates it and verifies it originated from this specific repository
3. GCP grants temporary credentials scoped to the `github-actions` service account
4. Credentials expire automatically after the workflow run — nothing is stored anywhere

The workflow's `id-token: write` permission enables this exchange. No credential rotation is needed.

---

## Secret Management

All sensitive configuration lives in **Google Secret Manager** and is injected into Cloud Run at container startup as environment variables. Secrets are never:

- committed to the repository
- embedded in Docker image layers
- passed as plaintext in deployment commands

Secrets are referenced by name in the Cloud Run deployment command:

```
--set-secrets="DATABASE_URL=DATABASE_URL:latest,JWT_PRIVATE_KEY=JWT_PRIVATE_KEY:latest,..."
```

The `:latest` suffix always resolves to the most recent active secret version. Adding a new version in Secret Manager takes effect on the next deployment without any pipeline changes.

---

## Cloud Run Configuration

| Setting       | Value                                | Rationale                                                                      |
| ------------- | ------------------------------------ | ------------------------------------------------------------------------------ |
| Port          | `8080`                               | Cloud Run default; matches `ENV PORT=8080` in the Dockerfile                   |
| Memory        | `512Mi`                              | Sufficient for the NestJS + Prisma workload; adjustable if needed              |
| CPU           | `1`                                  | Single vCPU; NestJS is single-threaded per instance                            |
| Min instances | `0` (scale to zero)                  | No cost when idle; suitable for a portfolio workload                           |
| Max instances | `3`                                  | Caps unexpected scaling and billing; increase for sustained production traffic |
| Health check  | `GET /health` via Docker HEALTHCHECK | Performs a real `SELECT 1` database ping; returns 503 on failure               |

**Cold starts**: scale-to-zero means the first request after a period of inactivity takes longer (typically 1–3 s for this image). Acceptable for a portfolio API; setting `--min-instances 1` eliminates cold starts at a small cost.

---

## Rollback

### API rollback

Cloud Run retains all previous immutable revisions. To instantly route traffic back to a prior revision:

```bash
# List revisions and find the one to restore
gcloud run revisions list \
  --service fast-feet-api \
  --region us-central1 \
  --project fast-feet-497419

# Route 100% of traffic to a specific revision
gcloud run services update-traffic fast-feet-api \
  --to-revisions REVISION-NAME=100 \
  --region us-central1 \
  --project fast-feet-497419
```

This is instantaneous — no rebuild, no redeployment.

### Database rollback

Prisma does not generate automatic down migrations. If a migration needs to be reversed:

1. Write a corrective migration that undoes the schema change
2. Push it as a new commit to `master`; CI/CD will apply it

For destructive migrations (dropped columns, renamed tables), **always verify against a staging environment first** and keep a manual backup before the deployment run.

---

## Observability

### Logs

Cloud Run streams `stdout` and `stderr` to **Cloud Logging** automatically. View logs with:

```bash
# Live log tail
gcloud run services logs tail fast-feet-api \
  --region us-central1 \
  --project fast-feet-497419

# Recent logs (last 50 entries)
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="fast-feet-api"' \
  --limit 50 \
  --project fast-feet-497419 \
  --format "table(timestamp, severity, textPayload)"
```

Logs are also visible in the [Google Cloud Console](https://console.cloud.google.com/run) under the service → Logs tab.

### Health check

```bash
curl https://fast-feet-api-560723623894.us-central1.run.app/health
# → { "status": "ok", "timestamp": "...", "uptime": 42.7 }
# → 503 if the database is unreachable
```

### Migration job logs

```bash
gcloud run jobs executions list \
  --job fast-feet-api-migrate \
  --region us-central1 \
  --project fast-feet-497419
```
