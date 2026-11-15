from fastapi import APIRouter
from pydantic import BaseModel
from database import supabase
from datetime import date, timedelta
import uuid

router = APIRouter()

class CreditCreate(BaseModel):
    customer_id: str
    amount: float
    due_days: int = 15

class PaymentRequest(BaseModel):
    payment_method: str = "UPI"
    reference_id: str = "TXN-LIVE"

@router.get("/")
def get_all_credits():
    res = supabase.table("credits").select("*, customers(company_name, phone)").order("created_at", desc=True).execute()
    return res.data

@router.post("/")
def create_credit(credit: CreditCreate):
    inv_num = f"INV-{str(uuid.uuid4())[:6].upper()}"
    issue_dt = date.today()
    due_dt = issue_dt + timedelta(days=credit.due_days)
    status = "OVERDUE" if credit.due_days < 0 else "OPEN"

    data = supabase.table("credits").insert({
        "customer_id": credit.customer_id,
        "invoice_number": inv_num,
        "amount": credit.amount,
        "issue_date": str(issue_dt),
        "due_date": str(due_dt),
        "status": status
    }).execute()
    return {"message": "Invoice created", "data": data.data}

@router.post("/{credit_id}/pay")
def mark_credit_paid(credit_id: str, req: PaymentRequest = PaymentRequest()):
    credit_res = supabase.table("credits").select("*").eq("id", credit_id).execute()
    if not credit_res.data:
        return {"error": "Credit not found"}
    
    c = credit_res.data[0]
    supabase.table("credits").update({"status": "PAID"}).eq("id", credit_id).execute()
    supabase.table("payments").insert({
        "customer_id": c["customer_id"],
        "credit_id": credit_id,
        "amount_paid": c["amount"],
        "payment_method": f"{req.payment_method} ({req.reference_id})",
        "status": "SUCCESS"
    }).execute()
    return {"message": "Payment recorded successfully"}

@router.get("/payments")
def get_all_payments():
    res = supabase.table("payments").select("*, customers(company_name), credits(invoice_number)").execute()
    return res.data