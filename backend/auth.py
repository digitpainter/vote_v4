from fastapi import APIRouter, HTTPException, Request, Response, Depends
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from database import SessionLocal
import httpx
from urllib.parse import urlencode
import re

router = APIRouter()

# CAS server configuration
CAS_SERVER_URL = "http://127.0.0.1:8001"
SERVICE_URL = "http://localhost:8000/auth/cas-callback"

# Session storage (in-memory for demonstration)
user_sessions = {}

class UserSession(BaseModel):
    staff_id: str
    username: str
    access_token: str
    role: str

class CASResponse(BaseModel):
    staff_id: str
    username: str
    role: str

def determine_user_role(username: str) -> str:
    """Determine user role based on username pattern"""
    if re.match(r'^\d{9}$', username):
        return 'undergraduate'
    elif re.match(r'^S\d{9}$', username):
        return 'graduate'
    elif re.match(r'^\d{7}$', username):
        return 'teacher'
    return 'unknown'

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
    print(f"Redirecting to CAS server for login: {login_url}")
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
                
            if 'id' not in user_info or 'username' not in user_info:
                raise HTTPException(status_code=500, detail="Missing required user information from CAS server")
            
            # Determine user role based on username pattern
            role = determine_user_role(user_info['username'])
                
            user_data = CASResponse(
                staff_id=str(user_info['id']),
                username=user_info['username'],
                role=role
            )
            
            # Generate session token
            access_token = f"session_{user_data.staff_id}"  # In production, use secure token generation
            
            # Store session with role information
            user_sessions[access_token] = UserSession(
                staff_id=user_data.staff_id,
                username=user_data.username,
                access_token=access_token,
                role=role
            )
            
            print(f"Successfully authenticated user: {user_data.username} with role: {role}")
            return {
                "access_token": access_token,
                "staff_id": user_data.staff_id,
                "username": user_data.username,
                "role": role
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/me")
async def get_current_user(request: Request):
    """Get current authenticated user information"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]
    user_session = user_sessions.get(token)
    
    if not user_session:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    return user_session

@router.post("/logout")
async def logout(request: Request):
    """Logout user and invalidate session"""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        user_sessions.pop(token, None)
    
    return {"message": "Logged out successfully"}