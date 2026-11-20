from fastapi import APIRouter
from database import supabase
from datetime import date, datetime

router = APIRouter()


def _parse_due_date(raw_due_date) -> date:
    if not raw_due_date:
        return date.today()
    if isinstance(raw_due_date, date) and not isinstance(raw_due_date, datetime):
        return raw_due_date
    if isinstance(raw_due_date, datetime):
        return raw_due_date.date()

    text = str(raw_due_date).strip()
    try:
        return date.fromisoformat(text[:10])
    except ValueError:
        try:
            return datetime.fromisoformat(text.replace("Z", "+00:00")).date()
        except ValueError:
            return date.today()


def _safe_float(val, default: float = 0.0) -> float:
    if val is None or val == "":
        return default
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


def _extract_company_name(credit_row: dict) -> str:
    customer_obj = credit_row.get("customers")
    if isinstance(customer_obj, list):
        if customer_obj and isinstance(customer_obj[0], dict):
            return customer_obj[0].get("company_name") or "Unknown"
        return "Unknown"
    if isinstance(customer_obj, dict):
        return customer_obj.get("company_name") or "Unknown"
    return "Unknown"


@router.get("/metrics")
def get_dashboard_metrics():
    customers = supabase.table("customers").select("*").execute().data or []
    credits = supabase.table("credits").select("*, customers(company_name)").execute().data or []
    payments = supabase.table("payments").select("*").execute().data or []

    # Agar DB mein koi credit invoice nahi hai, toh fallback demo + customer data dikhao
    if len(credits) == 0:
        return {
            "metrics": {
                "total_outstanding": "₹12,50,000",
                "total_overdue": "₹4,85,000",
                "collection_efficiency": "78.4%",
                "avg_dso": "24 Days"
            },
            "aged_debt": [
                {"name": "Current", "amount": 450000},
                {"name": "1-30 Days", "amount": 315000},
                {"name": "31-60 Days", "amount": 260000},
                {"name": "61-90 Days", "amount": 140000},
                {"name": "90+ Days", "amount": 85000}
            ],
            "top_debtors": [
                {
                    "id": c.get("id", idx),
                    "name": c.get("company_name") or "Unknown",
                    "amount": f"₹{_safe_float(c.get('credit_limit')):,.0f}",
                    "days": "Active Limit",
                    "risk": "Low"
                }
                for idx, c in enumerate(customers)
            ] if customers else [
                {"id": 1, "name": "KPI Industries", "amount": "₹3,88,600", "days": "23 Days", "risk": "Medium"},
                {"id": 2, "name": "Dran Corp", "amount": "₹6,52,400", "days": "83 Days", "risk": "High"}
            ]
        }

    # Live Calculation from PostgreSQL
    today = date.today()
    open_credits = [
        c for c in credits
        if str(c.get("status") or "").strip().upper() != "PAID"
    ]
    total_outstanding = sum(_safe_float(c.get("amount")) for c in open_credits)
    total_paid = sum(_safe_float(p.get("amount_paid")) for p in payments)
    total_billed = total_outstanding + total_paid

    overdue_amount = 0.0
    buckets = {
        "Current": 0.0,
        "1-30 Days": 0.0,
        "31-60 Days": 0.0,
        "61-90 Days": 0.0,
        "90+ Days": 0.0
    }
    debtor_map = {}

    for c in open_credits:
        amt = _safe_float(c.get("amount"))
        due_dt = _parse_due_date(c.get("due_date"))
        days_past = (today - due_dt).days
        comp_name = _extract_company_name(c)

        if days_past <= 0:
            buckets["Current"] += amt
        elif days_past <= 30:
            buckets["1-30 Days"] += amt
            overdue_amount += amt
        elif days_past <= 60:
            buckets["31-60 Days"] += amt
            overdue_amount += amt
        elif days_past <= 90:
            buckets["61-90 Days"] += amt
            overdue_amount += amt
        else:
            buckets["90+ Days"] += amt
            overdue_amount += amt

        past_clamped = max(0, days_past)
        if comp_name not in debtor_map:
            debtor_map[comp_name] = {"amount": 0.0, "max_days": past_clamped}
        debtor_map[comp_name]["amount"] += amt
        debtor_map[comp_name]["max_days"] = max(debtor_map[comp_name]["max_days"], past_clamped)

    eff = round((total_paid / total_billed * 100), 1) if total_billed > 0 else 100.0
    sorted_debtors = sorted(debtor_map.items(), key=lambda x: x[1]["amount"], reverse=True)[:5]

    avg_dso_days = (
        max(12, sum(d[1]["max_days"] for d in sorted_debtors) // len(sorted_debtors))
        if sorted_debtors
        else 12
    )

    return {
        "metrics": {
            "total_outstanding": f"₹{total_outstanding:,.0f}",
            "total_overdue": f"₹{overdue_amount:,.0f}",
            "collection_efficiency": f"{eff}%",
            "avg_dso": f"{avg_dso_days} Days"
        },
        "aged_debt": [{"name": k, "amount": v} for k, v in buckets.items()],
        "top_debtors": [
            {
                "id": idx,
                "name": name,
                "amount": f"₹{info['amount']:,.0f}",
                "days": f"{info['max_days']} Days",
                "risk": "High" if info["max_days"] > 30 else ("Medium" if info["max_days"] > 0 else "Low")
            }
            for idx, (name, info) in enumerate(sorted_debtors)
        ]
    }