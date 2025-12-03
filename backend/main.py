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

# ================= CORE LOGIC =================

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
            response = requests.post(url, headers=headers, data=payload, timeout=5)
            data = response.json()
            places = data.get("places", [])

            for place in places[:6]:
                # Skip duplicates
                if any(d['hospital_name'] == place.get("title") for d in results):
                    continue

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
    # Accept both patient_id and patientId from incoming JSON (Frontend sends patient_id)
    patient_id = data.patient_id 
    if patient_id is None:
        raise HTTPException(status_code=422, detail="patient_id is required")

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
        patient_id=patient_id,
        symptom_description=data.symptom_description,
        ai_summary=data.ai_summary,
        urgency=data.urgency,
        appointment_time=slot,
        status=initial_status,
        doctor_name=data.doctor_name, # Save text for easy history view
        clinic_address=data.address
    )
    db.add(new_apt)
    db.commit()
    db.refresh(new_apt)

    return {
        "message": "Success",
        "status": initial_status,
        "time": slot.isoformat(),
        "doctor_id": doctor.id,
        "id": new_apt.id,
        "demo_credentials": {"username": doctor.username, "password": doctor.password}
    }

# ================= AUTH ENDPOINTS (CRITICAL) =================

@app.post("/api/auth/patient/register")
def patient_register(data: PatientRegister, db: Session = Depends(get_session)):
    existing = db.exec(select(Patient).where(Patient.email == data.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_patient = Patient(**data.model_dump())
    db.add(new_patient)
    db.commit()
    return {"message": "Registered Successfully", "id": new_patient.id}

@app.post("/api/auth/patient/login")
def patient_login(data: LoginRequest, db: Session = Depends(get_session)):
    user = db.exec(select(Patient).where(Patient.email == data.username_or_email).where(Patient.password == data.password)).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid Credentials")
    return {"message": "Login Successful", "id": user.id, "name": user.name, "city": user.city}

@app.post("/api/auth/doctor/register")
def doctor_register(data: DoctorRegister, db: Session = Depends(get_session)):
    if db.exec(select(Doctor).where(Doctor.username == data.username)).first():
        raise HTTPException(status_code=400, detail="Username taken")
    
    new_doc = Doctor(**data.model_dump())
    if new_doc.rating is None: new_doc.rating = 0.0 # Default rating
    db.add(new_doc); db.commit()
    return {"message": "Success"}

@app.post("/api/auth/doctor/login")
def doctor_login(data: LoginRequest, db: Session = Depends(get_session)):
    doc = db.exec(select(Doctor).where(Doctor.username == data.username_or_email).where(Doctor.password == data.password)).first()
    if not doc:
        raise HTTPException(status_code=401, detail="Invalid Credentials")
    return {"id": doc.id, "name": doc.name, "role": "doctor", "hospital_name": doc.hospital_name}

# ================= HISTORY & ACTIONS =================

@app.get("/api/patient/{patient_id}/appointments")
def get_patient_appointments(patient_id: int, db: Session = Depends(get_session)):
    # Simple select (no join required if we save names in appointment table)
    res = db.exec(select(Appointment).where(Appointment.patient_id == patient_id).order_by(Appointment.appointment_time.desc())).all()
    return res

@app.get("/api/doctor/{doctor_id}/appointments")
def get_doctor_appointments(doctor_id: int, db: Session = Depends(get_session)):
    # Join needed to get patient name
    res = db.exec(select(Appointment, Patient).join(Patient).where(Appointment.doctor_id == doctor_id).order_by(Appointment.appointment_time)).all()
    return [{**a.model_dump(), "patient_name": p.name} for a, p in res]

@app.put("/api/appointment/{apt_id}/approve")
def approve_appointment(apt_id: int, db: Session = Depends(get_session)):
    apt = db.get(Appointment, apt_id)
    if not apt: raise HTTPException(404, "Not found")
    apt.status = "Confirmed"
    db.add(apt); db.commit()
    return {"message": "Approved"}

@app.delete("/api/appointment/{apt_id}")
def delete_appointment(apt_id: int, db: Session = Depends(get_session)):
    apt = db.get(Appointment, apt_id)
    if not apt: raise HTTPException(404, "Not found")
    db.delete(apt); db.commit()
    return {"message": "Deleted"}