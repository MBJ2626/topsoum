from __future__ import annotations

from fastapi import FastAPI

from app.routes.products import router as products_router

app = FastAPI(title="TopSoum API")

app.include_router(products_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
