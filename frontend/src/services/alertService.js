import api from './api';

class AlertsService {
  constructor() {
    this.socket = null;
    this.onAlertReceived = null;
    this.isConnected = false;
    this.apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    this.alertSound = new Audio('/sounds/alert.mp3');
  }
  
  // Connect to WebSocket for real-time alerts
  async connectToAlerts(callback) {
    this.onAlertReceived = callback;
    
    try {
      // Get websocket auth token
      const response = await api.get('/api/v1/alerts/token');
      const { token } = response.data;
      
      // Create WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${this.apiBaseUrl.replace(/^https?:\/\//, '')}/api/v1/alerts/ws?token=${token}`;
      
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('Alerts WebSocket connected');
        this.isConnected = true;
      };
      
      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'alert') {
          // Play sound for critical alerts
          if (data.severity === 'critical') {
            this.alertSound.play().catch(e => console.log('Error playing alert sound:', e));
          }
          
          // Call callback function
          if (this.onAlertReceived) {
            this.onAlertReceived(data);
          }
        }
      };
      
      this.socket.onclose = () => {
        console.log('Alerts WebSocket closed');
        this.isConnected = false;
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => this.connectToAlerts(callback), 3000);
      };
      
      this.socket.onerror = (error) => {
        console.error('Alerts WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('Failed to connect to alerts service:', error);
      
      // Attempt to reconnect after 5 seconds
      setTimeout(() => this.connectToAlerts(callback), 5000);
    }
  }
  
  // Disconnect from WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.isConnected = false;
  }
  
  // Get all alerts with optional filtering
  async getAlerts(filters = {}) {
    const { patientId, acknowledged, severity, startDate, endDate, skip, limit } = filters;
    let url = '/api/v1/alerts?';
    
    if (patientId) url += `&patient_id=${patientId}`;
    if (acknowledged !== undefined) url += `&acknowledged=${acknowledged}`;
    if (severity) url += `&severity=${encodeURIComponent(severity)}`;
    if (startDate) url += `&start_date=${startDate.toISOString()}`;
    if (endDate) url += `&end_date=${endDate.toISOString()}`;
    if (skip) url += `&skip=${skip}`;
    if (limit) url += `&limit=${limit}`;
    
    const response = await api.get(url);
    return response.data;
  }
  
  // Get alert details
  async getAlert(alertId) {
    const response = await api.get(`/api/v1/alerts/${alertId}`);
    return response.data;
  }
  
  // Acknowledge an alert
  async acknowledgeAlert(alertId) {
    const response = await api.post(`/api/v1/alerts/${alertId}/acknowledge`);
    return response.data;
  }
  
  // Get alerts count summary
  async getAlertsCounts() {
    const response = await api.get('/api/v1/alerts/counts');
    return response.data;
  }
}

export default new AlertsService();