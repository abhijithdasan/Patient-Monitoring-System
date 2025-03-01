import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaBars, FaBell, FaUser, FaSignOutAlt } from 'react-icons/fa';
import alertService from '../services/alertService';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useContext(AuthContext);
  const [alerts, setAlerts] = useState([]);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  useEffect(() => {
    // Load initial unacknowledged alerts
    const loadAlerts = async () => {
      try {
        const response = await alertService.getAlerts({ acknowledged: false, limit: 5 });
        setAlerts(response);
      } catch (error) {
        console.error('Error loading alerts:', error);
      }
    };
    
    if (user) {
      loadAlerts();
      
      // Connect to alert WebSocket
      const alertSocket = alertService.connectToAlertSocket((data) => {
        if (data.type === 'alert') {
          // Add new alert to the list
          setAlerts(prevAlerts => [data, ...prevAlerts].slice(0, 5));
        }
      });
      
      return () => {
        if (alertSocket) {
          alertSocket.close();
        }
      };
    }
  }, [user]);
  
  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await alertService.acknowledgeAlert(alertId);
      // Remove acknowledged alert from the list
      setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };
  
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button onClick={toggleSidebar} className="p-2 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none">
              <FaBars className="h-6 w-6" />
            </button>
            <div className="ml-4 font-bold text-xl text-blue-600">
              Patient Monitoring System
            </div>
          </div>
          
          {user && (
            <div className="flex items-center">
              {/* Alerts dropdown */}
              <div className="relative ml-3">
                <button 
                  onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none relative"
                >
                  <FaBell className="h-6 w-6" />
                  {alerts.length > 0 && (
                    <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {alerts.length}
                    </span>
                  )}
                </button>
                
                {showAlertsDropdown && (
                  <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b">
                        <div className="font-bold">Recent Alerts</div>
                      </div>
                      {alerts.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          No new alerts
                        </div>
                      ) : (
                        alerts.map((alert, index) => (
                          <div key={alert.id || index} className="px-4 py-2 text-sm border-b">
                            <div className={`font-bold mb-1 ${
                              alert.severity === 'critical' ? 'text-red-600' : 
                              alert.severity === 'attention' ? 'text-yellow-600' : 'text-blue-600'
                            }`}>
                              {alert.severity === 'critical' ? 'CRITICAL' : 
                               alert.severity === 'attention' ? 'Needs Attention' : 'Info'}
                            </div>
                            <div className="text-gray-700">{alert.message}</div>
                            <div className="flex justify-between mt-1">
                              <span className="text-xs text-gray-500">
                                {new Date(alert.timestamp).toLocaleTimeString()}
                              </span>
                              <button 
                                onClick={() => handleAcknowledgeAlert(alert.id)}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Acknowledge
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                      <Link 
                        to="/alerts" 
                        className="block px-4 py-2 text-center text-sm text-blue-600 hover:bg-gray-100"
                        onClick={() => setShowAlertsDropdown(false)}
                      >
                        View All Alerts
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Profile dropdown */}
              <div className="relative ml-3">
                <button 
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none flex items-center"
                >
                  <span className="mr-2 font-medium text-gray-700 hidden md:block">
                    {user.full_name || user.email}
                  </span>
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                    <FaUser className="h-4 w-4" />
                  </div>
                </button>
                
                {showProfileDropdown && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b">
                        <div className="font-bold">{user.full_name}</div>
                        <div className="text-gray-500">{user.role}</div>
                      </div>
                      <Link 
                        to="/profile" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        <FaUser className="mr-2" /> Profile
                      </Link>
                      <button 
                        onClick={() => {
                          logout();
                          setShowProfileDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <FaSignOutAlt className="mr-2" /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;