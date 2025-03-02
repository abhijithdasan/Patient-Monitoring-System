import api from './api';

class MonitoringService {
  constructor() {
    this.socket = null;
    this.videoStream = null;
    this.onMovementDetected = null;
    this.isConnecting = false;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }
  
  // Connect to WebSocket for patient monitoring
  async connect(patientId, movementCallback) {
    if (this.isConnecting) return;
    
    this.isConnecting = true;
    this.onMovementDetected = movementCallback;
    
    // Get websocket auth token
    try {
      const response = await api.get(`/api/v1/monitoring/token/${patientId}`);
      const { token } = response.data;
      
      // Create WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${this.apiBaseUrl.replace(/^https?:\/\//, '')}/api/v1/monitoring/ws/${patientId}?token=${token}`;
      
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = this._handleSocketOpen.bind(this);
      this.socket.onmessage = this._handleSocketMessage.bind(this);
      this.socket.onclose = this._handleSocketClose.bind(this, patientId);
      this.socket.onerror = this._handleSocketError.bind(this);
      
      // Get access to camera
      await this._setupVideoStream();
      
    } catch (error) {
      console.error('Failed to connect to monitoring service:', error);
      this.isConnecting = false;
      throw error;
    }
  }
  
  // Disconnect from WebSocket
  disconnect() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }
  
  // Private: Setup video stream from camera
  async _setupVideoStream() {
    try {
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 }
        }
      };
      
      this.videoStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.videoStream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      throw error;
    }
  }
  
  // Private: Handle WebSocket connection open
  _handleSocketOpen() {
    console.log('Monitoring WebSocket connected');
    this.isConnected = true;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    // Start sending video frames
    this._startSendingFrames();
  }
  
  // Private: Handle WebSocket message received
  _handleSocketMessage(event) {
    try {
      // Handle binary data (processed video frame)
      if (event.data instanceof Blob) {
        // Create object URL for the processed frame
        const frameUrl = URL.createObjectURL(event.data);
        
        // Find monitoring video element and update it
        const monitoringVideo = document.getElementById('monitoring-display');
        if (monitoringVideo) {
          const img = new Image();
          img.onload = () => {
            const ctx = monitoringVideo.getContext('2d');
            ctx.drawImage(img, 0, 0, monitoringVideo.width, monitoringVideo.height);
            URL.revokeObjectURL(frameUrl);
          };
          img.src = frameUrl;
        }
        return;
      }
      
      // Handle JSON data (movement detection)
      const data = JSON.parse(event.data);
      
      if (data.motion_detected && this.onMovementDetected) {
        this.onMovementDetected(data.movements);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }
  
  // Private: Handle WebSocket connection close
  _handleSocketClose(patientId, event) {
    console.log('Monitoring WebSocket closed:', event.code, event.reason);
    this.isConnected = false;
    
    // Attempt to reconnect if not manually closed
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect(patientId, this.onMovementDetected);
      }, 2000 * this.reconnectAttempts);
    }
  }
  
  // Private: Handle WebSocket error
  _handleSocketError(error) {
    console.error('Monitoring WebSocket error:', error);
  }
  
  // Private: Start sending video frames to server
  _startSendingFrames() {
    if (!this.isConnected || !this.videoStream) return;
    
    const videoElement = document.createElement('video');
    videoElement.srcObject = this.videoStream;
    videoElement.autoplay = true;
    videoElement.muted = true;
    
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    const sendFrame = () => {
      if (!this.isConnected) return;
      
      // Draw video frame to canvas
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob and send to server
      canvas.toBlob((blob) => {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(blob);
        }
        
        // Schedule next frame
        if (this.isConnected) {
          requestAnimationFrame(sendFrame);
        }
      }, 'image/jpeg', 0.7);
    };
    
    videoElement.onloadedmetadata = () => {
      videoElement.play();
      sendFrame();
    };
  }
}

export default new MonitoringService();