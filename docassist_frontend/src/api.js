import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const api = {
  triagePatient: async (data) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/triage`, data);
      return res.data;
    } catch (err) {
      console.error("API Error (triage):", err);
      throw err;
    }
  },

  getAppointments: async (patientId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/patient/${patientId}/appointments`);
      return res.data;
    } catch (err) {
      console.error("API Error (appointments):", err);
      throw err;
    }
  },
};
