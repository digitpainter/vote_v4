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
from ..database import SessionLocal, get_db
from ..admin_log.service import AdminLogService
from ..admin_log.schemas import AdminActionType

router = APIRouter()

from .config import CAS_SERVER_URL, SERVICE_URL, VOTE_MAIN_URL
from .service import AuthService

# Session storage moved to AuthService class

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
async def cas_callback(ticket: str, request: Request, response: Response, db: Session = Depends(get_db)):
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
            
            # 记录用户登录操作
            if session and hasattr(session, 'staff_id') and hasattr(session, 'username'):
                staff_id = session.staff_id
                username = session.username
                try:
                    # 记录登录操作日志
                    AdminLogService.log_admin_action(
                        db=db,
                        request=request,
                        user_session=session,
                        action_type=AdminActionType.OTHER,
                        resource_type="auth",
                        description=f"用户 {username}({staff_id}) 登录系统"
                    )
                except Exception as e:
                    # 记录日志失败不应影响主要业务逻辑
                    debug(f"记录登录日志失败: {str(e)}")
            
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
async def get_current_user(request: Request, db: Session = Depends(get_db)):
    """Get current authenticated user information"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="没有登录")
    print("get_current_user token")
    
    token = auth_header.split(" ")[1]
    if not AuthService.is_valid_token(token):
        raise HTTPException(status_code=401, detail="会话过期或者无效,需要重新登录")
    try:    
        user_session = AuthService.get_user_session(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail="会话过期或者无效,需要重新登录")

    if not user_session:
        raise HTTPException(status_code=401, detail="会话过期或者无效,需要重新登录")
    
    return {
        "staff_id": user_session.staff_id,
        "role": user_session.role,
        "username": user_session.username,
        "admin_type": user_session.admin_type,
        "admin_college_id": user_session.admin_college_id,
        "admin_college_name": user_session.admin_college_name
    }

@router.post("/logout")
async def logout(request: Request, db: Session = Depends(get_db)):
    # Clear user session from Redis
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        user_session = None
        
        try:
            # 获取用户信息用于记录日志
            user_session = AuthService.get_user_session(token)
        except Exception:
            pass
            
        if user_session and hasattr(user_session, 'staff_id') and hasattr(user_session, 'username'):
            try:
                # 记录登出操作日志
                AdminLogService.log_admin_action(
                    db=db,
                    request=request,
                    user_session=user_session,
                    action_type=AdminActionType.OTHER,
                    resource_type="auth",
                    description=f"用户 {user_session.username}({user_session.staff_id}) 登出系统"
                )
            except Exception as e:
                # 记录日志失败不应影响主要业务逻辑
                debug(f"记录登出日志失败: {str(e)}")
        
        AuthService.delete_user_session(token)
    
    params = {
        "service": SERVICE_URL
    }
    logout_url = f"{CAS_SERVER_URL}/logout?{urlencode(params)}"
    return RedirectResponse(url=logout_url)
