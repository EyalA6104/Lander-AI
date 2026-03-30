from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app.api.routes.analyze import router as analyze_router
from app.api.routes.health import router as health_router
from app.core.logging_config import setup_logging
from app.middleware.logging_middleware import LoggingMiddleware
from app.middleware.rate_limiter import RateLimiterMiddleware
from app.middleware.request_context import RequestContextMiddleware

setup_logging()
logger = structlog.stdlib.get_logger("app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("app_startup", message="Lander-AI server starting")
    yield
    logger.info("app_shutdown", message="Lander-AI server shutting down")


app = FastAPI(lifespan=lifespan)

# ---- Prometheus auto-instrumentation (request duration, count, size) ----
instrumentator = Instrumentator(
    should_group_status_codes=False,
    should_ignore_untemplated=True,
    excluded_handlers=["/metrics", "/health"],
)
instrumentator.instrument(app).expose(app, include_in_schema=False)

# ---- Middleware stack ----
# Starlette executes the *last* added middleware first on the request path.
# Desired order: RequestContext -> Logging -> RateLimiter -> CORS -> Route
# So we add them in reverse.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimiterMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(RequestContextMiddleware)


# ---- Exception handlers ----

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning("validation_error", path=request.url.path, errors=exc.errors())
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"status": "error", "error": "Invalid request configuration or URL.", "data": None},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_exception", path=request.url.path, error=str(exc), exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"status": "error", "error": "An unexpected internal error occurred.", "data": None},
    )


# ---- Routes ----

app.include_router(analyze_router)
app.include_router(health_router)


@app.get("/")
def root():
    return {"message": "API is running"}
