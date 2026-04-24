"""
============================================================
FILE: ml-service/profile_coach/coach.py — Profile Improvement Advisor
============================================================

WHAT:
  Analyzes a candidate's profile and generates actionable suggestions
  to improve their match scores.

HOW:
  Checks for common gaps in teaching profiles:
  - Missing key qualifications (B.Ed, CTET, etc.)
  - Low experience
  - Missing salary expectation
  - Limited location preferences
  - Incomplete profile sections

  Each suggestion includes:
  - What to add/change
  - Estimated impact on match scores
  - Priority level (high/medium/low)
============================================================
"""


class ProfileCoach:
    """Generates actionable profile improvement suggestions."""

    # Key qualifications that significantly boost teaching profiles
    KEY_QUALIFICATIONS = {
        "b.ed": {"name": "B.Ed (Bachelor of Education)", "impact": 15, "desc": "Required for most PGT/TGT positions"},
        "ctet": {"name": "CTET Certification", "impact": 12, "desc": "Makes you eligible for central government school positions"},
        "m.ed": {"name": "M.Ed (Master of Education)", "impact": 8, "desc": "Preferred for senior teaching positions"},
        "net": {"name": "UGC NET Qualification", "impact": 10, "desc": "Required for lecturership and valued in senior secondary"},
        "tet": {"name": "State TET", "impact": 10, "desc": "Required for state government school positions"},
        "ph.d": {"name": "Ph.D / Doctorate", "impact": 6, "desc": "Valued for principal and HOD roles"},
    }

    def analyze(self, candidate: dict) -> list:
        """
        Analyze a candidate profile and return improvement suggestions.
        """
        suggestions = []

        # 1. Check for missing key qualifications
        suggestions.extend(self._check_qualifications(candidate))

        # 2. Check experience gaps
        suggestions.extend(self._check_experience(candidate))

        # 3. Check profile completeness
        suggestions.extend(self._check_completeness(candidate))

        # 4. Check salary expectations
        suggestions.extend(self._check_salary(candidate))

        # 5. Check location preferences
        suggestions.extend(self._check_locations(candidate))

        # Sort by impact (highest first)
        suggestions.sort(key=lambda x: x["estimated_impact"], reverse=True)

        return suggestions

    def calculate_strength(self, candidate: dict) -> dict:
        """
        Calculate overall profile strength score (0-100).
        """
        scores = {
            "qualifications": self._qual_strength(candidate),
            "experience": self._exp_strength(candidate),
            "completeness": self._completeness_strength(candidate),
            "location_flexibility": self._location_strength(candidate),
        }

        # Weighted average
        weights = {"qualifications": 0.35, "experience": 0.30, "completeness": 0.20, "location_flexibility": 0.15}
        overall = sum(scores[k] * weights[k] for k in weights)

        return {
            "overall": round(overall, 1),
            "breakdown": {k: round(v, 1) for k, v in scores.items()},
            "grade": self._score_to_grade(overall),
        }

    def _check_qualifications(self, cand: dict) -> list:
        suggestions = []
        cand_quals = " ".join(q.get("degree", "").lower() for q in cand.get("qualifications", []))

        for key, info in self.KEY_QUALIFICATIONS.items():
            if key not in cand_quals:
                suggestions.append({
                    "category": "qualification",
                    "priority": "high" if info["impact"] >= 10 else "medium",
                    "title": f"Add {info['name']}",
                    "description": info["desc"],
                    "estimated_impact": info["impact"],
                    "action": f"If you have {info['name']}, add it to your profile. If not, consider pursuing it.",
                })

        return suggestions

    def _check_experience(self, cand: dict) -> list:
        suggestions = []
        total_exp = sum(e.get("years", 0) for e in cand.get("experience", []))

        if total_exp == 0:
            suggestions.append({
                "category": "experience",
                "priority": "high",
                "title": "Add teaching experience",
                "description": "Profiles with teaching experience receive 40% more interest from schools.",
                "estimated_impact": 20,
                "action": "Add any teaching experience — including tutoring, coaching classes, or internships.",
            })
        elif total_exp < 2:
            suggestions.append({
                "category": "experience",
                "priority": "medium",
                "title": "Gain more experience",
                "description": "Most schools prefer candidates with 2+ years of experience.",
                "estimated_impact": 10,
                "action": "Consider short-term teaching assignments or substitute teaching to build experience.",
            })

        # Check if experience entries lack detail
        for exp in cand.get("experience", []):
            if not exp.get("role"):
                suggestions.append({
                    "category": "experience",
                    "priority": "low",
                    "title": "Add role details to experience",
                    "description": "Specific role titles (e.g., 'PGT Mathematics') help matching accuracy.",
                    "estimated_impact": 5,
                    "action": "Update your experience entries with specific role titles and subjects taught.",
                })
                break

        return suggestions

    def _check_completeness(self, cand: dict) -> list:
        suggestions = []

        if not cand.get("primary_role"):
            suggestions.append({
                "category": "profile",
                "priority": "high",
                "title": "Set your primary teaching role",
                "description": "This is the first thing schools see and the main matching criterion.",
                "estimated_impact": 25,
                "action": "Specify your primary role (e.g., 'PGT Mathematics', 'TGT English').",
            })

        if not cand.get("qualifications") or len(cand["qualifications"]) == 0:
            suggestions.append({
                "category": "profile",
                "priority": "high",
                "title": "Add your qualifications",
                "description": "Qualifications are the second most important matching factor.",
                "estimated_impact": 20,
                "action": "Add all your degrees, diplomas, and certifications.",
            })

        return suggestions

    def _check_salary(self, cand: dict) -> list:
        suggestions = []

        if not cand.get("expected_salary"):
            suggestions.append({
                "category": "salary",
                "priority": "medium",
                "title": "Set salary expectation",
                "description": "Having a salary range helps filter compatible positions and improves match accuracy.",
                "estimated_impact": 8,
                "action": "Research market rates for your role and set a realistic expected salary.",
            })

        return suggestions

    def _check_locations(self, cand: dict) -> list:
        suggestions = []
        locations = cand.get("location_interested", [])

        if len(locations) == 0:
            suggestions.append({
                "category": "location",
                "priority": "high",
                "title": "Add preferred locations",
                "description": "Without location preferences, you won't match with any schools.",
                "estimated_impact": 15,
                "action": "Add the cities or regions where you're willing to teach.",
            })
        elif len(locations) == 1:
            suggestions.append({
                "category": "location",
                "priority": "low",
                "title": "Consider adding more locations",
                "description": "Adding 2-3 locations triples your visibility to schools.",
                "estimated_impact": 5,
                "action": "Add nearby cities or any other areas you'd consider relocating to.",
            })

        return suggestions

    def _qual_strength(self, cand: dict) -> float:
        quals = " ".join(q.get("degree", "").lower() for q in cand.get("qualifications", []))
        score = 20.0  # Base for having an account
        for key, info in self.KEY_QUALIFICATIONS.items():
            if key in quals:
                score += info["impact"]
        return min(100.0, score)

    def _exp_strength(self, cand: dict) -> float:
        total = sum(e.get("years", 0) for e in cand.get("experience", []))
        if total == 0: return 20.0
        if total < 2: return 40.0
        if total < 5: return 65.0
        if total < 10: return 85.0
        return 100.0

    def _completeness_strength(self, cand: dict) -> float:
        score = 0.0
        checks = [
            ("primary_role", 25),
            ("qualifications", 25),
            ("experience", 20),
            ("expected_salary", 15),
            ("location_interested", 15),
        ]
        for field, points in checks:
            val = cand.get(field)
            if val and (not isinstance(val, list) or len(val) > 0):
                score += points
        return score

    def _location_strength(self, cand: dict) -> float:
        count = len(cand.get("location_interested", []))
        if count == 0: return 0.0
        if count == 1: return 40.0
        if count <= 3: return 70.0
        return 100.0

    def _score_to_grade(self, score: float) -> str:
        if score >= 85: return "A"
        if score >= 70: return "B"
        if score >= 50: return "C"
        if score >= 30: return "D"
        return "F"
