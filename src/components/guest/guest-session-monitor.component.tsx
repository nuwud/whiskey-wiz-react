import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/auth.context';
import { GuestSessionService } from '../../services/guest-session.service';
import { GuestSessionAlert } from './guest-session-alert.component';

interface Props {
    onSessionExpiring?: () => void;
    onSessionExpired?: () => void;
}

export const GuestSessionMonitor: React.FC<Props> = ({
    onSessionExpiring,
    onSessionExpired
}) => {
    const { user } = useAuth();
    const [showWarning, setShowWarning] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

    useEffect(() => {
        if (!user?.guest) return;

        const checkSession = () => {
            const session = GuestSessionService.getSession();
            if (!session) {
                onSessionExpired?.();
                return;
            }

            const remainingTime = session.expiresAt - Date.now();
            setTimeRemaining(remainingTime);

            // Show warning when less than 5 minutes remain
            if (remainingTime < 5 * 60 * 1000 && remainingTime > 0) {
                setShowWarning(true);
                onSessionExpiring?.();
            }

            // Session expired
            if (remainingTime <= 0) {
                onSessionExpired?.();
            }
        };

        // Check every minute
        const interval = setInterval(checkSession, 60000);
        checkSession(); // Initial check

        return () => clearInterval(interval);
    }, [user, onSessionExpiring, onSessionExpired]);

    if (!user?.guest || !showWarning || !timeRemaining) return null;

    return <GuestSessionAlert timeRemaining={timeRemaining} />;
};