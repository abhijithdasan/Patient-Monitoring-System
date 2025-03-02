import React from 'react';

const Loader = ({ size = 'md', fullScreen = false, text = 'Loading...' }) => {
  // Define sizes
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };
  
  const sizeClass = sizes[size] || sizes.md;
  
  // Full screen loader
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
          <div className={`${sizeClass} animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600`}></div>
          {text && <p className="mt-4 text-gray-700">{text}</p>}
        </div>
      </div>
    );
  }
  
  // Inline loader
  return (
    <div className="flex items-center justify-center py-4">
      <div className={`${sizeClass} animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600`}></div>
      {text && <p className="ml-3 text-gray-700">{text}</p>}
    </div>
  );
};

export default Loader;