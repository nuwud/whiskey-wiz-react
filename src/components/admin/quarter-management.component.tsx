
import React, { useState, useEffect } from 'react';
import { useAuth, useQuarter } from '@/contexts';
import { quarterService } from '@/services/quarter.service';
import type { Quarter, WhiskeySample, ScoringRules } from '@/types/game.types';
import { SampleEditor } from './sample-editor.component';

type Difficulty = 'easy' | 'medium' | 'hard';
const DIFFICULTY_OPTIONS: Difficulty[] = ['easy', 'medium', 'hard'];

interface QuarterFormData {
  name: string;
  startDate: string;
  endDate: string;
  difficulty: Difficulty;
  isActive: boolean;
  samples: WhiskeySample[];
  description: string;
  scoringRules: ScoringRules;
}

export const QuarterManagement: React.FC = () => {
  // ... (keep the rest of the component unchanged)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const quarterData: Omit<Quarter, 'id' | 'createdAt' | 'updatedAt'> = {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      };

      if (selectedQuarter) {
        await quarterService.updateQuarter(selectedQuarter.id, quarterData);
      } else {
        await quarterService.createQuarter(quarterData);
      }

      const fetchedQuarters = await quarterService.getAllQuarters();
      setQuarters(fetchedQuarters);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quarter');
    } finally {
      setLoading(false);
    }
  };

  // ... (keep the rest of the component unchanged)
};
