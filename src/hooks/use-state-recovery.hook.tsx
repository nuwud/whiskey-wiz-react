import { useState, useEffect } from 'react';
import { StateRecoveryService } from '../services/state-recovery.service';
import { useAuth } from '../contexts/auth.context';

export const useStateRecovery = (quarterId: string) => {
  const { user } = useAuth();
  const [recoveredState, setRecoveredState] = useState<any>(null);
  const stateRecoveryService = new StateRecoveryService();

  useEffect(() => {
    let isSubscribed = true;

    const attemptStateRecovery = async () => {
        if (!user) return;

        try {
            const recoveryState = await stateRecoveryService.getRecoveryState(user.userId);
            
            // Only update state if component is still mounted
            if (isSubscribed && recoveryState && recoveryState.quarterId === quarterId) {
                setRecoveredState(recoveryState.lastSavedState);
            }
        } catch (error) {
            console.error('State recovery failed', error);
            if (isSubscribed) {
                // Handle error state if needed
            }
        }
    };

    attemptStateRecovery();

    // Cleanup function
    return () => {
        isSubscribed = false;
    };
}, [user, quarterId]);

  const savePartialState = async (partialState: any) => {
    if (!user) return;

    await stateRecoveryService.savePartialState(user.userId, quarterId, partialState);
  };

  const clearRecoveryState = async () => {
    if (!user) return;

    await stateRecoveryService.clearRecoveryState(user.userId);
    setRecoveredState(null);
  };

  return {
    recoveredState,
    savePartialState,
    clearRecoveryState
  };
};