from fastapi import Depends, HTTPException, status

from app.models.user import User
from app.utils.auth import get_current_user


# ============================================================
# SMARTNOTIFY WORKSPACE ROLES
# ============================================================

VALID_ROLES = (
    "Admin",
    "Campaign Manager",
    "Communication Team",
)


# ============================================================
# AUTHENTICATED WORKSPACE USER
# ============================================================
#
# Use this dependency for read-only workspace data that all three
# roles are allowed to see. It intentionally does NOT grant any
# management or execution permission.
#
# ============================================================

def require_workspace_user(
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="A valid SmartNotify workspace role is required.",
        )

    return current_user


# ============================================================
# ADMIN
# ============================================================
#
# Admin is the platform governance role.
# Admin can manage users/roles and view platform information,
# but does not create, edit, delete, schedule, or send campaigns.
#
# ============================================================

def require_admin(
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin can perform this action.",
        )

    return current_user


# ============================================================
# CAMPAIGN MANAGER
# ============================================================
#
# Campaign Manager owns campaign planning and preparation:
# campaigns, audiences, templates, AI content, translation and
# scheduling. It does not execute live channel delivery.
#
# ============================================================

def require_campaign_manager(
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "Campaign Manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Campaign Manager can perform this action.",
        )

    return current_user


# ============================================================
# COMMUNICATION TEAM
# ============================================================
#
# Communication Team owns operational delivery:
# live channel execution, delivery monitoring and retries.
# It does not create or modify campaign planning content.
#
# ============================================================

def require_communication_team(
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "Communication Team":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Communication Team can perform this action.",
        )

    return current_user
