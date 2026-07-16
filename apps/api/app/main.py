from __future__ import annotations

from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.middlewares.errors import register_exception_handlers
from app.middlewares.rate_limit import limiter
from app.routes.admin import router as admin_router
from app.routes.favorites import router as favorites_router
from app.routes.offers import router as offers_router
from app.routes.products import router as products_router

app = FastAPI(title="TopSoum API")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

register_exception_handlers(app)

app.include_router(products_router)
app.include_router(favorites_router)
app.include_router(admin_router)
app.include_router(offers_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
