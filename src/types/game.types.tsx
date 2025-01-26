
export interface ScoringRules {
  age: {
    maxPoints: number;
    pointDeductionPerYear: number;
    exactMatchBonus: number;
  };
  proof: {
    maxPoints: number;
    pointDeductionPerProof: number;
    exactMatchBonus: number;
  };
  mashbill: {
    maxPoints: number;
    pointDeductionPerYear: number;
    exactMatchBonus: number;
  };
}

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

export interface WhiskeySample {
  id: string;
  name: string;
  age: number;
  proof: number;
  mashbill: string;
}
