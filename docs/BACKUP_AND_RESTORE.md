# OrderMind — Backup & Disaster Recovery Runbook

This guide covers operational backup, tenant export, and recovery procedures for OrderMind deployments.

---

## 1. Automated Tenant JSON Export (In-App)

Every workspace owner can download a complete point-in-time snapshot of their workspace directly from the API or Settings page:

- **Endpoint:** `GET /api/workspace/export`
- **Scope:** Returns all tenant-isolated data for the active workspace:
  - Workspace details & members
  - Client directory & historical CRM data
  - Dump threads, raw messages, and parsed transcripts
  - Extracted LLM claims & evidence linkages
  - Orders, timeline events, and immutable snapshot versions
  - Tasks, pinned notes, and schedule events
  - Company Brain pricing matrices, machinery rules, and finish specs
  - Customer memory facts and preferences
  - Attachment metadata and references

```bash
# Example curl using session cookie:
curl -H "Cookie: ordermind_token=<JWT_TOKEN>" \
  https://your-ordermind-domain.com/api/workspace/export \
  -o ordermind_workspace_backup.json
```

---

## 2. MongoDB Database-Level Backup (mongodump)

For operational infrastructure backups covering all collections and GridFS file chunks:

### Automated Daily Dump via Cron:
```bash
mongodump --uri="$MONGODB_URI" \
  --gzip \
  --archive="/backups/ordermind_$(date +%Y%m%d_%H%M%S).gz"
```

### Collections Included:
- `users` — account credentials (bcrypt hashed)
- `workspaces` — tenant root entities
- `members` — role assignments (OWNER, ADMIN, OPERATOR)
- `clients` — customer profiles, contacts, packaging requirements
- `conversations` & `messages` — multi-channel customer communications
- `extracted_events` — Zod-validated AI evidence claims
- `orders` & `order_events` & `order_versions` — deterministic state timeline
- `tasks` & `notes` & `schedule_events` — operational tooling
- `company_brain` — workspace specifications and pricing tables
- `customer_memory` — verified shorthand preferences
- `attachments` & `fs.files` & `fs.chunks` — binary files stored in GridFS

---

## 3. Disaster Recovery & Restoration (mongorestore)

To restore a full backup archive into a target cluster:

```bash
mongorestore --uri="$MONGODB_URI" \
  --gzip \
  --archive="/backups/ordermind_YYYYMMDD_HHMMSS.gz" \
  --drop
```

> **Warning:** `--drop` will replace existing collections in the target database.

---

## 4. Periodic Health & Readiness Monitoring

OrderMind exposes a zero-auth public health endpoint for Kubernetes, Docker, and Render uptime monitors:

- **Endpoint:** `GET /api/health`
- **Responses:**
  - `200 OK`: Database connected, LLM initialized, traces active.
  - `503 Service Unavailable`: MongoDB disconnected or connection pool failure.
