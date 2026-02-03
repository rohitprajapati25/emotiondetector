from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/api/status")
def get_status():
    return JSONResponse({
        "camera": "System Camera",
        "ai_model": "Active",
        "backend": "Running on Vercel"
    })

# Vercel serverless handler
handler = app
