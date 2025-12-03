# models.py
from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum
from pydantic import BaseModel
from datetime import datetime
class UrgencyLevel(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class Doctor(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    specialty: str
    hospital_name: str
    address: str
    city: str
    rating: float = 0.0
    google_maps_link: str

    username: str = Field(default="", unique=True)
    password: str = Field(default="")

    appointments: List["Appointment"] = Relationship(back_populates="doctor")



    
class Patient(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True)
    password: str
    city: str
    age: int
    appointments: List["Appointment"] = Relationship(back_populates="patient")

class Appointment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    symptom_description: str
    ai_summary: str
    urgency: UrgencyLevel

    doctor_id: int = Field(foreign_key="doctor.id")
    doctor: Optional[Doctor] = Relationship(back_populates="appointments")

    patient_id: int = Field(foreign_key="patient.id")
    patient: Optional[Patient] = Relationship(back_populates="appointments")

    appointment_time: datetime
    status: str = "Confirmed"
    created_at: datetime = Field(default_factory=datetime.now)

# --- SCHEMAS ---
from sqlmodel import SQLModel as SchemaBase
from sqlmodel import Field as SchemaField

class SymptomInput(SchemaBase):
    description: str
    city: str

class BookingRequest(SQLModel):
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

class AIAnalysisResponse(SchemaBase):
    summary: str
    urgency: UrgencyLevel
    recommended_specialist: str
    reasoning: str
    care_advice: str

class LoginRequest(SchemaBase):
    username_or_email: str
    password: str

class DoctorRegister(SchemaBase):
    name: str
    specialty: str
    hospital_name: str
    city: str
    address: str
    google_maps_link: str
    username: str
    password: str

class PatientRegister(SchemaBase):
    name: str
    email: str
    password: str
    city: str
    age: int
