from typing import List, Optional
from fastapi import Request, HTTPException
from .service import AuthService, AdminType, RoleType as UserRole

def check_roles(
    allowed_roles: Optional[List[str]] = None,
    allowed_admin_types: Optional[List[str]] = None
):
    """
    检查用户角色和管理员类型的权限
    
    Args:
        allowed_roles: 允许的用户角色列表
        allowed_admin_types: 允许的管理员类型列表
    """
    allowed_roles = allowed_roles or []
    allowed_admin_types = allowed_admin_types or []
    
    def role_checker(request: Request):
        # 验证认证头
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="未认证，请先登录")
        
        token = auth_header.split(" ")[1]
        
        try:
            # 获取用户会话
            user_session = AuthService.get_user_session(token)
            
            # 如果指定了允许的角色，则进行角色检查
            if allowed_roles and user_session.role not in allowed_roles:
                raise HTTPException(
                    status_code=403,
                    detail=f"权限不足。需要以下角色之一: {', '.join(allowed_roles)}"
                )

            # 如果指定了允许的管理员类型，则进行管理员类型检查
            if allowed_admin_types and user_session.admin_type not in allowed_admin_types:
                raise HTTPException(
                    status_code=403,
                    detail=f"权限不足。需要以下管理员类型之一: {', '.join(allowed_admin_types)}"
                )
                
            return user_session
            
        except ValueError:
            raise HTTPException(
                status_code=401,
                detail="会话过期或无效，请重新登录"
            )
    
    return role_checker