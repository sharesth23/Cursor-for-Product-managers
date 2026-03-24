
# Cursor for Product Managers 
This repo contains the first MVP skeleton for **Cursor for Product Managers**:
- **Flutter mobile app** (iOS/Android) for product discovery + specs + build plan + PR scaffolds
- **Backend API + workers** to index GitHub repos, ingest evidence, generate opportunities/specs/plans/prompts, and create PR scaffolds
---

## One-page PRD (MVP)

### Product name
Cursor for Product Managers

### Problem
Teams struggle to reliably go from messy discovery inputs (interviews, tickets, notes) to clear, evidence-backed product decisions and implementation-ready plans. AI tools help write code once requirements are known, but there’s no system that supports the **full loop**: evidence → decision → spec → build plan → agent-ready prompts → PR scaffold, with **traceability**.

### Target users (MVP)
- **Seed startups**: founders / early PMs / eng leads who want to decide what to build next and ship fast.
- **Enterprise PM org pilots**: a small working group (PM + design + eng lead) that needs traceability and review gates, without full enterprise procurement features on day 1.

### Value proposition
An AI-native product discovery system that:
- connects to a **GitHub repo from day 1** (including mobile apps),
- turns evidence into **ranked opportunities** with citations,
- generates a **repo-aware spec** and **agent-ready task prompts**,
- and can create a **safe PR scaffold** (previewed, human-triggered).

### MVP scope (what we ship)
**Mobile app (Flutter)**
- GitHub connect → repo select → indexing status
- Repo Map (best-effort): screens/navigation, networking layer, persistence layer, analytics wrapper
- Evidence upload (text/markdown/CSV initially) + evidence viewer with extracted “atoms”
- Opportunities list (ranked) with “why” citations
- Spec v1 (structured editor) with citations + repo touchpoints
- Build Plan (tasks + dependencies) and “Generate agent prompts”
- PR scaffold preview + create PR (conservative levels)

**Backend**
- GitHub App/OAuth (GitHub first)
- Repo indexing pipeline (Flutter + Kotlin + Swift supported day 1; best-effort heuristics)
- Evidence ingestion + atom extraction + clustering (v1)
- Generation endpoints for opportunities/spec/plan/prompts (v1)
- PR scaffold creation:
  - **Level 0**: PR with body + checklist only (no code changes)
  - **Level 1**: add `specs/<feature>/` artifacts (spec/plan/prompts) (minimal repo changes)
  - **Level 2 (later)**: minimal wiring (feature flag + placeholder screen) only when confidence is high
- Safety rails: denylist sensitive paths, diff preview, audit log

### Non-goals (MVP)
- Full Figma authoring
- Deep product analytics connectors (Amplitude/GA4) beyond manual import
- Auto-merge or autonomous implementation
- Full enterprise suite (SSO/SCIM/data residency) beyond lightweight gates + audit log

### Key user journey (MVP)
1. Connect GitHub → pick repo
2. Index repo → browse Repo Map
3. Upload evidence → view extracted atoms/themes
4. Ask “what should we build next for onboarding?” → ranked opportunities w/ citations
5. Select opportunity → Spec v1 (repo-aware)
6. Generate Build Plan + per-task agent prompts
7. Preview PR scaffold → create PR (Level 0/1)

### Success metrics
- **Activation**: % of new workspaces that connect GitHub + complete first index
- **Time-to-first-value**: median time to first opportunity list < 15 minutes
- **Trust**: % of “why” claims with citations (target > 90% or labeled “Assumption”)
- **Downstream**: % that generate prompts and/or create a PR scaffold within 7 days
- **Retention**: weekly active workspaces generating specs/plans

### Risks & mitigations (MVP)
- **Repo inference wrong (mobile diversity)** → show confidence + “why”, default to safe PR scaffolds (Level 0/1)
- **Hallucinated rationale** → citations required for claims; explicit assumptions section
- **Dangerous repo writes** → explicit user trigger + diff preview + denylist + audit log
- **Latency on mobile** → async jobs w/ progress; caching; partial results

### Launch plan (MVP)
- TestFlight + Play internal testing with a Discord cohort
- In-app Discord invite + “first spec in 15 minutes” guided flow

---

## Development

### Repo layout
- `backend/` FastAPI API + background workers
- `mobile/` Flutter app (iOS/Android)