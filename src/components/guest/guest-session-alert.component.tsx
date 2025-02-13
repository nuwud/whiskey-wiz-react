import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
    timeRemaining: number;
}

export const GuestSessionAlert: React.FC<Props> = ({ timeRemaining }) => {
    const navigate = useNavigate();

    const formatTimeRemaining = (ms: number): string => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed top-4 right-4 z-50">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow-lg">
                <div className="flex">
                    <div className="flex-1">
                        <p className="text-sm text-yellow-700">
                            Guest Session Expiring in {formatTimeRemaining(timeRemaining)}
                        </p>
                        <p className="mt-1 text-sm text-yellow-700">
                            Sign up to save your progress!
                        </p>
                        <button
                            onClick={() => navigate('/signup')}
                            className="mt-2 px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600"
                        >
                            Sign Up Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};