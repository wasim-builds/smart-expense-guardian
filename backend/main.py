from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine
from backend.domain import models
from backend.api.routes import transactions, analytics, accounts, chat, auth

app = FastAPI(title="Smart Expense Guardian API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
app.include_router(chat.router, prefix="/ai/chat", tags=["ai"])

@app.get("/")
def read_root():
    return {"message": "Smart Expense Guardian API V2 is running!"}
