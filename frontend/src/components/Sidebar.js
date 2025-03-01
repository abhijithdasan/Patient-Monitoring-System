import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  FaHome, 
  FaUsers, 
  FaUserPlus, 
  FaVideo, 
  FaBell, 
  FaChartBar, 
  FaCog 
} from 'react-icons/fa';

const NavItem = ({ to, icon, text, isActive }) => {
  return (
    <Link
      to={to}
      className={`flex items-center px-4 py-3 text-sm font-medium rounded-md mb-1 ${
        isActive 
          ? 'bg-blue-100 text-blue-700' 
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {icon}
      <span className="ml-3">{text}</span>
    </Link>
  );
};

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  
  if (!user) return null;
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  return (
    <div 
      className={`bg-white shadow-lg transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-0 md:w-16'
      } flex flex-col z-10`}
    >
      {/* Sidebar content */}
      <div className="h-16 flex items-center justify-center border-b px-4">
        {isOpen ? (
          <h1 className="text-xl font-bold text-blue-600">Patient Monitor</h1>
        ) : (
          <span className="text-2xl font-bold text-blue-600">PM</span>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto pt-5 pb-4">
        <nav className="mt-5 px-2 space-y-1">
          <NavItem 
            to="/" 
            icon={<FaHome className="h-5 w-5" />} 
            text={isOpen ? "Dashboard" : ""}
            isActive={isActive('/')} 
          />
          
          <NavItem 
            to="/patients" 
            icon={<FaUsers className="h-5 w-5" />} 
            text={isOpen ? "Patients" : ""}
            isActive={isActive('/patients')} 
          />
          
          <NavItem 
            to="/patients/new" 
            icon={<FaUserPlus className="h-5 w-5" />} 
            text={isOpen ? "Register Patient" : ""}
            isActive={isActive('/patients/new')} 
          />
          
          <NavItem 
            to="/monitoring" 
            icon={<FaVideo className="h-5 w-5" />} 
            text={isOpen ? "Monitoring" : ""}
            isActive={isActive('/monitoring')} 
          />
          
          <NavItem 
            to="/alerts" 
            icon={<FaBell className="h-5 w-5" />} 
            text={isOpen ? "Alerts" : ""}
            isActive={isActive('/alerts')} 
          />
          
          <NavItem 
            to="/reports" 
            icon={<FaChartBar className="h-5 w-5" />} 
            text={isOpen ? "Reports" : ""}
            isActive={isActive('/reports')} 
          />
          
          {user.role === 'admin' && (
            <NavItem 
              to="/settings" 
              icon={<FaCog className="h-5 w-5" />} 
              text={isOpen ? "Settings" : ""}
              isActive={isActive('/settings')} 
            />
          )}
        </nav>
      </div>
      
      <div className="px-3 py-4 border-t">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
            {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          {isOpen && (
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 truncate">
                {user.full_name || user.email}
              </p>
              <p className="text-xs font-medium text-gray-500 capitalize">
                {user.role}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;