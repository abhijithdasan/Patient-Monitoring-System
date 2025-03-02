import React, { useRef, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const PatientVideo = ({ patientId, onMovementDetected, showControls = true }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [socket, setSocket] = useState(null);
  const [movementData, setMovementData] = useState([]);
  
  // Camera options
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');

  useEffect(() => {
    // Enumerate available cameras
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const cameras = devices.filter(device => device.kind === 'videoinput');
          setAvailableCameras(cameras);
          if (cameras.length > 0) {
            setSelectedCamera(cameras[0].deviceId);
          }
        })
        .catch(err => {
          console.error('Error enumerating devices:', err);
        });
    }
    
    return () => {
      stopStream();
    };
  }, []);

  const startStream = async () => {
    try {
      if (!selectedCamera) {
        toast.error('No camera selected');
        return;
      }
      
      // Get user media
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      // Set stream to video
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsPlaying(true);
        
        // Connect to WebSocket for motion detection
        connectWebSocket();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast.error('Could not access camera: ' + err.message);
    }
  };

  const stopStream = () => {
    // Stop video stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    // Close WebSocket
    if (socket) {
      socket.close();
      setSocket(null);
    }
    
    setIsPlaying(false);
    setMovementData([]);
  };

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/v1/monitoring/ws/${patientId}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connection established');
      setSocket(ws);
      startSendingFrames(ws);
    };
    
    ws.onmessage = (event) => {
      if (event.data instanceof Blob) {
        // Handle processed frame
        const url = URL.createObjectURL(event.data);
        const img = new Image();
        img.onload = () => {
          const ctx = canvasRef.current.getContext('2d');
          ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
          URL.revokeObjectURL(url);
        };
        img.src = url;
      } else {
        // Handle movement data
        try {
          const data = JSON.parse(event.data);
          if (data.movements && data.movements.length > 0) {
            setMovementData(data.movements);
            if (onMovementDetected) {
              onMovementDetected(data.movements);
            }
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Connection error. Trying to reconnect...');
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (isPlaying && !socket) {
          connectWebSocket();
        }
      }, 3000);
    };
    
    setSocket(ws);
  };

  const startSendingFrames = (ws) => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;
    
    const captureAndSendFrame = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA && ws.readyState === WebSocket.OPEN) {
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob and send via WebSocket
        canvas.toBlob((blob) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(blob);
          }
        }, 'image/jpeg', 0.7);
      }
      
      // Continue if video is playing and socket is connected
      if (isPlaying && socket) {
        requestAnimationFrame(captureAndSendFrame);
      }
    };
    
    // Start the capture loop
    captureAndSendFrame();
  };

  const handleCameraChange = (e) => {
    setSelectedCamera(e.target.value);
    if (isPlaying) {
      stopStream();
      setTimeout(() => {
        startStream();
      }, 500);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="relative">
        <video 
          ref={videoRef} 
          className="w-full h-auto hidden"
          autoPlay 
          playsInline
        />
        
        <canvas 
          ref={canvasRef} 
          className="w-full h-auto bg-gray-100"
          width={640}
          height={480}
        />
        
        {/* Movement indicators */}
        {movementData.length > 0 && (
          <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-60 text-white p-2 rounded">
            <div className="text-sm font-medium mb-1">Movement Detected:</div>
            <div className="flex flex-wrap gap-2">
              {movementData.map((movement, idx) => (
                <div 
                  key={idx}
                  className={`text-xs px-2 py-1 rounded ${movement.severity === 'critical' ? 'bg-red-500' : movement.severity === 'attention' ? 'bg-yellow-500' : 'bg-blue-500'}`}
                >
                  {movement.body_part} ({movement.duration.toFixed(1)}s)
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {showControls && (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex-1">
            <label htmlFor="camera-select" className="block text-sm font-medium text-gray-700 mb-1">
              Camera
            </label>
            <select
              id="camera-select"
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={selectedCamera}
              onChange={handleCameraChange}
              disabled={isPlaying}
            >
              {availableCameras.map(camera => (
                <option key={camera.deviceId} value={camera.deviceId}>
                  {camera.label || `Camera ${camera.deviceId.substr(0, 5)}...`}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-none">
            {!isPlaying ? (
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={startStream}
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Monitoring
              </button>
            ) : (
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={stopStream}
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                Stop Monitoring
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientVideo;