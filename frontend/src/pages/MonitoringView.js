import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaPlay, FaPause, FaBell, FaBellSlash, FaCog } from 'react-icons/fa';

import { getPatient } from '../services/patientService';
import { startMonitoring, stopMonitoring } from '../services/monitoringService';

const MovementCard = ({ movement }) => {
  // Calculate color based on severity
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'attention':
        return 'bg-yellow-500';
      case 'normal':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="border rounded-md p-3 mb-2 shadow-sm bg-white">
      <div className="flex justify-between items-center">
        <div>
          <span className="font-medium">{movement.body_part}</span>
          <div className="text-sm text-gray-600">
            Duration: {movement.duration.toFixed(1)}s
          </div>
          <div className="text-sm text-gray-600">
            Intensity: {movement.intensity.toFixed(1)}%
          </div>
        </div>
        <div className={`${getSeverityColor(movement.severity)} w-4 h-4 rounded-full`}></div>
      </div>
    </div>
  );
};

const MonitoringView = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [movements, setMovements] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [sensitivity, setSensitivity] = useState(1.0);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const wsRef = useRef(null);
  
  // Fetch patient data
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const data = await getPatient(id);
        setPatient(data);
        setSensitivity(data.sensitivity_level || 1.0);
        setIsLoading(false);
      } catch (error) {
        toast.error('Failed to load patient data');
        setIsLoading(false);
      }
    };
    
    fetchPatient();
    
    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [id]);
  
  // Start monitoring
  const startVideoMonitoring = async () => {
    try {
      // Get video stream from webcam or video file
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Connect to WebSocket
      connectWebSocket();
      
      setIsMonitoring(true);
    } catch (error) {
      toast.error('Failed to access camera: ' + error.message);
    }
  };
  
  // Stop monitoring
  const stopVideoMonitoring = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    setIsMonitoring(false);
    setMovements([]);
  };
  
  // Connect to WebSocket
  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/v1/monitoring/ws/${id}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      startSendingFrames();
    };
    
    ws.onmessage = (event) => {
      // Check if the message is binary (video frame) or JSON (movement data)
      if (event.data instanceof Blob) {
        // Display the processed frame
        const url = URL.createObjectURL(event.data);
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
          }
        };
        img.src = url;
      } else {
        // Process movement data
        try {
          const data = JSON.parse(event.data);
          if (data.movements && data.movements.length > 0) {
            setMovements(data.movements);
            
            // Play alert sound for critical movements if not muted
            if (!isMuted) {
              const hasCritical = data.movements.some(m => m.severity === 'critical');
              if (hasCritical) {
                playAlertSound('critical');
              } else if (data.movements.some(m => m.severity === 'attention')) {
                playAlertSound('attention');
              }
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Connection error. Please try again.');
      setIsMonitoring(false);
    };
    
    ws.onclose = () => {
      console.log('WebSocket closed');
      if (isMonitoring) {
        toast.info('Connection closed. Monitoring stopped.');
        setIsMonitoring(false);
      }
    };
  };
  
  // Start sending video frames to the server
  const startSendingFrames = () => {
    if (!videoRef.current || !canvasRef.current || !wsRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const video = videoRef.current;
    
    const sendFrame = () => {
      if (!isMonitoring || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      
      try {
        // Draw the current video frame on the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert the canvas to a blob and send it via WebSocket
        canvas.toBlob((blob) => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(blob);
          }
        }, 'image/jpeg', 0.8);
        
        // Schedule the next frame
        requestAnimationFrame(sendFrame);
      } catch (error) {
        console.error('Error sending frame:', error);
      }
    };
    
    // Start the process
    sendFrame();
  };
  
  // Play alert sound based on severity
  const playAlertSound = (severity) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set frequency based on severity
    if (severity === 'critical') {
      oscillator.frequency.value = 880; // A5
      gainNode.gain.value = 0.5;
      oscillator.type = 'sawtooth';
    } else {
      oscillator.frequency.value = 440; // A4
      gainNode.gain.value = 0.3;
      oscillator.type = 'sine';
    }
    
    oscillator.start();
    
    // Stop after a short duration
    setTimeout(() => {
      oscillator.stop();
      setTimeout(() => audioContext.close(), 100);
    }, severity === 'critical' ? 1000 : 500);
  };
  
  // Toggle monitoring
  const toggleMonitoring = () => {
    if (isMonitoring) {
      stopVideoMonitoring();
    } else {
      startVideoMonitoring();
    }
  };
  
  // Update patient sensitivity
  const updateSensitivity = async () => {
    try {
      // API call to update patient sensitivity
      await fetch(`/api/v1/patients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ sensitivity_level: sensitivity })
      });
      
      toast.success('Sensitivity updated successfully');
      setShowSettings(false);
      
      // Restart monitoring with new sensitivity if currently monitoring
      if (isMonitoring) {
        stopVideoMonitoring();
        setTimeout(() => startVideoMonitoring(), 500);
      }
    } catch (error) {
      toast.error('Failed to update sensitivity');
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }
  
  if (!patient) {
    return <div className="text-center p-4">Patient not found</div>;
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Monitoring: {patient.full_name}
          </h2>
          <div className="flex space-x-2">
            <button 
              onClick={() => setIsMuted(!isMuted)} 
              className="p-2 rounded-full hover:bg-gray-200"
              title={isMuted ? "Unmute alerts" : "Mute alerts"}
            >
              {isMuted ? <FaBellSlash /> : <FaBell />}
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)} 
              className="p-2 rounded-full hover:bg-gray-200"
              title="Settings"
            >
              <FaCog />
            </button>
            <button 
              onClick={toggleMonitoring} 
              className={`p-2 rounded-md ${isMonitoring ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
            >
              {isMonitoring ? <><FaPause className="inline mr-1" /> Stop</> : <><FaPlay className="inline mr-1" /> Start</>}
            </button>
          </div>
        </div>
        
        {/* Patient info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="border p-3 rounded-md">
            <div className="text-sm text-gray-500">Patient ID</div>
            <div>{patient.medical_record_number}</div>
          </div>
          <div className="border p-3 rounded-md">
            <div className="text-sm text-gray-500">Room</div>
            <div>{patient.room_number || 'Not assigned'}</div>
          </div>
          <div className="border p-3 rounded-md">
            <div className="text-sm text-gray-500">Status</div>
            <div className={`
              ${patient.status === 'critical' ? 'text-red-500' : ''}
              ${patient.status === 'stable' ? 'text-green-500' : ''}
              ${patient.status === 'recovering' ? 'text-blue-500' : ''}
              font-medium
            `}>
              {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
            </div>
          </div>
        </div>
        
        {/* Settings panel */}
        {showSettings && (
          <div className="border rounded-md p-4 mb-4 bg-gray-50">
            <h3 className="font-medium mb-2">Monitoring Settings</h3>
            <div className="mb-3">
              <label className="block text-sm mb-1">Movement Sensitivity</label>
              <div className="flex items-center">
                <input 
                  type="range" 
                  min="0.1" 
                  max="2" 
                  step="0.1" 
                  value={sensitivity} 
                  onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                  className="w-full mr-2"
                />
                <span className="text-sm">{sensitivity.toFixed(1)}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Higher values detect more subtle movements
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={() => setShowSettings(false)} 
                className="px-3 py-1 text-sm border rounded-md mr-2"
              >
                Cancel
              </button>
              <button 
                onClick={updateSensitivity} 
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md"
              >
                Apply
              </button>
            </div>
          </div>
        )}
        
        {/* Video monitoring area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="relative bg-black rounded-md overflow-hidden aspect-video">
              <video 
                ref={videoRef} 
                className="absolute top-0 left-0 w-full h-full object-cover" 
                autoPlay 
                playsInline 
                muted
              />
              <canvas 
                ref={canvasRef} 
                width="640" 
                height="480" 
                className="absolute top-0 left-0 w-full h-full object-cover"
              />
              
              {!isMonitoring && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                  <div className="text-center">
                    <FaPlay className="inline-block text-4xl mb-2" />
                    <div>Click Start to begin monitoring</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <div className="bg-gray-50 rounded-md p-3 h-full">
              <h3 className="font-medium mb-2">Detected Movements</h3>
              
              <div className="overflow-y-auto max-h-96">
                {movements.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No movements detected
                  </div>
                ) : (
                  movements.map((movement, index) => (
                    <MovementCard key={index} movement={movement} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringView;