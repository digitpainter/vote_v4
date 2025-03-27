from operator import is_
from fastapi import HTTPException, Request
from typing import Optional, List
from .service import AuthService

def check_roles(allowed_roles: List[str] = [], allowed_admin_types: List[str] = []):
    def role_checker(request: Request):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        token = auth_header.split(" ")[1]
        try:
            if not AuthService.is_valid_token(token):
                raise HTTPException(status_code=401, detail="Invalid or expired session")
            user_session = AuthService.get_user_session(token)
            if user_session.role not in allowed_roles:
                raise HTTPException(
                    status_code=403,
                    detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
                )

            if user_session.admin_type not in allowed_admin_types:
                raise HTTPException(
                    status_code=403,
                    detail=f"Access denied. Required admin types: {', '.join(allowed_admin_types)}"
                )
            return user_session
        except ValueError:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    return role_checker