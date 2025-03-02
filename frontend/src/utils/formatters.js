/**
 * Utility functions for data formatting throughout the application
 */

// Format date to display in UI (e.g., "Jan 5, 2023")
export const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  // Format date with time (e.g., "Jan 5, 2023, 2:30 PM")
  export const formatDateTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };
  
  // Format relative time (e.g., "5 minutes ago")
  export const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
    
    return formatDate(dateString);
  };
  
  // Format duration in seconds to MM:SS format
  export const formatDuration = (durationInSeconds) => {
    if (durationInSeconds === undefined || durationInSeconds === null) return '00:00';
    
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Format patient status with appropriate styling
  export const formatPatientStatus = (status) => {
    if (!status) return { label: 'Unknown', color: 'gray' };
    
    const statusMap = {
      'critical': { label: 'Critical', color: 'red' },
      'stable': { label: 'Stable', color: 'green' },
      'recovering': { label: 'Recovering', color: 'blue' }
    };
    
    return statusMap[status.toLowerCase()] || { label: status, color: 'gray' };
  };
  
  // Format movement severity with appropriate styling
  export const formatMovementSeverity = (severity) => {
    if (!severity) return { label: 'Normal', color: 'gray' };
    
    const severityMap = {
      'critical': { label: 'Critical', color: 'red', bgClass: 'bg-red-100 text-red-800' },
      'attention': { label: 'Attention Needed', color: 'yellow', bgClass: 'bg-yellow-100 text-yellow-800' },
      'normal': { label: 'Normal', color: 'green', bgClass: 'bg-green-100 text-green-800' }
    };
    
    return severityMap[severity.toLowerCase()] || { label: severity, color: 'gray', bgClass: 'bg-gray-100 text-gray-800' };
  };
  
  // Format a number with thousands separators
  export const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // Format patient name for display (e.g., "Smith, John")
  export const formatPatientName = (patient) => {
    if (!patient || !patient.full_name) return '';
    
    // Assuming format is "First Last"
    const nameParts = patient.full_name.split(' ');
    if (nameParts.length < 2) return patient.full_name;
    
    const lastName = nameParts.pop();
    const firstName = nameParts.join(' ');
    
    return `${lastName}, ${firstName}`;
  };
  
  // Format body part for display
  export const formatBodyPart = (bodyPart) => {
    if (!bodyPart) return '';
    
    // Convert snake_case to Title Case with spaces
    return bodyPart
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Calculate age from date of birth
  export const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '';
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };