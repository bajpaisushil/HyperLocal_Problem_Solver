# 🏙️ NagarFix — AI-Powered Society Operations

> Run your apartment society on autopilot: AI complaint triage, a verified vendor marketplace, transparent finances, a chat-with-your-data assistant, auto-generated committee reports, community engagement and a visitor log — built for the **self-managed small communities** that still run on WhatsApp + Excel.
>
> *Name: **Nagar** (Sanskrit, "town/city") + **Fix**.*

Built with **Next.js (App Router, TypeScript)** + **Express / Node (TypeScript)** + **MongoDB / Mongoose** — a fully typed MERN stack. Installable **PWA**.

---

## Why it's different

Most society/civic apps just *collect* problems. NagarFix *acts* on them and closes the accountability loop.

| Gap most platforms leave open | How NagarFix addresses it |
|---|---|
| **AI operations** — data is collected but never acted on | AI **auto-triages** every complaint (category, severity, summary, duplicate detection) and **auto-prioritizes** via an SLA engine. One-click **committee reports** + **predictive ops** (water-tanker forecast, abnormal-consumption flags). |
| **Small societies underserved** (10–50 flats, self-managed RWAs) | Lightweight onboarding, in-memory demo, zero-config — no enterprise rollout needed. |
| **Vendor ecosystem** — apps log issues but don't solve them | Assign **verified, rated vendors** to complaints; track **SLA performance** and **spend per vendor**. |
| **Financial opacity** — residents distrust RWA finances | Live **balance sheet**, dues collection %, **spend-by-category**, **invoice OCR** (stub) — visible to *every* resident. |
| **No local AI assistant** | **Chat with your data**: "show pending dues over ₹5,000", "which vendors cost us most", "list overdue complaints". |
| **Poor resident engagement** — just a "complaint app" | **Community feed**: announcements, events (RSVP), marketplace, polls, likes. |
| **Multi-property owners ignored** | Owners can hold multiple units; **visitor log** + per-unit dues support remote owners. |

### Signature features
- 🧠 **AI triage** — category + severity + summary + nearby-duplicate detection at report time
- ⏱️ **Accountability SLA engine** — per-category deadlines, public overdue flags
- 🤝 **Trust-but-verify resolution** — committee submits photo proof; residents confirm (2 ✓ closes) or dispute (2 ✗ reopens)
- 🔧 **Vendor marketplace** — verified vendors, ratings, SLA scorecards, spend tracking
- 💰 **Open finances** — dues, payments (stub gateway), expenses, balance sheet, OCR stub
- 💬 **Local AI assistant** — natural-language Q&A over the society's live data
- 📊 **Auto committee reports** + 🔮 **predictive ops** + 🎤 **voice reporting** + 📱 **PWA**
- 🏆 **Gamification** — points & badges for reporting, confirming, paying, rating

> **AI is stubbed but swappable.** All AI lives behind a clean interface in [`backend/src/services/aiService.ts`](backend/src/services/aiService.ts). Replace the heuristic bodies with Anthropic **Claude** (`claude-haiku-4-5` for triage, `claude-opus-4-8` for the assistant/report) — the controllers never change.

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Recharts, PWA |
| Backend | Node + Express 4, TypeScript (run via `tsx`), JWT auth, Multer uploads |
| Database | MongoDB + Mongoose 8 (auto in-memory fallback for zero-config demo) |

```
HyperLocal_Problem_Solver/
├── backend/          # Express + MongoDB API (TypeScript)
│   └── src/
│       ├── models/        Society, Unit, User, Complaint, Vendor, Invoice, Expense, Post, Visitor
│       ├── controllers/   auth, society, complaint, vendor, finance, community, visitor, assistant, report, dashboard
│       ├── services/      aiService (triage, assistant, report, predictions), societyData (aggregations)
│       ├── routes/        REST routes per module
│       └── server.ts      app entry + auto-seed
└── frontend/         # Next.js app (TypeScript)
    └── src/
        ├── app/           dashboard, complaints, finance, vendors, community, visitors, assistant, reports, directory, me, auth
        ├── components/     Navbar, ComplaintCard, ui (badges/cards/charts)
        ├── context/        AuthContext
        └── lib/            api client, types, constants, formatters
```

---

## Quick start

**Prerequisites:** Node 18+ (works on Node 24). MongoDB is **optional** — without it, the backend boots an in-memory database and **auto-seeds demo data**.

### 1) Backend
```bash
cd backend
cp .env.example .env      # optional: set JWT_SECRET / MONGODB_URI
npm install
npm start                 # http://localhost:5000  (auto-seeds demo data in-memory)
```

### 2) Frontend
```bash
cd frontend
cp .env.example .env.local # NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev                # http://localhost:3000
```

### Demo accounts (password: `password123`)
| Role | Email | Can do |
|---|---|---|
| Committee (RWA admin) | `committee@demo.com` | Everything: assign vendors, resolve, manage finances/units, post, reports |
| Resident | `asha@demo.com` | Report complaints, pay dues, verify fixes, rate vendors, engage |
| Resident | `vikram@demo.com` | second resident (for testing 2-confirmation resolution) |

> Using a **persistent** MongoDB? Seed manually with `npm run seed` in `backend/`.

---

## Environment

**backend/.env**
| Var | Default | Notes |
|---|---|---|
| `PORT` | `5000` | API port |
| `CLIENT_URL` | `http://localhost:3000` | CORS origin |
| `JWT_SECRET` | — | Set a long random string |
| `MONGODB_URI` | _(empty)_ | Empty → in-memory + auto-seed; set a URI for persistence |
| `SEED_ON_START` | `false` | Force seeding on boot even with a persistent DB |

**frontend/.env.local**
| Var | Default |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` |

---

## Scripts
**backend:** `npm start` (run) · `npm run dev` (watch) · `npm run typecheck` · `npm run seed`
**frontend:** `npm run dev` · `npm run build` · `npm start` · `npm run lint`

---

## Known stubs & notes
- **AI** is heuristic (no API key needed) — swappable to Claude in `aiService.ts`.
- **Payments** & **invoice OCR** are stubbed (no gateway / vision model wired).
- **Predictive ops** use a synthetic consumption series for the demo; feed real meter data in production.
- **In-memory DB** data is ephemeral (lost on restart). Use `MONGODB_URI` to persist.
- **Security:** pinned to Next.js 14.2.x (latest LTS-line patch). A few remaining advisories only resolve by upgrading to Next 16 (a breaking major) — deferred to keep the MVP stable; do it before a real production deploy.

## Roadmap (remaining gap items)
Real payment gateway + UPI, vision-model invoice OCR, IoT/meter-fed predictions, richer multi-property owner dashboards (rent/lease tracking), skill-exchange & carpooling in the community module.
