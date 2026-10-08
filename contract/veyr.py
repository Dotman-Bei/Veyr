# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""
Veyr
----
A decentralized community forum on GenLayer. Every submitted post is moderated
by validator LLM consensus inside this Intelligent Contract, and the resulting
verdict, the post itself and the author's reputation are persisted on-chain.

Public interface:
  views  get_topic, get_post_count, get_approved_count, get_reputation,
         get_post, get_posts
  write  submit_post
"""

from genlayer import *

from dataclasses import dataclass
import json
import typing


MAX_POST_CHARS = 2000
MAX_REASON_CHARS = 280

APPROVE = "APPROVE"
REJECT = "REJECT"
DECISIONS = (APPROVE, REJECT)
CATEGORIES = ("approved", "toxic", "off-topic", "spam", "other")

BOARD_POLICY = """
A post is APPROVED only if ALL of these are true:
  1. It is not toxic: no insults, harassment, hate speech, threats, or slurs.
  2. It contains no sexual or graphically violent content.
  3. It is on-topic for this community: it discusses technology, software,
     blockchain, or GenLayer.
  4. It is not spam or pure advertising.
If ANY condition fails, the post is REJECTED.
""".strip()


@allow_storage
@dataclass
class Post:
    """One submitted post plus the consensus-backed moderation result."""

    author: Address
    text: str
    approved: bool
    category: str
    reason: str


# --------------------------- moderation output ---------------------------


def _json_region(raw: str) -> str:
    """Extract the JSON object from model text that may carry fences or prose."""
    text = raw.strip()
    if text.startswith("```"):
        text = text.strip("`").strip()
        if text[:4].lower() == "json":
            text = text[4:]
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end <= start:
        raise gl.vm.UserError("moderator did not return JSON")
    return text[start : end + 1]


def _normalize_moderation(value: typing.Any) -> dict:
    """
    Turn raw moderator output into {decision, category, reason}.

    Raises UserError on anything malformed so a broken response can never be
    silently treated as an approval.
    """
    if isinstance(value, dict):
        payload = value
    elif isinstance(value, str):
        try:
            payload = json.loads(_json_region(value))
        except gl.vm.UserError:
            raise
        except Exception:
            raise gl.vm.UserError("moderator returned malformed JSON")
    else:
        raise gl.vm.UserError("moderator returned an unsupported payload")

    if not isinstance(payload, dict):
        raise gl.vm.UserError("moderator returned a non-object payload")

    decision = str(payload.get("decision", "")).strip().upper()
    if decision not in DECISIONS:
        raise gl.vm.UserError("invalid decision from moderator")

    category = str(payload.get("category", "")).strip().lower()
    if decision == APPROVE:
        # An approved post can only ever carry the "approved" category.
        category = "approved"
    elif category not in CATEGORIES or category == "approved":
        category = "other"

    reason = " ".join(str(payload.get("reason", "")).split())
    if len(reason) == 0:
        reason = (
            "Meets the board policy." if decision == APPROVE else "Violates the board policy."
        )
    reason = reason[:MAX_REASON_CHARS]

    return {"decision": decision, "category": category, "reason": reason}


# ------------------------------ public shape ------------------------------


def _as_public_record(index: int, post: Post) -> dict:
    return {
        "index": index,
        "author": post.author.as_hex,
        "text": post.text,
        "approved": post.approved,
        "category": post.category,
        "reason": post.reason,
    }


def _parse_address(value: typing.Any) -> Address:
    try:
        return Address(value)
    except Exception:
        raise gl.vm.UserError("invalid address")


class Veyr(gl.Contract):
    owner: Address
    topic: str
    posts: DynArray[Post]
    approved_count: u256
    reputation: TreeMap[Address, i32]

    def __init__(self, topic: str):
        topic = topic.strip()
        if len(topic) == 0:
            raise gl.vm.UserError("topic cannot be empty")
        self.owner = gl.message.sender_address
        self.topic = topic
        self.approved_count = u256(0)

    # ------------------------------ views ------------------------------

    @gl.public.view
    def get_topic(self) -> str:
        return self.topic

    @gl.public.view
    def get_post_count(self) -> u256:
        return u256(len(self.posts))

    @gl.public.view
    def get_approved_count(self) -> u256:
        return self.approved_count

    @gl.public.view
    def get_reputation(self, author: str) -> int:
        return int(self.reputation.get(_parse_address(author), i32(0)))

    @gl.public.view
    def get_post(self, index: int) -> dict:
        if index < 0 or index >= len(self.posts):
            raise gl.vm.UserError("post index out of range")
        return _as_public_record(index, self.posts[index])

    @gl.public.view
    def get_posts(self) -> list:
        records: list = []
        index = len(self.posts) - 1
        while index >= 0:
            records.append(_as_public_record(index, self.posts[index]))
            index -= 1
        return records
