WORKFLOW = {
    "Draft": ["Pending Review"],

    "Pending Review": [
        "Approved",
        "Rejected"
    ],

    "Approved": [
        "Scheduled"
    ],

    "Scheduled": [
        "Sending"
    ],

    "Sending": [
        "Completed"
    ],

    "Completed": [],

    "Rejected": []
}