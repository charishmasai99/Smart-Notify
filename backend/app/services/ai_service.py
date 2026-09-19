import os

from dotenv import load_dotenv

from groq import Groq

from app.services.translation_service import (
    translate_text
)


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


GROQ_API_KEY = os.getenv(
    "GROQ_API_KEY"
)


if not GROQ_API_KEY:

    raise RuntimeError(
        "GROQ_API_KEY is not configured in backend/.env"
    )


# ============================================================
# GROQ CLIENT
# ============================================================

client = Groq(
    api_key=GROQ_API_KEY
)


MODEL_NAME = (
    "openai/gpt-oss-20b"
)


# ============================================================
# 1. GENERATE CONTENT
# ============================================================

def generate_content(
    brief: str,
    campaign_type: str = "announcement",
    audience: str = "general public",
    tone: str = "professional",
):

    prompt = f"""
You are SmartNotify, an AI-powered
Public Awareness Management Platform.

Create a professional public awareness
campaign message.

Campaign type:
{campaign_type}

Target audience:
{audience}

Tone:
{tone}

Campaign brief:
{brief}

Requirements:

- Preserve all facts from the campaign brief.
- Do not invent statistics.
- Do not invent dates.
- Do not invent organizations.
- Do not invent locations.
- Do not invent policies.
- Do not invent medical claims.
- Create a complete and useful public-awareness message.
- Start with a clear and engaging title.
- Include a short introduction explaining the topic.
- Include 4 to 6 practical and actionable
  points when appropriate.
- Include important safety, prevention,
  or awareness guidance when relevant.
- End with a clear call to action.
- Use simple language.
- Maintain the requested tone.
- Target approximately 250 to 350 words.
- Do not use Markdown.
- Do not use asterisks.
- Do not use decorative separators.
- Return only the final campaign message.
"""

    response = client.chat.completions.create(
        model=MODEL_NAME,

        messages=[
            {
                "role": "system",
                "content": (
                    "You are SmartNotify's "
                    "AI public communication "
                    "assistant."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],

        temperature=0.7,

        max_completion_tokens=800,
    )

    return (
        response
        .choices[0]
        .message
        .content
        .strip()
    )


# ============================================================
# 2. PERSONALIZATION
# ============================================================

def personalize_content(
    content: str,

    audience: str = "general public",

    tone: str = "professional",

    personalization_fields=None,
):

    if personalization_fields is None:

        personalization_fields = [
            "first_name",
            "city",
        ]


    allowed_fields = {
        "first_name":
            "{{first_name}}",

        "last_name":
            "{{last_name}}",

        "city":
            "{{city}}",

        "language":
            "{{language}}",

        "occupation":
            "{{occupation}}",
    }


    selected_placeholders = []


    for field in personalization_fields:

        if field in allowed_fields:

            selected_placeholders.append(
                allowed_fields[field]
            )


    if not selected_placeholders:

        selected_placeholders = [
            "{{first_name}}"
        ]


    placeholder_text = "\n".join(
        selected_placeholders
    )


    prompt = f"""
You are SmartNotify's AI
personalization assistant.

Create a reusable personalized version
of the public-awareness campaign.

TARGET AUDIENCE:
{audience}

TONE:
{tone}

ORIGINAL MESSAGE:
{content}

AVAILABLE PERSONALIZATION
PLACEHOLDERS:
{placeholder_text}

Rules:

1. Preserve all original facts.
2. Preserve the original meaning.
3. Do not invent facts.
4. Do not invent statistics.
5. Do not remove important safety
   or awareness information.
6. Adapt vocabulary and sentence
   complexity to the target audience.
7. Adjust the emotional style to
   match the requested tone.
8. Use ONLY the supplied personalization
   placeholders.
9. Do not create additional placeholders.
10. Do not use real names or fake
    personal information.
11. Keep placeholders exactly in this format:
    {{{{first_name}}}}
    {{{{last_name}}}}
    {{{{city}}}}
    {{{{language}}}}
    {{{{occupation}}}}
12. Use placeholders naturally.
13. Do not force every selected
    placeholder into the message.
14. Do not use Markdown.
15. Do not use asterisks.
16. Do not use decorative separators.
17. Return only the final personalized
    campaign message.

Example:

Hello {{{{first_name}}}},

We are pleased to invite you to
our awareness program in {{{{city}}}}.

We look forward to your participation.
"""

    response = client.chat.completions.create(
        model=MODEL_NAME,

        messages=[
            {
                "role": "system",
                "content": (
                    "You are SmartNotify's "
                    "audience personalization "
                    "assistant."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],

        temperature=0.5,

        max_completion_tokens=600,
    )

    # --------------------------------------------------------
    # EXTRACT AND VALIDATE AI RESPONSE
    # --------------------------------------------------------

    raw_content = (
        response
        .choices[0]
        .message
        .content
    )

    result = (
        raw_content.strip()
        if isinstance(raw_content, str)
        else ""
    )

    # Groq may occasionally return an empty message.
    # Never return an empty personalization result because
    # the frontend must preserve the user's original content.
    if not result:
        raise RuntimeError(
            "AI returned empty personalized content. "
            "Please try personalization again."
        )

    return result


# ============================================================
# 3. TONE / SENTIMENT CHECK
# ============================================================

def check_tone(
    content: str,
):

    prompt = f"""
You are SmartNotify's AI tone
and sentiment reviewer.

Analyze the following public-awareness
communication.

CONTENT:
{content}

Evaluate:

1. Overall sentiment:
   - positive
   - neutral
   - negative

2. Tone:
   - professional
   - friendly
   - urgent
   - formal
   - casual
   - harsh
   - reassuring
   - informative
   - mixed

3. Tone score:

Give a score from 0 to 100 where:

100 = highly appropriate
for public communication

0 = highly inappropriate

4. Identify potential problems:

- overly harsh language
- fear-inducing language
- overly casual language
- offensive language
- unclear wording
- unnecessary negativity
- misleading claims

5. Give suggestions for improvement.

Return the result in exactly this format:

SENTIMENT: <positive/neutral/negative>

TONE: <tone>

SCORE: <0-100>

ISSUES:
- <issue 1>
- <issue 2>

SUGGESTIONS:
- <suggestion 1>
- <suggestion 2>
"""

    response = client.chat.completions.create(
        model=MODEL_NAME,

        messages=[
            {
                "role": "system",
                "content": (
                    "You are SmartNotify's "
                    "tone and sentiment "
                    "analysis assistant."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],

        temperature=0.3,

        max_completion_tokens=500,
    )

    return (
        response
        .choices[0]
        .message
        .content
        .strip()
    )


# ============================================================
# 4. TRANSLATION
# ============================================================

def translate_content(
    content: str,
    target_language: str,
):

    supported_languages = {

        "english":
            "English",

        "telugu":
            "Telugu",

        "hindi":
            "Hindi",

        "tamil":
            "Tamil",

        "kannada":
            "Kannada",

        "malayalam":
            "Malayalam",

        "marathi":
            "Marathi",

        "bengali":
            "Bengali",

        "gujarati":
            "Gujarati",

        "punjabi":
            "Punjabi",
    }


    language_key = (
        target_language
        .lower()
        .strip()
    )


    # --------------------------------------------------------
    # UNSUPPORTED LANGUAGE
    # --------------------------------------------------------

    if (
        language_key
        not in supported_languages
    ):

        return {
            "content":
                content,

            "language":
                "English",

            "fallback":
                True,

            "message": (
                f"Language "
                f"'{target_language}' "
                "is not currently supported. "
                "Returned the original "
                "English content."
            ),
        }


    language = (
        supported_languages[
            language_key
        ]
    )


    # --------------------------------------------------------
    # ALREADY ENGLISH
    # --------------------------------------------------------

    if language_key == "english":

        return {
            "content":
                content,

            "language":
                "English",

            "fallback":
                False,

            "message":
                "Content is already in English.",
        }


    # --------------------------------------------------------
    # INDIC TRANS
    # --------------------------------------------------------

    try:

        translated = translate_text(
            content,
            target_language,
        )

        return {
            "content":
                translated,

            "language":
                language,

            "fallback":
                False,

            "message":
                "Translation completed successfully.",
        }

    except Exception as error:

        raise RuntimeError(
            "IndicTrans translation failed: "
            f"{str(error)}"
        )


# ============================================================
# 5. COMPLIANCE CHECK
# ============================================================

def check_compliance(
    content: str,
) -> dict:

    prompt = f"""
You are a communication compliance
and safety reviewer.

Review the following campaign message
before it is sent to the public.

CAMPAIGN MESSAGE:
{content}

Check for:

1. Hate speech or discrimination
2. Threats or violence
3. Harassment or abusive language
4. Dangerous or illegal instructions
5. Sexually explicit content
6. Misleading or deceptive claims
7. Excessively offensive language
8. Content that could create
   unnecessary public panic
9. Privacy or sensitive
   personal information
10. Any other serious
    communication-safety concern

Return your response in EXACTLY
this format:

STATUS: APPROVED or FLAGGED

REASON:
Explain briefly why the message
is approved or flagged.

ISSUES:
List the specific issues found.
If there are none, write "None".

SUGGESTION:
If flagged, provide a safer
rewritten version.
If approved, write
"No changes required."
"""

    response = client.chat.completions.create(
        model=MODEL_NAME,

        messages=[
            {
                "role": "system",
                "content": (
                    "You are a professional "
                    "communication compliance "
                    "reviewer."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],

        temperature=0.2,

        max_completion_tokens=1000,
    )

    return {
        "analysis":
            response
            .choices[0]
            .message
            .content
            .strip()
    }
    # ============================================================
# 6. FEEDBACK SENTIMENT
# ============================================================

def analyze_feedback_sentiment(
    feedback: str,
    language: str = "English",
) -> dict:

    prompt = f"""
You are SmartNotify's multilingual feedback sentiment
analysis assistant.

The feedback was submitted in this language:
{language}

Analyze the following user feedback in its original language.
Understand the meaning and sentiment before classifying it.

FEEDBACK:
{feedback}

Determine:

1. Sentiment:
   - positive
   - neutral
   - negative

2. Sentiment score:
   - integer from 0 to 100
   - 100 = extremely positive
   - 50 = neutral
   - 0 = extremely negative

Return EXACTLY:

SENTIMENT: <positive/neutral/negative>
SCORE: <0-100>
"""

    response = client.chat.completions.create(
        model=MODEL_NAME,

        messages=[
            {
                "role": "system",
                "content": (
                    "You are SmartNotify's "
                    "feedback sentiment "
                    "analysis assistant."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],

        temperature=0.1,

        max_completion_tokens=100,
    )

    result = (
        response
        .choices[0]
        .message
        .content
        .strip()
    )

    sentiment = "neutral"
    score = 50

    for line in result.splitlines():

        line = line.strip()

        if line.upper().startswith("SENTIMENT:"):

            sentiment = (
                line.split(
                    ":",
                    1
                )[1]
                .strip()
                .lower()
            )

        elif line.upper().startswith("SCORE:"):

            try:

                score = int(
                    line.split(
                        ":",
                        1
                    )[1]
                    .strip()
                )

            except ValueError:

                score = 50

    if sentiment not in {
        "positive",
        "neutral",
        "negative",
    }:

        sentiment = "neutral"

    score = max(
        0,
        min(
            100,
            score
        )
    )

    return {
        "sentiment": sentiment,
        "score": score,
    }