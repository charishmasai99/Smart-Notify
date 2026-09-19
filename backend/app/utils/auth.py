from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.user import User
from app.utils.security import SECRET_KEY, ALGORITHM


# ============================================================
# HTTP BEARER AUTHENTICATION
# ============================================================

security = HTTPBearer()


# ============================================================
# GET CURRENT USER
# ============================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )

    try:
        # Get token from:
        # Authorization: Bearer <token>

        token = credentials.credentials

        print("AUTH TOKEN RECEIVED:", bool(token))

        # Decode JWT
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        print("JWT PAYLOAD:", payload)

        # We expect login to store user's email in "sub"
        email = payload.get("sub")

        if not email:
            print("JWT ERROR: sub/email missing")
            raise credentials_exception

    except JWTError as error:
        print("JWT DECODE ERROR:", error)
        raise credentials_exception

    # Find user by email
    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if user is None:
        print("AUTH ERROR: User not found for email:", email)
        raise credentials_exception

    print(
        "AUTH SUCCESS:",
        user.email,
        "ROLE:",
        user.role,
    )

    return user