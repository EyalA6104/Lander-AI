import unittest

from app.services.ai_analysis import _SYSTEM_PROMPT, _build_user_prompt
from app.services.extractors.models import DesignSignals, ExperienceSignals
from app.services.scraper import ScrapedPageData


class AIAnalysisPromptTests(unittest.TestCase):
    def test_system_prompt_prioritizes_modern_ux_over_seo_only(self) -> None:
        self.assertIn("modern, high-converting product", _SYSTEM_PROMPT)
        self.assertIn("Do not over-reward pages", _SYSTEM_PROMPT)
        self.assertIn("Reward animation only when it likely supports clarity", _SYSTEM_PROMPT)
        self.assertIn("SEO matters, but it should not dominate", _SYSTEM_PROMPT)

    def test_user_prompt_includes_experience_signals_and_visible_text(self) -> None:
        data = ScrapedPageData(
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
            visible_text_excerpt="A" * 1400,
        )

        prompt = _build_user_prompt(data)

        self.assertIn("CTA text samples: Book demo, Start free trial", prompt)
        self.assertIn("Has reduced motion support: True", prompt)
        self.assertIn("Has social proof: True", prompt)
        self.assertIn("Visible text excerpt: ", prompt)
        self.assertNotIn("A" * 1300, prompt)


if __name__ == "__main__":
    unittest.main()
