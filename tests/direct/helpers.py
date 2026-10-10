"""Shared constants and helpers for the direct-mode contract tests."""

import datetime
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


T0 = datetime.datetime(2026, 10, 10, 12, 0, 0, tzinfo=datetime.timezone.utc)


def at(direct_vm, seconds: int) -> None:
    """Set the transaction clock to T0 + seconds (the contract reads time via datetime.now)."""
    when = T0 + datetime.timedelta(seconds=seconds)
    direct_vm.warp(when.isoformat().replace("+00:00", "Z"))
