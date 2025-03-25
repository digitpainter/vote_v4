from fastapi import APIRouter, HTTPException, Request, Response, Depends
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import Optional
import httpx
from urllib.parse import urlencode
import re

from .schemas import UserSession, CASResponse
from ..database import SessionLocal

router = APIRouter()

from .config import CAS_SERVER_URL, SERVICE_URL
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
    return RedirectResponse(url=login_url)

@router.get("/cas-callback")
async def cas_callback(ticket: str, request: Request, response: Response):
    """Handle CAS server callback with ticket validation"""
    try:
        # Validate ticket with CAS server
        async with httpx.AsyncClient() as client:
            validate_url = f"{CAS_SERVER_URL}/serviceValidate?ticket={ticket}&service={SERVICE_URL}"
            print(f"Validating ticket with URL: {validate_url}")
            
            try:
                cas_response = await client.get(validate_url)
                print(f"CAS Response Status: {cas_response.status_code}")
                print(f"CAS Response Content: {cas_response.text}")
            except Exception as e:
                print(f"Error making request to CAS server: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Failed to connect to CAS server: {str(e)}")
            
            if cas_response.status_code != 200:
                raise HTTPException(status_code=401, detail=f"Invalid CAS ticket: Server returned {cas_response.status_code}")
            
            # Parse CAS response
            try:
                data = cas_response.json()
            except Exception as e:
                print(f"Error parsing CAS response as JSON: {str(e)}\nResponse content: {cas_response.text}")
                raise HTTPException(status_code=500, detail="Failed to parse CAS server response")
            
            if not isinstance(data, dict):
                raise HTTPException(status_code=500, detail="Invalid response format from CAS server")
                
            if not data.get('authenticated'):
                raise HTTPException(status_code=401, detail="Authentication failed")
                
            user_info = data.get('user')
            if not isinstance(user_info, dict):
                raise HTTPException(status_code=500, detail="Invalid user info format from CAS server")
                
            if 'id' not in user_info or 'uid' not in user_info:
                raise HTTPException(status_code=500, detail="Missing required user information from CAS server")
            session = AuthService.create_user_session(user_info)
            return session
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/me")
async def get_current_user(request: Request):
    """Get current authenticated user information"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]
    user_session = AuthService.get_user_session(token)
    
    if not user_session:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    return user_session

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
