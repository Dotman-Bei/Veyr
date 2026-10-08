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
import typing


MAX_POST_CHARS = 2000


@allow_storage
@dataclass
class Post:
    """One submitted post plus the consensus-backed moderation result."""

    author: Address
    text: str
    approved: bool
    category: str
    reason: str


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
