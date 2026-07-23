"""The grounding gate is the project's core credibility invariant:
no definitive verdict without valid citations, fact-checkers outrank the LLM,
and malformed LLM output degrades to UNVERIFIED — never to a guess."""

from app.models import Evidence, EvidenceKind, Stance, Verdict
from app.pipeline import _grounding_gate, _limited_result


def _ev(kind=EvidenceKind.ENCYCLOPEDIC, stance=Stance.CONTEXT, url="https://en.wikipedia.org/wiki/X"):
    return Evidence(source_name="Src", url=url, snippet="snippet", kind=kind, stance=stance)


class TestCitationValidity:
    def test_definitive_verdict_without_citations_is_capped_at_unverified(self):
        raw = {"verdict": "FALSE", "confidence": 0.95, "reasoning": "r", "citations": []}
        result = _grounding_gate("claim", raw, [_ev()])
        assert result.verdict == Verdict.UNVERIFIED
        assert result.confidence <= 0.3

    def test_hallucinated_citation_indices_are_dropped(self):
        raw = {"verdict": "TRUE", "confidence": 0.9, "reasoning": "r", "citations": [7, -1, "x"]}
        result = _grounding_gate("claim", raw, [_ev()])
        # All citations invalid -> definitive verdict not allowed
        assert result.verdict == Verdict.UNVERIFIED

    def test_valid_citation_keeps_definitive_verdict(self):
        raw = {"verdict": "FALSE", "confidence": 0.9, "reasoning": "r", "citations": [0]}
        result = _grounding_gate("claim", raw, [_ev(stance=Stance.REFUTES)])
        assert result.verdict == Verdict.FALSE
        assert len(result.evidence) == 1

    def test_unverified_is_allowed_without_citations(self):
        raw = {"verdict": "UNVERIFIED", "confidence": 0.5, "reasoning": "r", "citations": []}
        result = _grounding_gate("claim", raw, [_ev()])
        assert result.verdict == Verdict.UNVERIFIED


class TestFactCheckerPrecedence:
    def test_llm_true_overruled_by_unanimous_refuting_factcheckers(self):
        ev = [_ev(kind=EvidenceKind.FACTCHECK, stance=Stance.REFUTES, url="https://boomlive.in/x")]
        raw = {"verdict": "TRUE", "confidence": 0.8, "reasoning": "r", "citations": [0]}
        result = _grounding_gate("claim", raw, ev)
        assert result.verdict == Verdict.FALSE

    def test_llm_false_overruled_by_unanimous_supporting_factcheckers(self):
        ev = [_ev(kind=EvidenceKind.FACTCHECK, stance=Stance.SUPPORTS, url="https://politifact.com/x")]
        raw = {"verdict": "FALSE", "confidence": 0.8, "reasoning": "r", "citations": [0]}
        result = _grounding_gate("claim", raw, ev)
        assert result.verdict == Verdict.TRUE

    def test_mixed_factcheckers_do_not_flip_verdict(self):
        ev = [
            _ev(kind=EvidenceKind.FACTCHECK, stance=Stance.REFUTES, url="https://a.com"),
            _ev(kind=EvidenceKind.FACTCHECK, stance=Stance.SUPPORTS, url="https://b.com"),
        ]
        raw = {"verdict": "TRUE", "confidence": 0.7, "reasoning": "r", "citations": [0, 1]}
        result = _grounding_gate("claim", raw, ev)
        assert result.verdict == Verdict.TRUE


class TestMalformedLlmOutput:
    def test_unknown_verdict_string_degrades_to_unverified(self):
        raw = {"verdict": "PROBABLY", "confidence": 0.9, "reasoning": "r", "citations": [0]}
        assert _grounding_gate("c", raw, [_ev()]).verdict == Verdict.UNVERIFIED

    def test_garbage_confidence_degrades_to_zero(self):
        raw = {"verdict": "UNVERIFIED", "confidence": "high", "reasoning": "r", "citations": []}
        assert _grounding_gate("c", raw, [_ev()]).confidence == 0.0

    def test_confidence_is_clamped(self):
        raw = {"verdict": "UNVERIFIED", "confidence": 7.5, "reasoning": "r", "citations": []}
        assert _grounding_gate("c", raw, [_ev()]).confidence == 1.0

    def test_missing_reasoning_gets_placeholder(self):
        raw = {"verdict": "UNVERIFIED", "confidence": 0.2, "citations": []}
        assert _grounding_gate("c", raw, [_ev()]).reasoning


class TestLimitedResult:
    def test_no_llm_means_unverified_zero_confidence_with_evidence(self):
        result = _limited_result("claim", [_ev()])
        assert result.verdict == Verdict.UNVERIFIED
        assert result.confidence == 0.0
        assert result.evidence
