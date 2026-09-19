import os

import firebase_admin
from firebase_admin import credentials


def initialize_firebase():
    """
    Initialize Firebase Admin SDK once.
    """

    if firebase_admin._apps:
        return firebase_admin.get_app()

    service_account_path = os.getenv(
        "FIREBASE_SERVICE_ACCOUNT_PATH",
        "firebase-service-account.json",
    )

    if not os.path.exists(service_account_path):
        raise FileNotFoundError(
            f"Firebase service account file not found: "
            f"{service_account_path}"
        )

    cred = credentials.Certificate(
        service_account_path
    )

    return firebase_admin.initialize_app(
        cred
    )