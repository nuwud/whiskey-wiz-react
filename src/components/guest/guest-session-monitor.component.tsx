import { useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/auth.context';

export const GuestSessionMonitor = ({
    onSessionExpiring,
    onSessionExpired
}: {
    onSessionExpiring: () => void;
    onSessionExpired: () => void;
}) => {
    const { user } = useAuth();

    const checkSession = useCallback(() => {
        if (!user?.guest) return;

        const guestToken = localStorage.getItem('guestToken');
        const expiryTime = localStorage.getItem('guestExpiryTime');

        if (!guestToken || !expiryTime) {
            onSessionExpired();
            return;
        }

        const timeLeft = new Date(expiryTime).getTime() - Date.now();
        if (timeLeft <= 0) {
            onSessionExpired();
        } else if (timeLeft <= 5 * 60 * 1000) { // 5 minutes
            onSessionExpiring();
        }
    }, [user, onSessionExpiring, onSessionExpired]);

    useEffect(() => {
        if (!user?.guest) return;

        const interval = setInterval(checkSession, 60000); // Check every minute
        checkSession(); // Initial check

        return () => clearInterval(interval);
    }, [user, checkSession]);

    return null;
};