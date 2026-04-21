# DevSecOps Project

A lab project demonstrating a full DevSecOps pipeline: a 3-tier order-management web application with automated security gates, containerised deployments, and GitOps delivery on Kubernetes.

---

## Architecture

```
Browser
  └── Ingress (Traefik / k3s)
        ├── /        → frontend  (React, port 80)
        └── /api     → api       (Express, port 4000)
                          ├── → external-service (Express, port 4001)
                          └── → postgres         (port 5432)
```

### Services

| Service | Tech | Role |
|---|---|---|
| **frontend** | React | SPA — create orders, display order list |
| **api** | Node.js / Express | REST API (`GET /api/orders`, `POST /api/orders`, `GET /health`) |
| **external-service** | Node.js / Express | Scoring microservice — returns APPROVE or REVIEW |
| **postgres** | PostgreSQL | Persists orders (id, customer_name, amount, status, created_at) |

### Order creation flow

1. User fills the form on the frontend and submits
2. Frontend POSTs `{ customerName, amount }` to `api`
3. `api` calls `external-service /evaluate` → receives `APPROVE` or `REVIEW`
4. `api` inserts the order in Postgres with status `APPROVED` or `PENDING_REVIEW`
5. Frontend refreshes the order list

---

## Repository Structure

```
.
├── services/
│   ├── api/                  # Express REST API
│   ├── external-service/     # Scoring microservice
│   └── frontend/             # React SPA
├── infra/
│   ├── db/init.sql           # PostgreSQL schema
│   ├── argocd/               # ArgoCD Application manifest
│   └── k3s/
│       ├── base/             # Kubernetes base manifests (Kustomize)
│       └── overlays/prod/    # Production overlay (image tags)
└── .github/workflows/
    └── ci-cd.yml             # GitHub Actions CI/CD pipeline
```

---

## CI/CD Pipeline

Triggered on every push and pull request to `main`. Jobs run sequentially — any failure blocks the next stage.

```
security_checks → tests_and_sca → build_and_push → image_scan → update_manifests
```

| Job | Tool | Purpose |
|---|---|---|
| **security_checks** | Gitleaks | Detect secrets committed to the repository |
| **tests_and_sca** | Jest + `npm audit` | Run unit tests; block on HIGH+ CVEs in dependencies |
| **build_and_push** | Docker Buildx → GHCR | Build and publish images tagged `sha-<short-sha>` |
| **image_scan** | Trivy | Block on CRITICAL CVEs in built images |
| **update_manifests** | `sed` + git push | Update Kustomize overlay with new image tag → triggers ArgoCD |

---

## Kubernetes / Infrastructure

- **Cluster:** k3s
- **Namespace:** `devsecops`
- **GitOps:** ArgoCD watches `infra/k3s/overlays/prod` with `automated + selfHeal + prune`

### Security controls in place

| Control | Detail |
|---|---|
| Non-root containers | `runAsNonRoot: true`, `runAsUser: 10001` |
| Read-only filesystem | `readOnlyRootFilesystem: true` |
| Dropped capabilities | `capabilities: drop: ["ALL"]` |
| Seccomp | `seccompProfile: RuntimeDefault` |
| No SA token automount | `automountServiceAccountToken: false` |
| Dedicated service accounts | One per service (`sa-api`, `sa-frontend`, etc.) |
| RBAC least-privilege | Services can only read ConfigMaps |
| Network policies | Default-deny all; explicit allow per service pair |

---

## Local Development

### Prerequisites

- Docker & Docker Compose (or k3s for full stack)
- Node.js 20+

### Run a service locally

```bash
cd services/api
npm install
npm test
npm start
```

### Environment variables (api)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | Listening port |
| `DB_HOST` | — | PostgreSQL hostname |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USER` | — | Database user |
| `DB_PASSWORD` | — | Database password |
| `DB_NAME` | — | Database name |
| `EXTERNAL_SERVICE_URL` | `http://localhost:4001` | URL of the scoring service |
| `LOG_LEVEL` | `info` | Pino log level |

---

## Known Limitations (intentional — for teaching)

This project is purposefully incomplete in several areas to serve as discussion material:

- No authentication or authorisation on the API
- No rate limiting
- No input validation on order fields
- CORS open to `*`
- Naive scoring rule in `external-service` (trivially bypassable)
- DB credentials hardcoded in the Kubernetes manifest (should use a Secret)
- Trivy only blocks CRITICAL severities, not HIGH
- Frontend `npm audit` failures are silently ignored (`|| true`)

See [ANALYSIS.md](./ANALYSIS.md) for the full breakdown.
