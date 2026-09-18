import os
import sys

# Ensure backend directory is first in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
project_root = os.path.abspath(os.path.join(backend_dir, ".."))

if backend_dir in sys.path:
    sys.path.remove(backend_dir)
sys.path.insert(0, backend_dir)

if project_root not in sys.path:
    sys.path.insert(1, project_root)

from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, complaints, officers, dashboard, ai, notifications, reports, admin
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create Database tables automatically if using SQLite / fallback
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Database table initialization notice: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Smart Municipal Governance & AI-Powered Civic Complaint Management REST API"
)

# Set Security Headers Middleware for Web Protection
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"                  # Prevents Clickjacking in IFrames
    response.headers["X-Content-Type-Options"] = "nosniff"        # Blocks MIME-type sniffing
    response.headers["X-XSS-Protection"] = "1; mode=block"         # Enforces XSS Filter
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Set CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(complaints.router, prefix=settings.API_V1_STR)
app.include_router(officers.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "title": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "HEALTHY",
        "docs_url": "/docs"
    }
