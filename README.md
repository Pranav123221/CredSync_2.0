# CredSync Enterprise V2

This is the ultimate, presentation-ready version of the CredSync platform, explicitly designed based on the advanced UI requirements (Dark sidebar, Metric cards, Aged Debt Recharts, and Gemini AI Insights).

## Highlights for Demo
- **Zero-Error Guarantee for Presentation:** The FastAPI backend is pre-configured to return robust structural data for the Dashboard metrics and AI Insights even without the PostgreSQL database connected initially, so you can run the frontend instantly and show the UI to your Sir.
- **Advanced UI:** Tailwind CSS + Recharts + Lucide Icons exactly matching the reference images.

## Quick Start (Run within 2 minutes)

### 1. Start Backend (Terminal 1)
```bash
cd backend
python -m venv venv
# Activate venv: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
pip install -r requirements.txt
uvicorn main:app --reload
```
*Backend will run on http://localhost:8000*

### 2. Start Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
*Frontend will run on http://localhost:5173*
