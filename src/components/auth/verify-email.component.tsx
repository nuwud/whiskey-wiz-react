import React, { useState } from 'react';
import { useAuth } from '../../contexts/auth.context';
import { useNavigate } from 'react-router-dom';

const VerifyEmail: React.FC = () => {
  const { user, sendEmailVerification, error, loading } = useAuth();
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSendVerification = async () => {
    try {
      await sendEmailVerification();
      setMessage('Verification email sent!');
    } catch (err) {
      console.error('Failed to send verification email:', err);
    }
  };

  return (
    <div>
      <h2>Verify Your Email</h2>
      {user?.emailVerified ? (
        <p>Your email is verified. You can now access all features.</p>
      ) : (
        <div>
          <p>Please verify your email to access all features.</p>
          <button onClick={handleSendVerification} disabled={loading}>
            {loading ? 'Sending...' : 'Send Verification Email'}
          </button>
          {message && <p>{message}</p>}
          {error && <p>{error.message}</p>}
        </div>
      )}
      <button onClick={() => navigate('/profile')}>Go to Profile</button>
    </div>
  );
};

export default VerifyEmail;