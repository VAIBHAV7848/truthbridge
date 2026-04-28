# 🌉 TruthBridge

**India's First Public Bridge Safety Accountability Platform**

> *"The Gambhira Bridge locals warned about cracks for months. The government recorded zero collapses that year. We built the system that makes both lies impossible."*

Built at **Civilithon 2026**, KLE Technological University, Hubballi.

---

## Architecture

TruthBridge uses a **Supabase-first** architecture — no Express server needed.

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite |
| **Backend** | Supabase (Postgres + Auth + Storage + Edge Functions) |
| **Maps** | Leaflet.js / React-Leaflet |
| **Charts** | Recharts |
| **Weather** | OpenWeatherMap API |
| **Hosting** | Vercel (frontend) + Supabase (backend) |

---

## Quick Start

### 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run these migrations in order:
   - `supabase/migrations/00001_initial_schema.sql`
   - `supabase/migrations/00002_storage_buckets.sql`
   - `supabase/migrations/00003_seed_data.sql`
3. Create an admin user in **Authentication → Users** → Add User
4. Link the auth user to authorities table by updating `auth_user_id`

### 2. Configure Environment

```bash
cp .env.example .env
# Fill in your Supabase URL and anon key
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## Project Structure

```
truthbridge/
├── src/
│   ├── lib/                    # Supabase client + data services
│   │   ├── supabase.js         # Supabase client init
│   │   ├── auth.js             # Auth service (admin login/logout)
│   │   ├── bridges.js          # Bridge CRUD
│   │   ├── reports.js          # Citizen report submission
│   │   ├── inspections.js      # Inspection logging
│   │   ├── alerts.js           # Alert management
│   │   ├── truthCounter.js     # Truth counter data
│   │   ├── riskCalculator.js   # IRC:81-1997 risk score engine
│   │   └── weather.js          # OpenWeatherMap integration
│   ├── context/
│   │   └── AuthContext.jsx     # Auth state provider
│   ├── hooks/
│   │   ├── useBridges.js       # Bridge data hooks
│   │   └── useWeather.js       # Weather data hook
│   ├── pages/
│   │   ├── Home.jsx            # Public map page
│   │   ├── BridgeDetail.jsx    # Single bridge detail
│   │   ├── ReportBridge.jsx    # Citizen report form
│   │   ├── TruthDashboard.jsx  # Truth counter page
│   │   └── admin/
│   │       ├── Login.jsx       # Admin login
│   │       └── Dashboard.jsx   # Admin dashboard
│   ├── App.jsx                 # Router + app shell
│   ├── App.css                 # Design tokens + base styles
│   └── main.jsx                # Entry point
├── supabase/
│   ├── migrations/
│   │   ├── 00001_initial_schema.sql    # Tables, enums, indexes, RLS
│   │   ├── 00002_storage_buckets.sql   # Storage buckets + policies
│   │   └── 00003_seed_data.sql         # 5 demo bridges + reports
│   └── functions/
│       ├── recalculate-risk/index.ts   # Risk score recalculation
│       └── auto-escalate/index.ts      # 30-day auto-escalation
├── .env.example
├── .gitignore
└── package.json
```

---

## Database Schema

| Table | Description |
|-------|-------------|
| `bridges` | Bridge inventory with location, structural details, risk scores |
| `reports` | Citizen-submitted damage reports with photos |
| `authorities` | Admin users linked to Supabase Auth |
| `inspections` | Inspection logs with PDF uploads |
| `alerts` | System-generated alerts for authorities |
| `truth_counter` | Government vs. reality data (single row) |

---

## Risk Score Formula (IRC:81-1997)

```
Score = Age Factor (0–25)
      + Citizen Reports (0–25)
      + Inspection Gap (0–20)
      + Monsoon Risk (0–20)
      + Seismic Zone (0–10)

0–30  = 🟢 SAFE
31–60 = 🟡 MONITOR
61–80 = 🟠 WARNING
81–100 = 🔴 CRITICAL
```

---

## Security Model

- **RLS enabled** on all tables
- **Anon key** only in the browser — enforces public read access
- **Service role key** only in Edge Functions (server-side)
- **Anonymous reporting** — no citizen accounts required
- **Admin auth** via Supabase Auth (email/password)
- **Storage policies** — citizens upload report photos; only admins upload proofs and PDFs

---

## Admin Credentials (Demo)

Create via Supabase Dashboard → Authentication → Add User:
```
Email: admin@hdmc.karnataka.gov.in
Password: truthbridge2026
```

Then link the auth user to the authorities table.
