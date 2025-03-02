/**
 * WebSocket Manager for handling real-time connections
 * This utility handles connection management, reconnection logic,
 * and message processing for monitoring and alerts
 */

class WebSocketManager {
    constructor(url, options = {}) {
      this.baseUrl = url;
      this.options = {
        reconnectInterval: 2000,
        maxReconnectAttempts: 5,
        ...options
      };
      
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
      this.messageHandlers = [];
      this.connectionHandlers = [];
      this.disconnectionHandlers = [];
      this.errorHandlers = [];
    }
    
    connect(endpoint) {
      const url = `${this.baseUrl}${endpoint}`;
      
      // Close existing connection if any
      if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
        this.socket.close();
      }
      
      this.socket = new WebSocket(url);
      
      this.socket.onopen = () => {
        console.log(`WebSocket connected to ${url}`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.connectionHandlers.forEach(handler => handler());
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.messageHandlers.forEach(handler => handler(data));
        } catch (error) {
          // Handle binary data (like video frames)
          if (event.data instanceof Blob) {
            this.messageHandlers.forEach(handler => handler(event.data));
          } else {
            console.error('Error parsing WebSocket message:', error);
          }
        }
      };
      
      this.socket.onclose = (event) => {
        this.isConnected = false;
        console.log(`WebSocket disconnected from ${url}. Code: ${event.code}, Reason: ${event.reason}`);
        this.disconnectionHandlers.forEach(handler => handler(event));
        
        // Attempt to reconnect if not closed cleanly
        if (event.code !== 1000 && event.code !== 1001) {
          this.attemptReconnect(endpoint);
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.errorHandlers.forEach(handler => handler(error));
      };
      
      return this;
    }
    
    attemptReconnect(endpoint) {
      if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})...`);
        
        setTimeout(() => {
          this.connect(endpoint);
        }, this.options.reconnectInterval);
      } else {
        console.error(`Maximum reconnect attempts (${this.options.maxReconnectAttempts}) reached.`);
      }
    }
    
    disconnect() {
      if (this.socket) {
        this.socket.close(1000, 'Closed by client');
      }
    }
    
    send(data) {
      if (!this.isConnected) {
        console.error('Cannot send message: WebSocket is not connected');
        return false;
      }
      
      try {
        if (typeof data === 'object') {
          this.socket.send(JSON.stringify(data));
        } else {
          this.socket.send(data);
        }
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        return false;
      }
    }
    
    onMessage(handler) {
      this.messageHandlers.push(handler);
      return this;
    }
    
    onConnect(handler) {
      this.connectionHandlers.push(handler);
      return this;
    }
    
    onDisconnect(handler) {
      this.disconnectionHandlers.push(handler);
      return this;
    }
    
    onError(handler) {
      this.errorHandlers.push(handler);
      return this;
    }
    
    // For sending video frames
    sendVideoFrame(frameData) {
      if (!this.isConnected) {
        return false;
      }
      
      try {
        this.socket.send(frameData);
        return true;
      } catch (error) {
        console.error('Error sending video frame:', error);
        return false;
      }
    }
  }
  
  export default WebSocketManager;