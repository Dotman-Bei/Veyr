"""Shared constants and helpers for the direct-mode contract tests."""

import json

CONTRACT = "contract/veyr.py"
TOPIC = "GenLayer and blockchain development"


def addr(account) -> str:
    """Return the 0x-hex form of a direct-mode account fixture (raw 20 bytes)."""
    if isinstance(account, (bytes, bytearray)):
        return "0x" + bytes(account).hex()
    inner = getattr(account, "address", account)
    return getattr(inner, "as_hex", str(inner))


def verdict(decision: str, category: str, reason: str) -> str:
    return json.dumps({"decision": decision, "category": category, "reason": reason})


def approve(category="approved", reason="On-topic and respectful."):
    return verdict("APPROVE", category, reason)


def reject(category="toxic", reason="Contains insults."):
    return verdict("REJECT", category, reason)
