import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Stethoscope, Activity, MapPin, Star, CalendarCheck, Navigation, ExternalLink, History, LogOut, BadgeCheck, AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PatientTriage = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ lat: 0, lon: 0 });
  const [formData, setFormData] = useState({ description: '', city: localStorage.getItem('userCity') || '' });
  const [aiResult, setAiResult] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [booked, setBooked] = useState(null);
  const [myAppointments, setMyAppointments] = useState([]);
  
  const navigate = useNavigate();
  const patientName = localStorage.getItem('userName');
  const patientId = localStorage.getItem('userId');

  const fetchHistory = useCallback(async () => {
    if (!patientId) return;
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/patient/${patientId}/appointments`);
      setMyAppointments(res.data);
    } catch (e) { console.error(e); }
  }, [patientId]);

useEffect(() => {
  if (!patientId) {
    navigate('/');
  } else {
    // Defer to next event loop tick to avoid synchronous state update warning
    const timer = setTimeout(() => {
      fetchHistory();
    }, 0);

    return () => clearTimeout(timer);
  }
}, [patientId, navigate, fetchHistory]);
  // --- NEW: DELETE FUNCTION ---
  const handleDelete = async (aptId) => {
    if(!window.confirm("Cancel this appointment?")) return;
    try {
        await axios.delete(`http://127.0.0.1:8000/api/appointment/${aptId}`);
        fetchHistory(); // Refresh list
        if(booked && booked.id === aptId) setBooked(null); // Clear success screen if deleted
    } catch (error) {
  console.error(error);
  alert("Server Error");
}

  }

  const detectLocation = () => {
    if (!navigator.geolocation) return alert("GPS not supported");
    navigator.geolocation.getCurrentPosition(async (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`);
            const data = await res.json();
            setFormData(prev => ({...prev, city: data.locality || data.city || "Detected Location"}));
        } catch(e) { console.error(e); }
    });
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const aiRes = await axios.post('http://127.0.0.1:8000/api/analyze', formData);
      setAiResult(aiRes.data);
      const docRes = await axios.get(`http://127.0.0.1:8000/api/doctors/search?specialty=${aiRes.data.recommended_specialist}&city=${formData.city}&lat=${coords.lat}&lon=${coords.lon}`);
      setDoctors(docRes.data);
      setStep(2);
    }catch (error) {
  console.error(error);
  alert("Server Error");
}

    setLoading(false);
  };

const handleBook = async (doc) => {
    if(!patientId) return alert("Please Login first");

    // Construct the payload carefully to avoid missing fields
    const payload = {
        doctor_name: doc.name || "Unknown Doctor",
        hospital_name: doc.hospital_name || "Unknown Clinic",
        specialty: doc.specialty || aiResult?.recommended_specialist || "General",
        address: doc.address || formData.city,
        city: formData.city,
        google_maps_link: doc.google_maps_link || "",
        
        patient_id: parseInt(patientId),
        symptom_description: formData.description,
        ai_summary: aiResult?.summary || "No summary",
        urgency: aiResult?.urgency || "Low"
    };

    console.log("Booking Payload:", payload); // Debugging: Check console to see what is sent

    try {
        const res = await axios.post('http://127.0.0.1:8000/api/book', payload);
        
        setBooked(res.data);
        fetchHistory();
        setStep(3);
        
        if(res.data.demo_credentials) {
            alert(`[DEMO] New Doctor Created!\nUser: ${res.data.demo_credentials.username}\nPass: ${res.data.demo_credentials.password}`);
        }
    } catch (error) {
        console.error("Booking Error Details:", error.response?.data); // Check console for exact backend error message
        alert("Booking Failed: " + (error.response?.data?.detail?.[0]?.msg || "Server Error"));
    }
  };

  const handleLogout = () => { localStorage.clear(); navigate('/'); }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-900 flex items-center gap-2"><Stethoscope /> DocAssist</h1>
        <div className="flex items-center gap-4">
            <p className="text-gray-600">Welcome, <span className="font-bold text-gray-900">{patientName}</span></p>
            <button onClick={handleLogout} className="text-red-500 text-sm hover:underline flex items-center gap-1"><LogOut size={14}/> Logout</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl overflow-hidden min-h-[600px] p-8">
          {step === 1 && (
            <form onSubmit={handleAnalyze} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <div className="flex gap-2">
                    <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full p-3 border rounded-lg" placeholder="City" required />
                    <button type="button" onClick={detectLocation} className="bg-gray-800 text-white p-3 rounded-lg hover:bg-gray-900 flex items-center gap-2"><Navigation size={20} /> GPS</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Describe Symptoms</label>
                <textarea rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 border rounded-lg" placeholder="e.g. Severe tooth pain..." required />
              </div>
              <button disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 flex justify-center gap-2">
                {loading ? "Analyzing..." : <><Activity /> Analyze & Find Doctors</>}
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
                <div className={`p-4 rounded-lg border-l-4 ${aiResult.urgency === 'High' ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-500'}`}>
                    <h3 className="font-bold text-lg">{aiResult.urgency} Urgency</h3>
                    <p className="text-sm">{aiResult.summary}</p>
                </div>
                <h3 className="font-bold text-gray-700">Nearby {aiResult.recommended_specialist}s ({doctors.length}):</h3>
                <div className="grid gap-4">
                    {doctors.map((doc, idx) => (
                        <div key={idx} className="border p-5 rounded-xl hover:shadow-md bg-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-xl text-gray-900">{doc.name}</h4>
                                    <p className="text-blue-600 font-medium">{doc.hospital_name}</p>
                                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                                        <span className="flex items-center gap-1 text-yellow-600 font-bold"><Star size={14} fill="currentColor" /> {doc.rating}</span>
                                        <span>{doc.address}</span>
                                    </div>
                                </div>
                                <a href={doc.google_maps_link} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 p-2 bg-blue-50 rounded-full"><ExternalLink size={24} /></a>
                            </div>
                            <div className="mt-4 flex gap-3">
                                <a href={doc.google_maps_link} target="_blank" rel="noreferrer" className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 flex items-center justify-center gap-2"><MapPin size={18} /> Map</a>
                                <button onClick={() => handleBook(doc)} className={`flex-1 text-white py-2 rounded-lg font-semibold shadow-sm ${doc.is_registered ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                    {doc.is_registered ? "Instant Book" : "Request Visit"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={() => setStep(1)} className="text-gray-500 text-sm mt-4 underline">Back</button>
            </div>
          )}

          {step === 3 && booked && (
             <div className="text-center py-12 animate-fade-in">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${booked.status === 'Confirmed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    {booked.status === 'Confirmed' ? <CalendarCheck size={48} /> : <Activity size={48} />}
                </div>
                <h2 className={`text-3xl font-bold ${booked.status === 'Confirmed' ? 'text-green-800' : 'text-yellow-700'}`}>
                    {booked.status === 'Confirmed' ? 'Booking Confirmed!' : 'Request Sent'}
                </h2>
                <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200 inline-block max-w-md text-left">
                    <p className="text-gray-800 font-medium mb-2">Status: <span className="uppercase font-bold">{booked.status}</span></p>
                    <p className="text-sm text-gray-600">{booked.status === 'Confirmed' ? "Confirmed!" : "Waiting for hospital approval."}</p>
                </div>
                <div className="mt-6"><button onClick={() => window.location.reload()} className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold">Book Another</button></div>
             </div>
          )}
        </div>

        {/* RIGHT: HISTORY (UPDATED WITH DELETE & REFRESH) */}
        <div className="bg-white rounded-2xl shadow-xl p-6 h-fit">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><History className="text-blue-600" /> History</h3>
                <button onClick={fetchHistory} className="text-gray-500 hover:text-blue-600"><RefreshCw size={16} /></button>
            </div>
            
            <div className="space-y-3">
                {myAppointments.length === 0 ? <p className="text-sm text-gray-400 italic">No history.</p> : 
                    myAppointments.map(apt => (
                        <div key={apt.id} className="border border-gray-100 rounded-lg p-3 hover:bg-blue-50 transition text-sm relative group">
                            <p className="font-bold text-gray-900">{apt.doctor_name || "Unknown"}</p>
                            <p className="text-gray-500 text-xs mb-1">{apt.clinic_address}</p>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${apt.status==='Confirmed'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{apt.status || "Pending"}</span>
                                <span className="text-blue-600 font-bold font-mono text-xs">{new Date(apt.appointment_time).toLocaleDateString()}</span>
                            </div>
                            
                            {/* CANCEL BUTTON (Appears on Hover) */}
                            <button 
                                onClick={() => handleDelete(apt.id)}
                                className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                                title="Cancel Appointment"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                }
            </div>
        </div>
      </div>
    </div>
  );
};

export default PatientTriage;