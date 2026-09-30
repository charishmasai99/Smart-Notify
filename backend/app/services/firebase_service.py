import os
import json

import firebase_admin
from firebase_admin import credentials


def initialize_firebase():
    """
    Initialize Firebase Admin SDK once.
    """

    if firebase_admin._apps:
        return firebase_admin.get_app()

    # Production: Firebase credentials from environment variable
    service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")

    if service_account_json:
        try:
            service_account_info = json.loads(service_account_json)
        except json.JSONDecodeError as error:
            raise ValueError(
                f"Invalid FIREBASE_SERVICE_ACCOUNT_JSON: {error}"
            )

        cred = credentials.Certificate(service_account_info)

    else:
        # Local development: use JSON file
        service_account_path = os.getenv(
            "FIREBASE_SERVICE_ACCOUNT_PATH",
            "firebase-service-account.json",
        )

        if not os.path.exists(service_account_path):
            raise FileNotFoundError(
                f"Firebase service account file not found: "
                f"{service_account_path}"
            )

        cred = credentials.Certificate(service_account_path)

    return firebase_admin.initialize_app(cred)