# app/services/translation_service.py

import re
import urllib.parse
from functools import lru_cache

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


# ============================================================
# TRANSLATION CONFIGURATION
# ============================================================

print(
    "============================================================"
)

print(
    "SmartNotify Fast Translation Service"
)

print(
    "============================================================"
)

print(
    "Translation backend: Google Translate Web"
)


# ============================================================
# SUPPORTED LANGUAGES
# ============================================================

LANGUAGES = {
    "telugu": "te",
    "hindi": "hi",
    "tamil": "ta",
    "kannada": "kn",
    "malayalam": "ml",
    "marathi": "mr",
    "bengali": "bn",
    "gujarati": "gu",
    "punjabi": "pa",
    "odia": "or",
}


# ============================================================
# LANGUAGE ALIASES
# ============================================================

LANGUAGE_ALIASES = {

    # English
    "english": "en",
    "eng": "en",
    "eng_latn": "en",
    "en": "en",

    # Telugu
    "telugu": "te",
    "tel": "te",
    "tel_telu": "te",
    "te": "te",

    # Hindi
    "hindi": "hi",
    "hin": "hi",
    "hin_deva": "hi",
    "hi": "hi",

    # Tamil
    "tamil": "ta",
    "tam": "ta",
    "tam_taml": "ta",
    "ta": "ta",

    # Kannada
    "kannada": "kn",
    "kan": "kn",
    "kan_knda": "kn",
    "kn": "kn",

    # Malayalam
    "malayalam": "ml",
    "mal": "ml",
    "mal_mlym": "ml",
    "ml": "ml",

    # Marathi
    "marathi": "mr",
    "mar": "mr",
    "mar_deva": "mr",
    "mr": "mr",

    # Bengali
    "bengali": "bn",
    "ben": "bn",
    "ben_beng": "bn",
    "bn": "bn",

    # Gujarati
    "gujarati": "gu",
    "guj": "gu",
    "guj_gujr": "gu",
    "gu": "gu",

    # Punjabi
    "punjabi": "pa",
    "pan": "pa",
    "pan_guru": "pa",
    "pa": "pa",

    # Odia
    "odia": "or",
    "oriya": "or",
    "ory_orya": "or",
    "or": "or",
}


# ============================================================
# GOOGLE TRANSLATE WEB
# ============================================================

