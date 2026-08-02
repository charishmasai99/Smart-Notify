from fastapi import Depends, HTTPException, status

from app.models.user import User
from app.utils.auth import get_current_user


def require_admin(
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin can perform this action."
        )

    return current_user


def require_campaign_manager(
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [
        "Admin",
        "Campaign Manager"
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Campaign Manager access required."
        )

    return current_user


def require_communication_team(
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [
        "Admin",
        "Campaign Manager",
        "Communication Team"
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized."
        )

    return current_user