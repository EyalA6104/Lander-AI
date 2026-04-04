_WEIGHTS = {
    "content": 0.30,
    "ux": 0.30,
    "design": 0.25,
    "structure": 0.10,
    "seo": 0.05,
}


def compute_overall_score(
    content: float,
    ux: float,
    design: float,
    structure: float,
    seo: float,
) -> float:
    """Deterministic weighted-average overall score from section scores."""
    raw = (
        content * _WEIGHTS["content"]
        + ux * _WEIGHTS["ux"]
        + design * _WEIGHTS["design"]
        + structure * _WEIGHTS["structure"]
        + seo * _WEIGHTS["seo"]
    )
    return round(max(0.0, min(100.0, raw)), 1)
