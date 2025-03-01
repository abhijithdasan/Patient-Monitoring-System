import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiUsers, HiExclamation, HiEye, HiClock, HiChartBar } from 'react-icons/hi';
import api from '../services/api';

// Components
import AlertCard from '../components/AlertCard';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_patients: 0,
    active_monitoring: 0,
    alerts_today: 0,
    critical_alerts: 0
  });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch dashboard statistics
        const statsResponse = await api.get('/api/v1/dashboard/stats');
        setStats(statsResponse.data);
        
        // Fetch recent alerts
        const alertsResponse = await api.get('/api/v1/alerts/recent');
        setRecentAlerts(alertsResponse.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Set up polling for alerts (every 30 seconds)
    const alertsInterval = setInterval(async () => {
      try {
        const alertsResponse = await api.get('/api/v1/alerts/recent');
        setRecentAlerts(alertsResponse.data);
      } catch (err) {
        console.error('Failed to fetch recent alerts', err);
      }
    }, 30000);

    return () => clearInterval(alertsInterval);
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard 
            title="Total Patients" 
            value={stats.total_patients} 
            icon={<HiUsers className="h-8 w-8 text-blue-500" />} 
            linkTo="/patients"
          />
          <StatCard 
            title="Active Monitoring" 
            value={stats.active_monitoring} 
            icon={<HiEye className="h-8 w-8 text-green-500" />} 
            linkTo="/monitoring"
          />
          <StatCard 
            title="Alerts Today" 
            value={stats.alerts_today} 
            icon={<HiExclamation className="h-8 w-8 text-yellow-500" />} 
            linkTo="/alerts"
          />
          <StatCard 
            title="Critical Alerts" 
            value={stats.critical_alerts} 
            icon={<HiExclamation className="h-8 w-8 text-red-500" />} 
            linkTo="/alerts?severity=critical"
          />
        </div>
        
        {/* Recent Activity and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Alerts */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Recent Alerts</h3>
              <Link to="/alerts" className="text-sm text-blue-500 hover:text-blue-700">
                View all
              </Link>
            </div>
            <div className="px-4 py-3 divide-y divide-gray-200">
              {recentAlerts.length > 0 ? (
                recentAlerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))
              ) : (
                <p className="py-4 text-gray-500 text-center">No recent alerts</p>
              )}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="px-4 py-5">
              <div className="space-y-4">
                <Link
                  to="/patients/new"
                  className="block w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-center text-white bg-blue-600 hover:bg-blue-700 font-medium"
                >
                  Add New Patient
                </Link>
                <Link
                  to="/monitoring/new"
                  className="block w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-center text-white bg-green-600 hover:bg-green-700 font-medium"
                >
                  Start Monitoring Session
                </Link>
                <Link
                  to="/reports"
                  className="block w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-center text-white bg-purple-600 hover:bg-purple-700 font-medium"
                >
                  Generate Reports
                </Link>
                <Link
                  to="/settings"
                  className="block w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-center text-gray-700 bg-white hover:bg-gray-50 font-medium"
                >
                  System Settings
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            <Link to="/activity" className="text-sm text-blue-500 hover:text-blue-700">
              View all
            </Link>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="flow-root">
              <ul className="-mb-8">
                {/* Activity items would go here */}
                {/* This is a placeholder - you'd need to fetch activity data */}
                <li className="py-2">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <HiClock className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800">
                        Patient monitoring session started for <span className="font-medium">John Doe</span>
                      </p>
                      <p className="text-xs text-gray-500">30 minutes ago</p>
                    </div>
                  </div>
                </li>
                <li className="py-2">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <HiUsers className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800">
                        New patient <span className="font-medium">Jane Smith</span> was added to the system
                      </p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                </li>
                <li className="py-2">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <HiChartBar className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800">
                        Monthly report was generated by <span className="font-medium">Dr. Roberts</span>
                      </p>
                      <p className="text-xs text-gray-500">Yesterday at 4:30 PM</p>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;