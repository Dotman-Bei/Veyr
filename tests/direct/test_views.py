"""
Direct-mode tests for Veyr's storage and read interface.

These run the contract in-process with gltest's direct VM (no network).
Run from the project root:  npm run test:contract
"""

from helpers import CONTRACT, TOPIC, addr


def test_initial_state(direct_deploy):
    c = direct_deploy(CONTRACT, TOPIC)
    assert c.get_topic() == TOPIC
    assert c.get_post_count() == 0
    assert c.get_approved_count() == 0
    assert c.get_posts() == []


def test_topic_is_trimmed(direct_deploy):
    c = direct_deploy(CONTRACT, f"   {TOPIC}  ")
    assert c.get_topic() == TOPIC


def test_empty_topic_reverts(direct_vm, direct_deploy):
    with direct_vm.expect_revert("topic cannot be empty"):
        direct_deploy(CONTRACT, "   ")


def test_unknown_author_reputation_is_zero(direct_deploy, direct_alice):
    c = direct_deploy(CONTRACT, TOPIC)
    assert c.get_reputation(addr(direct_alice)) == 0


def test_get_post_out_of_range_reverts(direct_vm, direct_deploy):
    c = direct_deploy(CONTRACT, TOPIC)
    with direct_vm.expect_revert("post index out of range"):
        c.get_post(0)
    with direct_vm.expect_revert("post index out of range"):
        c.get_post(-1)
