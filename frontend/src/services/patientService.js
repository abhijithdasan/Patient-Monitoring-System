import api from './api';

const patientService = {
  // Get all patients with optional filtering
  getPatients: async (filters = {}) => {
    const { search, status, skip, limit } = filters;
    let url = '/api/v1/patients?';
    
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    if (skip) url += `&skip=${skip}`;
    if (limit) url += `&limit=${limit}`;
    
    const response = await api.get(url);
    return response.data;
  },
  
  // Get a specific patient by ID
  getPatient: async (id) => {
    const response = await api.get(`/api/v1/patients/${id}`);
    return response.data;
  },
  
  // Create a new patient
  createPatient: async (patientData) => {
    const response = await api.post('/api/v1/patients', patientData);
    return response.data;
  },
  
  // Update an existing patient
  updatePatient: async (id, patientData) => {
    const response = await api.put(`/api/v1/patients/${id}`, patientData);
    return response.data;
  },
  
  // Get patient movements history
  getPatientMovements: async (patientId, filters = {}) => {
    const { startDate, endDate, severity, skip, limit } = filters;
    let url = `/api/v1/patients/${patientId}/movements?`;
    
    if (startDate) url += `&start_date=${startDate.toISOString()}`;
    if (endDate) url += `&end_date=${endDate.toISOString()}`;
    if (severity) url += `&severity=${encodeURIComponent(severity)}`;
    if (skip) url += `&skip=${skip}`;
    if (limit) url += `&limit=${limit}`;
    
    const response = await api.get(url);
    return response.data;
  },
  
  // Get patient daily summary
  getPatientSummary: async (patientId, date) => {
    const formattedDate = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const response = await api.get(`/api/v1/patients/${patientId}/summary?date=${formattedDate}`);
    return response.data;
  },
  
  // Update patient monitoring sensitivity
  updateSensitivity: async (patientId, sensitivityLevel) => {
    const response = await api.put(`/api/v1/patients/${patientId}/sensitivity`, { sensitivity_level: sensitivityLevel });
    return response.data;
  }
};

export default patientService;