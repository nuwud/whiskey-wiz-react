export interface Sample {
  id: string;
  age: number;
  proof: number;
  mashbill: 'Bourbon' | 'Rye' | 'Wheat' | 'Single Malt' | 'Specialty';
}

export interface Quarter {
  id: string;
  name: string;
  active: boolean;
  samples: Sample[];
  createdAt: Date;
  updatedAt: Date;
}
