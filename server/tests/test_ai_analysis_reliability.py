import unittest
from types import SimpleNamespace
from unittest.mock import patch

from app.services.ai_analysis import (
    analyze_with_ai,
    _extract_finish_metadata,
    _parse_ai_response,
)
from app.services.extractors.models import DesignSignals, ExperienceSignals
from app.services.scraper import ScrapedPageData


def _sample_scraped_data() -> ScrapedPageData:
    return ScrapedPageData(
        url="https://example.com",
        title="Example",
        meta_description="Ship faster",
        h1_headings=["Build better pages"],
        h2_headings=["Pricing", "Testimonials"],
        design_signals=DesignSignals(
            has_animations=True,
            animation_keyword_count=3,
            has_animation_library=True,
            detected_libraries=["framer-motion"],
            image_count=4,
            video_count=1,
            has_media=True,
        ),
        experience_signals=ExperienceSignals(
            button_count=4,
            cta_count=2,
            cta_text_samples=["Book demo", "Start free trial"],
            form_count=1,
            input_count=2,
            nav_link_count=5,
            has_pricing_section=True,
            has_social_proof=True,
            has_faq_section=True,
            has_reduced_motion_support=True,
            has_skip_link=False,
        ),
        visible_text_excerpt="Clear value proposition and strong CTA hierarchy.",
    )


def _valid_payload() -> dict:
    return {
        "overallScore": 88,
        "content": {"score": 90, "suggestions": ["Sharpen the hero promise."]},
        "structure": {"score": 84, "suggestions": ["Tighten the page flow to the CTA."]},
        "design": {"score": 87, "suggestions": ["Increase contrast in key conversion areas."]},
        "ux": {"score": 89, "suggestions": ["Reduce friction in the primary sign-up path."]},
        "seo": {"score": 76, "suggestions": ["Refine metadata around the core use case."]},
    }


class _FakeModels:
    def __init__(self, responses: list[SimpleNamespace]) -> None:
        self._responses = responses
        self.calls: list[dict] = []

    async def generate_content(self, **kwargs):
        self.calls.append(kwargs)
        response = self._responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


class _FakeClient:
    def __init__(self, responses: list[SimpleNamespace]) -> None:
        self.aio = SimpleNamespace(models=_FakeModels(responses))


class AIAnalysisReliabilityTests(unittest.IsolatedAsyncioTestCase):
    def test_parse_ai_response_prefers_structured_payload(self) -> None:
        result = _parse_ai_response("not valid json", _valid_payload())
        self.assertEqual(result.overallScore, 88.0)
        self.assertEqual(result.ux.score, 89.0)

    def test_extract_finish_metadata_handles_response_candidate(self) -> None:
        response = SimpleNamespace(
            candidates=[
                SimpleNamespace(
                    finish_reason="MAX_TOKENS",
                    finish_message="Output truncated.",
                )
            ]
        )

        finish_reason, finish_message = _extract_finish_metadata(response)

        self.assertEqual(finish_reason, "MAX_TOKENS")
        self.assertEqual(finish_message, "Output truncated.")

    async def test_analyze_with_ai_repairs_invalid_json_response(self) -> None:
        fake_client = _FakeClient(
            [
                SimpleNamespace(text='{"overallScore": 88, "content": ', parsed=None, candidates=[]),
                SimpleNamespace(text=None, parsed=_valid_payload(), candidates=[]),
            ]
        )

        with (
            patch("app.services.ai_analysis.get_gemini_api_key", return_value="test-key"),
            patch("app.services.ai_analysis.genai.Client", return_value=fake_client),
        ):
            result = await analyze_with_ai(_sample_scraped_data())

        self.assertEqual(result.overallScore, 88.0)
        self.assertEqual(result.design.score, 87.0)
        self.assertEqual(len(fake_client.aio.models.calls), 2)
        self.assertIn(
            "Malformed model response",
            fake_client.aio.models.calls[1]["contents"],
        )

    async def test_analyze_with_ai_uses_compact_retry_on_max_tokens(self) -> None:
        fake_client = _FakeClient(
            [
                SimpleNamespace(
                    text='{"overallScore": 88, "content": ',
                    parsed=None,
                    candidates=[
                        SimpleNamespace(
                            finish_reason="MAX_TOKENS",
                            finish_message="Output truncated.",
                        )
                    ],
                ),
                SimpleNamespace(text=None, parsed=_valid_payload(), candidates=[]),
            ]
        )

        with (
            patch("app.services.ai_analysis.get_gemini_api_key", return_value="test-key"),
            patch("app.services.ai_analysis.genai.Client", return_value=fake_client),
        ):
            result = await analyze_with_ai(_sample_scraped_data())

        self.assertEqual(result.overallScore, 88.0)
        self.assertEqual(len(fake_client.aio.models.calls), 2)
        self.assertIn(
            "Compact analysis mode",
            fake_client.aio.models.calls[1]["contents"],
        )

    async def test_analyze_with_ai_falls_back_when_compact_retry_errors(self) -> None:
        fake_client = _FakeClient(
            [
                SimpleNamespace(
                    text='{"overallScore": 88, "content": ',
                    parsed=None,
                    candidates=[
                        SimpleNamespace(finish_reason="MAX_TOKENS", finish_message="Truncated")
                    ],
                ),
                RuntimeError("quota exceeded"),
                SimpleNamespace(text=None, parsed=_valid_payload(), candidates=[]),
            ]
        )

        with (
            patch("app.services.ai_analysis.get_gemini_api_key", return_value="test-key"),
            patch("app.services.ai_analysis.genai.Client", return_value=fake_client),
        ):
            result = await analyze_with_ai(_sample_scraped_data())

        self.assertEqual(result.overallScore, 88.0)
        self.assertEqual(len(fake_client.aio.models.calls), 3)
        self.assertIn(
            "Malformed model response",
            fake_client.aio.models.calls[2]["contents"],
        )


if __name__ == "__main__":
    unittest.main()
