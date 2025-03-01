import api from './api';

const monitoringService = {
  // Connect to patient monitoring WebSocket
  connectToPatientMonitoring: (patientId, onFrame, onMovementData) => {
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.REACT_APP_API_URL?.replace(/^https?:\/\//, '') || 'localhost:8000';
    const ws = new WebSocket(`${protocol}//${host}/api/v1/monitoring/ws/${patientId}`);
    
    let frameSocket = null;
    let dataSocket = null;
    
    ws.binaryType = 'arraybuffer';
    
    ws.onmessage = (event) => {
      // Check if the message is binary (image frame) or JSON (movement data)
      if (event.data instanceof ArrayBuffer) {
        // Process image frame
        if (onFrame) {
          const blob = new Blob([event.data], { type: 'image/jpeg' });
          const imageUrl = URL.createObjectURL(blob);
          onFrame(imageUrl);
        }
      } else {
        // Process movement data
        try {
          const data = JSON.parse(event.data);
          if (onMovementData) {
            onMovementData(data);
          }
        } catch (error) {
          console.error('Error parsing movement data:', error);
        }
      }
    };
    
    // Function to send video frame to server
    const sendFrame = (frameData) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(frameData);
      }
    };
    
    return { 
      socket: ws,
      sendFrame,
      close: () => ws.close()
    };
  },
  
  // Get available cameras
  getAvailableCameras: async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Error getting available cameras:', error);
      throw error;
    }
  },
  
  // Start video stream from camera
  startVideoStream: async (videoElement, deviceId = null) => {
    try {
      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = stream;
      return stream;
    } catch (error) {
      console.error('Error starting video stream:', error);
      throw error;
    }
  },
  
  // Capture frame from video stream
  captureVideoFrame: (videoElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    return new Promise((resolve) => {
      canvas.toBlob(blob => {
        resolve(blob);
      }, 'image/jpeg', 0.8);
    });
  }
};

export default monitoringService;