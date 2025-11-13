import os
import json
import re
import urllib.parse
import random
import requests
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, SQLModel, create_engine, select
from dotenv import load_dotenv
import google.generativeai as genai

from models import *

# --- CONFIG ---
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)
api_key = os.getenv("GOOGLE_API_KEY")
serper_key = os.getenv("SERPER_API_KEY")

DATABASE_URL = "sqlite:///./docassist.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.5-flash')

@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

def get_session():
    with Session(engine) as session:
        yield session

def clean_json_string(json_str: str) -> str:
    json_str = re.sub(r"```json\s*", "", json_str)
    json_str = re.sub(r"```", "", json_str)
    return json_str.strip()

def generate_credentials(name: str):
    clean_name = name.lower().replace(" ", "").replace("dr.", "")[:8]
    username = f"dr_{clean_name}_{random.randint(100,999)}"
    return username, "123"

# --- AI ANALYZE ENDPOINT ---
@app.post("/api/analyze")
def analyze_symptoms(input: SymptomInput):
    prompt = f"""
    Analyze symptoms: "{input.description}".
    Map to one clear medical specialty.

    Output RAW JSON:
    {{ 
      "summary": "Brief clinical summary", 
      "urgency": "High/Medium/Low", 
      "recommended_specialist": "...", 
      "reasoning": "Why you chose this",
      "care_advice": "Home care steps",
      "disease_keywords": ["keyword1", "keyword2"]
    }}
    """
    try:
        res = model.generate_content(prompt)
        return AIAnalysisResponse(**json.loads(clean_json_string(res.text)))
    except Exception as e:
        print(f"❌ Analysis Error: {e}")
        return AIAnalysisResponse(
            summary="Consultation required.",
            urgency="Medium",
            recommended_specialist="General Physician",
            reasoning="Error",
            care_advice="Visit a doctor."
        )

# --- DOCTOR SEARCH ---
@app.get("/api/doctors/search")
def search_doctors(specialty: str, city: str, query: str = "", db: Session = Depends(get_session)):
    results = []
    # Fetch from local DB
    statement = select(Doctor).where(Doctor.city == city).where(Doctor.specialty.contains(specialty))
    db_docs = db.exec(statement).all()
    for doc in db_docs:
        d = doc.model_dump()
        d['is_registered'] = True
        results.append(d)

    # Add from Serper if few results
    if len(results) < 5 and serper_key:
        q = f"{specialty} for {query} in {city}" if query else f"{specialty} in {city}"
        url = "https://google.serper.dev/places"
        payload = json.dumps({"q": q, "gl": "in", "hl": "en"})
        headers = {'X-API-KEY': serper_key, 'Content-Type': 'application/json'}

        try:
            response = requests.post(url, headers=headers, data=payload)
            data = response.json()
            places = data.get("places", [])

            for place in places[:6]:
                results.append({
                    "name": f"{specialty} Specialist",
                    "hospital_name": place.get("title", "Unknown Clinic"),
                    "address": place.get("address", f"Near {city}"),
                    "city": city,
                    "rating": place.get("rating", 4.0),
                    "specialty": specialty,
                    "google_maps_link": f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote(place.get('title', 'Clinic'))}",
                    "is_registered": False,
                    "id": random.randint(10000, 99999)
                })
        except Exception as e:
            print(f"❌ Serper API Error: {e}")

    return results

# --- BOOK APPOINTMENT ---
@app.post("/api/book")
def book(data: BookingRequest, db: Session = Depends(get_session)):
    statement = select(Doctor).where(Doctor.name == data.doctor_name).where(Doctor.hospital_name == data.hospital_name)
    doctor = db.exec(statement).first()

    if not doctor:
        uname, pwd = generate_credentials(data.doctor_name)
        new_doctor = Doctor(
            name=data.doctor_name, specialty=data.specialty, hospital_name=data.hospital_name,
            address=data.address, city=data.city, rating=4.5, google_maps_link=data.google_maps_link,
            username=uname, password=pwd
        )
        db.add(new_doctor)
        db.commit()
        db.refresh(new_doctor)
        doctor = new_doctor

    initial_status = "Confirmed" if data.urgency == UrgencyLevel.HIGH else "Pending"
    slot = datetime.now() + timedelta(hours=2)

    new_apt = Appointment(
        doctor_id=doctor.id,
        patient_id=data.patient_id,
        symptom_description=data.symptom_description,
        ai_summary=data.ai_summary,
        urgency=data.urgency,
        appointment_time=slot,
        status=initial_status
    )
    db.add(new_apt)
    db.commit()
    db.refresh(new_apt)

    return {
        "message": "Success",
        "status": initial_status,
        "time": slot,
        "doctor_id": doctor.id,
        "id": new_apt.id,
        "demo_credentials": {"username": doctor.username, "password": doctor.password}
    }

# --- PATIENT HISTORY ---
@app.get("/api/patient/{patient_id}/appointments")
def get_patient_appointments(patient_id: int, db: Session = Depends(get_session)):
    res = db.exec(
        select(Appointment, Doctor)
        .join(Doctor)
        .where(Appointment.patient_id == patient_id)
        .order_by(Appointment.appointment_time.desc())
    ).all()
    return [
        {
            "doctor_name": d.name,
            "clinic_address": d.address,
            "urgency": a.urgency,
            "appointment_time": a.appointment_time,
            "status": a.status,
            "id": a.id
        }
        for a, d in res
    ]

# --- DELETE APPOINTMENT ---
@app.delete("/api/appointment/{apt_id}")
def delete_appointment(apt_id: int, db: Session = Depends(get_session)):
    apt = db.get(Appointment, apt_id)
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    db.delete(apt)
    db.commit()
    return {"message": "Appointment Cancelled Successfully"}
