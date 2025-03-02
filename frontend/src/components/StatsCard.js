import React from 'react';
import { 
  ChartPieIcon, 
  UserGroupIcon, 
  ExclamationCircleIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';

const iconMap = {
  patients: UserGroupIcon,
  alerts: ExclamationCircleIcon,
  movements: ChartPieIcon,
  monitoring: ClockIcon
};

const colorMap = {
  patients: 'bg-blue-500',
  alerts: 'bg-red-500',
  movements: 'bg-green-500',
  monitoring: 'bg-purple-500'
};

const StatsCard = ({ title, value, type, change, duration }) => {
  const Icon = iconMap[type] || ChartPieIcon;
  const bgColor = colorMap[type] || 'bg-gray-500';
  
  return (
    <div className="card flex items-start p-6">
      <div className={`p-3 rounded-full ${bgColor} text-white mr-4`}>
        <Icon className="h-6 w-6" />
      </div>
      
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className="flex items-center mt-1">
          <h3 className="text-2xl font-bold text-gray-800 mr-2">{value}</h3>
          
          {change !== undefined && (
            <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? `+${change}%` : `${change}%`}
            </span>
          )}
        </div>
        
        {duration && (
          <p className="text-xs text-gray-500 mt-1">{duration}</p>
        )}
      </div>
    </div>
  );
};

export default StatsCard;