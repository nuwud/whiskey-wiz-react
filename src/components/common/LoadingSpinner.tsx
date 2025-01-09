import React from 'react';

const LoadingSpinner: React.FC<{message?: string}> = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>{message}</p>
      </div>
      <style jsx>{`
        .loading-spinner-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: var(--background-dark);
          color: var(--primary-gold);
        }

        .loading-spinner {
          text-align: center;
        }

        .spinner {
          border: 4px solid var(--accent-dark);
          border-top: 4px solid var(--primary-gold);
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;