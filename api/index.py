from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/status")
@app.get("/status")
def status():
    return JSONResponse({
        "camera": "System Camera",
        "ai_model": "Active",
        "backend": "Running on Vercel Serverless"
    })

# Vercel serverless handler
handler = app
