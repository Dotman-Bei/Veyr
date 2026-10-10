"""Direct-mode tests for moderation output normalization and the prompt."""

import json

from helpers import CONTRACT, TOPIC, addr, approve, reject, verdict

MODERATOR = r".*content moderator.*"


def _submit_with(direct_vm, c, response, text="A post about GenLayer validators"):
    direct_vm.clear_mocks()
    direct_vm.mock_llm(MODERATOR, response)
    return c.submit_post(text)


# ---------------------------- normalization ----------------------------


def test_decision_casing_is_normalized(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT, TOPIC)
    direct_vm.sender = direct_alice
    result = _submit_with(direct_vm, c, verdict("  approve ", "APPROVED", "fine"))
    assert result["approved"] is True
    assert result["category"] == "approved"


def test_json_inside_markdown_fence_is_parsed(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT, TOPIC)
    direct_vm.sender = direct_alice
    fenced = "```json\n" + reject(category="spam", reason="Pure advertising.") + "\n```"
    result = _submit_with(direct_vm, c, fenced)
    assert {k: result[k] for k in ("index", "approved", "category", "reason")} == {
        "index": 0,
        "approved": False,
        "category": "spam",
        "reason": "Pure advertising.",
    }


def test_json_with_surrounding_prose_is_parsed(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT, TOPIC)
    direct_vm.sender = direct_alice
    noisy = "Sure! Here is my verdict: " + approve() + " Hope that helps."
    assert _submit_with(direct_vm, c, noisy)["approved"] is True


def test_unknown_category_defaults_to_other(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT, TOPIC)
    direct_vm.sender = direct_alice
    result = _submit_with(direct_vm, c, reject(category="rude-ish"))
    assert result["category"] == "other"


def test_reject_cannot_carry_approved_category(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT, TOPIC)
    direct_vm.sender = direct_alice
    result = _submit_with(direct_vm, c, reject(category="approved"))
    assert result["approved"] is False
    assert result["category"] == "other"


def test_approve_always_uses_approved_category(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT, TOPIC)
    direct_vm.sender = direct_alice
    result = _submit_with(direct_vm, c, approve(category="spam"))
    assert result["category"] == "approved"


def test_reason_is_trimmed_and_bounded(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT, TOPIC)
    direct_vm.sender = direct_alice
    result = _submit_with(direct_vm, c, approve(reason="  word   " * 200))
    assert 0 < len(result["reason"]) <= 280
    assert result["reason"] == result["reason"].strip()
    assert "  " not in result["reason"]


def test_missing_reason_gets_a_default(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT, TOPIC)
    direct_vm.sender = direct_alice
    result = _submit_with(direct_vm, c, json.dumps({"decision": "REJECT", "category": "toxic"}))
    assert result["reason"] == "Violates the board policy."


def test_invalid_decision_never_mutates_state(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT, TOPIC)
    direct_vm.sender = direct_alice
    direct_vm.mock_llm(MODERATOR, verdict("MAYBE", "other", "unsure"))
    with direct_vm.expect_revert("invalid decision from moderator"):
        c.submit_post("A post about GenLayer")
    assert c.get_post_count() == 0
    assert c.get_approved_count() == 0
    assert c.get_reputation(addr(direct_alice)) == 0


def test_non_json_output_never_becomes_an_approval(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT, TOPIC)
    direct_vm.sender = direct_alice
    direct_vm.mock_llm(MODERATOR, "I think this post is fine, APPROVE.")
    with direct_vm.expect_revert("moderator did not return JSON"):
        c.submit_post("A post about GenLayer")
    assert c.get_post_count() == 0
    assert c.get_approved_count() == 0


def test_broken_json_is_rejected(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT, TOPIC)
    direct_vm.sender = direct_alice
    direct_vm.mock_llm(MODERATOR, '{"decision": "APPROVE", "category": }')
    with direct_vm.expect_revert("malformed JSON"):
        c.submit_post("A post about GenLayer")
    assert c.get_post_count() == 0


def test_non_object_json_is_rejected(direct_vm, direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT, TOPIC)
    direct_vm.sender = direct_alice
    direct_vm.mock_llm(MODERATOR, '["APPROVE"]')
    with direct_vm.expect_revert():
        c.submit_post("A post about GenLayer")
    assert c.get_post_count() == 0
