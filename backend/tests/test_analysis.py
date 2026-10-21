import math

import pytest

from app.analysis import linear_fit, polynomial_fit, summary_stats


def test_summary_stats_known_values() -> None:
    result = summary_stats([1.0, 2.0, 3.0, 4.0])
    assert result["n"] == 4
    assert result["mean"] == pytest.approx(2.5)
    assert result["std"] == pytest.approx(math.sqrt(5.0 / 3.0))
    assert result["sem"] == pytest.approx(math.sqrt(5.0 / 3.0) / 2.0)


def test_summary_stats_requires_two_values() -> None:
    with pytest.raises(ValueError, match="at least two"):
        summary_stats([1.0])


def test_summary_stats_rejects_non_finite() -> None:
    with pytest.raises(ValueError, match="non-finite"):
        summary_stats([1.0, float("nan")])


def test_linear_fit_exact_line() -> None:
    x = [0.0, 1.0, 2.0, 3.0]
    y = [1.0, 3.0, 5.0, 7.0]
    result = linear_fit(x, y)
    assert result["slope"] == pytest.approx(2.0)
    assert result["intercept"] == pytest.approx(1.0)
    assert result["r_squared"] == pytest.approx(1.0)
    assert all(abs(value) < 1e-12 for value in result["residuals"])
    assert result["equation"] == "y = 2x + 1"


def test_linear_fit_rejects_constant_x() -> None:
    with pytest.raises(ValueError, match="x values must vary"):
        linear_fit([1.0, 1.0, 1.0], [1.0, 2.0, 3.0])


def test_linear_fit_rejects_length_mismatch() -> None:
    with pytest.raises(ValueError, match="same length"):
        linear_fit([1.0, 2.0, 3.0], [1.0, 2.0])


def test_quadratic_fit_exact_parabola() -> None:
    x = [-2.0, -1.0, 0.0, 1.0, 2.0]
    y = [value * value for value in x]
    result = polynomial_fit(x, y, 2)
    assert result["degree"] == 2
    assert result["coefficients"][0] == pytest.approx(1.0)
    assert result["coefficients"][1] == pytest.approx(0.0, abs=1e-9)
    assert result["coefficients"][2] == pytest.approx(0.0, abs=1e-9)
    assert result["r_squared"] == pytest.approx(1.0)
    assert result["equation"].startswith("y = 1x^2")


def test_cubic_fit_exact_cubic() -> None:
    x = [-2.0, -1.0, 0.0, 1.0, 2.0, 3.0]
    y = [value ** 3 - 2.0 * value + 1.0 for value in x]
    result = polynomial_fit(x, y, 3)
    assert result["degree"] == 3
    assert result["coefficients"][0] == pytest.approx(1.0, abs=1e-9)
    assert result["coefficients"][1] == pytest.approx(0.0, abs=1e-9)
    assert result["coefficients"][2] == pytest.approx(-2.0, abs=1e-9)
    assert result["coefficients"][3] == pytest.approx(1.0, abs=1e-9)
    assert result["r_squared"] == pytest.approx(1.0)


def test_polynomial_rejects_degree_outside_supported_range() -> None:
    with pytest.raises(ValueError, match="degree must be 2 or 3"):
        polynomial_fit([0.0, 1.0, 2.0], [0.0, 1.0, 4.0], 1)


def test_polynomial_requires_enough_points() -> None:
    with pytest.raises(ValueError, match="requires more than"):
        polynomial_fit([0.0, 1.0, 2.0], [0.0, 1.0, 4.0], 3)