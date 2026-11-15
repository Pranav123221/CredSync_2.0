from fastapi import APIRouter
import google.generativeai as genai
import os
from database import supabase

router = APIRouter()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-3.8-flash")

@router.get("/")
def get_ai_risk_insights():
    try:
        customers = supabase.table("customers").select("company_name, credit_limit").execute().data
        credits = supabase.table("credits").select("amount, status, due_date").execute().data
    except Exception:
        customers = []
        credits = []

    # Agar database mein data hai toh Live Gemini AI se analysis karwao
    if customers:
        prompt = (
            f"You are an enterprise credit risk analyst for CredSync. "
            f"Analyze this data: Customers={customers}, Credits={credits}. "
            f"Write 2 crisp, actionable 1-sentence insights (no markdown, no asterisks, separate by a newline)."
        )
        try:
            response = model.generate_content(prompt)
            lines = [line.strip().replace("*", "").replace("-", "") for line in response.text.strip().split("\n") if line.strip()]
            
            insight_1 = lines[0] if len(lines) > 0 else f"Active credit exposure monitored across {len(customers)} accounts."
            insight_2 = lines[1] if len(lines) > 1 else "Maintain automated follow-ups for upcoming invoice due dates."

            return [
                {
                    "id": 1,
                    "title": "Gemini Live Risk Assessment",
                    "description": insight_1,
                    "icon": "Lightbulb"
                },
                {
                    "id": 2,
                    "title": "Collection & Exposure Strategy",
                    "description": insight_2,
                    "icon": "TrendingUp"
                },
                {
                    "id": 3,
                    "title": "Portfolio Monitoring Active",
                    "description": f"Real-time tracking enabled for {len(customers)} registered business accounts.",
                    "icon": "ShieldAlert"
                }
            ]
        except Exception as e:
            # Agar API key quota ya network issue aaye toh graceful fallback
            return [
                {
                    "id": 1,
                    "title": "Portfolio Exposure Alert",
                    "description": f"Monitoring {len(customers)} active accounts with total credit limit ₹{sum(c.get('credit_limit', 0) for c in customers):,.0f}.",
                    "icon": "AlertTriangle"
                },
                {
                    "id": 2,
                    "title": "Smart Follow-up Recommendation",
                    "description": "Prioritize payment reminders for accounts nearing 80% credit limit utilization.",
                    "icon": "MessageSquare"
                }
            ]

    # Default Demo Mode (jab DB empty ho)
    return [
        {"id": 1, "title": "Customer Payment Risk Analysis", "description": "3 customers showing repeated late payment patterns.", "icon": "AlertTriangle"},
        {"id": 2, "title": "Collection Forecasting", "description": "Expected collections for this week estimated at ₹1.2M.", "icon": "TrendingUp"}
    ]