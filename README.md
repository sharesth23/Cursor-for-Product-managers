
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
