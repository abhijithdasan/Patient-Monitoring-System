import React from 'react';
import { formatPatientStatus } from '../utils/formatters';

const PatientStatusBadge = ({ status }) => {
  const statusInfo = formatPatientStatus(status);
  
  const getBgClass = () => {
    switch (statusInfo.color) {
      case 'red':
        return 'bg-red-100 text-red-800';
      case 'green':
        return 'bg-green-100 text-green-800';
      case 'blue':
        return 'bg-blue-100 text-blue-800';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getBgClass()}`}>
      {statusInfo.label}
    </span>
  );
};

export default PatientStatusBadge;