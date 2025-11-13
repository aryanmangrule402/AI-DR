import React from 'react';
import { Link } from 'react-router-dom';
import { User, Stethoscope } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center space-y-8">
        <h1 className="text-4xl font-bold text-blue-900">DocAssist AI</h1>
        <p className="text-lg text-gray-600">Select your role to continue</p>
        
        <div className="flex gap-6 flex-col md:flex-row">
          {/* PATIENT CARD */}
          <Link to="/auth/patient" className="group bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition w-64 cursor-pointer border border-transparent hover:border-blue-500">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 transition">
              <User className="text-blue-600 group-hover:text-white" size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">I am a Patient</h2>
            <p className="text-sm text-gray-500 mt-2">Find doctors, check symptoms, and book appointments.</p>
          </Link>

          {/* DOCTOR CARD */}
          <Link to="/auth/doctor" className="group bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition w-64 cursor-pointer border border-transparent hover:border-green-500">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-600 transition">
              <Stethoscope className="text-green-600 group-hover:text-white" size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">I am a Doctor</h2>
            <p className="text-sm text-gray-500 mt-2">Manage appointments and view patient history.</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;