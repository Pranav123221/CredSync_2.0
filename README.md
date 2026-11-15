<div align="center">

# CredSync — Enterprise FinOps & AI Accounts Receivable Platform

**Real-time B2B credit ledger synchronization, aging debt analytics, Gemini AI risk scoring, and instant Razorpay UPI QR settlements.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://credsync-finops.vercel.app)
[![API Docs](https://img.shields.io/badge/FastAPI_Docs-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://credsync-2-0.onrender.com/docs)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)

[Live Application](https://credsync-finops.vercel.app) • [Interactive Swagger API](https://credsync-2-0.onrender.com/docs) • [Report Bug](https://github.com/Pranav123221/CredSync_2.0/issues)

</div>

---

## Overview

**CredSync** is a full-stack FinOps and Accounts Receivable (AR) automation platform designed for B2B enterprises and MSMEs. It replaces static spreadsheets with an automated credit ledger that tracks invoice aging buckets, evaluates counterparty default risk using **Google Gemini AI**, and enables instant multi-mode collections through a **Razorpay-styled checkout gateway** with offline-compatible dynamic UPI QR generation.

---

## Key Features

- **Real-Time FinOps KPIs:** Tracks *Total Outstanding AR*, *Overdue Exposure*, *Collection Efficiency (%)*, and *Average Days Sales Outstanding (DSO)* dynamically from PostgreSQL.
- **Aged Debt Distribution Engine:** Categorizes open invoices into standard accounting buckets (`Current`, `1–30 Days`, `31–60 Days`, `60+ Days`) with interactive Recharts visualizations.
- **Gemini AI Risk & Cashflow Insights:** Analyzes debtor payment velocity, overdue exposure, and credit utilization to generate actionable collection recommendations and risk tiers (`Low`, `Medium`, `High`).
- **Razorpay-Powered Payment Gateway & Dynamic UPI QR:** Built-in checkout modal supporting **UPI / Scannable Dynamic QR (`qrcode.react`)**, **Corporate Cards**, and **NetBanking** with instant ledger reconciliation.
- **Customer & Credit Limit Governance:** Manages B2B accounts, approved credit limits, invoice issuance, and immutable payment audit logs.

---

## System Architecture

```text
┌─────────────────────────────┐         REST / JSON         ┌─────────────────────────────┐
│     React + Vite Client     │ ◄─────────────────────────► │       FastAPI Backend       │
│  (Tailwind, Recharts, QR)   │      (Hosted on Vercel)     │      (Hosted on Render)     │
└─────────────────────────────┘                             └──────────────┬──────────────┘
                                                                           │
                                                   ┌───────────────────────┴───────────────────────┐
                                                   ▼                                               ▼
                                    ┌─────────────────────────────┐                 ┌─────────────────────────────┐
                                    │   Supabase (PostgreSQL)     │                 │      Google Gemini API      │
                                    │ Customers, Credits, Ledger  │                 │   Risk & Cashflow Insights  │
                                    └─────────────────────────────┘                 └─────────────────────────────┘



Tech Stack
LayerTechnologiesFrontendReact, Vite, Tailwind CSS, Recharts, Lucide Icons, qrcode.react, AxiosBackendPython, FastAPI, Uvicorn, PydanticDatabasePostgreSQL (hosted on Supabase)AI & IntelligenceGoogle Generative AI (gemini-flash / gemini-pro insights pipeline)Cloud & DeploymentVercel (Frontend), Render (Backend Web Service), GitHub

CredSync/
├── backend/
│   ├── routers/
│   │   ├── ai_insights.py      # Gemini AI financial risk & recommendation endpoints
│   │   ├── credits.py          # Invoice creation, overdue tracking & Razorpay settlement
│   │   ├── customers.py        # B2B customer & credit limit CRUD operations
│   │   └── dashboard.py        # KPI aggregations, DSO & aged debt analytics
│   ├── database.py             # Supabase PostgreSQL client initialization
│   ├── main.py                 # FastAPI app entry point & CORS middleware
│   └── requirements.txt        # Production Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Dashboard.jsx   # Main FinOps workspace, charts & Razorpay QR modal
│   │   ├── layouts/
│   │   │   └── Sidebar.jsx     # Navigation shell
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── database/
│   └── schema.sql              # PostgreSQL tables & relational constraints
└── README.md

Local Setup & Installation
1. Clone the Repository
git clone [https://github.com/Pranav123221/CredSync_2.0.git](https://github.com/Pranav123221/CredSync_2.0.git)
cd CredSync_2.0

2. Backend Setup (FastAPI)
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt

Create a .env file inside backend/ with your credentials:
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_or_service_key
GEMINI_API_KEY=your_google_gemini_api_key

Start the FastAPI server:
uvicorn main:app --reload --port 8000


3. Frontend Setup (React + Vite)
Open a new terminal in the frontend/ directory:

cd frontend
npm install
npm run dev

VITE_API_URL=http://localhost:8000/api

API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard/metrics` | Fetch AR KPIs, aged debt distribution, and top debtors |
| `GET` / `POST` | `/api/customers/` | Retrieve registered accounts or onboard a new B2B customer |
| `GET` / `POST` | `/api/credits/` | List active invoices or issue a new credit invoice |
| `POST` | `/api/credits/{id}/pay` | Settle an invoice via Razorpay UPI/Card/NetBanking and log payment |
| `GET` | `/api/credits/payments` | Fetch verified payment settlement history |
| `GET` | `/api/ai/` | Generate Gemini AI credit risk & collection insights |

Author
Pranav Sharma

GitHub: @Pranav123221

LinkedIn: Pranav Sharma