from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import dashboard, ai_insights, customers, credits

app = FastAPI(title="CredSync Enterprise API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(ai_insights.router, prefix="/api/ai", tags=["AI Insights"])
app.include_router(customers.router, prefix="/api/customers", tags=["Customers"])
app.include_router(credits.router, prefix="/api/credits", tags=["Credits"])

@app.get("/")
def health_check():
    return {"status": "operational", "system": "CredSync Backend V2"}