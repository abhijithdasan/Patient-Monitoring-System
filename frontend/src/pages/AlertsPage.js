import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import moment from 'moment';
import { alertService } from '../services/alertService';

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, critical, attention, unacknowledged

  useEffect(() => {
    fetchAlerts();
    
    // Set up real-time alert updates
    const alertSocket = alertService.subscribeToAlerts((newAlert) => {
      setAlerts(prevAlerts => [newAlert, ...prevAlerts]);
      
      // Show notification for new alerts
      toast.info(`New ${newAlert.severity} alert: ${newAlert.message}`, {
        position: "top-right",
        autoClose: newAlert.severity === 'critical' ? false : 5000,
      });
    });
    
    return () => {
      // Clean up subscription
      if (alertSocket) {
        alertSocket.close();
      }
    };
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await alertService.getAlerts();
      setAlerts(response);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      await alertService.acknowledgeAlert(alertId);
      // Update local state
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true, acknowledged_timestamp: new Date().toISOString() } : alert
      ));
      toast.success('Alert acknowledged');
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    switch(filter) {
      case 'critical':
        return alert.severity === 'critical';
      case 'attention':
        return alert.severity === 'attention';
      case 'unacknowledged':
        return !alert.acknowledged;
      default:
        return true;
    }
  });

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'attention':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="container px-6 mx-auto py-8">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Patient Alerts</h1>
      
      <div className="flex items-center mb-6 space-x-4">
        <div className="inline-flex shadow-md">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('critical')}
            className={`px-4 py-2 text-sm font-medium ${filter === 'critical' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
          >
            Critical
          </button>
          <button 
            onClick={() => setFilter('attention')}
            className={`px-4 py-2 text-sm font-medium ${filter === 'attention' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
          >
            Attention
          </button>
          <button 
            onClick={() => setFilter('unacknowledged')}
            className={`px-4 py-2 text-sm font-medium rounded-r-md ${filter === 'unacknowledged' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
          >
            Unacknowledged
          </button>
        </div>
        
        <button 
          onClick={fetchAlerts}
          className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md shadow-sm text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No alerts found matching the current filter.</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAlerts.map((alert) => (
                  <tr key={alert.id} className={alert.acknowledged ? '' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {alert.patient.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Room {alert.patient.room_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{alert.message}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {moment(alert.timestamp).format('MMM D, YYYY h:mm A')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {alert.acknowledged ? (
                        <span className="text-green-600">
                          Acknowledged {moment(alert.acknowledged_timestamp).fromNow()}
                        </span>
                      ) : (
                        <span className="text-red-600">Unacknowledged</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!alert.acknowledged && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Acknowledge
                        </button>
                      )}
                      <button
                        onClick={() => window.location.href = `/patients/${alert.patient_id}`}
                        className="ml-4 text-indigo-600 hover:text-indigo-900"
                      >
                        View Patient
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;