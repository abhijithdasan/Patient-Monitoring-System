import api from './api';

const alertService = {
  // Get all alerts
  getAlerts: async (params = {}) => {
    try {
      const response = await api.get('/api/v1/alerts/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  },
  
  // Get alerts for a specific patient
  getPatientAlerts: async (patientId, params = {}) => {
    try {
      const response = await api.get(`/api/v1/alerts/patient/${patientId}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching alerts for patient ${patientId}:`, error);
      throw error;
    }
  },
  
  // Acknowledge an alert
  acknowledgeAlert: async (alertId) => {
    try {
      const response = await api.post(`/api/v1/alerts/${alertId}/acknowledge`);
      return response.data;
    } catch (error) {
      console.error(`Error acknowledging alert ${alertId}:`, error);
      throw error;
    }
  },
  
  // Connect to alert WebSocket
  connectToAlertSocket: (onMessage) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.id) return null;
    
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.REACT_APP_API_URL?.replace(/^https?:\/\//, '') || 'localhost:8000';
    const ws = new WebSocket(`${protocol}//${host}/api/v1/alerts/ws/${user.id}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };
    
    return ws;
  }
};

export default alertService;