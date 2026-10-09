import re

PHONE_REGEX = re.compile(r'(?:\+84|0)\d{9,10}\b|(?:\+84|0)\s*\d{3}\s*\d{3}\s*\d{3,4}\b')
EMAIL_REGEX = re.compile(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+')

def anonymize_text(text: str) -> str:
    if not text:
        return text
    # Replace emails
    text = EMAIL_REGEX.sub("[EMAIL]", text)
    # Replace phone numbers
    text = PHONE_REGEX.sub("[PHONE_NUMBER]", text)
    return text

def anonymize_data(data: any) -> any:
    """
    Recursively scans and anonymizes personal identifiers in dictionaries, lists, and strings.
    """
    if isinstance(data, str):
        return anonymize_text(data)
    elif isinstance(data, dict):
        return {k: anonymize_data(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [anonymize_data(item) for item in data]
    return data
