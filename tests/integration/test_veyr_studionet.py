"""
Integration tests: real Veyr deployment with real multi-validator LLM consensus.

Deploys a fresh contract to GenLayer Studionet through genlayer-test and
drives it over JSON-RPC. No mocks: every verdict comes from validators.

Run from the project root:
    npm run test:integration
    # = gltest tests/integration -v -s --network studionet --contracts-dir contract
"""

import pytest

from gltest import get_contract_factory, get_default_account
from gltest.assertions import tx_execution_succeeded

TOPIC = "GenLayer and blockchain development"

CLEAN_POST = (
    "I really enjoy how GenLayer validators reach consensus on subjective "
    "decisions using the Equivalence Principle. Intelligent Contracts that can "
    "reason about natural language open up a lot of new dApp designs."
)
TOXIC_POST = "You are all complete idiots and I hate every single one of you losers."

# LLM consensus on Studionet can take a while: wait patiently.
WAIT = dict(wait_interval=5000, wait_retries=120)


@pytest.fixture(scope="module")
def veyr():
    factory = get_contract_factory("Veyr")
    return factory.deploy(args=[TOPIC], **WAIT)


@pytest.fixture(scope="module")
def author():
    return get_default_account().address


def _stats(contract, author):
    return (
        int(contract.get_post_count().call()),
        int(contract.get_approved_count().call()),
        int(contract.get_reputation(args=[author]).call()),
    )


def test_topic_is_stored_on_chain(veyr):
    assert veyr.get_topic().call() == TOPIC


def test_clean_on_topic_post_is_approved(veyr, author):
    posts, approved, rep = _stats(veyr, author)

    tx = veyr.submit_post(args=[CLEAN_POST]).transact(**WAIT)
    assert tx_execution_succeeded(tx)

    newest = veyr.get_posts().call()[0]
    assert newest["text"] == CLEAN_POST
    assert newest["approved"] is True
    assert newest["category"] == "approved"
    assert newest["reason"]
    assert newest["author"].lower() == author.lower()
    assert _stats(veyr, author) == (posts + 1, approved + 1, rep + 1)


def test_toxic_post_is_rejected_and_still_stored(veyr, author):
    posts, approved, rep = _stats(veyr, author)

    tx = veyr.submit_post(args=[TOXIC_POST]).transact(**WAIT)
    assert tx_execution_succeeded(tx)

    newest = veyr.get_posts().call()[0]
    assert newest["text"] == TOXIC_POST
    assert newest["approved"] is False
    assert newest["category"] != "approved"
    assert newest["reason"]
    assert _stats(veyr, author) == (posts + 1, approved, rep - 1)