class GoogleTranslateWeb:

    """
    Google Translate web translator.

    Uses a real Chrome browser because Google's current
    Translate website renders translation dynamically with
    JavaScript.

    No Google Cloud API key is required.
    """

    def __init__(
        self,
        headless=True,
        driver_wait=10,
    ):

        self.headless = headless

        self.driver_wait = driver_wait

        options = Options()

        if self.headless:

            options.add_argument(
                "--headless=new"
            )

        options.add_argument(
            "--disable-blink-features=AutomationControlled"
        )

        options.add_argument(
            "--disable-gpu"
        )

        options.add_argument(
            "--no-sandbox"
        )

        options.add_argument(
            "--disable-dev-shm-usage"
        )

        options.add_argument(
            "--window-size=1280,900"
        )

        options.add_argument(
            "--lang=en-US"
        )

        options.add_argument(
            "--disable-notifications"
        )

        options.add_argument(
            "--disable-popup-blocking"
        )

        self.driver = webdriver.Chrome(
            options=options
        )

        self.wait = WebDriverWait(
            self.driver,
            self.driver_wait
        )


    # ========================================================
    # TRANSLATE
    # ========================================================

    def translate(
        self,
        text: str,
        source_lang: str = "auto",
        target_lang: str = "en",
    ) -> str:

        if not text or not text.strip():

            return ""


        encoded_text = urllib.parse.quote(
            text
        )


        translate_url = (
            "https://translate.google.com/"
            f"?hl=en"
            f"&sl={source_lang}"
            f"&tl={target_lang}"
            f"&text={encoded_text}"
            f"&op=translate"
        )


        self.driver.get(
            translate_url
        )


        # ----------------------------------------------------
        # Wait for Google Translate page
        # ----------------------------------------------------

        try:

            self.wait.until(
                lambda driver:
                driver.execute_script(
                    "return document.readyState"
                ) == "complete"
            )

        except Exception:

            pass


        # ----------------------------------------------------
        # Google current translation output
        # ----------------------------------------------------

        selectors = [

            "span.ryNqvb",

            "div.ryNqvb",

            "[data-language-for-alternatives]",

            "span[jsname='W297wb']",

        ]


        for selector in selectors:

            try:

                elements = self.wait.until(

                    EC.presence_of_all_elements_located(

                        (
                            By.CSS_SELECTOR,
                            selector
                        )

                    )

                )


                translated_parts = []


                for element in elements:

                    value = (
                        element.text
                        .strip()
                    )

                    if value:

                        translated_parts.append(
                            value
                        )


                if translated_parts:

                    result = " ".join(
                        translated_parts
                    ).strip()


                    if result:

                        return result


            except Exception:

                continue


        # ----------------------------------------------------
        # JavaScript fallback
        # ----------------------------------------------------

        try:

            result = self.driver.execute_script(
                """
                const selectors = [
                    'span.ryNqvb',
                    'div.ryNqvb',
                    '[data-language-for-alternatives]',
                    'span[jsname="W297wb"]'
                ];

                for (const selector of selectors) {

                    const elements =
                        document.querySelectorAll(selector);

                    const values = [];

                    elements.forEach(element => {

                        const value =
                            element.innerText?.trim();

                        if (value) {
                            values.push(value);
                        }

                    });

                    if (values.length > 0) {
                        return values.join(" ");
                    }
                }

                return "";
                """
            )


            if result and result.strip():

                return result.strip()


        except Exception:

            pass


        raise RuntimeError(
            "Google Translate did not return "
            "a translated result."
        )


    # ========================================================
    # CLOSE BROWSER
    # ========================================================

    def close(self):

        if self.driver:

            try:

                self.driver.quit()

            except Exception:

                pass

            finally:

                self.driver = None


# ============================================================
# TEXT CLEANING
# ============================================================

def clean_text_for_translation(
    text: str
) -> str:

    """
    Remove Markdown/decorative formatting.
    """

    if not text:

        return ""


    # --------------------------------------------------------
    # Bold
    # --------------------------------------------------------

    text = re.sub(
        r"\*\*(.*?)\*\*",
        r"\1",
        text,
    )


    # --------------------------------------------------------
    # Italic
    # --------------------------------------------------------

    text = re.sub(
        r"(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)",
        r"\1",
        text,
    )


    # --------------------------------------------------------
    # Underline
    # --------------------------------------------------------

    text = re.sub(
        r"__(.*?)__",
        r"\1",
        text,
    )


    # --------------------------------------------------------
    # Markdown bullets
    # --------------------------------------------------------

    text = re.sub(
        r"(?m)^\s*\*\s+",
        "- ",
        text,
    )


    # --------------------------------------------------------
    # Headings
    # --------------------------------------------------------

    text = re.sub(
        r"(?m)^\s*#{1,6}\s*",
        "",
        text,
    )


    # --------------------------------------------------------
    # Repeated stars
    # --------------------------------------------------------

    text = re.sub(
        r"(?m)^\s*(?:\*\s*){2,}$",
        "",
        text,
    )


    # --------------------------------------------------------
    # Decorative separators
    # --------------------------------------------------------

    text = re.sub(
        r"(?m)^\s*[-_*~]{4,}\s*$",
        "",
        text,
    )


    # --------------------------------------------------------
    # Excessive blank lines
    # --------------------------------------------------------

    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text,
    )


    return text.strip()


# ============================================================
# TRANSLATED TEXT CLEANING
# ============================================================

