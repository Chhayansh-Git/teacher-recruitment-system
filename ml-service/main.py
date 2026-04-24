"""
============================================================
FILE: ml-service/main.py — FastAPI ML Microservice Entry Point
============================================================

WHAT IS THIS?
  A separate Python server that handles all ML/AI operations.
  The Node.js backend calls this service via HTTP when it needs:
  1. Candidate-requirement matching scores
  2. Profile improvement suggestions (Profile Coach)

WHY A SEPARATE SERVICE?
  - Python has the best ML libraries (scikit-learn, TensorFlow)
  - Keeps ML compute-heavy work off the main API server
  - Can be scaled independently (add more ML workers without touching the API)
  - Language-agnostic API — any service can call it via HTTP

HOW TO RUN:
  cd ml-service
  pip install -r requirements.txt
  uvicorn main:app --reload --port 8000
============================================================
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv

# Import our ML modules
from matching.model import MatchingModel
from profile_coach.coach import ProfileCoach

load_dotenv()

# --- Initialize FastAPI ---
app = FastAPI(
    title="TRS ML Service",
    description="Machine Learning microservice for Teacher Recruitment System",
    version="1.0.0",
)

# CORS — allow the Node.js backend to call us
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("API_URL", "http://localhost:5000")],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Initialize ML Models ---
matching_model = MatchingModel()
profile_coach = ProfileCoach()

# --- API Key Authentication ---
API_KEY = os.getenv("ML_API_KEY", "dev-ml-api-key-change-me")

def verify_api_key(api_key: str):
    """Simple API key check — shared secret between Node.js and this service."""
    if api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


# ============================================
# REQUEST/RESPONSE SCHEMAS
# ============================================

class CandidateData(BaseModel):
    """Data about a candidate (sent by Node.js backend)."""
    id: str
    primary_role: str
    qualifications: list  # [{degree, university, year}]
    experience: list      # [{school, role, years}]
    expected_salary: Optional[int] = None
    location_interested: list = []
    gender: Optional[str] = None

class RequirementData(BaseModel):
    """Data about a school's job requirement."""
    id: str
    subjects: list
    post_designation: str
    qualification: str
    experience_min: int = 0
    salary_offered: Optional[int] = None
    gender_pref: str = "ANY"
    location: str = ""

class MatchRequest(BaseModel):
    """Request to score candidates against a requirement."""
    requirement: RequirementData
    candidates: list[CandidateData]
    api_key: str

class ProfileCoachRequest(BaseModel):
    """Request for profile improvement suggestions."""
    candidate: CandidateData
    api_key: str


# ============================================
# ENDPOINTS
# ============================================

@app.get("/health")
def health_check():
    """Health check — used by monitoring and the Node.js backend."""
    return {
        "status": "ok",
        "service": "ml-service",
        "model_loaded": matching_model.is_loaded,
    }


@app.post("/match")
def match_candidates(request: MatchRequest):
    """
    Score all candidates against a requirement.

    Returns candidates sorted by match score (highest first),
    each with a score breakdown showing how each factor contributed.

    This is the CORE ML endpoint — replaces the hardcoded
    weighted scoring in Node.js with a trained model.
    """
    verify_api_key(request.api_key)

    results = matching_model.score_candidates(
        requirement=request.requirement.model_dump(),
        candidates=[c.model_dump() for c in request.candidates],
    )

    return {
        "matches": results,
        "total": len(results),
        "model_version": matching_model.version,
    }


@app.post("/profile-coach")
def get_profile_suggestions(request: ProfileCoachRequest):
    """
    Analyze a candidate's profile and suggest improvements.

    Returns actionable suggestions like:
    - "Add B.Ed qualification to improve match scores by ~15%"
    - "Adding CTET certification makes you eligible for 40% more positions"
    """
    verify_api_key(request.api_key)

    suggestions = profile_coach.analyze(request.candidate.model_dump())

    return {
        "suggestions": suggestions,
        "profile_strength": profile_coach.calculate_strength(request.candidate.model_dump()),
    }


@app.post("/retrain")
def retrain_model(api_key: str):
    """
    Trigger model retraining with latest placement data.
    Called periodically or manually by admin.
    """
    verify_api_key(api_key)

    try:
        matching_model.retrain()
        return {"status": "success", "message": "Model retrained", "version": matching_model.version}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")
