from pydantic import BaseModel, EmailStr
from typing import Optional


# ============================================================
# CREATE USER
# ============================================================

class UserCreate(BaseModel):

    name: str

    email: EmailStr

    password: str

    role: str = "Communication Team"


# ============================================================
# LOGIN
# ============================================================

class LoginRequest(BaseModel):

    email: EmailStr

    password: str

    role: str


# ============================================================
# GOOGLE LOGIN
# ============================================================

class GoogleLoginRequest(BaseModel):

    id_token: str

    role: str

    mode: str = "signin"


# ============================================================
# REFRESH TOKEN
# ============================================================

class RefreshTokenRequest(BaseModel):

    refresh_token: str


# ============================================================
# FORGOT PASSWORD
# ============================================================

class ForgotPasswordRequest(BaseModel):

    email: EmailStr


# ============================================================
# RESET PASSWORD
# ============================================================

class ResetPasswordRequest(BaseModel):

    token: str

    new_password: str

    confirm_password: str


# ============================================================
# USER RESPONSE
# ============================================================

class UserResponse(BaseModel):

    id: int

    name: str

    email: EmailStr

    role: str

    class Config:

        from_attributes = True


# ============================================================
# USER UPDATE
# ============================================================

class UserUpdate(BaseModel):

    name: Optional[str] = None

    email: Optional[str] = None

    password: Optional[str] = None

    role: Optional[str] = None