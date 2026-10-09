from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.logging import setup_logging
from app.api.endpoints import router as ai_router

# Configure logging at startup
setup_logging()

app = FastAPI(
    title="FireGuard AI Operations Engine",
    description="Python FastAPI engine for running intelligent fire protection system diagnosis, quotations, KPIs and dispatching.",
    version="1.0.0"
)

# Apply CORS middleware (internal communications gateway calls)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["System Health"])
def health_check():
    """
    Performs standard service health check.
    """
    return {"status": "healthy"}

# Include the protected AI endpoints router
app.include_router(ai_router)
