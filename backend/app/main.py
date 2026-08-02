from fastapi import FastAPI

from app.database.db import engine
from app.database.base import Base

from app.routers import (
    users,
    audience,
    campaign,
    template,
    dashboard
)
from app.models import User, Audience, Campaign, Template


# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI()

# Register routers
app.include_router(users.router)
app.include_router(audience.router)
app.include_router(campaign.router)
app.include_router(template.router)
app.include_router(dashboard.router)

# Home route
@app.get("/")
def home():
    return {"message": "Backend is running successfully"}