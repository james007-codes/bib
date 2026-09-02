Backend port - 5000
frontend - 5173
ai-serivce - 8000

ai-service:
uv sync
uv run python -m app.retrieval.ingest
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000   

backend/frontend:
npm i
npm run dev


