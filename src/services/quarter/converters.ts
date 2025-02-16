import { DocumentData } from 'firebase/firestore';
import { Quarter, WhiskeySample, MashbillType, MASHBILL_TYPES } from '../../types/game.types';

export class QuarterConverters {
  static convertTimestamp = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (timestamp?.seconds) return new Date(timestamp.seconds * 1000);
    if (typeof timestamp === 'number') return new Date(timestamp);
    return new Date(timestamp);
  };

  static convertToWhiskeySample(data: any): WhiskeySample {
    let mashbillType: MashbillType;
    let mashbillComposition = { corn: 0, rye: 0, wheat: 0, barley: 0 };
  
    if (typeof data.mashbill === 'string') {
      mashbillType = data.mashbill as MashbillType;
    } else if (typeof data.mashbill === 'object') {
      mashbillComposition = {
        corn: data.mashbill.corn || 0,
        rye: data.mashbill.rye || 0,
        wheat: data.mashbill.wheat || 0,
        barley: data.mashbill.barley || 0,
      };
      mashbillType = MASHBILL_TYPES.BOURBON;
    } else {
      mashbillType = MASHBILL_TYPES.BOURBON;
    }
  
    return {
      id: data.id || '',
      name: data.name || `Sample ${data.id || ''}`,
      age: typeof data.age === 'number' ? data.age : 0,
      proof: typeof data.proof === 'number' ? data.proof : 0,
      mashbill: mashbillType,
      mashbillComposition,
      notes: Array.isArray(data.notes) ? data.notes : [],
      hints: Array.isArray(data.hints) ? data.hints : [],
      distillery: data.distillery || 'Unknown',
      description: data.description || '',
      difficulty: data.difficulty || 'beginner',
      rating: typeof data.rating === 'number' ? data.rating : 0,
      type: data.type || 'bourbon',
      region: data.region || 'unknown',
      price: typeof data.price === 'number' ? data.price : 0,
      imageUrl: data.imageUrl || '',
      score: typeof data.score === 'number' ? data.score : 0,
      challengeQuestions: Array.isArray(data.challengeQuestions) ? data.challengeQuestions : [],
      image: data.image || '',
      availability: 'in stock' 
    };
  }

  static convertToQuarter(data: DocumentData, id: string): Quarter {
    const samples = this.ensureSamples(data);

    return {
      id,
      name: data.name || '',
      description: data.description || '',
      startDate: this.convertTimestamp(data.startDate),
      endDate: this.convertTimestamp(data.endDate),
      startTime: this.convertTimestamp(data.startTime),
      endTime: this.convertTimestamp(data.endTime),
      createdAt: this.convertTimestamp(data.createdAt),
      updatedAt: this.convertTimestamp(data.updatedAt),
      duration: typeof data.duration === 'number' ? data.duration : 90,
      minimumScore: typeof data.minimumScore === 'number' ? data.minimumScore : 0,
      maximumScore: typeof data.maximumScore === 'number' ? data.maximumScore : 100,
      minimumChallengesCompleted: typeof data.minimumChallengesCompleted === 'number'
        ? data.minimumChallengesCompleted
        : 0,
      isActive: Boolean(data.isActive || data.active),
      samples,
      difficulty: ['beginner', 'intermediate', 'advanced'].includes(data.difficulty)
        ? data.difficulty
        : 'beginner',
      scoringRules: data.scoringRules || this.getDefaultScoringRules(),
      challenges: Array.isArray(data.challenges) ? data.challenges : []
    };
  }

  private static getDefaultScoringRules() {
    return {
      age: {
        maxPoints: 100,
        pointDeductionPerYear: 10,
        exactMatchBonus: 50,
        points: 0,
        penaltyPerYear: 10,
        minValue: 0,
        maxValue: 0,
        hasLowerLimit: false,
        hasUpperLimit: false,
        gracePeriod: 0
      },
      proof: {
        maxPoints: 100,
        pointDeductionPerProof: 5,
        exactMatchBonus: 50,
        points: 0,
        penaltyPerPoint: 5,
        minValue: 0,
        maxValue: 0,
        hasLowerLimit: false,
        hasUpperLimit: false,
        gracePeriod: 0
      },
      mashbill: {
        maxPoints: 100,
        pointDeductionPerType: 25,
        exactMatchBonus: 50,
        points: 0
      }
    };
  }

  private static ensureSamples(data: any): WhiskeySample[] {
    const samples: WhiskeySample[] = [];
    
    if (!data.samples) {
      return this.createDefaultSamples();
    }
  
    if (Array.isArray(data.samples)) {
      samples.push(...(data.samples as any[]).map((sample: any, index: number) => 
        this.convertToWhiskeySample({
          ...sample,
          id: String.fromCharCode(65 + index)
        })
      ));
    } else if (typeof data.samples === 'object') {
      const sampleEntries = Object.entries(data.samples);
      sampleEntries.forEach(([, value], index) => {
        const sampleData = typeof value === 'object' && value !== null ? value : {};
        samples.push(this.convertToWhiskeySample({
          ...sampleData,
          id: String.fromCharCode(65 + index)
        }));
      });
    }
  
    while (samples.length < 4) {
      samples.push(this.createDefaultSample(String.fromCharCode(65 + samples.length)));
    }
  
    return samples.slice(0, 4).map((sample, index) => ({
      ...sample,
      id: String.fromCharCode(65 + index)
    }));
  }

  private static createDefaultSample(id: string): WhiskeySample {
    return {
      id,
      name: `Sample ${id}`,
      age: 0,
      proof: 0,
      mashbill: MASHBILL_TYPES.BOURBON,
      mashbillComposition: {
        corn: 51,
        rye: 0,
        wheat: 0,
        barley: 0
      },
      rating: 0,
      hints: [],
      distillery: 'Unknown',
      description: '',
      notes: [],
      type: 'bourbon',
      region: 'unknown',
      imageUrl: '',
      price: 0,
      difficulty: 'beginner',
      score: 0,
      challengeQuestions: [],
      image: '',
      availability: 'in stock' 
    };
  }

  private static createDefaultSamples(): WhiskeySample[] {
    return ['A', 'B', 'C', 'D'].map(id => this.createDefaultSample(id));
  }
}