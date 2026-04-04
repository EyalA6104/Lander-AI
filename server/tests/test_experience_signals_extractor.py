import unittest

from bs4 import BeautifulSoup

from app.services.extractors.experience_signals_extractor import (
    ExperienceSignalsExtractor,
)


class ExperienceSignalsExtractorTests(unittest.TestCase):
    def test_extracts_conversion_and_accessibility_signals(self) -> None:
        html = """
        <html>
          <body>
            <a href="#main">Skip to content</a>
            <nav>
              <a href="/product">Product</a>
              <a href="/pricing">Pricing</a>
              <a href="/docs">Docs</a>
            </nav>
            <section>
              <h1>Launch faster</h1>
              <a class="btn btn-primary" href="/demo">Book demo</a>
              <button>Start free trial</button>
            </section>
            <form>
              <input type="email" />
              <input type="submit" value="Get started" />
            </form>
            <section>
              <h2>Pricing</h2>
              <p>Choose the plan that fits your team.</p>
            </section>
            <section>
              <h2>Testimonials</h2>
              <p>Trusted by teams at Acme.</p>
            </section>
            <section>
              <h2>Frequently Asked Questions</h2>
            </section>
            <style>
              @media (prefers-reduced-motion: reduce) {
                * { animation: none; }
              }
            </style>
          </body>
        </html>
        """

        signals = ExperienceSignalsExtractor().extract(BeautifulSoup(html, "html.parser"))

        self.assertEqual(signals.button_count, 3)
        self.assertEqual(signals.cta_count, 3)
        self.assertEqual(
            signals.cta_text_samples,
            ["Book demo", "Start free trial", "Get started"],
        )
        self.assertEqual(signals.form_count, 1)
        self.assertEqual(signals.input_count, 2)
        self.assertEqual(signals.nav_link_count, 3)
        self.assertTrue(signals.has_pricing_section)
        self.assertTrue(signals.has_social_proof)
        self.assertTrue(signals.has_faq_section)
        self.assertTrue(signals.has_reduced_motion_support)
        self.assertTrue(signals.has_skip_link)


if __name__ == "__main__":
    unittest.main()
