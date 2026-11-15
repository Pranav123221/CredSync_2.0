from fastapi import APIRouter
from pydantic import BaseModel
from database import supabase

router = APIRouter()

class CustomerCreate(BaseModel):
    company_name: str
    phone: str
    email: str = None
    credit_limit: float = 0.0

@router.post("/")
def create_customer(customer: CustomerCreate):
    # Supabase DB me naya customer insert karega
    data = supabase.table("customers").insert({
        "company_name": customer.company_name,
        "phone": customer.phone,
        "email": customer.email,
        "credit_limit": customer.credit_limit
    }).execute()
    return {"message": "Customer created successfully", "data": data.data}

@router.get("/")
def get_customers():
    # Supabase se real customers fetch karega
    response = supabase.table("customers").select("*").execute()
    return response.data