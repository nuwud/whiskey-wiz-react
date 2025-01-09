import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { AnalyticsService } from './AnalyticsService';

export interface QuarterTemplate {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  whiskeySamples: WhiskeySample[];
  challengeRules: ChallengeRules;
}

export interface WhiskeySample {
  id: string;
  name: string;
  age: number;
  proof: number;
  mashbillType: string;
  challengeQuestions: ChallengeQuestion[];
}

export interface ChallengeQuestion {
  id: string;
  question: string;
  possibleAnswers: string[];
  correctAnswer: string;
  points: number;
}

export interface ChallengeRules {
  maxAttempts: number;
  timeLimit: number; // in minutes
  passingScore: number;
}

export class QuarterTemplateService {
  private templateCollection = collection(db, 'quarter_templates');

  async createQuarterTemplate(template: QuarterTemplate): Promise<string> {
    try {
      const docRef = await addDoc(this.templateCollection, template);
      
      AnalyticsService.trackUserEngagement('quarter_template_created', {
        templateId: docRef.id,
        difficulty: template.difficulty
      });

      return docRef.id;
    } catch (error) {
      console.error('Failed to create quarter template', error);
      throw error;
    }
  }

  async getTemplatesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Promise<QuarterTemplate[]> {
    try {
      const q = query(this.templateCollection, where('difficulty', '==', difficulty));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as QuarterTemplate));
    } catch (error) {
      console.error('Failed to fetch templates', error);
      return [];
    }
  }

  generateQuarterComponent(template: QuarterTemplate): string {
    return `
      import React from 'react';
      import { BaseQuarterComponent } from './BaseQuarterComponent';

      export const Quarter${template.id}Component: React.FC = () => {
        return (
          <BaseQuarterComponent
            quarterId="${template.id}"
            quarterName="${template.name}"
            difficulty="${template.difficulty}"
          >
            {/* Quarter-specific rendering logic */}
          </BaseQuarterComponent>
        );
      };
    `;
  }

  async generateDynamicQuarters(): Promise<void> {
    try {
      const difficulties = ['easy', 'medium', 'hard'];
      
      for (const difficulty of difficulties) {
        const templates = await this.getTemplatesByDifficulty(difficulty as 'easy' | 'medium' | 'hard');
        
        templates.forEach(template => {
          // Generate component files or register dynamically
          const componentCode = this.generateQuarterComponent(template);
          
          AnalyticsService.trackUserEngagement('dynamic_quarter_generated', {
            templateId: template.id,
            difficulty: template.difficulty
          });
        });
      }
    } catch (error) {
      console.error('Failed to generate dynamic quarters', error);
    }
  }
}