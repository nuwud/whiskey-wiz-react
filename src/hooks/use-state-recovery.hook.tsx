import { useState, useEffect } from 'react';
import { StateRecoveryService } from '../services/state-recovery.service';
import { useAuth } from '../contexts/auth.context';

export const useStateRecovery = (quarterId: string) => {
  const { user } = useAuth();
  const [recoveredState, setRecoveredState] = useState<any>(null);
  const stateRecoveryService = new StateRecoveryService();

  useEffect(() => {
    const attemptStateRecovery = async () => {
      if (!user) return;

      try {
        const recoveryState = await stateRecoveryService.recoverGameState(user.uid);

        if (recoveryState && recoveryState.quarterId === quarterId) {
          setRecoveredState(recoveryState.lastSavedState);
        }
      } catch (error) {
        console.error('State recovery failed', error);
      }
    };

    attemptStateRecovery();
  }, [user, quarterId]);

  const savePartialState = async (partialState: any) => {
    if (!user) return;

    await stateRecoveryService.savePartialState(user.uid, quarterId, partialState);
  };

  const clearRecoveryState = async () => {
    if (!user) return;

    await stateRecoveryService.clearRecoveryState(user.uid);
    setRecoveredState(null);
  };

  return {
    recoveredState,
    savePartialState,
    clearRecoveryState
  };
};