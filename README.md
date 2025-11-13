# 🩺 DocAssist: AI-Powered Medical Triage & Dynamic Booking System

![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green)
![AI](https://img.shields.io/badge/AI-Google%20Gemini-orange)
![Maps](https://img.shields.io/badge/Geo-Serper%20%2F%20Google%20Maps-red)

## 🚀 Project Overview

**DocAssist** is an intelligent healthcare platform that bridges the gap between symptom onset and medical consultation. Unlike traditional booking apps that rely on static databases, DocAssist uses **Generative AI (LLMs)** to analyze symptoms, determine clinical urgency, and dynamically fetch **real-world providers** based on the patient's geolocation.

It features a **"Just-in-Time" Database Architecture**: the system automatically discovers doctors via live maps APIs and registers them into the system on-demand, creating a self-growing provider network.

## 🌟 Key Features

### 🧠 1. AI-Native Triage Engine
* Uses **Google Gemini 1.5 Flash** to parse unstructured patient symptoms.
* Classifies cases into **High** (Emergency), **Medium** (Urgent), or **Low** (Routine).
* Provides immediate **AI Care Suggestions** (Home remedies) while waiting for the doctor.

### 🌍 2. Location-Aware Provider Discovery
* Integrates with **Serper.dev (Google Maps API)** to find *real* clinics and hospitals near the patient.
* **Smart Filtering:** Automatically maps symptoms to specialists (e.g., "Skin itch" → "Dermatologist").
* **Hybrid Search:** Prioritizes verified partners; falls back to live web search for unknown locations.

### ⚡ 3. Dynamic "Just-in-Time" Booking
* **Auto-Registration:** If a patient books a doctor found via Web Search, the backend automatically creates a Doctor account, generates credentials, and populates the database.
* **Smart Scheduling:** Algorithmically prevents double-booking by calculating the next available 30-minute slot.

### 🔐 4. Role-Based Workflow (RBAC)
* **Patient Portal:** View history, book appointments, track status (Pending/Confirmed).
* **Doctor Dashboard:** Live patient queue, one-click "Accept/Reject," and hospital analytics.
* **Triage Logic:** High-urgency cases are **Auto-Confirmed**; Routine cases require **Doctor Approval**.

---

## 🛠️ Tech Stack

| Component | Technology | Why? |
| :--- | :--- | :--- |
| **Frontend** | React.js (Vite), Tailwind CSS | Fast, component-based UI with modern styling. |
| **Backend** | Python (FastAPI) | High-performance, async support for AI/API calls. |
| **AI Model** | Google Gemini 1.5 Flash | Fast inference, low latency, excellent JSON handling. |
| **Geolocation** | Serper.dev / OpenStreetMap | Real-time retrieval of verified business data. |
| **Database** | SQLite (Dev) / PostgreSQL (Prod) | Relational data integrity for scheduling. |
| **ORM** | SQLModel (Pydantic + SQLAlchemy) | Type-safe database interaction. |

---

## ⚙️ Installation & Setup

### Prerequisites
* Python 3.10+
* Node.js 18+
* Google Gemini API Key
* Serper.dev API Key (Free tier)

### 1. Backend Setup

# 1. Navigate to backend folder
cd docassist_backend

# 2. Create virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create .env file and add your keys
# GOOGLE_API_KEY="your_key"
# SERPER_API_KEY="your_key"

# 5. Start the Server
uvicorn main:app --reload


### 2.frontend setup
# 1. Navigate to frontend folder
cd docassist_frontend

# 2. Install dependencies
npm install

# 3. Start React Dev Server
npm run dev
🧠 System Architecture
Code snippet

graph TD;
    User[Patient] -->|Enters Symptoms + Location| Frontend[React UI];
    Frontend -->|POST Request| Backend[FastAPI];
    Backend -->|Prompt Engineering| AI[Gemini LLM];
    AI -->|JSON Response: Specialty & Urgency| Backend;
    Backend -->|Query: 'Cardiologist near Pune'| Maps[Serper API];
    Maps -->|Real-time Data| Backend;
    Backend -->|Combined Results| Frontend;
    User -->|Books Appointment| Database[(SQLite)];
    Database -->|Update Queue| DoctorDash[Doctor UI];
🧪 How to Test the Demo
Patient Flow:

Register a patient account.

Enter Location: "Mumbai" | Symptoms: "Severe chest pain".

Observe AI marking it "High Urgency".

Select "Asian Heart Institute" (fetched live from Maps).

Click Book Now.

Dynamic Registration:

The system will alert you: "New Doctor Account Created: dr_asianheart..."

Doctor Flow:

Logout.

Login with the new doctor credentials.

View the appointment in the dashboard.

🚀 Future Improvements
Voice-to-Text: Allow patients to speak symptoms instead of typing.

Video Integration: WebRTC integration for tele-consultation links.

Twilio/WhatsApp: Send SMS reminders to patients.
