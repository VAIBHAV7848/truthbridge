# 🌉 TruthBridge

**India's First Public Bridge Safety Accountability Platform**

> *"The Gambhira Bridge locals warned about cracks for months. The government recorded zero collapses that year. We built the system that makes both lies impossible."*

**TruthBridge** is a civic-tech platform designed to expose the gap between government infrastructure claims and ground reality. It empowers citizens to anonymously report damaged bridges, calculates live risk scores using established civil engineering guidelines, and publicly ranks government authorities on how fast they respond to danger.

Built for **Civilithon 2026** at KLE Technological University, Hubballi, Karnataka.

🌍 **Live Demo:** [https://truthbridge-six.vercel.app](https://truthbridge-six.vercel.app)

---

## 🎯 The Problem

In India, infrastructure failure is a silent crisis. 
- The government officially acknowledged only **42 bridge collapses** between 2019–2024.
- Independent media analysis verified over **170 collapses** in the same timeframe, resulting in hundreds of deaths.
- **The Gap:** Rural bridge collapses are frequently omitted from federal databases or classified under vague categories like "structural wear".

## 💡 Our Solution

TruthBridge shifts the power to the public. It relies on crowdsourced photographic evidence and automated risk algorithms to create an undeniable, public record of infrastructure decay. If authorities ignore a report for 30 days, it is permanently marked as **IGNORED** for everyone to see.

---

## ✨ Core Features

### 📡 1. Live Citizen Reporting (with Offline Support)
Citizens can report bridge damage (cracks, scour, foundation sinking) directly from their phones.
- **Verified Accounts:** Requires Citizen Login to prevent spam and ensure accountability.
- **Evidence-Based:** Enforces mandatory photo uploads (up to 5MB).
- **Offline Mode:** If a user is deep in rural India with no signal, the Progressive Web App (PWA) Service Worker saves the report as a draft and uploads it automatically when the network returns.

### 🗺️ 2. Real-time Interactive Map & Heatmap
- Visualizes all bridges with color-coded risk markers.
- Features a **Density Heatmap Overlay** to instantly spot regions with severe infrastructure decay.
- **Live Weather Integration:** Alerts users if heavy monsoon rainfall (>100mm/day) is hitting a highly vulnerable bridge.

### 🧮 3. IRC:81-1997 Risk Scoring Engine
We don't guess risk. We calculate it using the Indian Roads Congress guidelines.
Bridges are scored from 0–100 based on:
1. **Age Factor** (25%)
2. **Citizen Reports** (25%)
3. **Inspection Gap** (20%)
4. **Monsoon/Hydrological Risk** (20%)
5. **Seismic Zone** (10%)

### ⏱️ 4. The "Truth Counter" & Accountability Scores
- **Government vs. Reality:** A dramatic, animated dashboard showing the exact gap between official claims and ground reality.
- **Accountability Score:** Authorities are graded (0-100) based on their response rate to citizen reports. If an authority constantly ignores reports, their profile is marked as "Negligent" on the public dashboard.

### 🔒 5. Authority Dashboard
- Administrators (PWD Engineers, State Authorities) can log in to view a prioritized queue of "Critical" bridges.
- Admins can change report statuses (e.g., from `PENDING` to `ACTION_TAKEN`) and upload proof-of-repair photos.
- Built-in data analytics (Recharts) show the distribution of bridge risk across different districts.

### 🤖 6. AI-Powered Image Verification
To prevent users from uploading fake or generated images to skew the accountability dashboard, TruthBridge features an AI Image Detector.
- Uses a **Hugging Face Vision Transformer (ViT)** model (`dima806/ai_vs_real_image_detection`).
- **Secure Backend Proxy:** The image is sent to a serverless Vercel function, converted to Base64 JSON, and verified securely via the Hugging Face Router API without exposing API keys to the frontend.
- Instantly blocks uploads and warns the user if the image is detected as AI-generated with high confidence.

---

## 🛠️ Technology Stack

TruthBridge uses a modern **Supabase-first** architecture. We eliminated the need for a traditional backend (Node/Express) by leveraging PostgreSQL Row Level Security (RLS) and Edge Functions.

- **Frontend:** React 19 + Vite + React-Router-Dom
- **Styling:** Vanilla CSS Variables (Glassmorphism & Dark Mode) — *No Tailwind/Bootstrap used.*
- **Backend & Auth:** Supabase (PostgreSQL, GoTrue Auth)
- **Realtime:** Supabase WebSockets (for live report feeds)
- **Database Migrations:** Pure SQL
- **Mapping:** React-Leaflet + OpenStreetMap + Leaflet.heat
- **Data Visualization:** Recharts
- **AI Integration:** Hugging Face Inference API (ViT Image Classification)
- **Forms & Validation:** React-Hook-Form + Zod
- **Hosting:** Vercel (Frontend & Serverless API proxy)

---

## 🚀 How to Run Locally

Want to spin up TruthBridge on your own machine? It takes less than 2 minutes.

### 1. Clone & Install
```bash
git clone https://github.com/VAIBHAV7848/truthbridge.git
cd truthbridge
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root folder. You don't need to create your own database for local testing, you can safely connect to the hosted backend:

```env
VITE_SUPABASE_URL=https://truthbridge-six.vercel.app/api/supabase
VITE_SUPABASE_ANON_KEY=sb_publishable_D48FvPXjvI6FmnnElSBOqw_Vue35aiM

# Required for AI Image Validation
HUGGING_FACE_API_KEY=your_huggingface_token_here
```

### 3. Start the App
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔐 Admin Demo Credentials

To test the Authority Dashboard, click on "Live Map" -> wait for it to load, or navigate directly to `/admin/login`.

**Email:** `demo@truthbridge.app`  
**Password:** `TruthBridge@2026`  

*(Note: Please do not delete core demo bridges so others can view the platform).*

---

## 📂 Project Structure Snapshot

```text
src/
├── components/       # Reusable UI components (ProtectedRoute)
├── context/          # Global state (AuthContext)
├── hooks/            # Custom React hooks (useBridges)
├── lib/              # Core logic (Supabase client, Risk Calculator, Weather API)
└── pages/            # Main application routes
    ├── Home.jsx            # The Map & Heatmap
    ├── TruthDashboard.jsx  # Government vs Reality stats
    ├── ReportFeed.jsx      # Realtime public feed
    ├── ReportBridge.jsx    # Offline-capable reporting form
    ├── BridgeDetail.jsx    # Risk breakdown & WhatsApp sharing
    └── admin/              # Authority zone (Dashboard & Analytics)
```

---

*Because infrastructure shouldn't cost lives. Built with ❤️ for Civilithon 2026.*
