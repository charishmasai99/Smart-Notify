import os

from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv

from jose import jwt

from passlib.context import CryptContext


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv(
    override=True
)


# ============================================================
# JWT CONFIGURATION
# ============================================================

SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY"
)

if not SECRET_KEY:

    raise RuntimeError(
        "JWT_SECRET_KEY is not configured. "
        "Add JWT_SECRET_KEY to the backend .env file."
    )


ALGORITHM = os.getenv(
    "JWT_ALGORITHM",
    "HS256"
)


# ============================================================
# ACCESS TOKEN
# ============================================================

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "60"
    )
)


# ============================================================
# REFRESH TOKEN
# ============================================================

REFRESH_TOKEN_EXPIRE_DAYS = int(
    os.getenv(
        "REFRESH_TOKEN_EXPIRE_DAYS",
        "7"
    )
)


# ============================================================
# PASSWORD RESET TOKEN
# ============================================================

PASSWORD_RESET_EXPIRE_MINUTES = int(
    os.getenv(
        "PASSWORD_RESET_EXPIRE_MINUTES",
        "30"
    )
)


# ============================================================
# PASSWORD HASHING
# ============================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


# ============================================================
# HASH PASSWORD
# ============================================================

def hash_password(
    password: str,
):

    return pwd_context.hash(
        password
    )


# ============================================================
# VERIFY PASSWORD
# ============================================================

def verify_password(
    plain_password: str,
    hashed_password: str,
):

    return pwd_context.verify(
        plain_password,
        hashed_password,
    )


# ============================================================
# CREATE ACCESS TOKEN
# ============================================================

def create_access_token(
    data: dict,
):

    to_encode = data.copy()

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    to_encode.update(
        {
            "exp": expire,
            "type": "access",
        }
    )

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


# ============================================================
# CREATE REFRESH TOKEN
# ============================================================

def create_refresh_token(
    data: dict,
):

    to_encode = data.copy()

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            days=REFRESH_TOKEN_EXPIRE_DAYS
        )
    )

    to_encode.update(
        {
            "exp": expire,
            "type": "refresh",
        }
    )

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


# ============================================================
# CREATE PASSWORD RESET TOKEN
# ============================================================

def create_password_reset_token(
    email: str,
):

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=PASSWORD_RESET_EXPIRE_MINUTES
        )
    )

    payload = {

        "sub": email,

        "exp": expire,

        "type": "password_reset",
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


# ============================================================
# VERIFY PASSWORD RESET TOKEN
# ============================================================

def verify_password_reset_token(
    token: str,
):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        if payload.get("type") != "password_reset":

            return None

        email = payload.get("sub")

        if not email:

            return None

        return email

    except Exception:

        return None