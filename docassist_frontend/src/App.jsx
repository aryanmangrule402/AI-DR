import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import PatientTriage from './pages/PatientTriage'; // Use your existing code, just update user ID logic
import DoctorDashboard from './pages/DoctorDashboard'; // Use existing code

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/:role" element={<AuthPage />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard/patient" element={<PatientTriage />} />
        <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;