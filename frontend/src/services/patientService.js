import api from './api';

const patientService = {
  // Get all patients
  getPatients: async (params = {}) => {
    try {
      const response = await api.get('/api/v1/patients/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  },
  
  // Get a patient by ID
  getPatientById: async (id) => {
    try {
      const response = await api.get(`/api/v1/patients/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching patient with ID ${id}:`, error);
      throw error;
    }
  },
  
  // Create a new patient
  createPatient: async (patientData) => {
    try {
      const response = await api.post('/api/v1/patients/', patientData);
      return response.data;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  },
  
  // Update a patient
  updatePatient: async (id, patientData) => {
    try {
      const response = await api.put(`/api/v1/patients/${id}`, patientData);
      return response.data;
    } catch (error) {
      console.error(`Error updating patient with ID ${id}:`, error);
      throw error;
    }
  },
  
  // Get patient movements
  getPatientMovements: async (patientId, params = {}) => {
    try {
      const response = await api.get(`/api/v1/movements/patient/${patientId}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching movements for patient ${patientId}:`, error);
      throw error;
    }
  },
  
  // Get patient daily report
  getPatientDailyReport: async (patientId, date) => {
    try {
      const response = await api.get(`/api/v1/reports/patient/${patientId}/daily`, {
        params: { date }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching daily report for patient ${patientId}:`, error);
      throw error;
    }
  }
};

export default patientService;