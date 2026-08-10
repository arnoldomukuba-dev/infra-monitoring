import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any


def is_email_enabled() -> bool:
    val = os.getenv("EMAIL_NOTIFICATIONS_ENABLED", "true").lower()
    return val in ["true", "1", "yes", "on"]


def get_smtp_config() -> Dict[str, Any]:
    return {
        "host": os.getenv("SMTP_HOST", "localhost"),
        "port": int(os.getenv("SMTP_PORT", "587")),
        "user": os.getenv("SMTP_USER", ""),
        "password": os.getenv("SMTP_PASSWORD", ""),
        "from_email": os.getenv("SMTP_FROM", "alerts@odrisystems.io"),
        "enabled": is_email_enabled(),
    }


def send_email_notification(to_email: str, subject: str, body_text: str) -> bool:
    """Send an email notification via SMTP with safe error handling."""
    config = get_smtp_config()

    if not config["enabled"]:
        print(f"[Email Service] Email dispatch skipped (disabled). Subject: '{subject}' -> To: {to_email}")
        return False

    if not to_email:
        return False

    try:
        msg = MIMEMultipart()
        msg["From"] = config["from_email"]
        msg["To"] = to_email
        msg["Subject"] = subject

        # Plain text message body
        msg.attach(MIMEText(body_text, "plain"))

        # Connect to SMTP server with 5 second timeout
        with smtplib.SMTP(config["host"], config["port"], timeout=5) as server:
            if config["port"] == 587:
                server.starttls()
            if config["user"] and config["password"]:
                server.login(config["user"], config["password"])
            server.send_message(msg)

        print(f"[Email Service] Email sent successfully to {to_email}: '{subject}'")
        return True
    except Exception as ex:
        # Graceful handling when SMTP server is unreachable / unconfigured in dev environment
        print(f"[Email Service] SMTP dispatch info (unconfigured/mocked): {ex}. Subject: '{subject}' -> To: {to_email}")
        return False


def get_email_status_summary() -> Dict[str, Any]:
    """Safe email settings configuration summary without exposing secrets."""
    config = get_smtp_config()
    return {
        "enabled": config["enabled"],
        "smtp_host": config["host"],
        "smtp_port": config["port"],
        "smtp_from": config["from_email"],
        "smtp_auth_configured": bool(config["user"] and config["password"]),
    }
