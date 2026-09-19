import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv

from app.database.db import engine
from app.database.base import Base
from app.routers.tracking import (
    router as tracking_router
)

from app.models import (
    User,
    Audience,
    Campaign,
    Template,
       Feedback,
)


from app.routers import (
    users,
    audience,
    campaign,
    template,
    dashboard,
    ai,
    channels,
    feedback,
)


from app.routers.notification import (
    router as notification_router
)


from app.routers.delivery import (
    router as delivery_router
)


from app.routers.webhook import (
    router as webhook_router
)


# ============================================================
# SCHEDULER
# ============================================================

from app.services.scheduler import (
    scheduler_loop,
)


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv(
    override=True
)


# ============================================================
# SCHEDULER LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    # --------------------------------------------------------
    # START SCHEDULER
    # --------------------------------------------------------

    stop_event = asyncio.Event()

    scheduler_task = asyncio.create_task(
        scheduler_loop(
            stop_event
        )
    )

    print(
        "================================================"
    )

    print(
        "SMARTNOTIFY SCHEDULER STARTED"
    )

    print(
        "Automatic campaign scheduling is ACTIVE"
    )

    print(
        "================================================"
    )

    try:

        yield

    finally:

        # ----------------------------------------------------
        # STOP SCHEDULER
        # ----------------------------------------------------

        stop_event.set()

        try:

            await scheduler_task

        except asyncio.CancelledError:

            pass

        print(
            "SMARTNOTIFY SCHEDULER STOPPED"
        )


# ============================================================
# APP
# ============================================================

app = FastAPI(

    title="SmartNotify API",

    description=(
        "Public Awareness Communication "
        "Platform API"
    ),

    version="1.0.0",

    lifespan=lifespan,

)


# ============================================================
# DATABASE
# ============================================================

Base.metadata.create_all(
    bind=engine
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(

    CORSMiddleware,

    allow_origins=[

        "http://localhost:5173",

        "http://127.0.0.1:5173",

    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(
    users.router
)

app.include_router(
    audience.router
)

app.include_router(
    campaign.router
)

app.include_router(
    template.router
)

app.include_router(
    dashboard.router
)

app.include_router(
    ai.router
)

app.include_router(
    notification_router
)

app.include_router(
    delivery_router
)

app.include_router(
    webhook_router
)

app.include_router(
    channels.router
    
)
app.include_router(
    feedback.router
)

app.include_router(
    tracking_router
)

# ============================================================
# ROOT
# ============================================================

@app.get("/")
def home():

    return {

        "message":
            "SmartNotify API is running successfully"

    }


# ============================================================
# DEBUG: REGISTERED ROUTES
# ============================================================

for route in app.routes:

    print(
        "REGISTERED ROUTE:",
        getattr(
            route,
            "path",
            None
        ),
        type(route).__name__,
    )