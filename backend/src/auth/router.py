from logging import info, debug
from fastapi import APIRouter, HTTPException, Request, Response, Depends
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session, session
from typing import Optional
import httpx
from urllib.parse import urlencode
import re

from .schemas import UserSession, CASResponse
from ..database import SessionLocal

router = APIRouter()

from .config import CAS_SERVER_URL, SERVICE_URL, VOTE_MAIN_URL
from .service import AuthService

# Session storage moved to AuthService class

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/cas-login")
async def cas_login():
    """Redirect to CAS server for authentication"""
    params = {
        "service": SERVICE_URL
    }
    login_url = f"{CAS_SERVER_URL}/login?{urlencode(params)}"
    print(f"Redirecting to CAS login URL: {login_url}")
    return RedirectResponse(url=login_url)

@router.get("/cas-callback")
async def cas_callback(ticket: str, request: Request, response: Response):
    try:
        async with httpx.AsyncClient() as client:
            debug(f"开始CAS票据验证流程，ticket参数接收成功: {ticket}")
            validate_url = f"{CAS_SERVER_URL}/serviceValidate?ticket={ticket}&service={SERVICE_URL}"
            debug(f"正在向CAS验证服务发送请求，目标URL: {validate_url}")
            debug("准备发起CAS服务验证HTTP请求")
            cas_response = await client.get(validate_url)
            debug(f"收到CAS服务响应，状态码: {cas_response.status_code}")
            if cas_response.status_code != 200:
                raise HTTPException(status_code=401, detail=f"无效的CAS票据，服务器返回{cas_response.status_code}")
            debug("开始解析CAS服务返回的JSON响应数据")
            data = cas_response.json()
            debug(f"用户认证状态: {data.get('authenticated')}，准备创建用户会话")
            if not data.get('authenticated'):
                raise HTTPException(status_code=401, detail="CAS认证失败")
                
            user_info = data.get('user')
            session = AuthService.create_user_session(user_info)
            
            return {
                "authenticated": True,
                "access_token": session.access_token,
                "user_info": {
                    "staff_id": session.staff_id,
                    "role": session.role
                }
            }
            
    except HTTPException as e:
        return {
            "authenticated": False,
            "error": str(e)
        }

@router.get("/users/me")
async def get_current_user(request: Request):
    """Get current authenticated user information"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    print("get_current_user token")
    
    token = auth_header.split(" ")[1]
    if not AuthService.is_valid_token(token):
        raise HTTPException(status_code=401, detail="Invalid or expired session")
        
    user_session = AuthService.get_user_session(token)
    
    if not user_session:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    return {
        "staff_id": user_session.staff_id,
        "role": user_session.role,
        "username": user_session.username,
        "admin_type": user_session.admin_type,
        "admin_college_id": user_session.admin_college_id,
        "admin_college_name": user_session.admin_college_name
    }

@router.post("/logout")
async def logout(request: Request):
    # Clear user session from Redis
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        AuthService.delete_user_session(token)
    
    params = {
        "service": SERVICE_URL
    }
    logout_url = f"{CAS_SERVER_URL}/logout?{urlencode(params)}"
    return RedirectResponse(url=logout_url)
