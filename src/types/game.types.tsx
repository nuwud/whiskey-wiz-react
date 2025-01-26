
import { PlayerProfile } from "./auth.types";
import { LeaderboardEntry } from "@/services/leaderboard.service";

// ... (keep existing types)

export interface Quarter {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  difficulty: 'easy' | 'medium' | 'hard';
  isActive: boolean;
  samples: WhiskeySample[];
  description: string;
  scoringRules: ScoringRules;
  createdAt: Date;
  updatedAt: Date;
}

// ... (keep the rest of the file unchanged)
