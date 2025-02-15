import React from 'react';
import { useNavigate } from 'react-router-dom';

const UnauthorizedAccess: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Unauthorized Access</strong>
            <span className="block sm:inline"> You do not have permission to view this page.</span>
            <button
                onClick={() => navigate('/')}
                className="mt-4 bg-amber-600 text-white px-4 py-2 rounded"
            >
                Go to Home
            </button>
        </div>
    );
};

export default UnauthorizedAccess;