import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, Clock, User, MapPin, LogOut, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const navigate = useNavigate();
  
  const doctorName = localStorage.getItem('userName');
  const doctorId = localStorage.getItem('userId');
  const hospitalName = localStorage.getItem('hospitalName');

useEffect(() => {
  if (!doctorId) return navigate('/auth/doctor');
  if (doctorId) fetchAppointments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/doctor/${doctorId}/appointments`);
      setAppointments(res.data);
    } catch (error) {
  console.error(error);
  alert("Server Error");
}

  };

  const handleApprove = async (aptId) => {
    try {
        await axios.put(`http://127.0.0.1:8000/api/appointment/${aptId}/approve`);
        fetchAppointments(); // Refresh immediately to show "Confirmed"
    } catch (error) {
  console.error(error);
  alert("Server Error");
}

  };

  // --- NEW: DELETE FUNCTION ---
  const handleDelete = async (aptId) => {
    if(!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
        await axios.delete(`http://127.0.0.1:8000/api/appointment/${aptId}`);
        fetchAppointments(); // Refresh list
    } catch (error) {
  console.error(error);
  alert("Server Error");
}

  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg"><MapPin size={24} /></div>
            <div>
                <h1 className="text-xl font-bold text-gray-900">{hospitalName || "My Clinic"}</h1>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Dr. {doctorName}</p>
            </div>
          </div>
          <button onClick={() => {localStorage.clear(); navigate('/');}} className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition flex items-center gap-2 font-medium">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Calendar className="text-blue-600" /> Patient Queue</h2>
            <div className="flex gap-2">
                <button onClick={fetchAppointments} className="text-blue-600 text-sm hover:underline">Refresh List</button>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">{appointments.length} Total</span>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b">
              <tr>
                <th className="p-4">Time</th>
                <th className="p-4">Patient</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {appointments.length === 0 ? (
                <tr><td colSpan="4" className="p-10 text-center text-gray-400">No appointments.</td></tr>
              ) : (
                appointments.map((apt) => (
                  <tr key={apt.id} className={`border-b last:border-0 transition ${apt.status === 'Pending' ? 'bg-yellow-50' : 'hover:bg-blue-50'}`}>
                    <td className="p-4 font-mono font-bold text-blue-600">
                        {new Date(apt.appointment_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        <div className="text-xs text-gray-400 font-normal">{new Date(apt.appointment_time).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4 font-bold">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600"><User size={14}/></div>
                            <div>
                                {apt.patient_name}
                                <div className="text-xs text-gray-500 font-normal">{apt.urgency} Urgency</div>
                            </div>
                        </div>
                    </td>
                    <td className="p-4">
                        {apt.status === 'Pending' ? (
                            <span className="flex items-center gap-1 text-yellow-700 font-bold bg-yellow-100 px-2 py-1 rounded-md w-fit"><AlertCircle size={14} /> Approval Needed</span>
                        ) : (
                            <span className="flex items-center gap-1 text-green-700 font-bold bg-green-100 px-2 py-1 rounded-md w-fit"><CheckCircle size={14} /> Confirmed</span>
                        )}
                    </td>
                    <td className="p-4 flex gap-2">
                        {apt.status === 'Pending' && (
                            <button onClick={() => handleApprove(apt.id)} className="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 font-bold text-xs flex items-center gap-1">
                                <CheckCircle size={14} /> Accept
                            </button>
                        )}
                        <button onClick={() => handleDelete(apt.id)} className="bg-red-100 text-red-600 px-3 py-1.5 rounded hover:bg-red-200 font-bold text-xs flex items-center gap-1">
                            <Trash2 size={14} /> Cancel
                        </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;