def clean_translated_text(
    text: str
) -> str:

    if not text:

        return ""


    cleaned_lines = []


    for line in text.splitlines():

        line = line.strip()


        # ----------------------------------------------------
        # Empty lines
        # ----------------------------------------------------

        if not line:

            if (
                cleaned_lines
                and cleaned_lines[-1] != ""
            ):

                cleaned_lines.append("")

            continue


        # ----------------------------------------------------
        # Only stars
        # ----------------------------------------------------

        if re.fullmatch(
            r"[\s*]+",
            line,
        ):

            continue


        # ----------------------------------------------------
        # Decorative symbols
        # ----------------------------------------------------

        if re.fullmatch(
            r"[\s*_\-~]+",
            line,
        ):

            continue


        # ----------------------------------------------------
        # Repeated stars
        # ----------------------------------------------------

        line = re.sub(
            r"\*{2,}",
            "",
            line,
        )


        cleaned_lines.append(
            line
        )


    return "\n".join(
        cleaned_lines
    ).strip()


# ============================================================
# LANGUAGE NORMALIZATION
# ============================================================

def normalize_language(
    language: str
) -> str:

    """
    Convert SmartNotify language names/codes into
    Google language codes.
    """

    if not language:

        raise ValueError(
            "Language is required."
        )


    normalized = (
        str(language)
        .lower()
        .strip()
    )


    language_code = (
        LANGUAGE_ALIASES.get(
            normalized
        )
    )


    if not language_code:

        raise ValueError(
            f"Unsupported language: {language}"
        )


    return language_code


# ============================================================
# CACHED TRANSLATION
# ============================================================

@lru_cache(
    maxsize=512
)
def _translate_text_cached(
    cleaned_text: str,
    source_language: str,
    target_language: str,
) -> str:

    source_code = (
        normalize_language(
            source_language
        )
    )


    target_code = (
        normalize_language(
            target_language
        )
    )


    # --------------------------------------------------------
    # Same language
    # --------------------------------------------------------

    if source_code == target_code:

        return cleaned_text


    translator = None


    try:

        # ----------------------------------------------------
        # Create browser
        # ----------------------------------------------------

        translator = GoogleTranslateWeb(
            headless=True,
            driver_wait=10,
        )


        # ----------------------------------------------------
        # Translate
        # ----------------------------------------------------

        translated_text = (
            translator.translate(
                text=cleaned_text,
                source_lang=source_code,
                target_lang=target_code,
            )
        )


        if not translated_text:

            raise ValueError(
                "Translation service returned empty text."
            )


        return clean_translated_text(
            translated_text
        )


    finally:

        # ----------------------------------------------------
        # Always close Chrome
        # ----------------------------------------------------

        if translator:

            translator.close()


# ============================================================
# PUBLIC TRANSLATION FUNCTION
# ============================================================

def translate_text(
    text: str,
    target_language: str,
    source_language: str = "eng_Latn",
) -> str:

    """
    Translate text between English and supported
    Indian languages using Google Translate Web.

    Examples:

        English -> Telugu
        English -> Hindi
        English -> Tamil
        English -> Kannada
        English -> Malayalam
        English -> Marathi
        English -> Bengali
        English -> Gujarati
        English -> Punjabi
        English -> Odia
    """

    if not text or not text.strip():

        return ""


    source_code = (
        normalize_language(
            source_language
        )
    )


    target_code = (
        normalize_language(
            target_language
        )
    )


    cleaned_text = (
        clean_text_for_translation(
            text
        )
    )


    if not cleaned_text:

        return ""


    # --------------------------------------------------------
    # Same language
    # --------------------------------------------------------

    if source_code == target_code:

        return cleaned_text


    # --------------------------------------------------------
    # Translate
    # --------------------------------------------------------

    translated_text = (
        _translate_text_cached(
            cleaned_text,
            source_code,
            target_code,
        )
    )


    return translated_text


# ============================================================
# TRANSLATION CACHE INFORMATION
# ============================================================

def get_translation_cache_info():

    return (
        _translate_text_cached.cache_info()
    )


# ============================================================
# CLEAR TRANSLATION CACHE
# ============================================================

def clear_translation_cache():

    _translate_text_cached.cache_clear()