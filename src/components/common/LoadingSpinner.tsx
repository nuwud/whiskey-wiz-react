import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p>Loading Whiskey Wiz...</p>
    </div>
  );
};

export default LoadingSpinner;