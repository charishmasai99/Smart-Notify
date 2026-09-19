from fastapi import APIRouter, Depends, HTTPException
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database.db import get_db
from app.models.user import User

from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserUpdate,
    LoginRequest,
    GoogleLoginRequest,
    RefreshTokenRequest,
)
from app.schemas.user import (
    ForgotPasswordRequest,
    ResetPasswordRequest,
)

from app.utils.security import (
    create_password_reset_token,
    verify_password_reset_token,
    hash_password,
)

from app.services.email_service import (
    send_password_reset_email,
)

from app.utils.auth import get_current_user

from app.utils.roles import (
    VALID_ROLES,
    require_admin,
    require_communication_team,
)

from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    SECRET_KEY,
    ALGORITHM,
)

from app.services.firebase_service import initialize_firebase
from firebase_admin import auth as firebase_auth


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


# ============================================================
# CREATE USER
# ============================================================

@router.post(
    "/",
    response_model=UserResponse,
)
def create_user(
    user: UserCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if user.role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail="Invalid role. Choose Admin, Campaign Manager, or Communication Team.",
        )

    # Check whether email already exists
    existing = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already exists",
        )

    # Create new user
    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        role=user.role,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

# ============================================================
# FORGOT PASSWORD
# ============================================================

@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Request a password reset email.

    Always returns the same successful response so that
    attackers cannot discover whether an email is registered.
    """

    email = (
        str(payload.email)
        .strip()
        .lower()
    )

    user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    # Do not reveal whether the account exists.
    if user is None:

        return {
            "success": True,
            "message": (
                "If an account exists for this email, "
                "a password reset link has been sent."
            ),
        }

    # --------------------------------------------------------
    # Google-only account
    # --------------------------------------------------------

    # Google-created accounts have a generated local password.
    # We still allow password reset so the user can establish
    # a local password if the product permits it.
    #
    # If you want Google-only accounts to remain Google-only,
    # this block can instead return a provider-specific message.

    reset_token = create_password_reset_token(
        user.email
    )

    try:

        send_password_reset_email(
            recipient=user.email,
            recipient_name=user.name,
            reset_token=reset_token,
        )

    except Exception as error:

        print(
            "PASSWORD RESET EMAIL ERROR:",
            error,
        )

        # Do not reveal SMTP/internal details.
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to send the password reset email. "
                "Please try again later."
            ),
        )

    return {
        "success": True,
        "message": (
            "If an account exists for this email, "
            "a password reset link has been sent."
        ),
    }


# ============================================================
# RESET PASSWORD
# ============================================================

@router.post("/reset-password")
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """
    Reset a user's password using a short-lived reset token.
    """

    if payload.new_password != payload.confirm_password:

        raise HTTPException(
            status_code=400,
            detail="Passwords do not match.",
        )

    if len(payload.new_password) < 8:

        raise HTTPException(
            status_code=400,
            detail=(
                "Password must contain at least "
                "8 characters."
            ),
        )

    email = verify_password_reset_token(
        payload.token
    )

    if not email:

        raise HTTPException(
            status_code=400,
            detail=(
                "This password reset link is "
                "invalid or expired."
            ),
        )

    user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    if user is None:

        raise HTTPException(
            status_code=400,
            detail=(
                "This password reset link is "
                "invalid or expired."
            ),
        )

    user.password = hash_password(
        payload.new_password
    )

    db.commit()

    return {
        "success": True,
        "message": (
            "Password reset successfully."
        ),
    }
# ============================================================
# PUBLIC REGISTRATION
# ============================================================

@router.post("/register")
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    """Create a standard SmartNotify account from the registration form.

    Public registration is intentionally limited to non-admin workspace roles.
    Administrator accounts must be provisioned by an existing administrator.
    """
    if user.role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail="Invalid workspace role.",
        )

    if user.role == "Admin":
        raise HTTPException(
            status_code=403,
            detail="Administrator accounts must be created by an existing administrator.",
        )

    email = str(user.email).strip().lower()
    name = user.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Full name is required.",
        )

    if len(user.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 8 characters.",
        )

    existing = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="An account already exists for this email. Please sign in instead.",
        )

    new_user = User(
        name=name,
        email=email,
        password=hash_password(user.password),
        role=user.role,
    )

    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="An account already exists for this email.",
        )

    access_token = create_access_token(data={"sub": new_user.email})
    refresh_token = create_refresh_token(data={"sub": new_user.email})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
        },
    }


# ============================================================
# RECIPIENT FEEDBACK REGISTER
# ============================================================

@router.post("/feedback-register")
def register_feedback_user(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    """Create a recipient account for the public feedback portal.

    The role is intentionally fixed to User. Recipients never choose
    an internal SmartNotify workspace role from the public feedback UI.
    """
    email = str(user.email).strip().lower()
    name = user.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Full name is required.",
        )

    if len(user.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 8 characters.",
        )

    existing = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="An account already exists for this email. Please sign in instead.",
        )

    new_user = User(
        name=name,
        email=email,
        password=hash_password(user.password),
        role="User",
    )

    db.add(new_user)

    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="An account already exists for this email.",
        )

    return {
        "access_token": create_access_token(data={"sub": new_user.email}),
        "refresh_token": create_refresh_token(data={"sub": new_user.email}),
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
        },
    }


# ============================================================
# RECIPIENT FEEDBACK LOGIN
# ============================================================

@router.post("/feedback-login")
def login_feedback_user(
    user: LoginRequest,
    db: Session = Depends(get_db),
):
    """Authenticate only a public feedback recipient account."""
    email = str(user.email).strip().lower()

    db_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if db_user is None:
        raise HTTPException(
            status_code=404,
            detail="No feedback account was found for this email.",
        )

    if db_user.role != "User":
        raise HTTPException(
            status_code=403,
            detail="This is an internal SmartNotify account. Use the main SmartNotify login.",
        )

    if not verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    return {
        "access_token": create_access_token(data={"sub": db_user.email}),
        "refresh_token": create_refresh_token(data={"sub": db_user.email}),
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
            "role": db_user.role,
        },
    }


# ============================================================
# LOGIN
# ============================================================

@router.post("/login")
def login(
    user: LoginRequest,
    db: Session = Depends(get_db),
):
    # Find user
    db_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if db_user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if user.role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail="Invalid workspace role.",
        )

    # Verify password
    if not verify_password(
        user.password,
        db_user.password,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid password",
        )

    # The selected workspace must match the account's real DB role.
    if db_user.role != user.role:
        raise HTTPException(
            status_code=403,
            detail=(
                f"This account is registered as {db_user.role}. "
                "Please select the correct workspace role."
            ),
        )

    # Create JWT
    access_token = create_access_token(
        data={
            "sub": db_user.email
        }
    )

    refresh_token = create_refresh_token(
        data={
            "sub": db_user.email
        }
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
            "role": db_user.role,
        },
    }


# ============================================================
# GOOGLE AUTHENTICATION
# ============================================================

@router.post("/google-login")
def google_login(
    payload: GoogleLoginRequest,
    db: Session = Depends(get_db),
):
    """
    Authenticate a Google/Firebase user and exchange the Firebase ID token
    for the SmartNotify JWT used by the rest of the application.

    Sign-in requires an existing SmartNotify account whose database role
    matches the selected workspace.

    Sign-up may create a new SmartNotify account for non-admin roles only.
    Admin accounts must be created/assigned by an existing administrator.
    """

    if payload.role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail="Invalid workspace role.",
        )

    if payload.mode not in {"signin", "signup"}:
        raise HTTPException(
            status_code=400,
            detail="Invalid Google authentication mode.",
        )

    if payload.mode == "signup" and payload.role == "Admin":
        raise HTTPException(
            status_code=403,
            detail="Administrator accounts must be created by an existing administrator.",
        )

    try:
        initialize_firebase()
        decoded_token = firebase_auth.verify_id_token(
            payload.id_token,
            check_revoked=True,
        )
    except Exception as exc:
        print("GOOGLE AUTH ERROR:", exc)
        raise HTTPException(
            status_code=401,
            detail="Google authentication could not be verified. Please try again.",
        )

    email = (decoded_token.get("email") or "").strip().lower()
    name = (
        decoded_token.get("name")
        or decoded_token.get("email", "Google User").split("@")[0]
    )
    email_verified = decoded_token.get("email_verified", False)

    if not email or not email_verified:
        raise HTTPException(
            status_code=400,
            detail="A verified Google email address is required.",
        )

    db_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    # --------------------------------------------------------
    # Existing SmartNotify account
    # --------------------------------------------------------

    if db_user:
        if payload.mode == "signup":
            raise HTTPException(
                status_code=409,
                detail="A SmartNotify account already exists for this Google email. Use Continue with Google instead.",
            )

        if db_user.role != payload.role:
            raise HTTPException(
                status_code=403,
                detail=(
                    f"This Google account is registered as {db_user.role}. "
                    "Please select the correct workspace role."
                ),
            )

    # --------------------------------------------------------
    # New SmartNotify account via Google
    # --------------------------------------------------------

    else:
        if payload.mode != "signup":
            raise HTTPException(
                status_code=404,
                detail="No SmartNotify account exists for this Google email. Use Create account with Google first.",
            )

        # Google is the identity provider; keep a non-usable local password
        # so the existing users table remains compatible with password login.
        db_user = User(
            name=name,
            email=email,
            password=hash_password(f"google:{decoded_token['uid']}:SmartNotify"),
            role=payload.role,
        )

        db.add(db_user)
        try:
            db.commit()
            db.refresh(db_user)
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=409,
                detail="A SmartNotify account already exists for this Google email. Use Continue with Google instead.",
            )

    access_token = create_access_token(
        data={
            "sub": db_user.email,
        }
    )

    refresh_token = create_refresh_token(
        data={
            "sub": db_user.email,
        }
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
            "role": db_user.role,
        },
    }


# ============================================================
# REFRESH ACCESS TOKEN
# ============================================================

@router.post("/refresh")
def refresh_access_token(
    payload: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    """Exchange a valid refresh token for a new access token."""

    credentials_exception = HTTPException(
        status_code=401,
        detail="Invalid or expired refresh token.",
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )

    try:
        decoded = jwt.decode(
            payload.refresh_token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        if decoded.get("type") != "refresh":
            raise credentials_exception

        email = decoded.get("sub")

        if not email:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if user is None:
        raise credentials_exception

    new_access_token = create_access_token(
        data={
            "sub": user.email
        }
    )

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
    }


# ============================================================
# CURRENT USER
# ============================================================

@router.get("/me")
def read_me(
    current_user: User = Depends(
        get_current_user
    ),
):
    return current_user


# ============================================================
# GET ALL USERS
# ============================================================

@router.get("/")
def get_users(
    current_user: User = Depends(
        require_admin
    ),
    db: Session = Depends(get_db),
):
    users = (
        db.query(User)
        .all()
    )

    return users


# ============================================================
# GET SINGLE USER
# ============================================================

@router.get(
    "/{user_id}",
    response_model=UserResponse,
)
def get_user(
    user_id: int,
    current_user: User = Depends(
        require_admin
    ),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return user


# ============================================================
# UPDATE USER
# ============================================================

@router.put(
    "/{user_id}",
    response_model=UserResponse,
)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(
        require_admin
    ),
    db: Session = Depends(get_db),
):
    # Find user
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # --------------------------------------------------------
    # Update email
    # --------------------------------------------------------

    if user_data.email is not None:

        existing_user = (
            db.query(User)
            .filter(
                User.email == user_data.email,
                User.id != user_id,
            )
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already exists",
            )

        user.email = user_data.email

    # --------------------------------------------------------
    # Update name
    # --------------------------------------------------------

    if user_data.name is not None:
        user.name = user_data.name

    # --------------------------------------------------------
    # Update role
    # --------------------------------------------------------

    if user_data.role is not None:
        if user_data.role not in VALID_ROLES:
            raise HTTPException(
                status_code=400,
                detail="Invalid role. Choose Admin, Campaign Manager, or Communication Team.",
            )
        user.role = user_data.role

    # --------------------------------------------------------
    # Update password
    # --------------------------------------------------------

    if (
        user_data.password is not None
        and user_data.password.strip() != ""
    ):
        user.password = hash_password(
            user_data.password
        )

    # --------------------------------------------------------
    # Save changes
    # --------------------------------------------------------

    db.commit()
    db.refresh(user)

    return user


# ============================================================
# DELETE USER
# ============================================================

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(
        require_admin
    ),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # Prevent admin from deleting own account
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot delete your own account",
        )

    db.delete(user)
    db.commit()

    return {
        "message": "User deleted successfully"
    }