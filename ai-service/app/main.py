from fastapi import FastAPI

from app.api.chat import router as chat_router


app = FastAPI(
    title="AI Service",
    version="1.0.0"
)


app.include_router(chat_router)


@app.get("/")
def root():
    return {
        "message": "AI service is running"
    }