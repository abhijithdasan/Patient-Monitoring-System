import React, { useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';
import { useAlerts } from '../context/AlertContext';
import { formatRelativeTime, formatMovementSeverity } from '../utils/formatters';

const AlertBell = () => {
  const { alerts, unreadCount, acknowledgeAlert } = useAlerts();
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  const handleAcknowledge = async (e, alertId) => {
    e.stopPropagation();
    await acknowledgeAlert(alertId);
  };
  
  const handleAlertClick = (alert) => {
    // Navigate to patient detail with alert info
    window.location.href = `/patients/${alert.patient_id}?highlightAlert=${alert.id}`;
  };
  
  // Limit displayed alerts
  const recentAlerts = alerts.slice(0, 5);
  
  return (
    <div className="relative">
      {/* Bell icon with notification badge */}
      <button
        className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        onClick={toggleDropdown}
      >
        <span className="sr-only">View notifications</span>
        {unreadCount > 0 ? (
          <BellAlertIcon className="h-6 w-6 text-indigo-600" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
        
        {/* Notification badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1" role="none">
            <div className="px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
            </div>
            
            {recentAlerts.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                No new notifications
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {recentAlerts.map(alert => {
                  const severityInfo = formatMovementSeverity(alert.severity);
                  
                  return (
                    <div 
                      key={alert.id}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${!alert.acknowledged ? 'bg-indigo-50' : ''}`}
                      onClick={() => handleAlertClick(alert)}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <span className={`inline-block h-2 w-2 rounded-full ${severityInfo.color === 'red' ? 'bg-red-600' : severityInfo.color === 'yellow' ? 'bg-yellow-500' : 'bg-blue-600'}`}></span>
                        </div>
                        <div className="ml-3 w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {alert.message}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatRelativeTime(alert.timestamp)}
                          </p>
                        </div>
                        {!alert.acknowledged && (
                          <div className="ml-4 flex-shrink-0 flex">
                            <button
                              type="button"
                              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              onClick={(e) => handleAcknowledge(e, alert.id)}
                            >
                              <span className="sr-only">Acknowledge</span>
                              <span className="text-xs font-medium text-indigo-600">Ack</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {recentAlerts.length > 0 && (
              <div className="border-t border-gray-200">
                <a
                  href="/alerts"
                  className="block px-4 py-2 text-sm text-indigo-600 hover:bg-gray-100"
                >
                  View all notifications
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertBell;