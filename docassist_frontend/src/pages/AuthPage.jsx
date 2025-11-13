import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthPage = () => {
  const { role } = useParams(); // "doctor" or "patient"
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  
  // Added 'address' to state
  const [formData, setFormData] = useState({
    name: '', email: '', username: '', password: '', city: '', 
    specialty: '', hospital_name: '', address: '', age: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegister ? 'register' : 'login';
    
    // Prepare data
    let payload = {};
    
    if (!isRegister) {
        // --- LOGIN PAYLOAD ---
        payload = { username_or_email: formData.email || formData.username, password: formData.password };
    } else {
        // --- REGISTER PAYLOAD ---
        payload = { ...formData };
        
        if (role === 'patient') {
            payload.age = parseInt(payload.age); 
        }
        
        if (role === 'doctor') {
            // 1. We auto-generate a Google Maps Search Link to satisfy the backend requirement
            const mapQuery = encodeURIComponent(`${payload.hospital_name} ${payload.address} ${payload.city}`);
            payload.google_maps_link = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
        }
    }

    try {
      const res = await axios.post(`http://127.0.0.1:8000/api/auth/${role}/${endpoint}`, payload);
      
      if (!isRegister) {
        // --- LOGIN SUCCESS ---
        localStorage.setItem('userId', res.data.id);
        localStorage.setItem('userRole', role);
        localStorage.setItem('userName', res.data.name);

        if(role === 'patient') {
            localStorage.setItem('userCity', res.data.city);
            navigate('/dashboard/patient');
        }
        
        if(role === 'doctor') {
            // CRITICAL: Save Hospital Name for the Dashboard
            localStorage.setItem('hospitalName', res.data.hospital_name); 
            navigate('/dashboard/doctor');
        }
      } else {
        // --- REGISTER SUCCESS ---
        alert("Registration Successful! Please Login.");
        setIsRegister(false);
      }
    } catch (err) {
      console.error(err);
      alert("Error: " + (err.response?.data?.detail || "Connection Failed"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2 capitalize text-center text-blue-900">
            {role} {isRegister ? 'Registration' : 'Login'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          
          {/* --- COMMON FIELDS (Register Only) --- */}
          {isRegister && (
            <>
              <input required placeholder="Full Name" className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none" onChange={e => setFormData({...formData, name: e.target.value})} />
              <input required placeholder="City" className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none" onChange={e => setFormData({...formData, city: e.target.value})} />
            </>
          )}

          {/* --- DOCTOR SPECIFIC FIELDS --- */}
          {role === 'doctor' ? (
             isRegister && (
               <>
                 <input required placeholder="Username" className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none" onChange={e => setFormData({...formData, username: e.target.value})} />
                 <input required placeholder="Specialty (e.g. Cardiologist)" className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none" onChange={e => setFormData({...formData, specialty: e.target.value})} />
                 <input required placeholder="Hospital/Clinic Name" className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none" onChange={e => setFormData({...formData, hospital_name: e.target.value})} />
                 <input required placeholder="Street Address (For Maps)" className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none" onChange={e => setFormData({...formData, address: e.target.value})} />
               </>
             )
          ) : (
             // --- PATIENT SPECIFIC FIELDS ---
             <>
               <input required placeholder="Email" type="email" className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none" onChange={e => setFormData({...formData, email: e.target.value})} />
               {isRegister && <input required placeholder="Age" type="number" className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none" onChange={e => setFormData({...formData, age: e.target.value})} />}
             </>
          )}
          
          {/* --- LOGIN USERNAME FIELD (Doctor Only) --- */}
          {!isRegister && role === 'doctor' && (
             <input required placeholder="Username" className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none" onChange={e => setFormData({...formData, username: e.target.value})} />
          )}

          {/* --- PASSWORD (Always) --- */}
          <input required placeholder="Password" type="password" className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none" onChange={e => setFormData({...formData, password: e.target.value})} />
          
          <button className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 transition shadow-md">
            {isRegister ? 'Create Account' : 'Login'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-600">
          {isRegister ? "Already have an account?" : "Don't have an account?"} 
          <button onClick={() => setIsRegister(!isRegister)} className="text-blue-600 font-bold ml-1 underline">
            {isRegister ? "Login here" : "Register here"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;