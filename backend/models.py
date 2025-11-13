from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum

class UrgencyLevel(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

# --- DOCTOR MODEL ---
class Doctor(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    specialty: str
    hospital_name: str
    address: str
    city: str
    rating: float = 0.0
    google_maps_link: str
    
    # Login Credentials (Auto-generated for AI doctors)
    username: str = Field(unique=True)
    password: str 
    
    appointments: List["Appointment"] = Relationship(back_populates="doctor")

# --- PATIENT MODEL ---
class Patient(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True)
    password: str
    city: str
    age: int
    appointments: List["Appointment"] = Relationship(back_populates="patient")

# --- APPOINTMENT MODEL ---
class Appointment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    symptom_description: str
    ai_summary: str
    urgency: UrgencyLevel
    
    # Always link to a Doctor ID now (since we auto-create them)
    doctor_id: int = Field(foreign_key="doctor.id")
    doctor: Optional[Doctor] = Relationship(back_populates="appointments")
    
    patient_id: int = Field(foreign_key="patient.id")
    patient: Optional[Patient] = Relationship(back_populates="appointments")
    
    appointment_time: datetime
    status: str = "Confirmed"
    created_at: datetime = Field(default_factory=datetime.now)

# --- SCHEMAS ---
class SymptomInput(SQLModel):
    description: str
    city: str

class BookingRequest(SQLModel):
    # We accept full details so we can Auto-Register the doctor if needed
    doctor_name: str
    hospital_name: str
    specialty: str
    address: str
    city: str
    google_maps_link: str
    
    patient_id: int
    symptom_description: str
    ai_summary: str
    urgency: UrgencyLevel
# ... (Keep imports)

class AIAnalysisResponse(SQLModel):
    summary: str
    urgency: UrgencyLevel
    recommended_specialist: str
    reasoning: str
    # NEW FIELD: Advice for the patient
    care_advice: str 

# ... (Keep the rest of the file unchanged)

class LoginRequest(SQLModel):
    username_or_email: str
    password: str

class DoctorRegister(SQLModel):
    name: str
    specialty: str
    hospital_name: str
    city: str
    address: str
    google_maps_link: str
    username: str
    password: str

class PatientRegister(SQLModel):
    name: str
    email: str
    password: str
    city: str
    age: int