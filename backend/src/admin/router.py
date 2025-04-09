from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from typing import List

from .schemas import AdminCreate, AdminUpdate, AdminResponse
from .service import AdminService
from ..auth.service import AuthService
from ..database import get_db
from ..auth.dependencies import check_roles

router = APIRouter()

@router.post("/", response_model=AdminResponse)
async def create_administrator(admin: AdminCreate, request: Request, db: Session = Depends(get_db), _= check_roles(allowed_roles=["teacher"], allowed_admin_types=["school"])):
    try:
        return AdminService.create_admin(db, admin)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{stuff_id}", response_model=AdminResponse)
async def get_administrator(stuff_id: str, request: Request, db: Session = Depends(get_db), _= check_roles(allowed_roles=[])):
    admin = AdminService.get_admin(db, stuff_id)
    if not admin:
        raise HTTPException(status_code=404, detail="Administrator not found")
    return admin

@router.get("/", response_model=List[AdminResponse])
async def list_administrators(request: Request, db: Session = Depends(get_db), _= check_roles(allowed_roles=[])):
    return AdminService.get_admins(db)

@router.put("/{stuff_id}", response_model=AdminResponse)
async def update_administrator(stuff_id: str, admin: AdminUpdate, request: Request, db: Session = Depends(get_db), _= check_roles(allowed_admin_types=["school"])):
    try:
        updated_admin = AdminService.update_admin(db, stuff_id, admin)
        if not updated_admin:
            raise HTTPException(status_code=404, detail="Administrator not found")
        return updated_admin
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{stuff_id}")
async def delete_administrator(stuff_id: str, request: Request, db: Session = Depends(get_db), _= check_roles(allowed_admin_types=["school"])):
    try:
        if not AdminService.delete_admin(db, stuff_id):
            raise HTTPException(status_code=404, detail="Administrator not found")
        return {"message": "Administrator deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))