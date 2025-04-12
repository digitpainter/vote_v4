from fastapi import FastAPI, HTTPException, Query, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import logging
from logging.handlers import RotatingFileHandler
from fastapi import Request
from datetime import datetime
from typing import Optional, List
import os
from pathlib import Path

from .auth.router import router as auth_router
from .admin.router import router as admin_router
from .vote.router import router as vote_router
from .admin_log.router import router as admin_log_router
from .database import init_db
from backend.src import database
from .config import UPLOAD_DIR

# 不需要再次创建上传目录，配置文件已经创建了
# UPLOAD_DIR = Path("./uploads")
# os.makedirs(UPLOAD_DIR / "images", exist_ok=True)

app = FastAPI(title="Vote API")

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(admin_router, prefix="/admin", tags=["admin"])
app.include_router(vote_router, prefix="/vote", tags=["vote"])
app.include_router(admin_log_router, prefix="/admin-logs", tags=["admin-logs"])

# Initialize database tables
init_db()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler('app.log', maxBytes=1024*1024*10, backupCount=3),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# 添加静态文件服务
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Health check endpoint
@app.get("/")
def read_root():
    return {"status": "healthy", "message": "Vote API is running"}

# Request logging middleware
@app.middleware('http')
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    response = await call_next(request)
    process_time = (datetime.now() - start_time).total_seconds() * 1000
    logger.info(
        f"Method={request.method} Path={request.url.path} "
        f"Status={response.status_code} Duration={process_time:.2f}ms"
    )
    return response