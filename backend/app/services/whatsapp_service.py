import os

import requests

from dotenv import load_dotenv


# ============================================================
# LOAD ENVIRONMENT
# ============================================================

load_dotenv(
    override=True
)


# ============================================================
# CONFIGURATION
# ============================================================

GRAPH_API_VERSION = os.getenv(
    "WHATSAPP_GRAPH_API_VERSION",
    "v23.0"
).strip()


WHATSAPP_ACCESS_TOKEN = os.getenv(
    "WHATSAPP_ACCESS_TOKEN",
    ""
).strip()


WHATSAPP_PHONE_NUMBER_ID = os.getenv(
    "WHATSAPP_PHONE_NUMBER_ID",
    ""
).strip()


WHATSAPP_TEMPLATE_NAME = os.getenv(
    "WHATSAPP_TEMPLATE_NAME",
    "smartnotify_campaigns"
).strip()


WHATSAPP_TEMPLATE_LANGUAGE = os.getenv(
    "WHATSAPP_TEMPLATE_LANGUAGE",
    "en_US"
).strip()


# ============================================================
# SEND WHATSAPP TEMPLATE
# ============================================================

def send_whatsapp(
    recipient: str,
    content: str,
    campaign_type: str = "Public Awareness",
    campaign_name: str = "SmartNotify Campaign",
):

    # ========================================================
    # RELOAD ENVIRONMENT
    # ========================================================

    load_dotenv(
        override=True
    )

    access_token = os.getenv(
        "WHATSAPP_ACCESS_TOKEN",
        ""
    ).strip()

    phone_number_id = os.getenv(
        "WHATSAPP_PHONE_NUMBER_ID",
        ""
    ).strip()

    template_name = os.getenv(
        "WHATSAPP_TEMPLATE_NAME",
        "smartnotify_campaigns"
    ).strip()

    template_language = os.getenv(
        "WHATSAPP_TEMPLATE_LANGUAGE",
        "en_US"
    ).strip()

    graph_api_version = os.getenv(
        "WHATSAPP_GRAPH_API_VERSION",
        "v23.0"
    ).strip()


    # ========================================================
    # VALIDATION
    # ========================================================

    if not access_token:

        raise ValueError(
            "WHATSAPP_ACCESS_TOKEN is not configured."
        )


    if not phone_number_id:

        raise ValueError(
            "WHATSAPP_PHONE_NUMBER_ID is not configured."
        )


    if not recipient:

        raise ValueError(
            "Recipient WhatsApp number is required."
        )


    if not template_name:

        raise ValueError(
            "WHATSAPP_TEMPLATE_NAME is not configured."
        )


    if not template_language:

        raise ValueError(
            "WHATSAPP_TEMPLATE_LANGUAGE is not configured."
        )


    if not campaign_type:

        campaign_type = "Public Awareness"


    # ========================================================
    # CLEAN RECIPIENT
    # ========================================================

    recipient = (
        recipient
        .strip()
        .replace(
            "+",
            ""
        )
        .replace(
            " ",
            ""
        )
        .replace(
            "-",
            ""
        )
    )


    # ========================================================
    # GRAPH API URL
    # ========================================================

    url = (
        f"https://graph.facebook.com/"
        f"{graph_api_version}/"
        f"{phone_number_id}/messages"
    )


    # ========================================================
    # HEADERS
    # ========================================================

    headers = {

        "Authorization":
            f"Bearer {access_token}",

        "Content-Type":
            "application/json",

    }


    # ========================================================
    # TEMPLATE DATA
    # ========================================================

    template_data = {

        "name":
            template_name,

        "language": {

            "code":
                template_language

        },

    }


    # ========================================================
    # TEMPLATE PARAMETERS
    #
    # hello_world
    # ----------------
    # 0 parameters
    #
    #
    # smartnotify_campaign
    # --------------------
    # Current version:
    #
    # {{1}} = campaign_type
    # {{2}} = content
    #
    # ========================================================

    if template_name == "hello_world":

        # ----------------------------------------------------
        # Meta's default hello_world template has ZERO
        # parameters.
        #
        # Do not add components.
        # ----------------------------------------------------

        pass


    else:

        # ----------------------------------------------------
        # SmartNotify custom template
        # ----------------------------------------------------

        template_data["components"] = [

    {
        "type": "body",

        "parameters": [

            {
                "type": "text",
                "text": str(campaign_name),
            },

            {
                "type": "text",
                "text": str(campaign_type),
            },

            {
                "type": "text",
                "text": str(content),
            },

        ],
    },

]

    # ========================================================
    # FINAL PAYLOAD
    # ========================================================

    payload = {

        "messaging_product":
            "whatsapp",

        "recipient_type":
            "individual",

        "to":
            recipient,

        "type":
            "template",

        "template":
            template_data,

    }


    # ========================================================
    # DEBUG INFORMATION
    # ========================================================

    print(
        "\n"
        "==================================================\n"
        "WHATSAPP SEND\n"
        "=================================================="
    )


    print(
        "GRAPH API VERSION:",
        graph_api_version
    )


    print(
        "PHONE NUMBER ID:",
        phone_number_id
    )


    print(
        "ACCESS TOKEN LOADED:",
        bool(
            access_token
        )
    )


    print(
        "TEMPLATE NAME:",
        template_name
    )


    print(
        "TEMPLATE LANGUAGE:",
        template_language
    )


    print(
        "RECIPIENT:",
        recipient
    )


    print(
        "CAMPAIGN TYPE:",
        campaign_type
    )
    print(
    "CAMPAIGN NAME:",
    campaign_name
)

    print(
        "CONTENT:",
        content
    )


    if template_name == "hello_world":

        print(
            "TEMPLATE PARAMETERS:",
            0
        )

    else:

        print(
            "TEMPLATE PARAMETERS:",
            3
        )


    print(
        "FINAL PAYLOAD:",
        payload
    )


    print(
        "=================================================="
    )


    # ========================================================
    # SEND REQUEST
    # ========================================================

    try:

        response = requests.post(

            url,

            headers=headers,

            json=payload,

            timeout=30,

        )

    except requests.RequestException as error:

        print(
            "WHATSAPP CONNECTION ERROR:",
            str(error)
        )

        raise ValueError(
            f"WhatsApp connection failed: {error}"
        )


    # ========================================================
    # RESPONSE DEBUG
    # ========================================================

    print(
        "WHATSAPP STATUS CODE:",
        response.status_code
    )


    print(
        "WHATSAPP RESPONSE:",
        response.text
    )


    # ========================================================
    # API ERROR
    # ========================================================

    if not response.ok:

        raise ValueError(

            "WhatsApp API error: "
            f"{response.status_code} "
            f"{response.text}"

        )


    # ========================================================
    # PARSE RESPONSE
    # ========================================================

    try:

        result = response.json()

    except ValueError:

        raise ValueError(
            "WhatsApp API returned invalid JSON."
        )


    # ========================================================
    # PROVIDER MESSAGE ID
    # ========================================================

    messages = result.get(
        "messages",
        []
    )


    message_id = None


    if messages:

        message_id = (
            messages[0]
            .get("id")
        )


    # ========================================================
    # VALIDATE MESSAGE ID
    # ========================================================

    if not message_id:

        raise ValueError(

            "WhatsApp API did not "
            "return a message ID."

        )


    # ========================================================
    # SUCCESS
    # ========================================================

    print(
        "WHATSAPP MESSAGE ID:",
        message_id
    )


    print(
        "WHATSAPP MESSAGE ACCEPTED BY META."
    )


    # ========================================================
    # RETURN
    # ========================================================

    return {

        "success":
            True,

        "message_id":
            message_id,

        "recipient":
            recipient,

        "campaign_type":
            campaign_type,

        "content":
            content,

        "template":
            template_name,

        "language":
            template_language,

        "status":
            "Sent",

    }