"""Direct-mode tests for submit_post: validation, persistence and reputation."""

from helpers import CONTRACT, TOPIC, addr, approve, reject

MODERATOR = r".*content moderator.*"


def test_empty_post_reverts(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT, TOPIC)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("post text cannot be empty"):
        c.submit_post("   \n\t ")
    assert c.get_post_count() == 0


def test_post_over_limit_reverts(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT, TOPIC)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("post text too long"):
        c.submit_post("x" * 2001)
    assert c.get_post_count() == 0


def test_post_at_limit_is_accepted(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT, TOPIC)
    direct_vm.sender = direct_alice
    direct_vm.mock_llm(MODERATOR, approve())
    # Surrounding whitespace is trimmed before the length check.
    c.submit_post("  " + "a" * 2000 + "  ")
    assert len(c.get_post(0)["text"]) == 2000


def test_approved_post_is_persisted(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT, TOPIC)
    direct_vm.sender = direct_alice
    direct_vm.mock_llm(MODERATOR, approve(reason="On-topic GenLayer discussion."))

    result = c.submit_post("  GenLayer's optimistic democracy is fascinating!  ")
    assert result == {
        "index": 0,
        "approved": True,
        "category": "approved",
        "reason": "On-topic GenLayer discussion.",
    }

    assert c.get_post(0) == {
        "index": 0,
        "author": c.get_post(0)["author"],
        "text": "GenLayer's optimistic democracy is fascinating!",
        "approved": True,
        "category": "approved",
        "reason": "On-topic GenLayer discussion.",
    }
    assert c.get_post(0)["author"].lower() == addr(direct_alice).lower()
    assert c.get_post_count() == 1
    assert c.get_approved_count() == 1
    assert c.get_reputation(addr(direct_alice)) == 1


def test_rejected_post_is_still_persisted(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT, TOPIC)
    direct_vm.sender = direct_alice
    direct_vm.mock_llm(MODERATOR, reject())

    result = c.submit_post("You are all idiots and I hate this place")
    assert result["approved"] is False
    assert result["category"] == "toxic"

    post = c.get_post(0)
    assert post["approved"] is False
    assert post["text"] == "You are all idiots and I hate this place"
    assert c.get_post_count() == 1
    assert c.get_approved_count() == 0
    assert c.get_reputation(addr(direct_alice)) == -1


def test_reputation_accumulates_per_author(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = direct_deploy(CONTRACT, TOPIC)

    direct_vm.sender = direct_alice
    direct_vm.mock_llm(MODERATOR, approve())
    c.submit_post("First post about smart contracts")
    c.submit_post("Second post about validators")

    direct_vm.clear_mocks()
    direct_vm.mock_llm(MODERATOR, reject(category="spam", reason="Advertising."))
    c.submit_post("BUY CHEAP FOLLOWERS NOW visit my link")

    direct_vm.sender = direct_bob
    c.submit_post("more spam from bob")

    assert c.get_reputation(addr(direct_alice)) == 1  # +1 +1 -1
    assert c.get_reputation(addr(direct_bob)) == -1
    assert c.get_post_count() == 4
    assert c.get_approved_count() == 2


def test_posts_are_returned_newest_first(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT, TOPIC)
    direct_vm.sender = direct_alice
    direct_vm.mock_llm(MODERATOR, approve())

    c.submit_post("oldest post")
    c.submit_post("middle post")
    c.submit_post("newest post")

    posts = c.get_posts()
    assert [p["text"] for p in posts] == ["newest post", "middle post", "oldest post"]
    assert [p["index"] for p in posts] == [2, 1, 0]
    assert set(posts[0].keys()) == {"index", "author", "text", "approved", "category", "reason"}
